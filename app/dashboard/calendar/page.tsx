import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './calendar-client'
import type { CalendarEvent } from '@/lib/calendar/utils'

interface ScheduledPost {
  id: string
  content: Record<string, string>
  scheduled_for: string
  platforms: string[]
  status: string
}

interface Speaker {
  id: string
  full_name: string
  presentation_title: string
  presentation_description: string
  event_date: string
  event_location: string
  status: string
}

interface Workshop {
  id: string
  title: string
  description?: string
  short_description?: string
  event_date: string
  start_time: string
  end_time: string
  location_type: 'online' | 'in-person' | 'hybrid'
  location_city?: string
  luma_url?: string
  current_attendees: number
  max_capacity?: number
  status: string
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch scheduled posts
  const { data: scheduledPosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: true })

  // Fetch speaker events
  const { data: speakers } = await supabase
    .from('speakers')
    .select('*')
    .order('event_date', { ascending: true })

  // Fetch workshops
  const { data: workshops } = await supabase
    .from('workshops')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  // Transform data into CalendarEvent format
  const events: CalendarEvent[] = []

  // Add scheduled posts
  if (scheduledPosts) {
    scheduledPosts.forEach((post: ScheduledPost) => {
      // Get first non-empty content for title
      const contentValues = Object.values(post.content).filter(c => c && c.trim())
      const title = contentValues[0]?.substring(0, 50) + (contentValues[0]?.length > 50 ? '...' : '') || 'Untitled Post'

      events.push({
        id: post.id,
        type: 'post',
        date: post.scheduled_for,
        title,
        description: contentValues[0],
        platforms: post.platforms,
        status: post.status,
        time: post.scheduled_for
      })
    })
  }

  // Add speaker events
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

  // Add workshop events
  if (workshops) {
    workshops.forEach((workshop: Workshop) => {
      events.push({
        id: workshop.id,
        type: 'workshop',
        date: workshop.event_date,
        title: workshop.title,
        description: workshop.description || workshop.short_description,
        location: workshop.location_city,
        locationType: workshop.location_type,
        workshopUrl: workshop.luma_url,
        attendeeCount: workshop.current_attendees,
        maxCapacity: workshop.max_capacity,
        startTime: workshop.start_time,
        endTime: workshop.end_time,
        status: workshop.status,
        time: workshop.event_date
      })
    })
  }

  // Calculate stats
  const now = new Date()
  const upcomingPosts = scheduledPosts?.filter(
    (post: ScheduledPost) => new Date(post.scheduled_for) >= now && post.status === 'scheduled'
  ).length || 0

  const upcomingSpeakers = speakers?.filter(
    (speaker: Speaker) => new Date(speaker.event_date) >= now
  ).length || 0

  const upcomingWorkshops = workshops?.filter(
    (workshop: Workshop) => new Date(workshop.event_date) >= now && workshop.status === 'published'
  ).length || 0

  const totalUpcoming = upcomingPosts + upcomingSpeakers + upcomingWorkshops

  return (
    <CalendarClient
      events={events}
      stats={{
        totalUpcoming,
        upcomingPosts,
        upcomingSpeakers,
        upcomingWorkshops,
        totalEvents: events.length
      }}
    />
  )
}
