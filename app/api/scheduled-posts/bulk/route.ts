import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postIds } = await request.json()

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'Invalid postIds' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .in('id', postIds)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error bulk deleting posts:', deleteError)
      return NextResponse.json({ error: 'Failed to delete posts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedCount: postIds.length })
  } catch (error) {
    console.error('Error in bulk DELETE:', error)
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

    const { postIds, action, newScheduledTime } = await request.json()

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'Invalid postIds' }, { status: 400 })
    }

    if (action === 'reschedule') {
      if (!newScheduledTime) {
        return NextResponse.json({ error: 'Missing newScheduledTime' }, { status: 400 })
      }

      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({ scheduled_for: newScheduledTime, status: 'scheduled' })
        .in('id', postIds)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error bulk rescheduling posts:', updateError)
        return NextResponse.json({ error: 'Failed to reschedule posts' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updatedCount: postIds.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in bulk PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
