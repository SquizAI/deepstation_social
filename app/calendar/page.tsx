import { createClient } from '@/lib/supabase/server'
import { PublicCalendarClient } from './calendar-client'
import type { CalendarEvent } from '@/lib/calendar/utils'

interface Speaker {
  id: string
  full_name: string
  presentation_title: string
  presentation_description: string
  event_date: string
  event_location: string
  status: string
}

export const revalidate = 3600 // Revalidate every hour

export default async function PublicCalendarPage() {
  const supabase = await createClient()

  // Fetch only approved/published speaker events
  const { data: speakers } = await supabase
    .from('speakers')
    .select('*')
    .eq('status', 'approved')
    .order('event_date', { ascending: true })

  // Transform speakers into CalendarEvent format
  const events: CalendarEvent[] = []

  if (speakers) {
    speakers.forEach((speaker: Speaker) => {
      events.push({
        id: speaker.id,
        type: 'speaker',
        date: speaker.event_date,
        title: speaker.presentation_title,
        description: speaker.presentation_description,
        speakerName: speaker.full_name,
        location: speaker.event_location,
        status: speaker.status,
        time: speaker.event_date
      })
    })
  }

  return <PublicCalendarClient events={events} />
}
