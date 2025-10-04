/**
 * Luma API Integration
 * Handles syncing events from Luma calendar to DeepStation
 */

const LUMA_API_BASE = 'https://public-api.luma.com'
const LUMA_API_KEY = process.env.LUMA_API_KEY

export interface LumaEvent {
  api_id: string
  name: string
  description?: string
  start_at: string
  end_at: string
  timezone: string
  geo_address_json?: {
    city?: string
    region?: string
    country?: string
    place_name?: string
    full_address?: string
  }
  meeting_url?: string
  url: string
  cover_url?: string
  thumbnail_url?: string
  hosts?: Array<{
    name: string
    email?: string
  }>
  guest_count?: number
  capacity?: number
  visibility?: string
  event_type?: string
}

export interface LumaCalendarResponse {
  entries: LumaEvent[]
  has_more: boolean
  next_cursor?: string
}

/**
 * Fetch events from Luma calendar
 */
export async function fetchLumaEvents(
  calendarId?: string,
  cursor?: string
): Promise<LumaCalendarResponse> {
  if (!LUMA_API_KEY) {
    throw new Error('LUMA_API_KEY is not configured in environment variables')
  }

  try {
    const url = new URL(`${LUMA_API_BASE}/v1/calendar/list-events`)
    if (cursor) {
      url.searchParams.append('pagination_cursor', cursor)
    }
    if (calendarId) {
      url.searchParams.append('calendar_api_id', calendarId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-luma-api-key': LUMA_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Luma API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Luma events:', error)
    throw error
  }
}

/**
 * Fetch a single event from Luma
 */
export async function fetchLumaEvent(eventId: string): Promise<LumaEvent> {
  if (!LUMA_API_KEY) {
    throw new Error('LUMA_API_KEY is not configured in environment variables')
  }

  try {
    const response = await fetch(
      `${LUMA_API_BASE}/v1/event/get?event_api_id=${eventId}`,
      {
        method: 'GET',
        headers: {
          'x-luma-api-key': LUMA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Luma API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.event
  } catch (error) {
    console.error('Error fetching Luma event:', error)
    throw error
  }
}

/**
 * Fetch guests for a Luma event
 */
export async function fetchLumaGuests(
  eventId: string,
  cursor?: string
): Promise<{ guests: any[]; has_more: boolean; next_cursor?: string }> {
  if (!LUMA_API_KEY) {
    throw new Error('LUMA_API_KEY is not configured in environment variables')
  }

  try {
    const url = new URL(`${LUMA_API_BASE}/v1/event/get-guests`)
    url.searchParams.append('event_api_id', eventId)
    if (cursor) {
      url.searchParams.append('pagination_cursor', cursor)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-luma-api-key': LUMA_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Luma API error: ${response.status} - ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Luma guests:', error)
    throw error
  }
}

/**
 * Transform Luma event to DeepStation workshop format
 */
export function transformLumaEvent(lumaEvent: LumaEvent, userId: string) {
  const startDate = new Date(lumaEvent.start_at)
  const endDate = new Date(lumaEvent.end_at)

  // Determine location type
  let locationType: 'online' | 'in-person' | 'hybrid' = 'in-person'
  if (lumaEvent.meeting_url) {
    locationType = lumaEvent.geo_address_json ? 'hybrid' : 'online'
  }

  return {
    user_id: userId,
    luma_event_id: lumaEvent.api_id,
    luma_url: lumaEvent.url,

    title: lumaEvent.name,
    description: lumaEvent.description || '',

    event_date: startDate.toISOString().split('T')[0],
    start_time: startDate.toTimeString().split(' ')[0],
    end_time: endDate.toTimeString().split(' ')[0],
    timezone: lumaEvent.timezone,

    location_type: locationType,
    location_name: lumaEvent.geo_address_json?.place_name || null,
    location_address: lumaEvent.geo_address_json?.full_address || null,
    location_city: lumaEvent.geo_address_json?.city || null,
    location_state: lumaEvent.geo_address_json?.region || null,
    location_country: lumaEvent.geo_address_json?.country || null,

    status: 'published',
    visibility: lumaEvent.visibility || 'public',

    registration_url: lumaEvent.url,
    max_capacity: lumaEvent.capacity || null,
    current_attendees: lumaEvent.guest_count || 0,

    is_free: true, // Luma doesn't expose pricing in basic API
    ticket_price: 0,

    cover_image_url: lumaEvent.cover_url || null,
    thumbnail_url: lumaEvent.thumbnail_url || null,

    organizers: lumaEvent.hosts || [],

    last_synced_at: new Date().toISOString(),
    sync_enabled: true,
  }
}

/**
 * Batch fetch all events from a calendar (handles pagination)
 */
export async function fetchAllLumaEvents(
  calendarId?: string
): Promise<LumaEvent[]> {
  const allEvents: LumaEvent[] = []
  let cursor: string | undefined = undefined
  let hasMore = true

  while (hasMore) {
    const response = await fetchLumaEvents(calendarId, cursor)
    allEvents.push(...response.entries)
    hasMore = response.has_more
    cursor = response.next_cursor
  }

  return allEvents
}
