/**
 * Calendar utility functions for DeepStation
 * Handles date manipulation, event aggregation, and calendar grid generation
 */

export interface CalendarEvent {
  id: string
  type: 'post' | 'speaker' | 'workshop'
  date: string
  title: string
  description?: string
  platform?: string // for posts
  platforms?: string[] // for posts with multiple platforms
  speakerName?: string // for speakers
  location?: string // for speakers
  locationType?: 'online' | 'in-person' | 'hybrid' // for workshops
  workshopUrl?: string // for workshops (Luma URL)
  attendeeCount?: number // for workshops
  maxCapacity?: number // for workshops
  startTime?: string // for workshops
  endTime?: string // for workshops
  status?: string
  time?: string
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Get the day of week for the first day of the month (0 = Sunday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/**
 * Generate calendar grid with dates
 * Returns array of weeks, each containing 7 days
 */
export function generateCalendarGrid(
  year: number,
  month: number
): Array<Array<Date | null>> {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const weeks: Array<Array<Date | null>> = []

  let currentWeek: Array<Date | null> = []

  // Fill in empty days at the start
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null)
  }

  // Fill in the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(new Date(year, month, day))
  }

  // Fill in empty days at the end
  while (currentWeek.length < 7) {
    currentWeek.push(null)
  }
  weeks.push(currentWeek)

  return weeks
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(
  date: Date,
  events: CalendarEvent[]
): CalendarEvent[] {
  const dateStr = formatDateToYMD(date)
  return events.filter((event) => {
    const eventDate = new Date(event.date)
    return formatDateToYMD(eventDate) === dateStr
  })
}

/**
 * Aggregate events by date
 */
export function aggregateEventsByDate(
  events: CalendarEvent[]
): Record<string, CalendarEvent[]> {
  const aggregated: Record<string, CalendarEvent[]> = {}

  events.forEach((event) => {
    const eventDate = new Date(event.date)
    const dateKey = formatDateToYMD(eventDate)

    if (!aggregated[dateKey]) {
      aggregated[dateKey] = []
    }
    aggregated[dateKey].push(event)
  })

  return aggregated
}

/**
 * Get event color based on type
 */
export function getEventColor(type: 'post' | 'speaker' | 'workshop'): string {
  switch (type) {
    case 'post':
      return 'fuchsia' // Fuchsia for posts
    case 'speaker':
      return 'purple' // Purple for speakers
    case 'workshop':
      return 'blue' // Blue for workshops
    default:
      return 'fuchsia'
  }
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month]
}

/**
 * Get abbreviated day names
 */
export function getDayNames(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

/**
 * Format time from date string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMinutes = String(minutes).padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${ampm}`
}

/**
 * Format date for display
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString)
  const month = getMonthName(date.getMonth())
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

/**
 * Get events count for a date
 */
export function getEventsCount(
  date: Date,
  events: CalendarEvent[]
): { posts: number; speakers: number; workshops: number; total: number } {
  const dayEvents = getEventsForDate(date, events)
  const posts = dayEvents.filter((e) => e.type === 'post').length
  const speakers = dayEvents.filter((e) => e.type === 'speaker').length
  const workshops = dayEvents.filter((e) => e.type === 'workshop').length

  return {
    posts,
    speakers,
    workshops,
    total: dayEvents.length
  }
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

/**
 * Get upcoming events (from today onwards)
 */
export function getUpcomingEvents(
  events: CalendarEvent[],
  limit?: number
): CalendarEvent[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = events
    .filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return limit ? upcoming.slice(0, limit) : upcoming
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: CalendarEvent[],
  type: 'all' | 'post' | 'speaker' | 'workshop'
): CalendarEvent[] {
  if (type === 'all') return events
  return events.filter((event) => event.type === type)
}

/**
 * Filter events by location (for speaker events)
 */
export function filterEventsByLocation(
  events: CalendarEvent[],
  location: string
): CalendarEvent[] {
  if (location === 'all') return events
  return events.filter((event) => event.location === location)
}

/**
 * Search events by title or description
 */
export function searchEvents(
  events: CalendarEvent[],
  query: string
): CalendarEvent[] {
  const lowerQuery = query.toLowerCase()
  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.speakerName?.toLowerCase().includes(lowerQuery)
  )
}
