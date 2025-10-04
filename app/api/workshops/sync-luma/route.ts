import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  fetchAllLumaEvents,
  transformLumaEvent,
  type LumaEvent,
} from '@/lib/integrations/luma'

/**
 * POST /api/workshops/sync-luma
 * Sync workshops from Luma calendar
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

    // Get optional calendar ID from request body
    const body = await request.json().catch(() => ({}))
    const calendarId = body.calendarId

    // Create sync log entry
    const syncLogId = crypto.randomUUID()
    const syncStartTime = new Date().toISOString()

    await supabase.from('luma_sync_log').insert({
      id: syncLogId,
      user_id: user.id,
      sync_type: 'manual',
      sync_status: 'partial', // Will update to success/failed at end
      started_at: syncStartTime,
    })

    // Fetch all events from Luma
    let lumaEvents: LumaEvent[] = []
    try {
      lumaEvents = await fetchAllLumaEvents(calendarId)
    } catch (error: any) {
      // Log error and return
      await supabase
        .from('luma_sync_log')
        .update({
          sync_status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [
            {
              message: error.message || 'Failed to fetch Luma events',
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq('id', syncLogId)

      return NextResponse.json(
        {
          error: 'Failed to fetch events from Luma',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Track sync stats
    let eventsCreated = 0
    let eventsUpdated = 0
    const errors: any[] = []

    // Process each event
    for (const lumaEvent of lumaEvents) {
      try {
        // Transform to our format
        const workshop = transformLumaEvent(lumaEvent, user.id)

        // Check if event already exists
        const { data: existing } = await supabase
          .from('workshops')
          .select('id')
          .eq('luma_event_id', lumaEvent.api_id)
          .single()

        if (existing) {
          // Update existing workshop
          const { error: updateError } = await supabase
            .from('workshops')
            .update(workshop)
            .eq('luma_event_id', lumaEvent.api_id)

          if (updateError) {
            errors.push({
              event_id: lumaEvent.api_id,
              event_name: lumaEvent.name,
              error: updateError.message,
              timestamp: new Date().toISOString(),
            })
          } else {
            eventsUpdated++
          }
        } else {
          // Insert new workshop
          const { error: insertError } = await supabase
            .from('workshops')
            .insert(workshop)

          if (insertError) {
            errors.push({
              event_id: lumaEvent.api_id,
              event_name: lumaEvent.name,
              error: insertError.message,
              timestamp: new Date().toISOString(),
            })
          } else {
            eventsCreated++
          }
        }
      } catch (error: any) {
        errors.push({
          event_id: lumaEvent.api_id,
          event_name: lumaEvent.name,
          error: error.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Update sync log with final results
    const syncStatus =
      errors.length === 0
        ? 'success'
        : errors.length < lumaEvents.length
        ? 'partial'
        : 'failed'

    await supabase
      .from('luma_sync_log')
      .update({
        sync_status: syncStatus,
        events_synced: lumaEvents.length,
        events_created: eventsCreated,
        events_updated: eventsUpdated,
        errors: errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLogId)

    // Return results
    return NextResponse.json({
      success: true,
      sync_id: syncLogId,
      stats: {
        total_events: lumaEvents.length,
        created: eventsCreated,
        updated: eventsUpdated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error syncing Luma events:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync events',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workshops/sync-luma
 * Get sync status and history
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

    // Get recent sync logs
    const { data: syncLogs, error: logsError } = await supabase
      .from('luma_sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (logsError) {
      throw logsError
    }

    // Get total workshops count
    const { count: workshopsCount } = await supabase
      .from('workshops')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('luma_event_id', 'is', null)

    // Get last sync time
    const lastSync = syncLogs && syncLogs.length > 0 ? syncLogs[0] : null

    return NextResponse.json({
      success: true,
      sync_history: syncLogs,
      stats: {
        total_workshops: workshopsCount || 0,
        last_sync: lastSync?.completed_at || null,
        last_sync_status: lastSync?.sync_status || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch sync status',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
