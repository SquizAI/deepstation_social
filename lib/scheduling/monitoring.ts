/**
 * Scheduler Monitoring Utilities
 * Track scheduler health, performance, and detect issues
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Scheduler health status
 */
export interface SchedulerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastRunTime?: Date;
  queueDepth: number;
  stuckJobs: number;
  recentFailures: number;
  successRate: number;
  avgProcessingTime: number;
  issues: string[];
  timestamp: Date;
}

/**
 * Job performance metrics
 */
export interface JobMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Stuck job information
 */
export interface StuckJob {
  id: string;
  postId: string;
  status: string;
  startedAt: Date;
  durationMinutes: number;
  platform: string;
}

/**
 * Queue depth metrics
 */
export interface QueueDepth {
  total: number;
  pending: number;
  processing: number;
  scheduled: number;
  overdue: number;
  byPlatform: Record<string, number>;
}

/**
 * Get scheduler health status
 * @param supabaseUrl - Supabase URL
 * @param supabaseKey - Supabase service role key
 */
export async function getSchedulerHealth(
  supabaseUrl: string,
  supabaseKey: string
): Promise<SchedulerHealth> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const issues: string[] = [];

  try {
    // Check queue depth
    const queueDepth = await getQueueDepthMetrics(supabase);

    // Detect stuck jobs
    const stuckJobs = await detectStuckJobs(supabase);

    // Get recent failures (last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const { data: recentFailures } = await supabase
      .from('publishing_queue')
      .select('id')
      .eq('status', 'failed')
      .gte('queued_at', oneHourAgo.toISOString());

    // Calculate success rate (last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentJobs } = await supabase
      .from('publishing_queue')
      .select('status, queued_at, completed_at')
      .gte('queued_at', oneDayAgo.toISOString());

    const totalRecent = recentJobs?.length || 0;
    const successfulRecent =
      recentJobs?.filter((j) => j.status === 'completed').length || 0;
    const successRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 100;

    // Calculate average processing time
    const completedJobs = recentJobs?.filter(
      (j) => j.status === 'completed' && j.queued_at && j.completed_at
    ) || [];

    const avgProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = new Date(job.completed_at).getTime() - new Date(job.queued_at).getTime();
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

    // Check for issues
    if (queueDepth.overdue > 0) {
      issues.push(`${queueDepth.overdue} overdue jobs in queue`);
    }

    if (stuckJobs.length > 0) {
      issues.push(`${stuckJobs.length} stuck jobs detected`);
    }

    if (successRate < 80) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
    }

    if (queueDepth.total > 100) {
      issues.push(`High queue depth: ${queueDepth.total} jobs`);
    }

    if (avgProcessingTime > 30000) {
      // > 30 seconds
      issues.push(`Slow processing: ${(avgProcessingTime / 1000).toFixed(1)}s average`);
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 || stuckJobs.length > 5 ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      queueDepth: queueDepth.total,
      stuckJobs: stuckJobs.length,
      recentFailures: recentFailures?.length || 0,
      successRate,
      avgProcessingTime,
      issues,
      timestamp: now,
    };
  } catch (error: any) {
    console.error('Error getting scheduler health:', error);

    return {
      status: 'unhealthy',
      queueDepth: 0,
      stuckJobs: 0,
      recentFailures: 0,
      successRate: 0,
      avgProcessingTime: 0,
      issues: [`Error checking health: ${error.message}`],
      timestamp: now,
    };
  }
}

/**
 * Detect stuck jobs (processing for > 10 minutes)
 */
export async function detectStuckJobs(supabase: any): Promise<StuckJob[]> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  try {
    const { data: stuck } = await supabase
      .from('publishing_queue')
      .select('id, scheduled_post_id, platform, status, started_at')
      .eq('status', 'processing')
      .lt('started_at', tenMinutesAgo.toISOString());

    if (!stuck || stuck.length === 0) {
      return [];
    }

    return stuck.map((job: any) => {
      const startedAt = new Date(job.started_at);
      const durationMs = Date.now() - startedAt.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      return {
        id: job.id,
        postId: job.scheduled_post_id,
        status: job.status,
        startedAt,
        durationMinutes,
        platform: job.platform,
      };
    });
  } catch (error) {
    console.error('Error detecting stuck jobs:', error);
    return [];
  }
}

/**
 * Get queue depth metrics
 */
export async function getQueueDepthMetrics(supabase: any): Promise<QueueDepth> {
  const now = new Date();

  try {
    // Get all pending and processing jobs
    const { data: jobs } = await supabase
      .from('publishing_queue')
      .select('status, platform, scheduled_post_id')
      .in('status', ['pending', 'processing']);

    // Get scheduled posts
    const { data: scheduledPosts } = await supabase
      .from('scheduled_posts')
      .select('id, scheduled_for, status')
      .eq('status', 'scheduled');

    const pending = jobs?.filter((j: any) => j.status === 'pending').length || 0;
    const processing = jobs?.filter((j: any) => j.status === 'processing').length || 0;
    const scheduled = scheduledPosts?.length || 0;

    // Count overdue (scheduled for past but still pending)
    const overdue =
      scheduledPosts?.filter(
        (post: any) => new Date(post.scheduled_for) < now
      ).length || 0;

    // Count by platform
    const byPlatform: Record<string, number> = {};
    jobs?.forEach((job: any) => {
      byPlatform[job.platform] = (byPlatform[job.platform] || 0) + 1;
    });

    return {
      total: (jobs?.length || 0) + scheduled,
      pending,
      processing,
      scheduled,
      overdue,
      byPlatform,
    };
  } catch (error) {
    console.error('Error getting queue depth:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      scheduled: 0,
      overdue: 0,
      byPlatform: {},
    };
  }
}

/**
 * Get job performance metrics for a time range
 */
export async function getJobMetrics(
  supabase: any,
  startDate: Date,
  endDate: Date = new Date()
): Promise<JobMetrics> {
  try {
    const { data: jobs } = await supabase
      .from('publishing_queue')
      .select('status, queued_at, started_at, completed_at')
      .gte('queued_at', startDate.toISOString())
      .lte('queued_at', endDate.toISOString());

    if (!jobs || jobs.length === 0) {
      return {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        timeRange: { start: startDate, end: endDate },
      };
    }

    const totalJobs = jobs.length;
    const successfulJobs = jobs.filter((j: any) => j.status === 'completed').length;
    const failedJobs = jobs.filter((j: any) => j.status === 'failed').length;

    // Calculate durations
    const durations = jobs
      .filter((j: any) => j.queued_at && j.completed_at)
      .map((j: any) => {
        return new Date(j.completed_at).getTime() - new Date(j.queued_at).getTime();
      });

    const avgDuration = durations.length > 0
      ? durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length
      : 0;

    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

    const successRate = totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0;

    return {
      totalJobs,
      successfulJobs,
      failedJobs,
      avgDuration,
      minDuration,
      maxDuration,
      successRate,
      timeRange: { start: startDate, end: endDate },
    };
  } catch (error) {
    console.error('Error getting job metrics:', error);
    return {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      successRate: 0,
      timeRange: { start: startDate, end: endDate },
    };
  }
}

/**
 * Get platform-specific performance
 */
export async function getPlatformPerformance(
  supabase: any,
  platform: string,
  hoursBack: number = 24
): Promise<{
  platform: string;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgDuration: number;
}> {
  const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  try {
    const { data: jobs } = await supabase
      .from('publishing_queue')
      .select('status, queued_at, completed_at')
      .eq('platform', platform)
      .gte('queued_at', startDate.toISOString());

    const total = jobs?.length || 0;
    const successful = jobs?.filter((j: any) => j.status === 'completed').length || 0;
    const failed = jobs?.filter((j: any) => j.status === 'failed').length || 0;

    const durations = jobs
      ?.filter((j: any) => j.queued_at && j.completed_at)
      .map((j: any) => {
        return new Date(j.completed_at).getTime() - new Date(j.queued_at).getTime();
      }) || [];

    const avgDuration = durations.length > 0
      ? durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length
      : 0;

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      platform,
      total,
      successful,
      failed,
      successRate,
      avgDuration,
    };
  } catch (error) {
    console.error('Error getting platform performance:', error);
    return {
      platform,
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      avgDuration: 0,
    };
  }
}

/**
 * Reset stuck jobs (mark as failed and allow retry)
 */
export async function resetStuckJobs(supabase: any): Promise<number> {
  const stuckJobs = await detectStuckJobs(supabase);

  if (stuckJobs.length === 0) {
    return 0;
  }

  try {
    const jobIds = stuckJobs.map((job) => job.id);

    const { error } = await supabase
      .from('publishing_queue')
      .update({
        status: 'failed',
        error_message: 'Job stuck in processing state, auto-failed',
        completed_at: new Date().toISOString(),
      })
      .in('id', jobIds);

    if (error) throw error;

    console.log(`Reset ${stuckJobs.length} stuck jobs`);
    return stuckJobs.length;
  } catch (error) {
    console.error('Error resetting stuck jobs:', error);
    return 0;
  }
}

/**
 * Get recent errors with details
 */
export async function getRecentErrors(
  supabase: any,
  limit: number = 10
): Promise<Array<{
  id: string;
  postId: string;
  platform: string;
  error: string;
  timestamp: Date;
}>> {
  try {
    const { data: errors } = await supabase
      .from('publishing_queue')
      .select('id, scheduled_post_id, platform, error_message, completed_at')
      .eq('status', 'failed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (!errors) return [];

    return errors.map((err: any) => ({
      id: err.id,
      postId: err.scheduled_post_id,
      platform: err.platform,
      error: err.error_message || 'Unknown error',
      timestamp: new Date(err.completed_at),
    }));
  } catch (error) {
    console.error('Error getting recent errors:', error);
    return [];
  }
}

/**
 * Get hourly job distribution (for visualization)
 */
export async function getHourlyDistribution(
  supabase: any,
  hoursBack: number = 24
): Promise<Array<{
  hour: string;
  total: number;
  successful: number;
  failed: number;
}>> {
  const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  try {
    const { data: jobs } = await supabase
      .from('publishing_queue')
      .select('status, completed_at')
      .gte('completed_at', startDate.toISOString())
      .not('completed_at', 'is', null);

    if (!jobs) return [];

    // Group by hour
    const hourlyData: Record<string, { total: number; successful: number; failed: number }> = {};

    jobs.forEach((job: any) => {
      const hour = new Date(job.completed_at).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      if (!hourlyData[hour]) {
        hourlyData[hour] = { total: 0, successful: 0, failed: 0 };
      }

      hourlyData[hour].total++;
      if (job.status === 'completed') {
        hourlyData[hour].successful++;
      } else if (job.status === 'failed') {
        hourlyData[hour].failed++;
      }
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      ...data,
    }));
  } catch (error) {
    console.error('Error getting hourly distribution:', error);
    return [];
  }
}

/**
 * Format scheduler health for display
 */
export function formatHealthReport(health: SchedulerHealth): string {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
  };

  let report = `${statusEmoji[health.status]} Scheduler Status: ${health.status.toUpperCase()}\n\n`;

  report += `Queue Depth: ${health.queueDepth}\n`;
  report += `Stuck Jobs: ${health.stuckJobs}\n`;
  report += `Recent Failures: ${health.recentFailures}\n`;
  report += `Success Rate: ${health.successRate.toFixed(1)}%\n`;
  report += `Avg Processing Time: ${(health.avgProcessingTime / 1000).toFixed(1)}s\n\n`;

  if (health.issues.length > 0) {
    report += `Issues:\n`;
    health.issues.forEach((issue) => {
      report += `  - ${issue}\n`;
    });
  } else {
    report += `No issues detected.\n`;
  }

  report += `\nLast checked: ${health.timestamp.toISOString()}`;

  return report;
}

/**
 * Log monitoring metrics to console
 */
export async function logSchedulerMetrics(
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const health = await getSchedulerHealth(supabaseUrl, supabaseKey);
  console.log('\n' + '='.repeat(60));
  console.log(formatHealthReport(health));
  console.log('='.repeat(60) + '\n');
}
