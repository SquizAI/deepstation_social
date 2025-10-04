/**
 * Scheduling System - Main Export
 * Complete scheduling utilities for DeepStation
 */

// Timezone utilities
export {
  convertToUTC,
  convertFromUTC,
  formatInUserTimezone,
  isValidTimezone,
  getCurrentTimeInTimezone,
  getTimezoneOffset,
  observesDST,
  parseScheduledTime,
  getBrowserTimezone,
  getTimezoneAbbreviation,
  isScheduledTimeInPast,
  formatTimeUntilScheduled,
  SUPPORTED_TIMEZONES,
  TIMEZONE_LABELS,
  type SupportedTimezone,
} from './timezone';

// Recurrence (RRULE) utilities
export {
  generateRRule,
  parseRRule,
  calculateNextOccurrence,
  getRecurrenceInfo,
  isValidRRule,
  createDailyRecurrence,
  createWeeklyRecurrence,
  createMonthlyRecurrence,
  createRecurrenceWithCount,
  updateRecurrenceEndDate,
  hasRecurrenceEnded,
  getTotalOccurrences,
  getRecurrenceDescription,
  WEEKDAYS,
  type RecurrenceFrequency,
  type RecurrenceConfig,
  type RecurrenceInfo,
} from './recurrence';

// Queue management
export {
  JobQueue,
  getGlobalQueue,
  queueHelpers,
  JobPriority,
  JobStatus,
  JobType,
  type Job,
  type PublishJobData,
  type RetryJobData,
  type QueueStats,
} from './queue';

// Monitoring utilities
export {
  getSchedulerHealth,
  detectStuckJobs,
  getQueueDepthMetrics,
  getJobMetrics,
  getPlatformPerformance,
  resetStuckJobs,
  getRecentErrors,
  getHourlyDistribution,
  formatHealthReport,
  logSchedulerMetrics,
  type SchedulerHealth,
  type JobMetrics,
  type StuckJob,
  type QueueDepth,
} from './monitoring';

/**
 * Quick start example: Schedule a post
 */
export const schedulePostExample = async () => {
  const { parseScheduledTime } = await import('./timezone');
  const { createClient } = await import('@supabase/supabase-js');

  // User wants to schedule for 9 AM Miami time on Oct 15, 2025
  const scheduledFor = parseScheduledTime(
    '2025-10-15',
    '09:00',
    'America/New_York'
  );

  console.log('Local time: 2025-10-15 09:00 (Miami)');
  console.log('UTC time:', scheduledFor.toISOString());

  // Store in database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from('scheduled_posts').insert({
    user_id: 'user-id',
    content: {
      linkedin: 'Professional content',
      twitter: 'Casual tweet',
    },
    platforms: ['linkedin', 'twitter'],
    scheduled_for: scheduledFor.toISOString(),
    timezone: 'America/New_York',
    status: 'scheduled',
  });

  if (error) {
    console.error('Error scheduling post:', error);
  } else {
    console.log('Post scheduled successfully:', data);
  }
};

/**
 * Quick start example: Create recurring post
 */
export const createRecurringPostExample = async () => {
  const { createWeeklyRecurrence } = await import('./recurrence');
  const { createClient } = await import('@supabase/supabase-js');

  // Every Tuesday at 2 PM for the next year
  const startDate = new Date(2025, 0, 7, 14, 0, 0); // Jan 7, 2025
  const endDate = new Date(2025, 11, 31); // Dec 31, 2025
  const rrule = createWeeklyRecurrence(startDate, [2], endDate); // 2 = Tuesday

  console.log('RRULE:', rrule);
  console.log('Start:', startDate.toISOString());
  console.log('End:', endDate.toISOString());

  // Store in database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Create parent post
  const { data: parentPost } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id: 'user-id',
      title: 'Weekly Newsletter',
      content: {
        linkedin: 'This week in tech...',
      },
      platforms: ['linkedin'],
      scheduled_for: startDate.toISOString(),
      timezone: 'America/New_York',
      recurrence_rule: rrule,
      status: 'scheduled',
    })
    .select()
    .single();

  // Create recurring entry
  if (parentPost) {
    await supabase.from('recurring_posts').insert({
      parent_post_id: parentPost.id,
      user_id: 'user-id',
      recurrence_rule: rrule,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      timezone: 'America/New_York',
      next_occurrence: startDate.toISOString(),
      is_active: true,
    });
  }
};

/**
 * Quick start example: Monitor scheduler
 */
export const monitorSchedulerExample = async () => {
  const { getSchedulerHealth, formatHealthReport } = await import('./monitoring');

  const health = await getSchedulerHealth(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(formatHealthReport(health));
};

/**
 * Quick start example: Use job queue
 */
export const useJobQueueExample = () => {
  const { queueHelpers, JobPriority } = require('./queue');

  // Enqueue a publish job
  const job = queueHelpers.enqueuePublish(
    'post-id-123',
    'user-id-456',
    ['linkedin', 'twitter'],
    {
      linkedin: 'Professional content',
      twitter: 'Casual tweet',
    },
    ['https://example.com/image.jpg'],
    undefined,
    JobPriority.HIGH
  );

  console.log('Job enqueued:', job.id);

  // Check queue stats
  const stats = queueHelpers.getQueueStats();
  console.log('Queue stats:', stats);
};
