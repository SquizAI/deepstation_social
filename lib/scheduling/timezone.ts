/**
 * Timezone Management Utilities
 * Handles conversion between user timezones and UTC for scheduling
 */

import { formatInTimeZone, toDate } from 'date-fns-tz';
import { format, isValid } from 'date-fns';

/**
 * Supported timezones (common US timezones + UTC)
 */
export const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',      // Eastern
  'America/Chicago',       // Central
  'America/Denver',        // Mountain
  'America/Los_Angeles',   // Pacific
  'America/Anchorage',     // Alaska
  'Pacific/Honolulu',      // Hawaii
  'America/Phoenix',       // Arizona (no DST)
  'America/Puerto_Rico',   // Puerto Rico
] as const;

export type SupportedTimezone = typeof SUPPORTED_TIMEZONES[number];

/**
 * Timezone display names
 */
export const TIMEZONE_LABELS: Record<SupportedTimezone, string> = {
  'UTC': 'UTC (Coordinated Universal Time)',
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Anchorage': 'Alaska Time (AKT)',
  'Pacific/Honolulu': 'Hawaii Time (HT)',
  'America/Phoenix': 'Arizona Time (MST - no DST)',
  'America/Puerto_Rico': 'Atlantic Time (AST)',
};

/**
 * Convert a local date/time to UTC
 * @param localDate - Date in user's local timezone
 * @param timezone - User's timezone (IANA format)
 * @returns Date object in UTC
 */
export function convertToUTC(localDate: Date, timezone: string): Date {
  try {
    // Validate input
    if (!isValid(localDate)) {
      throw new Error('Invalid date provided');
    }

    // Convert to UTC using the specified timezone
    const utcDate = toDate(localDate, { timeZone: timezone });
    return utcDate;
  } catch (error: any) {
    console.error('Error converting to UTC:', error);
    throw new Error(`Failed to convert to UTC: ${error.message}`);
  }
}

/**
 * Convert a UTC date to user's local timezone
 * @param utcDate - Date in UTC
 * @param timezone - Target timezone (IANA format)
 * @returns Date object in user's timezone
 */
export function convertFromUTC(utcDate: Date, timezone: string): Date {
  try {
    // Validate input
    if (!isValid(utcDate)) {
      throw new Error('Invalid date provided');
    }

    // Parse the UTC date in the target timezone
    const localDateString = formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ss");
    const localDate = new Date(localDateString);

    return localDate;
  } catch (error: any) {
    console.error('Error converting from UTC:', error);
    throw new Error(`Failed to convert from UTC: ${error.message}`);
  }
}

/**
 * Format a date in user's timezone for display
 * @param date - Date to format (can be UTC or local)
 * @param timezone - User's timezone
 * @param formatString - date-fns format string (default: 'PPpp' = 'Apr 15, 2025, 9:00 AM')
 * @returns Formatted date string
 */
export function formatInUserTimezone(
  date: Date,
  timezone: string,
  formatString: string = 'PPpp'
): string {
  try {
    if (!isValid(date)) {
      return 'Invalid date';
    }

    return formatInTimeZone(date, timezone, formatString);
  } catch (error: any) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
}

/**
 * Validate if a timezone string is supported
 * @param timezone - Timezone string to validate
 * @returns True if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to use the timezone
    const testDate = new Date();
    formatInTimeZone(testDate, timezone, 'yyyy-MM-dd');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current time in a specific timezone
 * @param timezone - Target timezone
 * @returns Current date/time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date();
  return convertFromUTC(now, timezone);
}

/**
 * Get timezone offset in hours
 * @param timezone - Timezone to check
 * @returns Offset in hours (e.g., -5 for EST, -8 for PST)
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcTime = now.getTime();
  const localTime = convertFromUTC(now, timezone).getTime();
  const offsetMs = localTime - utcTime;
  return Math.round(offsetMs / (1000 * 60 * 60));
}

/**
 * Check if timezone observes DST
 * @param timezone - Timezone to check
 * @returns True if DST is observed
 */
export function observesDST(timezone: string): boolean {
  // Check offset in January vs July
  const january = new Date(new Date().getFullYear(), 0, 1);
  const july = new Date(new Date().getFullYear(), 6, 1);

  const janOffset = getTimezoneOffsetAtDate(timezone, january);
  const julyOffset = getTimezoneOffsetAtDate(timezone, july);

  return janOffset !== julyOffset;
}

/**
 * Get timezone offset at a specific date
 * @param timezone - Timezone to check
 * @param date - Date to check
 * @returns Offset in hours
 */
function getTimezoneOffsetAtDate(timezone: string, date: Date): number {
  const utcTime = date.getTime();
  const localTime = convertFromUTC(date, timezone).getTime();
  const offsetMs = localTime - utcTime;
  return Math.round(offsetMs / (1000 * 60 * 60));
}

/**
 * Parse a scheduled time string and convert to UTC
 * @param dateString - Date string (ISO or other format)
 * @param timeString - Time string (HH:mm format)
 * @param timezone - User's timezone
 * @returns UTC Date object
 */
export function parseScheduledTime(
  dateString: string,
  timeString: string,
  timezone: string
): Date {
  try {
    // Parse the date and time
    const [hours, minutes] = timeString.split(':').map(Number);
    const localDate = new Date(dateString);
    localDate.setHours(hours, minutes, 0, 0);

    // Convert to UTC
    return convertToUTC(localDate, timezone);
  } catch (error: any) {
    throw new Error(`Failed to parse scheduled time: ${error.message}`);
  }
}

/**
 * Get user's browser timezone
 * @returns IANA timezone string
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect browser timezone, defaulting to America/New_York');
    return 'America/New_York';
  }
}

/**
 * Format timezone abbreviation (ET, CT, PT, etc.)
 * @param timezone - Full IANA timezone
 * @param date - Date to check (for DST)
 * @returns Abbreviated timezone (e.g., 'EST', 'EDT', 'PST', 'PDT')
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatted = formatInTimeZone(date, timezone, 'zzz');
    return formatted;
  } catch (error) {
    return timezone;
  }
}

/**
 * Check if a scheduled time is in the past
 * @param scheduledTime - Scheduled time (UTC)
 * @param bufferMinutes - Optional buffer in minutes (default: 5)
 * @returns True if time is in the past
 */
export function isScheduledTimeInPast(
  scheduledTime: Date,
  bufferMinutes: number = 5
): boolean {
  const now = new Date();
  const buffer = bufferMinutes * 60 * 1000;
  return scheduledTime.getTime() < (now.getTime() - buffer);
}

/**
 * Format duration between now and scheduled time
 * @param scheduledTime - Scheduled time
 * @returns Human-readable duration (e.g., "in 2 hours", "in 3 days")
 */
export function formatTimeUntilScheduled(scheduledTime: Date): string {
  const now = new Date();
  const diff = scheduledTime.getTime() - now.getTime();

  if (diff < 0) {
    return 'Past due';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'in less than a minute';
  }
}

/**
 * Example usage and test cases
 */
export const timezoneExamples = {
  // User in Miami schedules for 9:00 AM local time
  scheduleMiamiTime: () => {
    const localTime = new Date('2025-10-15T09:00:00'); // 9 AM
    const timezone = 'America/New_York';
    const utcTime = convertToUTC(localTime, timezone);
    console.log('Miami 9 AM:', localTime);
    console.log('UTC equivalent:', utcTime.toISOString());
    return utcTime;
  },

  // Display UTC time in user's timezone
  displayInUserTimezone: (utcTime: Date, timezone: string) => {
    const localDisplay = formatInUserTimezone(utcTime, timezone, 'PPpp');
    console.log(`Display in ${timezone}:`, localDisplay);
    return localDisplay;
  },

  // Check DST
  checkDSTStatus: (timezone: string) => {
    const hasDST = observesDST(timezone);
    const abbr = getTimezoneAbbreviation(timezone);
    console.log(`${timezone} observes DST:`, hasDST);
    console.log(`Current abbreviation:`, abbr);
    return { hasDST, abbr };
  },
};
