import { RecurringPattern } from '@/lib/types/schedule'

/**
 * Calculate the next occurrence date based on recurring pattern
 */
export function calculateNextOccurrence(
  currentDate: Date,
  pattern: RecurringPattern,
  timezone: string = 'UTC'
): Date | null {
  const current = new Date(currentDate)
  const interval = pattern.interval || 1

  switch (pattern.frequency) {
    case 'daily':
      current.setDate(current.getDate() + interval)
      break

    case 'weekly':
      // If specific days of week are set
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const currentDay = current.getDay()
        const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b)

        // Find next day in the pattern
        let nextDay = sortedDays.find(day => day > currentDay)

        if (nextDay === undefined) {
          // Wrap to next week
          nextDay = sortedDays[0]
          current.setDate(current.getDate() + (7 - currentDay + nextDay))
        } else {
          current.setDate(current.getDate() + (nextDay - currentDay))
        }
      } else {
        // Default weekly interval
        current.setDate(current.getDate() + (7 * interval))
      }
      break

    case 'monthly':
      if (pattern.dayOfMonth) {
        // Set to specific day of month
        const currentMonth = current.getMonth()
        current.setMonth(currentMonth + interval)
        current.setDate(Math.min(pattern.dayOfMonth, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()))
      } else {
        // Same day next month
        current.setMonth(current.getMonth() + interval)
      }
      break

    case 'none':
    case 'custom':
      return null

    default:
      return null
  }

  // Check if we've exceeded end date
  if (pattern.endDate && current > new Date(pattern.endDate)) {
    return null
  }

  return current
}

/**
 * Generate all occurrences for a recurring pattern up to a limit
 */
export function generateOccurrences(
  startDate: Date,
  pattern: RecurringPattern,
  maxOccurrences: number = 100
): Date[] {
  const occurrences: Date[] = [new Date(startDate)]
  let currentDate = new Date(startDate)
  let count = 1

  while (count < maxOccurrences) {
    const nextDate = calculateNextOccurrence(currentDate, pattern)

    if (!nextDate) break

    // Check occurrence count limit
    if (pattern.occurrenceCount && count >= pattern.occurrenceCount) break

    occurrences.push(nextDate)
    currentDate = nextDate
    count++
  }

  return occurrences
}

/**
 * Format recurring pattern to human-readable string
 */
export function formatRecurringPattern(pattern: RecurringPattern): string {
  const { frequency, interval = 1, daysOfWeek, dayOfMonth, endDate, occurrenceCount } = pattern

  if (frequency === 'none') return 'Does not repeat'

  let description = ''

  switch (frequency) {
    case 'daily':
      description = interval === 1 ? 'Daily' : `Every ${interval} days`
      break

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const days = daysOfWeek.map(d => dayNames[d]).join(', ')
        description = `Weekly on ${days}`
      } else {
        description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`
      }
      break

    case 'monthly':
      if (dayOfMonth) {
        description = `Monthly on day ${dayOfMonth}`
      } else {
        description = interval === 1 ? 'Monthly' : `Every ${interval} months`
      }
      break

    case 'custom':
      description = 'Custom schedule'
      break
  }

  // Add end condition
  if (endDate) {
    const date = new Date(endDate).toLocaleDateString()
    description += ` until ${date}`
  } else if (occurrenceCount) {
    description += `, ${occurrenceCount} times`
  }

  return description
}

/**
 * Validate recurring pattern
 */
export function validateRecurringPattern(pattern: RecurringPattern): { valid: boolean; error?: string } {
  if (!pattern.frequency) {
    return { valid: false, error: 'Frequency is required' }
  }

  if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
    if (pattern.daysOfWeek.some(day => day < 0 || day > 6)) {
      return { valid: false, error: 'Invalid day of week (must be 0-6)' }
    }
  }

  if (pattern.frequency === 'monthly' && pattern.dayOfMonth) {
    if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      return { valid: false, error: 'Invalid day of month (must be 1-31)' }
    }
  }

  if (pattern.interval && pattern.interval < 1) {
    return { valid: false, error: 'Interval must be at least 1' }
  }

  if (pattern.endDate && pattern.occurrenceCount) {
    return { valid: false, error: 'Cannot specify both end date and occurrence count' }
  }

  return { valid: true }
}

/**
 * Check if a recurring pattern should be deactivated
 */
export function shouldDeactivateRecurring(
  pattern: RecurringPattern,
  currentOccurrence: number,
  lastOccurrenceDate: Date
): boolean {
  // Check occurrence count limit
  if (pattern.occurrenceCount && currentOccurrence >= pattern.occurrenceCount) {
    return true
  }

  // Check end date
  if (pattern.endDate && lastOccurrenceDate >= new Date(pattern.endDate)) {
    return true
  }

  return false
}

/**
 * Convert recurring pattern to iCalendar RRULE format
 */
export function patternToRRule(pattern: RecurringPattern): string {
  const parts: string[] = []

  switch (pattern.frequency) {
    case 'daily':
      parts.push('FREQ=DAILY')
      if (pattern.interval && pattern.interval > 1) {
        parts.push(`INTERVAL=${pattern.interval}`)
      }
      break

    case 'weekly':
      parts.push('FREQ=WEEKLY')
      if (pattern.interval && pattern.interval > 1) {
        parts.push(`INTERVAL=${pattern.interval}`)
      }
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const days = pattern.daysOfWeek.map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d])
        parts.push(`BYDAY=${days.join(',')}`)
      }
      break

    case 'monthly':
      parts.push('FREQ=MONTHLY')
      if (pattern.interval && pattern.interval > 1) {
        parts.push(`INTERVAL=${pattern.interval}`)
      }
      if (pattern.dayOfMonth) {
        parts.push(`BYMONTHDAY=${pattern.dayOfMonth}`)
      }
      break
  }

  if (pattern.endDate) {
    const date = new Date(pattern.endDate)
    const formatted = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    parts.push(`UNTIL=${formatted}`)
  } else if (pattern.occurrenceCount) {
    parts.push(`COUNT=${pattern.occurrenceCount}`)
  }

  return `RRULE:${parts.join(';')}`
}

/**
 * Parse iCalendar RRULE to recurring pattern
 */
export function rruleToPattern(rrule: string): RecurringPattern | null {
  if (!rrule.startsWith('RRULE:')) return null

  const parts = rrule.substring(6).split(';')
  const pattern: RecurringPattern = { frequency: 'none' }

  for (const part of parts) {
    const [key, value] = part.split('=')

    switch (key) {
      case 'FREQ':
        pattern.frequency = value.toLowerCase() as any
        break
      case 'INTERVAL':
        pattern.interval = parseInt(value)
        break
      case 'BYDAY':
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
        pattern.daysOfWeek = value.split(',').map(d => dayMap[d])
        break
      case 'BYMONTHDAY':
        pattern.dayOfMonth = parseInt(value)
        break
      case 'UNTIL':
        pattern.endDate = new Date(value).toISOString()
        break
      case 'COUNT':
        pattern.occurrenceCount = parseInt(value)
        break
    }
  }

  return pattern
}
