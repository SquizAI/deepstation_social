/**
 * Recurrence (RRULE) Utilities
 * Handles recurring post scheduling using iCalendar RRULE format
 */

import { RRule, Frequency, Weekday, rrulestr } from 'rrule';

/**
 * Recurrence frequency options
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Day of week (0 = Sunday, 6 = Saturday)
 */
export const WEEKDAYS = {
  SUNDAY: RRule.SU,
  MONDAY: RRule.MO,
  TUESDAY: RRule.TU,
  WEDNESDAY: RRule.WE,
  THURSDAY: RRule.TH,
  FRIDAY: RRule.FR,
  SATURDAY: RRule.SA,
} as const;

/**
 * Recurrence configuration
 */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval?: number; // Every N days/weeks/months (default: 1)
  daysOfWeek?: number[]; // 0-6 for weekly recurrence
  dayOfMonth?: number; // 1-31 for monthly recurrence
  startDate: Date;
  endDate?: Date; // UNTIL
  count?: number; // Number of occurrences
  timezone?: string;
}

/**
 * Recurrence info for display
 */
export interface RecurrenceInfo {
  rruleString: string;
  humanReadable: string;
  nextOccurrences: Date[];
  frequency: RecurrenceFrequency;
  hasEndDate: boolean;
  endDate?: Date;
  totalOccurrences?: number;
}

/**
 * Generate RRULE string from configuration
 * @param config - Recurrence configuration
 * @returns RRULE string (e.g., "FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20251231T000000Z")
 */
export function generateRRule(config: RecurrenceConfig): string {
  try {
    const options: any = {
      freq: getFrequency(config.frequency),
      dtstart: config.startDate,
      interval: config.interval || 1,
    };

    // Add day of week for weekly recurrence
    if (config.daysOfWeek && config.daysOfWeek.length > 0) {
      options.byweekday = config.daysOfWeek.map(dayNumToRRuleDay);
    }

    // Add day of month for monthly recurrence
    if (config.dayOfMonth) {
      options.bymonthday = config.dayOfMonth;
    }

    // Add end date or count
    if (config.endDate) {
      options.until = config.endDate;
    } else if (config.count) {
      options.count = config.count;
    }

    const rule = new RRule(options);
    return rule.toString();
  } catch (error: any) {
    console.error('Error generating RRULE:', error);
    throw new Error(`Failed to generate RRULE: ${error.message}`);
  }
}

/**
 * Parse RRULE string and get next occurrences
 * @param rruleString - RRULE string
 * @param limit - Maximum number of occurrences to return (default: 10)
 * @param after - Get occurrences after this date (default: now)
 * @returns Array of Date objects
 */
export function parseRRule(
  rruleString: string,
  limit: number = 10,
  after?: Date
): Date[] {
  try {
    const rule = rrulestr(rruleString);
    const afterDate = after || new Date();

    // Get occurrences after the specified date
    const occurrences = rule.all((date, i) => {
      if (i >= limit) return false; // Stop after limit
      return date > afterDate; // Only future dates
    });

    return occurrences;
  } catch (error: any) {
    console.error('Error parsing RRULE:', error);
    throw new Error(`Failed to parse RRULE: ${error.message}`);
  }
}

/**
 * Calculate next occurrence after a given date
 * @param rruleString - RRULE string
 * @param after - Get next occurrence after this date
 * @returns Next occurrence Date or null if no more occurrences
 */
export function calculateNextOccurrence(
  rruleString: string,
  after: Date
): Date | null {
  try {
    const rule = rrulestr(rruleString);
    const next = rule.after(after, true); // true = inclusive
    return next;
  } catch (error: any) {
    console.error('Error calculating next occurrence:', error);
    return null;
  }
}

/**
 * Get recurrence information for display
 * @param rruleString - RRULE string
 * @param previewCount - Number of occurrences to preview (default: 5)
 * @returns Recurrence info object
 */
export function getRecurrenceInfo(
  rruleString: string,
  previewCount: number = 5
): RecurrenceInfo {
  try {
    const rule = rrulestr(rruleString);
    const nextOccurrences = parseRRule(rruleString, previewCount);

    // Extract frequency
    const options = rule.origOptions;
    const frequency = getFrequencyString(options.freq);

    // Human readable text
    const humanReadable = rule.toText();

    return {
      rruleString,
      humanReadable,
      nextOccurrences,
      frequency,
      hasEndDate: !!options.until,
      endDate: options.until ? new Date(options.until) : undefined,
      totalOccurrences: options.count,
    };
  } catch (error: any) {
    console.error('Error getting recurrence info:', error);
    return {
      rruleString,
      humanReadable: 'Invalid recurrence rule',
      nextOccurrences: [],
      frequency: 'daily',
      hasEndDate: false,
    };
  }
}

/**
 * Validate RRULE string
 * @param rruleString - RRULE string to validate
 * @returns True if valid
 */
export function isValidRRule(rruleString: string): boolean {
  try {
    rrulestr(rruleString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convert frequency string to RRule frequency constant
 */
function getFrequency(freq: RecurrenceFrequency): Frequency {
  switch (freq) {
    case 'daily':
      return RRule.DAILY;
    case 'weekly':
      return RRule.WEEKLY;
    case 'monthly':
      return RRule.MONTHLY;
    case 'yearly':
      return RRule.YEARLY;
    default:
      return RRule.DAILY;
  }
}

/**
 * Convert RRule frequency constant to string
 */
function getFrequencyString(freq: Frequency): RecurrenceFrequency {
  switch (freq) {
    case RRule.DAILY:
      return 'daily';
    case RRule.WEEKLY:
      return 'weekly';
    case RRule.MONTHLY:
      return 'monthly';
    case RRule.YEARLY:
      return 'yearly';
    default:
      return 'daily';
  }
}

/**
 * Convert day number (0-6) to RRule weekday
 */
function dayNumToRRuleDay(dayNum: number): Weekday {
  const days = [
    RRule.SU,
    RRule.MO,
    RRule.TU,
    RRule.WE,
    RRule.TH,
    RRule.FR,
    RRule.SA,
  ];
  return days[dayNum] || RRule.MO;
}

/**
 * Create a daily recurrence
 * @param startDate - Start date
 * @param endDate - Optional end date
 * @param interval - Every N days (default: 1)
 * @returns RRULE string
 */
export function createDailyRecurrence(
  startDate: Date,
  endDate?: Date,
  interval: number = 1
): string {
  return generateRRule({
    frequency: 'daily',
    interval,
    startDate,
    endDate,
  });
}

/**
 * Create a weekly recurrence
 * @param startDate - Start date
 * @param daysOfWeek - Days of week (0-6, Sunday-Saturday)
 * @param endDate - Optional end date
 * @returns RRULE string
 */
export function createWeeklyRecurrence(
  startDate: Date,
  daysOfWeek: number[],
  endDate?: Date
): string {
  return generateRRule({
    frequency: 'weekly',
    daysOfWeek,
    startDate,
    endDate,
  });
}

/**
 * Create a monthly recurrence
 * @param startDate - Start date
 * @param dayOfMonth - Day of month (1-31)
 * @param endDate - Optional end date
 * @returns RRULE string
 */
export function createMonthlyRecurrence(
  startDate: Date,
  dayOfMonth: number,
  endDate?: Date
): string {
  return generateRRule({
    frequency: 'monthly',
    dayOfMonth,
    startDate,
    endDate,
  });
}

/**
 * Create a recurrence with count limit
 * @param config - Recurrence configuration
 * @param count - Number of occurrences
 * @returns RRULE string
 */
export function createRecurrenceWithCount(
  config: Omit<RecurrenceConfig, 'endDate' | 'count'>,
  count: number
): string {
  return generateRRule({
    ...config,
    count,
  });
}

/**
 * Update recurrence end date
 * @param rruleString - Existing RRULE string
 * @param newEndDate - New end date
 * @returns Updated RRULE string
 */
export function updateRecurrenceEndDate(
  rruleString: string,
  newEndDate: Date
): string {
  try {
    const rule = rrulestr(rruleString);
    const options = rule.origOptions;

    // Update until date
    options.until = newEndDate;
    delete options.count; // Remove count if exists

    const newRule = new RRule(options);
    return newRule.toString();
  } catch (error: any) {
    console.error('Error updating recurrence end date:', error);
    throw new Error(`Failed to update end date: ${error.message}`);
  }
}

/**
 * Check if recurrence has ended
 * @param rruleString - RRULE string
 * @returns True if recurrence has no more occurrences
 */
export function hasRecurrenceEnded(rruleString: string): boolean {
  const next = calculateNextOccurrence(rruleString, new Date());
  return next === null;
}

/**
 * Get total number of occurrences
 * @param rruleString - RRULE string
 * @param maxCheck - Maximum occurrences to check (default: 1000)
 * @returns Number of occurrences or null if unlimited
 */
export function getTotalOccurrences(
  rruleString: string,
  maxCheck: number = 1000
): number | null {
  try {
    const rule = rrulestr(rruleString);
    const options = rule.origOptions;

    // If count is specified, return it
    if (options.count) {
      return options.count;
    }

    // If until is specified, count all occurrences
    if (options.until) {
      const all = rule.all();
      return all.length;
    }

    // Unlimited
    return null;
  } catch (error) {
    console.error('Error getting total occurrences:', error);
    return null;
  }
}

/**
 * Example usage patterns
 */
export const recurrenceExamples = {
  // Every Tuesday at 2pm
  everyTuesday: () => {
    const startDate = new Date(2025, 0, 1, 14, 0, 0); // Jan 1, 2025, 2 PM
    const endDate = new Date(2025, 11, 31); // End of year
    return createWeeklyRecurrence(startDate, [2], endDate); // 2 = Tuesday
  },

  // Every Tuesday and Thursday
  tuesdayThursday: () => {
    const startDate = new Date(2025, 0, 1, 14, 0, 0);
    return createWeeklyRecurrence(startDate, [2, 4]); // 2 = Tuesday, 4 = Thursday
  },

  // Daily for 30 days
  dailyFor30Days: () => {
    const startDate = new Date(2025, 0, 1, 9, 0, 0);
    return createRecurrenceWithCount(
      { frequency: 'daily', startDate },
      30
    );
  },

  // Monthly on the 15th
  monthlyOn15th: () => {
    const startDate = new Date(2025, 0, 15, 12, 0, 0);
    const endDate = new Date(2025, 11, 31);
    return createMonthlyRecurrence(startDate, 15, endDate);
  },

  // Every weekday (Mon-Fri)
  everyWeekday: () => {
    const startDate = new Date(2025, 0, 1, 9, 0, 0);
    return createWeeklyRecurrence(startDate, [1, 2, 3, 4, 5]);
  },

  // Every other week
  everyOtherWeek: () => {
    return generateRRule({
      frequency: 'weekly',
      interval: 2,
      daysOfWeek: [2], // Tuesday
      startDate: new Date(2025, 0, 1, 14, 0, 0),
    });
  },
};

/**
 * Get human-readable description of recurrence pattern
 * @param rruleString - RRULE string
 * @returns Human-readable description
 */
export function getRecurrenceDescription(rruleString: string): string {
  try {
    const rule = rrulestr(rruleString);
    return rule.toText();
  } catch (error) {
    return 'Invalid recurrence pattern';
  }
}
