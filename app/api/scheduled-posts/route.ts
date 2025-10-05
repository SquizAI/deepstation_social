import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platforms = searchParams.get('platforms')?.split(',')
    const status = searchParams.get('status')?.split(',')
    const search = searchParams.get('search')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })

    if (platforms?.length) {
      query = query.contains('platforms', platforms)
    }

    if (status?.length) {
      query = query.in('status', status)
    }

    if (search) {
      query = query.or(`content->linkedin.ilike.%${search}%,content->twitter.ilike.%${search}%`)
    }

    if (startDate) {
      query = query.gte('scheduled_for', startDate)
    }

    if (endDate) {
      query = query.lte('scheduled_for', endDate)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Error fetching scheduled posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Error in scheduled-posts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, images, platforms, scheduled_for, timezone, recurring_pattern } = body

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: content, platforms' },
        { status: 400 }
      )
    }

    const { data: post, error: insertError } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        content,
        images,
        platforms,
        scheduled_for,
        timezone: timezone || 'UTC',
        status: scheduled_for ? 'scheduled' : 'draft',
        recurring_pattern
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating post:', insertError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // If recurring, create recurring post entry
    if (recurring_pattern && recurring_pattern.frequency !== 'none') {
      const { error: recurringError } = await supabase
        .from('recurring_posts')
        .insert({
          user_id: user.id,
          post_id: post.id,
          pattern: recurring_pattern,
          timezone: timezone || 'UTC',
          next_occurrence: scheduled_for,
          is_active: true
        })

      if (recurringError) {
        console.error('Error creating recurring post:', recurringError)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error in scheduled-posts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, ...updates } = body

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
    }

    const { data: post, error: updateError } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error in scheduled-posts PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in scheduled-posts DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
