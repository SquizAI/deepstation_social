import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
    }

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'failed') {
      return NextResponse.json({ error: 'Only failed posts can be retried' }, { status: 400 })
    }

    const retryCount = (post.retry_count || 0) + 1
    const maxRetries = post.max_retries || 3

    if (retryCount > maxRetries) {
      return NextResponse.json(
        { error: `Maximum retry attempts (${maxRetries}) exceeded` },
        { status: 400 }
      )
    }

    // Update retry count and status
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'publishing',
        retry_count: retryCount,
        last_error: null
      })
      .eq('id', postId)

    // Determine which platforms failed
    const failedPlatforms = post.publish_results
      ? Object.entries(post.publish_results)
          .filter(([_, result]: [string, any]) => !result.success)
          .map(([platform]) => platform)
      : post.platforms

    if (failedPlatforms.length === 0) {
      return NextResponse.json({ error: 'No failed platforms to retry' }, { status: 400 })
    }

    // Fetch OAuth accounts for failed platforms
    const { data: accounts, error: accountsError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', failedPlatforms)
      .eq('is_active', true)

    if (accountsError || !accounts || accounts.length === 0) {
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'failed',
          last_error: 'No connected accounts found for retry'
        })
        .eq('id', postId)

      return NextResponse.json(
        { error: 'No connected accounts found for retry' },
        { status: 400 }
      )
    }

    const results = post.publish_results ? { ...post.publish_results } : {}

    // Retry publishing to failed platforms
    for (const account of accounts) {
      const platform = account.platform
      const content = post.content[platform]
      const imageData = post.images?.find((img: any) => img.platform === platform)

      try {
        const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            postId: post.id,
            platforms: [platform]
          })
        })

        if (!publishResponse.ok) {
          throw new Error(`Failed to publish to ${platform}`)
        }

        const publishResult = await publishResponse.json()
        results[platform] = publishResult.results?.[platform] || { success: true }
      } catch (error) {
        console.error(`Error retrying publish to ${platform}:`, error)
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update post with retry results
    const allSuccess = Object.values(results).every((r: any) => r.success)
    const { error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        status: allSuccess ? 'published' : 'failed',
        published_at: allSuccess ? new Date().toISOString() : post.published_at,
        publish_results: results,
        last_error: allSuccess ? null : 'Some platforms failed after retry'
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post after retry:', updateError)
    }

    return NextResponse.json({
      success: allSuccess,
      retryCount,
      maxRetries,
      results
    })
  } catch (error) {
    console.error('Error in retry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
