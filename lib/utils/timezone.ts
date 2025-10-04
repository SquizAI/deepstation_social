export interface Timezone {
  value: string
  label: string
  offset: string
}

export const TIMEZONES: Timezone[] = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
  { value: 'America/Sao_Paulo', label: 'São Paulo Time (BRT)', offset: 'UTC-3' }
]

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(date: Date, fromTz: string, toTz: string): Date {
  const dateStr = date.toLocaleString('en-US', { timeZone: fromTz })
  const converted = new Date(dateStr)
  return new Date(converted.toLocaleString('en-US', { timeZone: toTz }))
}

/**
 * Format a date for display in a specific timezone
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone
  })
}

/**
 * Get the current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date()
  const str = now.toLocaleString('en-US', { timeZone: timezone })
  return new Date(str)
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date, timezone: string): boolean {
  const now = getCurrentTimeInTimezone(timezone)
  return date < now
}

/**
 * Get optimal posting times for different platforms
 */
export interface OptimalTime {
  platform: string
  time: string
  description: string
}

export const OPTIMAL_POSTING_TIMES: OptimalTime[] = [
  {
    platform: 'linkedin',
    time: '9:00 AM - 10:00 AM',
    description: 'Weekdays, when professionals check their feed'
  },
  {
    platform: 'instagram',
    time: '11:00 AM - 1:00 PM',
    description: 'Lunch hours, high engagement period'
  },
  {
    platform: 'twitter',
    time: '12:00 PM - 3:00 PM',
    description: 'Midday, when users are most active'
  },
  {
    platform: 'discord',
    time: '6:00 PM - 9:00 PM',
    description: 'Evening hours, when community is online'
  }
]

/**
 * Calculate next scheduled time for recurring posts
 */
export function getNextScheduledTime(
  baseDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  daysOfWeek?: number[]
): Date {
  const next = new Date(baseDate)

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDay = next.getDay()
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
        const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]
        const daysToAdd = nextDay > currentDay
          ? nextDay - currentDay
          : 7 - currentDay + nextDay
        next.setDate(next.getDate() + daysToAdd)
      } else {
        next.setDate(next.getDate() + 7)
      }
      break

    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
  }

  return next
}
