/**
 * Job Queue Management
 * Handles priority-based queue for scheduled post processing
 */

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 0,
  NORMAL = 10,
  HIGH = 20,
  URGENT = 30,
}

/**
 * Job status
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Job types
 */
export enum JobType {
  PUBLISH = 'publish',
  RETRY = 'retry',
  CLEANUP = 'cleanup',
  RECURRING = 'recurring',
}

/**
 * Job data interface
 */
export interface Job<T = any> {
  id: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  data: T;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Publish job data
 */
export interface PublishJobData {
  postId: string;
  userId: string;
  platforms: string[];
  content: Record<string, string>;
  images?: string[];
  webhookUrls?: Record<string, string>;
}

/**
 * Retry job data
 */
export interface RetryJobData {
  originalJobId: string;
  postId: string;
  reason: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byPriority: Record<JobPriority, number>;
  byType: Record<JobType, number>;
  avgProcessingTime: number;
  successRate: number;
}

/**
 * Job Queue class
 */
export class JobQueue {
  private queue: Job[] = [];
  private processing = false;
  private maxConcurrent: number;
  private processingJobs: Set<string> = new Set();

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a job to the queue
   */
  enqueue<T>(
    type: JobType,
    data: T,
    priority: JobPriority = JobPriority.NORMAL,
    scheduledFor?: Date,
    maxRetries: number = 3
  ): Job<T> {
    const job: Job<T> = {
      id: this.generateJobId(),
      type,
      priority,
      status: JobStatus.PENDING,
      data,
      scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries,
    };

    this.queue.push(job);
    this.sortQueue();

    console.log(`Enqueued job ${job.id} (${type}) with priority ${priority}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue().catch(console.error);
    }

    return job;
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we can process more jobs
      if (this.processingJobs.size >= this.maxConcurrent) {
        await this.sleep(100);
        continue;
      }

      // Get next job
      const job = this.getNextJob();
      if (!job) {
        await this.sleep(100);
        continue;
      }

      // Process job without waiting
      this.processJob(job).catch((error) => {
        console.error(`Error processing job ${job.id}:`, error);
      });
    }

    this.processing = false;
  }

  /**
   * Get next job from queue (respects priority and schedule)
   */
  private getNextJob(): Job | null {
    const now = new Date();

    // Find first job that is:
    // 1. Pending status
    // 2. Not yet being processed
    // 3. Scheduled time has passed (or no schedule)
    for (let i = 0; i < this.queue.length; i++) {
      const job = this.queue[i];

      if (
        job.status === JobStatus.PENDING &&
        !this.processingJobs.has(job.id) &&
        (!job.scheduledFor || job.scheduledFor <= now)
      ) {
        // Remove from queue and mark as processing
        this.queue.splice(i, 1);
        this.processingJobs.add(job.id);
        return job;
      }
    }

    return null;
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    try {
      console.log(`Processing job ${job.id} (${job.type})`);

      job.status = JobStatus.PROCESSING;
      job.startedAt = new Date();
      job.updatedAt = new Date();

      // Process based on job type
      await this.executeJob(job);

      // Mark as completed
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.updatedAt = new Date();

      console.log(`Completed job ${job.id}`);
    } catch (error: any) {
      console.error(`Failed job ${job.id}:`, error);

      job.error = error.message;
      job.updatedAt = new Date();

      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = JobStatus.PENDING;

        // Re-enqueue with exponential backoff
        const delay = Math.min(
          Math.pow(2, job.retryCount) * 1000,
          60000 // Max 1 minute
        );

        job.scheduledFor = new Date(Date.now() + delay);
        this.queue.push(job);
        this.sortQueue();

        console.log(
          `Retrying job ${job.id} (attempt ${job.retryCount}/${job.maxRetries}) in ${delay}ms`
        );
      } else {
        // Max retries exceeded
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();

        console.error(
          `Job ${job.id} failed after ${job.maxRetries} retries`
        );
      }
    } finally {
      // Remove from processing set
      this.processingJobs.delete(job.id);
    }
  }

  /**
   * Execute job based on type
   */
  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case JobType.PUBLISH:
        await this.executePublishJob(job as Job<PublishJobData>);
        break;

      case JobType.RETRY:
        await this.executeRetryJob(job as Job<RetryJobData>);
        break;

      case JobType.CLEANUP:
        await this.executeCleanupJob(job);
        break;

      case JobType.RECURRING:
        await this.executeRecurringJob(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Execute publish job
   */
  private async executePublishJob(job: Job<PublishJobData>): Promise<void> {
    const { postId, userId, platforms, content, images, webhookUrls } = job.data;

    console.log(`Publishing post ${postId} to ${platforms.length} platforms`);

    // In a real implementation, this would call the unified publisher
    // For now, simulate processing
    await this.sleep(1000);

    // Simulate success/failure
    if (Math.random() > 0.1) {
      console.log(`Successfully published post ${postId}`);
    } else {
      throw new Error('Simulated publish failure');
    }
  }

  /**
   * Execute retry job
   */
  private async executeRetryJob(job: Job<RetryJobData>): Promise<void> {
    const { originalJobId, postId, reason } = job.data;

    console.log(`Retrying job ${originalJobId} for post ${postId}: ${reason}`);

    // Re-enqueue the original job
    await this.sleep(500);
  }

  /**
   * Execute cleanup job
   */
  private async executeCleanupJob(job: Job): Promise<void> {
    console.log('Executing cleanup job');

    // Clean up old completed jobs
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // In real implementation, this would clean database records
    await this.sleep(500);

    console.log('Cleanup completed');
  }

  /**
   * Execute recurring job
   */
  private async executeRecurringJob(job: Job): Promise<void> {
    console.log('Processing recurring post job');

    // Calculate next occurrence and create new scheduled post
    await this.sleep(500);

    console.log('Recurring job completed');
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.find((job) => job.id === jobId);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const index = this.queue.findIndex((job) => job.id === jobId);

    if (index !== -1) {
      const job = this.queue[index];

      if (job.status === JobStatus.PENDING) {
        job.status = JobStatus.CANCELLED;
        job.updatedAt = new Date();
        this.queue.splice(index, 1);

        console.log(`Cancelled job ${jobId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const allJobs = [...this.queue];

    const stats: QueueStats = {
      total: allJobs.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byPriority: {} as Record<JobPriority, number>,
      byType: {} as Record<JobType, number>,
      avgProcessingTime: 0,
      successRate: 0,
    };

    let totalProcessingTime = 0;
    let processedJobs = 0;
    let successfulJobs = 0;

    for (const job of allJobs) {
      // Count by status
      switch (job.status) {
        case JobStatus.PENDING:
          stats.pending++;
          break;
        case JobStatus.PROCESSING:
          stats.processing++;
          break;
        case JobStatus.COMPLETED:
          stats.completed++;
          successfulJobs++;
          processedJobs++;
          break;
        case JobStatus.FAILED:
          stats.failed++;
          processedJobs++;
          break;
      }

      // Count by priority
      stats.byPriority[job.priority] = (stats.byPriority[job.priority] || 0) + 1;

      // Count by type
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;

      // Calculate processing time
      if (job.startedAt && job.completedAt) {
        totalProcessingTime +=
          job.completedAt.getTime() - job.startedAt.getTime();
      }
    }

    stats.avgProcessingTime =
      processedJobs > 0 ? totalProcessingTime / processedJobs : 0;
    stats.successRate =
      processedJobs > 0 ? (successfulJobs / processedJobs) * 100 : 0;

    return stats;
  }

  /**
   * Get queue depth (number of pending jobs)
   */
  getQueueDepth(): number {
    return this.queue.filter((job) => job.status === JobStatus.PENDING).length;
  }

  /**
   * Clear completed jobs older than specified time
   */
  clearOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - olderThanMs);
    const initialLength = this.queue.length;

    this.queue = this.queue.filter((job) => {
      if (
        job.status === JobStatus.COMPLETED &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        return false;
      }
      return true;
    });

    const removed = initialLength - this.queue.length;
    console.log(`Cleared ${removed} old jobs`);

    return removed;
  }

  /**
   * Sort queue by priority and scheduled time
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Then by scheduled time (earlier first)
      if (a.scheduledFor && b.scheduledFor) {
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      }

      // Jobs with schedule come before jobs without
      if (a.scheduledFor) return -1;
      if (b.scheduledFor) return 1;

      // Finally by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all jobs (for debugging)
   */
  getAllJobs(): Job[] {
    return [...this.queue];
  }
}

/**
 * Global queue instance (singleton)
 */
let globalQueue: JobQueue | null = null;

/**
 * Get or create global queue instance
 */
export function getGlobalQueue(): JobQueue {
  if (!globalQueue) {
    globalQueue = new JobQueue(5); // Max 5 concurrent jobs
  }
  return globalQueue;
}

/**
 * Helper functions for common job operations
 */
export const queueHelpers = {
  /**
   * Enqueue a publish job
   */
  enqueuePublish(
    postId: string,
    userId: string,
    platforms: string[],
    content: Record<string, string>,
    images?: string[],
    webhookUrls?: Record<string, string>,
    priority: JobPriority = JobPriority.NORMAL
  ): Job {
    const queue = getGlobalQueue();
    return queue.enqueue<PublishJobData>(
      JobType.PUBLISH,
      { postId, userId, platforms, content, images, webhookUrls },
      priority
    );
  },

  /**
   * Enqueue a retry job
   */
  enqueueRetry(
    originalJobId: string,
    postId: string,
    reason: string,
    priority: JobPriority = JobPriority.HIGH
  ): Job {
    const queue = getGlobalQueue();
    return queue.enqueue<RetryJobData>(
      JobType.RETRY,
      { originalJobId, postId, reason },
      priority
    );
  },

  /**
   * Enqueue a cleanup job
   */
  enqueueCleanup(
    priority: JobPriority = JobPriority.LOW,
    scheduledFor?: Date
  ): Job {
    const queue = getGlobalQueue();
    return queue.enqueue(JobType.CLEANUP, {}, priority, scheduledFor);
  },

  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    const queue = getGlobalQueue();
    return queue.getStats();
  },

  /**
   * Get queue depth
   */
  getQueueDepth(): number {
    const queue = getGlobalQueue();
    return queue.getQueueDepth();
  },
};
