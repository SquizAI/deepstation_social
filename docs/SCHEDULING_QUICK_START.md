# Scheduling System - Quick Start Guide

## 🚀 Getting Started

The DeepStation scheduling system allows you to schedule posts across multiple platforms with timezone awareness, recurring patterns, and automatic retry logic.

## 📦 Installation

Dependencies are already installed:
- `date-fns` - Date manipulation
- `date-fns-tz` - Timezone support
- `rrule` - Recurring rule parsing

## 🎯 Core Concepts

### 1. Timezone Management

Always store times in **UTC** in the database, but allow users to schedule in their local timezone.

```typescript
import { parseScheduledTime, formatInUserTimezone } from '@/lib/scheduling';

// User schedules for 9:00 AM Miami time
const utcTime = parseScheduledTime('2025-10-15', '09:00', 'America/New_York');

// Store in database as UTC
await supabase.from('scheduled_posts').insert({
  scheduled_for: utcTime.toISOString(), // Stored as UTC
  timezone: 'America/New_York', // Original timezone for display
});

// Display to user in their timezone
const displayTime = formatInUserTimezone(
  utcTime,
  'America/New_York',
  'PPpp' // "Oct 15, 2025, 9:00 AM"
);
```

### 2. Recurrence Patterns (RRULE)

Create recurring schedules using RRULE format.

```typescript
import { createWeeklyRecurrence, getRecurrenceInfo } from '@/lib/scheduling';

// Every Tuesday and Thursday at 2 PM
const rrule = createWeeklyRecurrence(
  new Date(2025, 0, 1, 14, 0), // Start date
  [2, 4], // Tuesday=2, Thursday=4
  new Date(2025, 11, 31) // End date
);

// Get human-readable description
const info = getRecurrenceInfo(rrule);
console.log(info.humanReadable); // "every week on Tuesday, Thursday until Dec 31, 2025"
console.log(info.nextOccurrences); // [Date, Date, Date, ...]
```

### 3. Edge Function (Cron)

The scheduler runs as a Supabase Edge Function on a cron schedule.

```bash
# Deploy
supabase functions deploy process-scheduled-posts --no-verify-jwt

# Schedule to run every 5 minutes
supabase functions schedule process-scheduled-posts --cron "*/5 * * * *"
```

## 📝 Common Use Cases

### Schedule a Single Post

```typescript
import { parseScheduledTime } from '@/lib/scheduling';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const scheduledFor = parseScheduledTime(
  '2025-10-15', // Date
  '09:00',      // Time (24-hour format)
  'America/New_York' // Timezone
);

const { data, error } = await supabase.from('scheduled_posts').insert({
  user_id: userId,
  content: {
    linkedin: 'Check out our latest insights on AI! 🤖',
    twitter: 'New blog post: AI trends 2025 🚀 #AI #Tech',
    instagram: 'Swipe to see our AI predictions for 2025 ➡️',
  },
  images: ['https://example.com/image.jpg'],
  platforms: ['linkedin', 'twitter', 'instagram'],
  scheduled_for: scheduledFor.toISOString(),
  timezone: 'America/New_York',
  status: 'scheduled',
});
```

### Create Weekly Recurring Post

```typescript
import { createWeeklyRecurrence, calculateNextOccurrence } from '@/lib/scheduling';

// Every Monday at 9 AM
const startDate = new Date(2025, 0, 6, 9, 0, 0); // First Monday
const rrule = createWeeklyRecurrence(startDate, [1]); // 1 = Monday

// Create parent post
const { data: parentPost } = await supabase
  .from('scheduled_posts')
  .insert({
    user_id: userId,
    title: 'Monday Motivation',
    content: {
      linkedin: 'Start your week strong! 💪',
    },
    platforms: ['linkedin'],
    scheduled_for: startDate.toISOString(),
    recurrence_rule: rrule,
    status: 'scheduled',
  })
  .select()
  .single();

// Create recurring post entry
const nextOccurrence = calculateNextOccurrence(rrule, new Date());

await supabase.from('recurring_posts').insert({
  parent_post_id: parentPost.id,
  user_id: userId,
  recurrence_rule: rrule,
  start_date: startDate.toISOString(),
  timezone: 'America/New_York',
  next_occurrence: nextOccurrence?.toISOString(),
  is_active: true,
});
```

### Create Monthly Newsletter

```typescript
import { createMonthlyRecurrence } from '@/lib/scheduling';

// Every 15th of the month at 10 AM
const startDate = new Date(2025, 0, 15, 10, 0, 0);
const rrule = createMonthlyRecurrence(
  startDate,
  15, // Day of month
  new Date(2025, 11, 31) // End date
);

// Same pattern as weekly recurrence above
```

### Create Daily Posts for 30 Days

```typescript
import { createRecurrenceWithCount } from '@/lib/scheduling';

// Daily for 30 days
const startDate = new Date(2025, 0, 1, 8, 0, 0);
const rrule = createRecurrenceWithCount(
  { frequency: 'daily', startDate },
  30 // Count
);
```

### Bulk Schedule Posts

```typescript
// Schedule multiple posts with spacing
const posts = [
  { content: 'Post 1', platforms: ['linkedin'] },
  { content: 'Post 2', platforms: ['twitter'] },
  { content: 'Post 3', platforms: ['instagram'] },
];

const baseTime = new Date('2025-10-15T09:00:00');
const spacingMinutes = 30;

for (let i = 0; i < posts.length; i++) {
  const scheduledFor = new Date(
    baseTime.getTime() + i * spacingMinutes * 60 * 1000
  );

  await supabase.from('scheduled_posts').insert({
    user_id: userId,
    content: { [posts[i].platforms[0]]: posts[i].content },
    platforms: posts[i].platforms,
    scheduled_for: scheduledFor.toISOString(),
    timezone: 'America/New_York',
    status: 'scheduled',
  });
}
```

## 🔍 Monitoring

### Check Scheduler Health

```typescript
import { getSchedulerHealth, formatHealthReport } from '@/lib/scheduling';

const health = await getSchedulerHealth(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log(formatHealthReport(health));

// Example output:
// ✅ Scheduler Status: HEALTHY
//
// Queue Depth: 12
// Stuck Jobs: 0
// Recent Failures: 2
// Success Rate: 94.5%
// Avg Processing Time: 3.2s
//
// No issues detected.
```

### Get Queue Metrics

```typescript
import { getQueueDepthMetrics } from '@/lib/scheduling';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const metrics = await getQueueDepthMetrics(supabase);

console.log(`Total: ${metrics.total}`);
console.log(`Pending: ${metrics.pending}`);
console.log(`Processing: ${metrics.processing}`);
console.log(`Overdue: ${metrics.overdue}`);
console.log(`By platform:`, metrics.byPlatform);
```

### Detect and Fix Stuck Jobs

```typescript
import { detectStuckJobs, resetStuckJobs } from '@/lib/scheduling';

// Find stuck jobs
const stuck = await detectStuckJobs(supabase);
console.log(`Found ${stuck.length} stuck jobs`);

stuck.forEach((job) => {
  console.log(`Job ${job.id} stuck for ${job.durationMinutes} minutes`);
});

// Auto-fix
const resetCount = await resetStuckJobs(supabase);
console.log(`Reset ${resetCount} stuck jobs`);
```

## 🛠️ Utility Functions

### Timezone Helpers

```typescript
import {
  getBrowserTimezone,
  getTimezoneAbbreviation,
  observesDST,
  formatTimeUntilScheduled,
} from '@/lib/scheduling';

// Get user's browser timezone
const userTz = getBrowserTimezone(); // "America/New_York"

// Get timezone abbreviation
const abbr = getTimezoneAbbreviation('America/New_York'); // "EST" or "EDT"

// Check if timezone observes DST
const hasDST = observesDST('America/New_York'); // true

// Format time until scheduled
const scheduledFor = new Date('2025-10-15T09:00:00Z');
const timeUntil = formatTimeUntilScheduled(scheduledFor); // "in 5 days"
```

### Recurrence Helpers

```typescript
import {
  getRecurrenceDescription,
  hasRecurrenceEnded,
  getTotalOccurrences,
} from '@/lib/scheduling';

// Get human-readable description
const desc = getRecurrenceDescription(rrule);
// "every week on Tuesday, Thursday"

// Check if recurrence has ended
const ended = hasRecurrenceEnded(rrule); // false

// Get total number of occurrences
const total = getTotalOccurrences(rrule); // 52 or null (unlimited)
```

## 📊 Database Queries

### View Pending Posts

```sql
SELECT
  id,
  title,
  scheduled_for,
  timezone,
  platforms,
  retry_count
FROM scheduled_posts
WHERE status = 'scheduled'
ORDER BY scheduled_for ASC;
```

### View Recent Failures

```sql
SELECT
  id,
  title,
  platforms,
  last_error,
  retry_count,
  max_retries
FROM scheduled_posts
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

### View Active Recurring Posts

```sql
SELECT
  rp.id,
  sp.title,
  rp.recurrence_rule,
  rp.next_occurrence,
  rp.is_active
FROM recurring_posts rp
JOIN scheduled_posts sp ON rp.parent_post_id = sp.id
WHERE rp.is_active = true
ORDER BY rp.next_occurrence ASC;
```

## 🐛 Debugging

### Enable Debug Logging

```typescript
// In Edge Function
console.log('Processing post:', post.id);
console.log('Platforms:', post.platforms);
console.log('Scheduled for:', post.scheduled_for);
```

### Check Edge Function Logs

```bash
# Real-time logs
supabase functions logs process-scheduled-posts --tail

# Historical logs
supabase functions logs process-scheduled-posts --limit 100
```

### Manual Trigger

```bash
# Test the function manually
supabase functions invoke process-scheduled-posts

# With payload
supabase functions invoke process-scheduled-posts \
  --body '{"test": true}'
```

## 🎨 UI Integration

### Timezone Selector

```tsx
import { SUPPORTED_TIMEZONES, TIMEZONE_LABELS } from '@/lib/scheduling';

export function TimezoneSelector() {
  return (
    <select>
      {SUPPORTED_TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>
          {TIMEZONE_LABELS[tz]}
        </option>
      ))}
    </select>
  );
}
```

### Recurrence Builder

```tsx
import { generateRRule, getRecurrenceInfo } from '@/lib/scheduling';

export function RecurrenceBuilder() {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  const handleGenerate = () => {
    const rrule = generateRRule({
      frequency,
      daysOfWeek,
      startDate: new Date(),
    });

    const info = getRecurrenceInfo(rrule);
    console.log(info.humanReadable);
  };

  return (
    <div>
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {frequency === 'weekly' && (
        <div>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={daysOfWeek.includes(i)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDaysOfWeek([...daysOfWeek, i]);
                  } else {
                    setDaysOfWeek(daysOfWeek.filter((d) => d !== i));
                  }
                }}
              />
              {day}
            </label>
          ))}
        </div>
      )}

      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}
```

### Schedule Preview

```tsx
import { parseRRule, formatInUserTimezone } from '@/lib/scheduling';

export function SchedulePreview({ rrule, timezone }: { rrule: string; timezone: string }) {
  const occurrences = parseRRule(rrule, 5); // Next 5

  return (
    <div>
      <h3>Next 5 Occurrences:</h3>
      <ul>
        {occurrences.map((date, i) => (
          <li key={i}>
            {formatInUserTimezone(date, timezone, 'PPpp')}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 📚 API Reference

### Timezone Functions

- `convertToUTC(localDate, timezone)` → `Date`
- `convertFromUTC(utcDate, timezone)` → `Date`
- `formatInUserTimezone(date, timezone, format?)` → `string`
- `parseScheduledTime(dateString, timeString, timezone)` → `Date`
- `getBrowserTimezone()` → `string`

### Recurrence Functions

- `generateRRule(config)` → `string`
- `parseRRule(rruleString, limit?, after?)` → `Date[]`
- `calculateNextOccurrence(rruleString, after)` → `Date | null`
- `getRecurrenceInfo(rruleString)` → `RecurrenceInfo`
- `createWeeklyRecurrence(startDate, daysOfWeek, endDate?)` → `string`
- `createMonthlyRecurrence(startDate, dayOfMonth, endDate?)` → `string`

### Monitoring Functions

- `getSchedulerHealth(url, key)` → `Promise<SchedulerHealth>`
- `detectStuckJobs(supabase)` → `Promise<StuckJob[]>`
- `getQueueDepthMetrics(supabase)` → `Promise<QueueDepth>`
- `resetStuckJobs(supabase)` → `Promise<number>`

## 🔗 Related Documentation

- [Full Deployment Guide](./SCHEDULING_DEPLOYMENT.md)
- [PRD Phase 4](../docs/posting-system-with-scheduling.md)
- [Database Schema](./SCHEDULING_DEPLOYMENT.md#database-schema)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 💡 Tips

1. **Always use UTC for storage**: Convert to/from user timezone only at boundaries
2. **Test timezone edge cases**: DST transitions, midnight crossings, etc.
3. **Monitor stuck jobs**: Set up alerts for jobs processing >10 minutes
4. **Optimize cron frequency**: Balance accuracy vs. cost (5 minutes is recommended)
5. **Archive old posts**: Prevent database bloat with regular cleanup
6. **Use retry logic**: Let the system auto-retry transient failures
7. **Validate RRULEs**: Test recurrence patterns before saving

## 🆘 Common Issues

**Issue**: Post not publishing at scheduled time
- Check: Is `scheduled_for` in the past?
- Check: Is status `scheduled`?
- Check: Are OAuth tokens valid?
- Fix: View Edge Function logs

**Issue**: Timezone showing wrong time
- Check: Is timezone valid IANA format?
- Check: Is DST being considered?
- Fix: Use `formatInUserTimezone()` for display

**Issue**: Recurring posts not creating
- Check: Is `is_active` true?
- Check: Is `next_occurrence` in the past?
- Check: Is RRULE valid?
- Fix: Manually set `next_occurrence`

## 🚀 Next Steps

1. Deploy Edge Function: `supabase functions deploy process-scheduled-posts`
2. Set up cron: `supabase functions schedule process-scheduled-posts --cron "*/5 * * * *"`
3. Test scheduling: Create a test post scheduled for 1 minute from now
4. Monitor: Check scheduler health every hour
5. Optimize: Adjust cron frequency based on usage

Happy scheduling! 🎉
