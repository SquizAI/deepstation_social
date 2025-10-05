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

    // Fetch the original post
    const { data: originalPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !originalPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create duplicate
    const { data: duplicatePost, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        content: originalPost.content,
        images: originalPost.images,
        platforms: originalPost.platforms,
        timezone: originalPost.timezone,
        status: 'draft',
        recurring_pattern: originalPost.recurring_pattern
        // Note: scheduled_for is intentionally omitted to create as draft
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error duplicating post:', insertError)
      return NextResponse.json({ error: 'Failed to duplicate post' }, { status: 500 })
    }

    return NextResponse.json({ post: duplicatePost }, { status: 201 })
  } catch (error) {
    console.error('Error in duplicate POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
