# Posting System with Scheduling Capability

## Overview
This document details the scheduling system for DeepStation's social media automation platform. The system allows users to schedule posts across multiple platforms with support for timezone management, recurring posts, bulk scheduling, and intelligent optimal time suggestions.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Scheduling System                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Scheduler  │─────→│  Job Queue   │        │
│  │   Service    │      │              │        │
│  └──────────────┘      └──────────────┘        │
│         ↓                      ↓                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Cron Job   │      │   Workers    │        │
│  │   (Edge Fn)  │      │              │        │
│  └──────────────┘      └──────────────┘        │
│         ↓                      ↓                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Publisher  │─────→│  Analytics   │        │
│  │   Service    │      │   Tracker    │        │
│  └──────────────┘      └──────────────┘        │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Database Schema

### Scheduled Posts Table
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Post Content
  title TEXT,
  content JSONB NOT NULL, -- Platform-specific variants
  images TEXT[], -- Image URLs

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  recurrence_rule TEXT, -- iCal RRULE format

  -- Platforms
  platforms TEXT[] NOT NULL CHECK (array_length(platforms, 1) > 0),

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'draft',
    'scheduled',
    'queued',
    'publishing',
    'published',
    'failed',
    'cancelled'
  )),

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,

  -- Metadata
  metadata JSONB, -- Speaker info, event details
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  CONSTRAINT valid_scheduled_time CHECK (scheduled_for > NOW())
);

CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);

-- RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled posts"
  ON scheduled_posts
  USING (auth.uid() = user_id);
```

### Recurring Posts Table
```sql
CREATE TABLE recurring_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recurrence Configuration
  recurrence_rule TEXT NOT NULL, -- RRULE format
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'America/New_York',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Next occurrence cache
  next_occurrence TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_posts_next_occurrence ON recurring_posts(next_occurrence)
  WHERE is_active = true;
```

### Publishing Queue Table
```sql
CREATE TABLE publishing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,

  -- Platform-specific
  platform TEXT NOT NULL,
  platform_content TEXT NOT NULL,
  platform_images TEXT[],

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  -- Results
  platform_post_id TEXT,
  post_url TEXT,
  error_message TEXT,

  -- Timing
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Priority
  priority INTEGER DEFAULT 0
);

CREATE INDEX idx_publishing_queue_status ON publishing_queue(status);
CREATE INDEX idx_publishing_queue_queued_at ON publishing_queue(queued_at);
```

## Core Features

### 1. Single Post Scheduling

```typescript
interface SchedulePostRequest {
  content: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    discord?: string;
  };
  images: string[];
  scheduledFor: Date;
  timezone: string;
  platforms: Platform[];
  metadata?: {
    speakerId?: string;
    eventId?: string;
    tags?: string[];
  };
}

async function schedulePost(
  userId: string,
  request: SchedulePostRequest
): Promise<ScheduledPost> {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id: userId,
      content: request.content,
      images: request.images,
      scheduled_for: request.scheduledFor.toISOString(),
      timezone: request.timezone,
      platforms: request.platforms,
      metadata: request.metadata,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) throw error;

  // Create queue entries for each platform
  await createQueueEntries(data.id, request);

  return data;
}

async function createQueueEntries(
  postId: string,
  request: SchedulePostRequest
) {
  const queueEntries = request.platforms.map(platform => ({
    scheduled_post_id: postId,
    platform: platform,
    platform_content: request.content[platform],
    platform_images: request.images,
    status: 'pending'
  }));

  await supabase
    .from('publishing_queue')
    .insert(queueEntries);
}
```

### 2. Recurring Posts (Weekly Events, Monthly Newsletters)

```typescript
interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm format
  timezone: string;
  startDate: Date;
  endDate?: Date;
}

function createRRule(schedule: RecurringSchedule): string {
  const parts = ['FREQ=' + schedule.frequency.toUpperCase()];

  if (schedule.interval > 1) {
    parts.push(`INTERVAL=${schedule.interval}`);
  }

  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const days = schedule.daysOfWeek.map(d =>
      ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]
    );
    parts.push(`BYDAY=${days.join(',')}`);
  }

  if (schedule.dayOfMonth) {
    parts.push(`BYMONTHDAY=${schedule.dayOfMonth}`);
  }

  if (schedule.endDate) {
    const endStr = schedule.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    parts.push(`UNTIL=${endStr}`);
  }

  return parts.join(';');
}

async function scheduleRecurringPost(
  userId: string,
  postContent: SchedulePostRequest,
  recurrence: RecurringSchedule
): Promise<void> {
  const rrule = createRRule(recurrence);

  // Create parent post
  const { data: parentPost } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id: userId,
      ...postContent,
      recurrence_rule: rrule,
      status: 'scheduled'
    })
    .select()
    .single();

  // Create recurring post record
  await supabase
    .from('recurring_posts')
    .insert({
      parent_post_id: parentPost.id,
      user_id: userId,
      recurrence_rule: rrule,
      start_date: recurrence.startDate.toISOString(),
      end_date: recurrence.endDate?.toISOString(),
      timezone: recurrence.timezone,
      next_occurrence: calculateNextOccurrence(rrule, recurrence.startDate)
    });
}

function calculateNextOccurrence(rrule: string, after: Date): Date {
  // Use RRule library to parse and calculate
  const { RRule } = require('rrule');
  const rule = RRule.fromString(rrule);
  const next = rule.after(after, true);
  return next;
}
```

### 3. Bulk Scheduling (Multiple Posts at Once)

```typescript
interface BulkScheduleRequest {
  posts: SchedulePostRequest[];
  spacingMinutes?: number; // Time between posts
}

async function bulkSchedulePosts(
  userId: string,
  request: BulkScheduleRequest
): Promise<ScheduledPost[]> {
  const { posts, spacingMinutes = 15 } = request;
  const results: ScheduledPost[] = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];

    // Add spacing between posts
    if (i > 0 && spacingMinutes > 0) {
      const baseTime = post.scheduledFor.getTime();
      post.scheduledFor = new Date(baseTime + (spacingMinutes * 60 * 1000 * i));
    }

    const scheduled = await schedulePost(userId, post);
    results.push(scheduled);
  }

  return results;
}
```

### 4. Optimal Time Suggestions

```typescript
interface OptimalTimeResult {
  platform: Platform;
  recommendedTimes: Date[];
  reason: string;
  engagement_score: number;
}

async function getOptimalPostingTimes(
  userId: string,
  platform: Platform,
  timezone: string = 'America/New_York'
): Promise<OptimalTimeResult> {
  // Analyze historical engagement data
  const { data: analytics } = await supabase
    .from('post_results')
    .select('posted_at, metrics')
    .eq('platform', platform)
    .gte('posted_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  // Calculate engagement by hour of day
  const hourlyEngagement = calculateHourlyEngagement(analytics);

  // Get top 3 performing hours
  const topHours = Object.entries(hourlyEngagement)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Generate recommended times for next week
  const recommendedTimes = generateTimesForNextWeek(topHours, timezone);

  // Platform-specific best practices
  const platformDefaults = {
    linkedin: {
      hours: [9, 12, 17], // Business hours
      days: [2, 3, 4], // Tue, Wed, Thu
      reason: 'LinkedIn performs best during business hours on weekdays'
    },
    instagram: {
      hours: [11, 14, 19], // Late morning, lunch, evening
      days: [0, 1, 2, 3, 4], // Weekdays
      reason: 'Instagram engagement peaks during lunch and evening hours'
    },
    twitter: {
      hours: [8, 12, 17], // Morning, lunch, commute
      days: [1, 2, 3, 4, 5], // Weekdays
      reason: 'Twitter is most active during commute times and lunch breaks'
    },
    discord: {
      hours: [18, 19, 20], // Evening
      days: [0, 1, 2, 3, 4, 5, 6], // All week
      reason: 'Discord communities are most active in the evening'
    }
  };

  const defaults = platformDefaults[platform];

  return {
    platform,
    recommendedTimes: topHours.length > 0 ? recommendedTimes : generateDefaultTimes(defaults, timezone),
    reason: topHours.length > 0
      ? 'Based on your historical engagement data'
      : defaults.reason,
    engagement_score: calculateAverageEngagement(analytics)
  };
}

function calculateHourlyEngagement(analytics: any[]): Record<number, number> {
  const engagement: Record<number, number> = {};

  for (const post of analytics) {
    const hour = new Date(post.posted_at).getHours();
    const score =
      (post.metrics?.likes || 0) +
      (post.metrics?.shares || 0) * 2 +
      (post.metrics?.comments || 0) * 3;

    engagement[hour] = (engagement[hour] || 0) + score;
  }

  return engagement;
}
```

### 5. Timezone Management

```typescript
import { formatInTimeZone, toDate } from 'date-fns-tz';

function convertToUserTimezone(
  utcDate: Date,
  userTimezone: string
): string {
  return formatInTimeZone(utcDate, userTimezone, 'yyyy-MM-dd HH:mm:ss zzz');
}

function convertToUTC(
  localDate: Date,
  userTimezone: string
): Date {
  const zonedDate = toDate(localDate, { timeZone: userTimezone });
  return zonedDate;
}

// Example: User schedules post for 9am Miami time
const userInput = new Date('2025-10-15T09:00:00'); // Local browser time
const miaminTimezone = 'America/New_York';
const utcScheduledTime = convertToUTC(userInput, miaminTimezone);

// Store in database as UTC
await supabase
  .from('scheduled_posts')
  .insert({
    scheduled_for: utcScheduledTime.toISOString(),
    timezone: miaminTimezone
  });
```

## Scheduler Implementation

### Supabase Edge Function (Cron Job)

```typescript
// supabase/functions/process-scheduled-posts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date().toISOString();

  // Get posts scheduled for now or earlier
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(20);

  if (error) {
    console.error('Error fetching scheduled posts:', error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  const results = [];

  for (const post of posts || []) {
    try {
      // Update status to queued
      await supabase
        .from('scheduled_posts')
        .update({ status: 'queued' })
        .eq('id', post.id);

      // Get queue entries for this post
      const { data: queueEntries } = await supabase
        .from('publishing_queue')
        .select('*')
        .eq('scheduled_post_id', post.id)
        .eq('status', 'pending');

      // Process each platform
      for (const entry of queueEntries || []) {
        await processQueueEntry(supabase, post, entry);
      }

      results.push({ postId: post.id, status: 'processed' });
    } catch (err) {
      console.error(`Error processing post ${post.id}:`, err);
      results.push({ postId: post.id, status: 'error', error: err.message });
    }
  }

  // Process recurring posts
  await processRecurringPosts(supabase);

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

async function processQueueEntry(
  supabase: any,
  post: any,
  entry: any
) {
  // Get OAuth token
  const { data: token } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('platform', entry.platform)
    .eq('is_active', true)
    .single();

  if (!token) {
    throw new Error(`No active token for platform: ${entry.platform}`);
  }

  // Update queue entry status
  await supabase
    .from('publishing_queue')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', entry.id);

  // Publish to platform
  const publisher = new SocialMediaPublisher();
  const result = await publisher.publishToPlatform({
    platform: entry.platform,
    content: entry.platform_content,
    images: entry.platform_images,
    token: token.access_token,
    platformUserId: token.platform_user_id
  });

  // Update queue entry with result
  await supabase
    .from('publishing_queue')
    .update({
      status: result.success ? 'completed' : 'failed',
      platform_post_id: result.postId,
      post_url: result.postUrl,
      error_message: result.error,
      completed_at: new Date().toISOString()
    })
    .eq('id', entry.id);

  // Check if all platforms are complete
  const { data: allEntries } = await supabase
    .from('publishing_queue')
    .select('status')
    .eq('scheduled_post_id', post.id);

  const allComplete = allEntries.every(e =>
    e.status === 'completed' || e.status === 'failed'
  );

  if (allComplete) {
    const allSuccessful = allEntries.every(e => e.status === 'completed');
    await supabase
      .from('scheduled_posts')
      .update({
        status: allSuccessful ? 'published' : 'failed',
        published_at: new Date().toISOString()
      })
      .eq('id', post.id);
  }
}

async function processRecurringPosts(supabase: any) {
  const now = new Date().toISOString();

  // Get recurring posts due for next occurrence
  const { data: recurring } = await supabase
    .from('recurring_posts')
    .select('*, scheduled_posts(*)')
    .eq('is_active', true)
    .lte('next_occurrence', now);

  for (const recurrence of recurring || []) {
    // Create new scheduled post based on parent
    const parentPost = recurrence.scheduled_posts;

    const { data: newPost } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: parentPost.user_id,
        content: parentPost.content,
        images: parentPost.images,
        platforms: parentPost.platforms,
        metadata: parentPost.metadata,
        scheduled_for: recurrence.next_occurrence,
        timezone: recurrence.timezone,
        status: 'scheduled'
      })
      .select()
      .single();

    // Calculate next occurrence
    const nextOccurrence = calculateNextOccurrence(
      recurrence.recurrence_rule,
      new Date(recurrence.next_occurrence)
    );

    // Update recurring post
    await supabase
      .from('recurring_posts')
      .update({
        next_occurrence: nextOccurrence?.toISOString(),
        is_active: nextOccurrence ? true : false
      })
      .eq('id', recurrence.id);
  }
}
```

### Cron Configuration

```bash
# Set up cron job in Supabase
# Run every minute
supabase functions deploy process-scheduled-posts
supabase functions schedule process-scheduled-posts --cron "* * * * *"
```

## Error Handling & Retry Logic

```typescript
async function retryFailedPost(postId: string): Promise<void> {
  const { data: post } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post) throw new Error('Post not found');

  if (post.retry_count >= post.max_retries) {
    throw new Error('Max retries exceeded');
  }

  // Increment retry count
  await supabase
    .from('scheduled_posts')
    .update({
      retry_count: post.retry_count + 1,
      status: 'scheduled',
      scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
    })
    .eq('id', postId);
}

// Exponential backoff for rate limits
async function handleRateLimit(
  platform: Platform,
  retryAfter: number
): Promise<void> {
  const delay = retryAfter * 1000 || 60000; // Default 1 minute

  console.log(`Rate limited on ${platform}, waiting ${delay}ms`);

  await new Promise(resolve => setTimeout(resolve, delay));
}
```

## User Interface Components

### Calendar View

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  platforms: Platform[];
  status: string;
}

function transformPostsToCalendarEvents(
  posts: ScheduledPost[]
): CalendarEvent[] {
  return posts.map(post => ({
    id: post.id,
    title: post.title || 'Scheduled Post',
    start: new Date(post.scheduled_for),
    end: new Date(new Date(post.scheduled_for).getTime() + 30 * 60000), // 30 min duration
    platforms: post.platforms,
    status: post.status
  }));
}
```

### Draft Management

```typescript
async function saveDraft(
  userId: string,
  draft: Partial<SchedulePostRequest>
): Promise<void> {
  await supabase
    .from('scheduled_posts')
    .insert({
      user_id: userId,
      ...draft,
      status: 'draft'
    });
}

async function listDrafts(userId: string): Promise<ScheduledPost[]> {
  const { data } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false });

  return data || [];
}
```

## Analytics & Reporting

```sql
-- Posts scheduled by platform
CREATE VIEW scheduled_posts_by_platform AS
SELECT
  unnest(platforms) as platform,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  AVG(retry_count) as avg_retries
FROM scheduled_posts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY platform;

-- Publishing success rate
CREATE VIEW publishing_success_rate AS
SELECT
  date_trunc('day', queued_at) as date,
  platform,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*), 2) as success_rate
FROM publishing_queue
GROUP BY date, platform
ORDER BY date DESC;
```

## Best Practices

1. **Timezone Awareness**: Always store times in UTC, display in user's timezone
2. **Rate Limiting**: Respect platform-specific rate limits
3. **Error Recovery**: Implement retry logic with exponential backoff
4. **Queue Management**: Process queue in priority order
5. **Monitoring**: Track success rates and failure patterns
6. **User Notifications**: Alert users of failed posts
7. **Batch Processing**: Group similar operations to reduce API calls
8. **Graceful Degradation**: Continue publishing to successful platforms even if one fails

## Testing Checklist

- [ ] Schedule single post in future
- [ ] Schedule post in different timezone
- [ ] Create recurring weekly post
- [ ] Bulk schedule multiple posts
- [ ] Test retry logic on failure
- [ ] Verify rate limit handling
- [ ] Check timezone conversions
- [ ] Test optimal time suggestions
- [ ] Validate calendar view
- [ ] Test draft save/load
- [ ] Verify multi-platform publishing
- [ ] Test cancellation of scheduled posts
- [ ] Verify recurring post generation
- [ ] Test error notifications
