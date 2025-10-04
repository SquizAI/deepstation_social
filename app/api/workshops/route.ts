import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/workshops
 * Fetch all workshops for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const visibility = searchParams.get('visibility')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build query
    let query = supabase
      .from('workshops')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('event_date', today)
    }

    const { data: workshops, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      workshops: workshops || [],
    })
  } catch (error: any) {
    console.error('Error fetching workshops:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch workshops',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workshops
 * Create a new workshop
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.event_date || !body.start_time || !body.end_time) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['title', 'event_date', 'start_time', 'end_time'],
        },
        { status: 400 }
      )
    }

    // Create workshop
    const { data: workshop, error } = await supabase
      .from('workshops')
      .insert({
        user_id: user.id,
        ...body,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      workshop,
    })
  } catch (error: any) {
    console.error('Error creating workshop:', error)
    return NextResponse.json(
      {
        error: 'Failed to create workshop',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
