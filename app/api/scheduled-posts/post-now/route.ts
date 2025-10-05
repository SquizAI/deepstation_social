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

    // Update status to publishing
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'publishing',
        scheduled_for: new Date().toISOString()
      })
      .eq('id', postId)

    // Fetch OAuth accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', post.platforms)
      .eq('is_active', true)

    if (accountsError || !accounts || accounts.length === 0) {
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'failed',
          last_error: 'No connected accounts found'
        })
        .eq('id', postId)

      return NextResponse.json(
        { error: 'No connected accounts found' },
        { status: 400 }
      )
    }

    const results: Record<string, { success: boolean; error?: string; post_id?: string; post_url?: string }> = {}

    // Publish to each platform
    for (const account of accounts) {
      const platform = account.platform
      const content = post.content[platform]
      const imageData = post.images?.find((img: any) => img.platform === platform)

      try {
        // Call the existing publish API
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
        console.error(`Error publishing to ${platform}:`, error)
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Update post with results
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
    console.error('Error in post-now:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
