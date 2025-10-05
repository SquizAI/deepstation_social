import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { posts, filename } = await request.json()

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'No posts to import' }, { status: 400 })
    }

    let successCount = 0
    let failedCount = 0
    const errors: { row: number; error: string }[] = []

    // Import posts
    for (let i = 0; i < posts.length; i++) {
      try {
        const { data: insertedPost, error: insertError } = await supabase
          .from('scheduled_posts')
          .insert(posts[i])
          .select()
          .single()

        if (insertError) {
          failedCount++
          errors.push({ row: i + 1, error: insertError.message })
        } else {
          successCount++

          // Create recurring post if pattern exists
          if (posts[i].recurring_pattern && posts[i].recurring_pattern.frequency !== 'none') {
            await supabase
              .from('recurring_posts')
              .insert({
                user_id: user.id,
                post_id: insertedPost.id,
                pattern: posts[i].recurring_pattern,
                timezone: posts[i].timezone || 'UTC',
                next_occurrence: posts[i].scheduled_for || new Date().toISOString(),
                is_active: true
              })
          }
        }
      } catch (error) {
        failedCount++
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log import history
    await supabase
      .from('csv_import_history')
      .insert({
        user_id: user.id,
        filename: filename || 'unknown.csv',
        total_rows: posts.length,
        successful_imports: successCount,
        failed_imports: failedCount,
        error_log: errors
      })

    return NextResponse.json({
      successCount,
      failedCount,
      errors: errors.slice(0, 10) // Limit errors in response
    })
  } catch (error) {
    console.error('Error in CSV import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
