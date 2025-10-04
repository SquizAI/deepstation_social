# Scheduling System Deployment Guide

## Overview

This guide covers deploying and configuring the complete scheduling system for DeepStation, including timezone management, recurring posts (RRULE), job queues, and Supabase Edge Functions with cron.

## Prerequisites

- Supabase project with service role key
- Supabase CLI installed (`npm install -g supabase`)
- Node.js dependencies installed (`npm install`)

## System Components

### 1. Timezone Management (`lib/scheduling/timezone.ts`)

Handles conversion between user timezones and UTC for accurate scheduling.

**Key Functions:**
- `convertToUTC(localDate, timezone)` - Convert user's local time to UTC
- `convertFromUTC(utcDate, timezone)` - Convert UTC to user's timezone
- `formatInUserTimezone(date, timezone)` - Format dates for display
- `parseScheduledTime(dateString, timeString, timezone)` - Parse user input

**Supported Timezones:**
- Eastern (America/New_York)
- Central (America/Chicago)
- Mountain (America/Denver)
- Pacific (America/Los_Angeles)
- Alaska (America/Anchorage)
- Hawaii (Pacific/Honolulu)
- And more...

### 2. Recurrence (RRULE) (`lib/scheduling/recurrence.ts`)

Manages recurring post schedules using iCalendar RRULE format.

**Key Functions:**
- `generateRRule(config)` - Create RRULE from configuration
- `parseRRule(rruleString)` - Get next occurrences
- `calculateNextOccurrence(rruleString, after)` - Get next single occurrence
- `getRecurrenceInfo(rruleString)` - Get human-readable info

**Recurrence Patterns:**
- Daily (every N days)
- Weekly (specific days of week)
- Monthly (specific day of month)
- With end date (UNTIL) or count limit

### 3. Job Queue (`lib/scheduling/queue.ts`)

Priority-based queue for managing scheduled post processing.

**Features:**
- Priority levels (LOW, NORMAL, HIGH, URGENT)
- Job status tracking (PENDING, PROCESSING, COMPLETED, FAILED)
- Automatic retry with exponential backoff
- Concurrent job processing (configurable limit)
- Queue statistics and monitoring

### 4. Monitoring (`lib/scheduling/monitoring.ts`)

Track scheduler health and performance.

**Key Functions:**
- `getSchedulerHealth()` - Overall health status
- `detectStuckJobs()` - Find jobs stuck in processing
- `getQueueDepthMetrics()` - Queue depth by status
- `getJobMetrics()` - Performance metrics
- `resetStuckJobs()` - Auto-fix stuck jobs

## Database Schema

### Required Tables

#### 1. scheduled_posts
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Post Content
  title TEXT,
  content JSONB NOT NULL,
  images TEXT[],

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  recurrence_rule TEXT,

  -- Platforms
  platforms TEXT[] NOT NULL CHECK (array_length(platforms, 1) > 0),

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'draft', 'scheduled', 'queued', 'publishing',
    'published', 'failed', 'cancelled', 'partial', 'archived'
  )),

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,

  -- Metadata
  metadata JSONB,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
```

#### 2. recurring_posts
```sql
CREATE TABLE recurring_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recurrence Configuration
  recurrence_rule TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'America/New_York',

  -- Status
  is_active BOOLEAN DEFAULT true,
  next_occurrence TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_posts_next_occurrence
  ON recurring_posts(next_occurrence)
  WHERE is_active = true;
```

#### 3. post_results (for tracking)
```sql
CREATE TABLE post_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  platform TEXT NOT NULL,
  platform_post_id TEXT,
  post_url TEXT,

  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,

  posted_at TIMESTAMP WITH TIME ZONE,
  metrics JSONB,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_post_results_post_id ON post_results(post_id);
CREATE INDEX idx_post_results_platform ON post_results(platform);
```

## Edge Function Deployment

### Step 1: Set Up Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Configure Environment Variables

Create `.env` file in your Supabase project:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy process-scheduled-posts \
  --no-verify-jwt

# Verify deployment
supabase functions list
```

### Step 4: Set Up Cron Schedule

**Option 1: Every Minute (Most Accurate)**
```bash
supabase functions schedule process-scheduled-posts \
  --cron "* * * * *"
```

**Option 2: Every 5 Minutes (Recommended for Production)**
```bash
supabase functions schedule process-scheduled-posts \
  --cron "*/5 * * * *"
```

**Option 3: Every 15 Minutes (Light Load)**
```bash
supabase functions schedule process-scheduled-posts \
  --cron "*/15 * * * *"
```

### Step 5: Test the Function

```bash
# Invoke manually for testing
supabase functions invoke process-scheduled-posts

# Check logs
supabase functions logs process-scheduled-posts
```

## Cron Expression Reference

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Common Patterns:**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 9 * * *` - Every day at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM

## Usage Examples

### 1. Schedule a Single Post

```typescript
import { convertToUTC, parseScheduledTime } from '@/lib/scheduling/timezone';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User schedules post for 9:00 AM Miami time
const scheduledFor = parseScheduledTime(
  '2025-10-15',
  '09:00',
  'America/New_York'
);

const { data, error } = await supabase
  .from('scheduled_posts')
  .insert({
    user_id: userId,
    title: 'Morning Update',
    content: {
      linkedin: 'Check out our latest insights!',
      twitter: 'New blog post is live! 🚀',
    },
    images: ['https://example.com/image.jpg'],
    platforms: ['linkedin', 'twitter'],
    scheduled_for: scheduledFor.toISOString(),
    timezone: 'America/New_York',
    status: 'scheduled',
  });
```

### 2. Create Recurring Post (Weekly)

```typescript
import { createWeeklyRecurrence } from '@/lib/scheduling/recurrence';

// Every Tuesday at 2 PM
const startDate = new Date(2025, 0, 7, 14, 0, 0); // Jan 7, 2025, 2 PM
const endDate = new Date(2025, 11, 31); // End of year
const rrule = createWeeklyRecurrence(startDate, [2], endDate); // 2 = Tuesday

// Create parent post
const { data: parentPost } = await supabase
  .from('scheduled_posts')
  .insert({
    user_id: userId,
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

// Create recurring post entry
await supabase
  .from('recurring_posts')
  .insert({
    parent_post_id: parentPost.id,
    user_id: userId,
    recurrence_rule: rrule,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    timezone: 'America/New_York',
    next_occurrence: startDate.toISOString(),
    is_active: true,
  });
```

### 3. Monitor Scheduler Health

```typescript
import { getSchedulerHealth, formatHealthReport } from '@/lib/scheduling/monitoring';

const health = await getSchedulerHealth(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log(formatHealthReport(health));

// Example output:
// ✅ Scheduler Status: HEALTHY
//
// Queue Depth: 5
// Stuck Jobs: 0
// Recent Failures: 1
// Success Rate: 95.5%
// Avg Processing Time: 2.3s
//
// No issues detected.
//
// Last checked: 2025-01-15T10:30:00.000Z
```

### 4. Use Job Queue (Manual Processing)

```typescript
import { queueHelpers, JobPriority } from '@/lib/scheduling/queue';

// Enqueue a high-priority publish job
const job = queueHelpers.enqueuePublish(
  'post-id-123',
  'user-id-456',
  ['linkedin', 'twitter'],
  {
    linkedin: 'Professional content here',
    twitter: 'Casual tweet here',
  },
  ['https://example.com/image.jpg'],
  undefined,
  JobPriority.HIGH
);

// Check queue stats
const stats = queueHelpers.getQueueStats();
console.log(`Queue depth: ${stats.pending} pending jobs`);
console.log(`Success rate: ${stats.successRate}%`);
```

## Monitoring and Maintenance

### View Scheduler Health (SQL)

```sql
-- View pending jobs
SELECT
  id,
  scheduled_for,
  timezone,
  platforms,
  status,
  retry_count
FROM scheduled_posts
WHERE status = 'scheduled'
ORDER BY scheduled_for ASC;

-- View recent failures
SELECT
  id,
  platforms,
  last_error,
  retry_count,
  max_retries
FROM scheduled_posts
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC;

-- View stuck jobs (processing > 10 minutes)
SELECT
  id,
  platforms,
  status,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_stuck
FROM scheduled_posts
WHERE status = 'publishing'
AND updated_at < NOW() - INTERVAL '10 minutes';
```

### Reset Stuck Jobs

```typescript
import { resetStuckJobs } from '@/lib/scheduling/monitoring';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const resetCount = await resetStuckJobs(supabase);
console.log(`Reset ${resetCount} stuck jobs`);
```

### Cleanup Old Jobs

```sql
-- Archive old published posts (>7 days)
UPDATE scheduled_posts
SET status = 'archived'
WHERE status = 'published'
AND published_at < NOW() - INTERVAL '7 days';

-- Delete very old archived posts (>30 days)
DELETE FROM scheduled_posts
WHERE status = 'archived'
AND published_at < NOW() - INTERVAL '30 days';
```

## Troubleshooting

### Issue: Posts Not Publishing

**Check:**
1. Verify cron is running: `supabase functions list`
2. Check Edge Function logs: `supabase functions logs process-scheduled-posts`
3. Verify OAuth tokens are active
4. Check scheduled_for time is in the past

**Fix:**
```sql
-- Check if posts are overdue
SELECT * FROM scheduled_posts
WHERE status = 'scheduled'
AND scheduled_for < NOW();

-- Manually trigger processing
SELECT * FROM process_scheduled_posts();
```

### Issue: Stuck Jobs

**Check:**
```sql
SELECT * FROM scheduled_posts
WHERE status IN ('queued', 'publishing')
AND updated_at < NOW() - INTERVAL '10 minutes';
```

**Fix:**
```typescript
await resetStuckJobs(supabase);
```

### Issue: Recurring Posts Not Creating

**Check:**
```sql
SELECT * FROM recurring_posts
WHERE is_active = true
AND next_occurrence < NOW();
```

**Fix:**
```sql
-- Verify RRULE is valid
SELECT recurrence_rule FROM recurring_posts WHERE id = 'uuid';

-- Manually set next occurrence
UPDATE recurring_posts
SET next_occurrence = NOW() + INTERVAL '1 week'
WHERE id = 'uuid';
```

## Performance Optimization

### 1. Batch Processing

The Edge Function processes up to 50 posts per run. Adjust based on load:

```typescript
// In Edge Function index.ts
.limit(50); // Increase for high volume
```

### 2. Cron Frequency

Balance between accuracy and cost:
- **High accuracy**: Every 1 minute (720 invocations/day)
- **Recommended**: Every 5 minutes (288 invocations/day)
- **Low cost**: Every 15 minutes (96 invocations/day)

### 3. Database Indexes

Ensure indexes exist for optimal query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_scheduled_for
  ON scheduled_posts(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_recurring_posts_active_next
  ON recurring_posts(is_active, next_occurrence);
```

### 4. Cleanup Strategy

Schedule regular cleanup to prevent table bloat:

```sql
-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_posts()
RETURNS void AS $$
BEGIN
  -- Archive old published posts
  UPDATE scheduled_posts
  SET status = 'archived'
  WHERE status = 'published'
  AND published_at < NOW() - INTERVAL '7 days';

  -- Delete very old archived posts
  DELETE FROM scheduled_posts
  WHERE status = 'archived'
  AND published_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly cleanup (via pg_cron or cron job)
```

## Security Considerations

1. **Service Role Key**: Store securely in environment variables
2. **Rate Limiting**: Implement per-platform rate limits
3. **Token Refresh**: Ensure OAuth tokens are refreshed before expiry
4. **Input Validation**: Validate all user input before scheduling
5. **Error Handling**: Don't expose sensitive errors to users

## Next Steps

1. ✅ Deploy Edge Function
2. ✅ Set up cron schedule
3. ✅ Test with sample posts
4. ✅ Monitor scheduler health
5. ✅ Implement cleanup jobs
6. ✅ Set up alerts for failures
7. ✅ Optimize based on usage patterns

## Support

For issues or questions:
- Check Edge Function logs: `supabase functions logs process-scheduled-posts`
- Monitor health dashboard: Use monitoring utilities
- Review database state: Query scheduled_posts table
- Test manually: `supabase functions invoke process-scheduled-posts`
