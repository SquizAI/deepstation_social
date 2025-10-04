# Scheduling System - Command Reference

## 🚀 Quick Commands

### Deployment

```bash
# 1. Install dependencies (already done)
npm install date-fns date-fns-tz rrule

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy the Edge Function
supabase functions deploy process-scheduled-posts --no-verify-jwt

# 5. Set up cron schedule
supabase functions schedule process-scheduled-posts --cron "*/5 * * * *"
```

### Testing

```bash
# Test the function manually
supabase functions invoke process-scheduled-posts

# View real-time logs
supabase functions logs process-scheduled-posts --tail

# View historical logs
supabase functions logs process-scheduled-posts --limit 100

# List all functions
supabase functions list

# Check cron schedules
supabase functions schedule list
```

### Monitoring

```bash
# View Edge Function status
supabase functions list

# Check recent invocations
supabase functions logs process-scheduled-posts --limit 50

# Monitor for errors
supabase functions logs process-scheduled-posts --tail | grep -i error
```

## 📊 Database Commands

### View Scheduled Posts

```sql
-- All scheduled posts
SELECT * FROM scheduled_posts ORDER BY scheduled_for ASC;

-- Pending posts
SELECT id, title, scheduled_for, timezone, platforms, status
FROM scheduled_posts
WHERE status = 'scheduled'
ORDER BY scheduled_for ASC;

-- Overdue posts
SELECT id, title, scheduled_for, platforms
FROM scheduled_posts
WHERE status = 'scheduled'
AND scheduled_for < NOW();

-- Failed posts
SELECT id, title, last_error, retry_count, max_retries
FROM scheduled_posts
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

### View Recurring Posts

```sql
-- Active recurring posts
SELECT rp.id, sp.title, rp.recurrence_rule, rp.next_occurrence
FROM recurring_posts rp
JOIN scheduled_posts sp ON rp.parent_post_id = sp.id
WHERE rp.is_active = true
ORDER BY rp.next_occurrence ASC;

-- Next 5 occurrences due
SELECT * FROM recurring_posts
WHERE is_active = true
AND next_occurrence < NOW() + INTERVAL '7 days'
ORDER BY next_occurrence ASC
LIMIT 5;
```

### Monitoring Queries

```sql
-- Stuck jobs (processing > 10 min)
SELECT id, platforms, status, updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_stuck
FROM scheduled_posts
WHERE status IN ('queued', 'publishing')
AND updated_at < NOW() - INTERVAL '10 minutes';

-- Success rate (last 24 hours)
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'published') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'published') / COUNT(*), 2) as success_rate
FROM scheduled_posts
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- Posts by platform (last 7 days)
SELECT
  unnest(platforms) as platform,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM scheduled_posts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY platform;
```

### Cleanup

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

-- Reset stuck jobs manually
UPDATE scheduled_posts
SET status = 'failed',
    last_error = 'Job stuck in processing state, manually reset'
WHERE status IN ('queued', 'publishing')
AND updated_at < NOW() - INTERVAL '10 minutes';
```

## 🔧 TypeScript Usage

### Import

```typescript
import {
  // Timezone
  parseScheduledTime,
  formatInUserTimezone,
  getBrowserTimezone,

  // Recurrence
  createWeeklyRecurrence,
  getRecurrenceInfo,
  calculateNextOccurrence,

  // Monitoring
  getSchedulerHealth,
  detectStuckJobs,
  resetStuckJobs,
} from '@/lib/scheduling';
```

### Schedule a Post

```typescript
const scheduledFor = parseScheduledTime(
  '2025-10-15',
  '09:00',
  'America/New_York'
);

await supabase.from('scheduled_posts').insert({
  user_id: userId,
  content: { linkedin: 'Content here' },
  platforms: ['linkedin'],
  scheduled_for: scheduledFor.toISOString(),
  timezone: 'America/New_York',
  status: 'scheduled',
});
```

### Create Recurring Post

```typescript
const rrule = createWeeklyRecurrence(
  new Date(2025, 0, 7, 14, 0, 0), // Start
  [2], // Tuesday
  new Date(2025, 11, 31) // End
);

// Insert parent post with recurrence_rule
// Insert recurring_posts entry
```

### Monitor Health

```typescript
const health = await getSchedulerHealth(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log(`Status: ${health.status}`);
console.log(`Queue Depth: ${health.queueDepth}`);
console.log(`Success Rate: ${health.successRate}%`);
```

## 🐛 Troubleshooting Commands

### Check Function Status

```bash
# Is function deployed?
supabase functions list

# Is cron scheduled?
supabase functions schedule list

# Recent errors?
supabase functions logs process-scheduled-posts --tail | grep -i error
```

### Fix Stuck Jobs

```typescript
import { detectStuckJobs, resetStuckJobs } from '@/lib/scheduling';

// Detect
const stuck = await detectStuckJobs(supabase);
console.log(`Found ${stuck.length} stuck jobs`);

// Reset
const count = await resetStuckJobs(supabase);
console.log(`Reset ${count} jobs`);
```

### Manual Processing

```bash
# Trigger function manually
supabase functions invoke process-scheduled-posts

# With test flag
supabase functions invoke process-scheduled-posts \
  --body '{"test": true}'
```

## 📈 Cron Patterns

```bash
# Every minute (most accurate)
--cron "* * * * *"

# Every 5 minutes (recommended)
--cron "*/5 * * * *"

# Every 15 minutes (light load)
--cron "*/15 * * * *"

# Every hour
--cron "0 * * * *"

# Every day at 9 AM
--cron "0 9 * * *"

# Every Monday at 9 AM
--cron "0 9 * * 1"
```

## 🔑 Environment Variables

```bash
# Required for Edge Function
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional for local testing
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📝 Quick Tests

### Test 1: Schedule Post for 1 Minute from Now

```typescript
const oneMinuteLater = new Date(Date.now() + 60000);

await supabase.from('scheduled_posts').insert({
  user_id: userId,
  content: { linkedin: 'Test post' },
  platforms: ['linkedin'],
  scheduled_for: oneMinuteLater.toISOString(),
  timezone: 'America/New_York',
  status: 'scheduled',
});

// Wait 2 minutes, then check if it published
```

### Test 2: Create Weekly Recurring

```typescript
const rrule = createWeeklyRecurrence(
  new Date(), // Now
  [new Date().getDay()], // Today
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 days
);

// Create posts, check if next occurrence is created
```

### Test 3: Monitor Health

```typescript
const health = await getSchedulerHealth(url, key);
console.log(formatHealthReport(health));

// Should show "healthy" status
```

## 🎯 File Locations

### Code
- Timezone: `/lib/scheduling/timezone.ts`
- Recurrence: `/lib/scheduling/recurrence.ts`
- Queue: `/lib/scheduling/queue.ts`
- Monitoring: `/lib/scheduling/monitoring.ts`
- Index: `/lib/scheduling/index.ts`

### Edge Function
- Main: `/supabase/functions/process-scheduled-posts/index.ts`
- Import Map: `/supabase/functions/import_map.json`
- Config: `/supabase/functions/process-scheduled-posts/config.json`

### Docs
- Deployment: `/docs/SCHEDULING_DEPLOYMENT.md`
- Quick Start: `/docs/SCHEDULING_QUICK_START.md`
- Summary: `/SCHEDULING_IMPLEMENTATION_SUMMARY.md`

## 🚀 Complete Setup Flow

```bash
# 1. Install dependencies
npm install date-fns date-fns-tz rrule

# 2. Deploy Edge Function
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy process-scheduled-posts --no-verify-jwt

# 3. Set up cron
supabase functions schedule process-scheduled-posts --cron "*/5 * * * *"

# 4. Create database tables (run SQL from docs)
# See SCHEDULING_DEPLOYMENT.md for SQL

# 5. Test
supabase functions invoke process-scheduled-posts
supabase functions logs process-scheduled-posts --tail

# 6. Monitor
# Check /docs/SCHEDULING_QUICK_START.md for monitoring code
```

## 📞 Support

- Logs: `supabase functions logs process-scheduled-posts --tail`
- Docs: Check `/docs/SCHEDULING_DEPLOYMENT.md`
- Test: `supabase functions invoke process-scheduled-posts`
- Debug: Use monitoring utilities from `/lib/scheduling/monitoring.ts`

---

**Quick Reference Generated** - See full documentation in `/docs/` folder
