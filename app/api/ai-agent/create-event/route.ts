import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Get user from session or require authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract event data from AI conversation
    const {
      title,
      description,
      short_description,
      event_date,
      start_time,
      end_time,
      timezone,
      location_type,
      venue_name,
      venue_address,
      meeting_url,
      virtual_platform,
      capacity,
      event_type,
      tags,
      ticket_types,
    } = body

    // Generate slug from title
    const slug =
      title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `event-${Date.now()}`

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        slug,
        description,
        short_description,
        event_date,
        start_time,
        end_time,
        timezone: timezone || 'America/New_York',
        location_type,
        venue_name,
        venue_address,
        meeting_url,
        virtual_platform,
        capacity: capacity ? parseInt(capacity) : null,
        event_type: event_type || 'workshop',
        tags: tags || [],
        status: 'draft',
        visibility: 'public',
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return NextResponse.json(
        { error: 'Failed to create event', details: eventError.message },
        { status: 500 }
      )
    }

    // Create ticket types if provided
    if (ticket_types && ticket_types.length > 0 && event) {
      const ticketInserts = ticket_types.map((ticket: any, index: number) => ({
        event_id: event.id,
        name: ticket.name || 'General Admission',
        description: ticket.description,
        price: parseFloat(ticket.price || '0'),
        currency: 'USD',
        quantity_total: ticket.quantity ? parseInt(ticket.quantity) : null,
        display_order: index,
      }))

      const { error: ticketError } = await supabase
        .from('ticket_types')
        .insert(ticketInserts)

      if (ticketError) {
        console.error('Ticket creation error:', ticketError)
      }
    }

    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: `Event "${event.title}" created successfully! You can view it at /dashboard/events/${event.id}`,
      url: `/dashboard/events/${event.id}`,
    })
  } catch (error: any) {
    console.error('AI Agent event creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}
