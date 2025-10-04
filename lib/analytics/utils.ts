import { DateRange, DateRangePreset } from '@/lib/types/analytics'
import { startOfDay, endOfDay, subDays } from 'date-fns'

/**
 * Get date range from preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date()

  switch (preset) {
    case '7d':
      return {
        start: startOfDay(subDays(now, 7)),
        end: endOfDay(now)
      }
    case '30d':
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now)
      }
    case '90d':
      return {
        start: startOfDay(subDays(now, 90)),
        end: endOfDay(now)
      }
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date range requires start and end dates')
      }
      return {
        start: startOfDay(customStart),
        end: endOfDay(customEnd)
      }
    default:
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now)
      }
  }
}
