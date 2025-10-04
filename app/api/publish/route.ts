import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, platforms } = body

    if (!postId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, platforms' },
        { status: 400 }
      )
    }

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch OAuth tokens for selected platforms
    const { data: accounts, error: accountsError } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', platforms)

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No connected accounts found for selected platforms' },
        { status: 400 }
      )
    }

    const results: Record<string, { success: boolean; error?: string }> = {}

    // Publish to each platform
    for (const account of accounts) {
      const platform = account.platform
      const content = post.content[platform]
      const imageData = post.images?.find((img: any) => img.platform === platform)

      try {
        switch (platform) {
          case 'linkedin':
            await publishToLinkedIn(account.access_token, content, imageData?.url)
            results[platform] = { success: true }
            break

          case 'instagram':
            await publishToInstagram(account.access_token, content, imageData?.url)
            results[platform] = { success: true }
            break

          case 'twitter':
            await publishToTwitter(account.access_token, account.refresh_token, content, imageData?.url)
            results[platform] = { success: true }
            break

          case 'discord':
            await publishToDiscord(account.webhook_url || '', content, imageData?.url)
            results[platform] = { success: true }
            break

          default:
            results[platform] = { success: false, error: 'Unsupported platform' }
        }
      } catch (error) {
        console.error(`Error publishing to ${platform}:`, error)
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update post status
    const allSuccess = Object.values(results).every(r => r.success)
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        status: allSuccess ? 'published' : 'failed',
        published_at: new Date().toISOString(),
        publish_results: results
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post status:', updateError)
    }

    return NextResponse.json({
      success: allSuccess,
      results
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// LinkedIn Publishing
async function publishToLinkedIn(accessToken: string, content: string, imageUrl?: string) {
  const endpoint = 'https://api.linkedin.com/v2/ugcPosts'

  const postData: any = {
    author: `urn:li:person:${await getLinkedInPersonId(accessToken)}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  }

  if (imageUrl) {
    // Upload image first
    const imageUrn = await uploadLinkedInImage(accessToken, imageUrl)
    postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        media: imageUrn
      }
    ]
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(postData)
  })

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.status}`)
  }

  return await response.json()
}

async function getLinkedInPersonId(accessToken: string): Promise<string> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user info')
  }

  const data = await response.json()
  return data.sub
}

async function uploadLinkedInImage(accessToken: string, imageUrl: string): Promise<string> {
  // Implementation for LinkedIn image upload
  // This is a simplified version - actual implementation needs multi-step process
  throw new Error('LinkedIn image upload not yet implemented')
}

// Instagram Publishing (requires Facebook Graph API)
async function publishToInstagram(accessToken: string, content: string, imageUrl?: string) {
  if (!imageUrl) {
    throw new Error('Instagram posts require an image')
  }

  // Get Instagram Business Account ID
  const accountResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  )
  const accountData = await accountResponse.json()
  const pageId = accountData.data?.[0]?.id

  if (!pageId) {
    throw new Error('No Instagram Business Account found')
  }

  // Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      })
    }
  )

  const containerData = await containerResponse.json()
  const creationId = containerData.id

  // Publish media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    }
  )

  if (!publishResponse.ok) {
    throw new Error(`Instagram API error: ${publishResponse.status}`)
  }

  return await publishResponse.json()
}

// Twitter Publishing
async function publishToTwitter(
  accessToken: string,
  refreshToken: string,
  content: string,
  imageUrl?: string
) {
  let mediaId: string | undefined

  if (imageUrl) {
    // Upload media first
    const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ media_data: imageUrl })
    })

    const mediaData = await mediaResponse.json()
    mediaId = mediaData.media_id_string
  }

  // Create tweet
  const tweetData: any = { text: content }
  if (mediaId) {
    tweetData.media = { media_ids: [mediaId] }
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tweetData)
  })

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`)
  }

  return await response.json()
}

// Discord Publishing
async function publishToDiscord(webhookUrl: string, content: string, imageUrl?: string) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL not configured')
  }

  const payload: any = { content }

  if (imageUrl) {
    payload.embeds = [
      {
        image: { url: imageUrl }
      }
    ]
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Discord webhook error: ${response.status}`)
  }

  return { success: true }
}
