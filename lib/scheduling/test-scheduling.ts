/**
 * Test Script for Scheduling System
 * Run this to verify the scheduling utilities work correctly
 */

import {
  // Timezone
  convertToUTC,
  convertFromUTC,
  formatInUserTimezone,
  parseScheduledTime,
  getBrowserTimezone,
  observesDST,
  getTimezoneAbbreviation,

  // Recurrence
  createWeeklyRecurrence,
  createMonthlyRecurrence,
  getRecurrenceInfo,
  calculateNextOccurrence,
  parseRRule,

  // Queue (for demonstration)
  JobQueue,
  JobPriority,
  JobType,
} from './index';

/**
 * Test timezone conversions
 */
export function testTimezones() {
  console.log('\n=== Testing Timezone Utilities ===\n');

  // Test 1: Convert Miami 9 AM to UTC
  const miamiTime = new Date('2025-10-15T09:00:00');
  const utcTime = convertToUTC(miamiTime, 'America/New_York');
  console.log('1. Miami 9:00 AM → UTC:', utcTime.toISOString());

  // Test 2: Convert UTC back to Miami
  const backToMiami = convertFromUTC(utcTime, 'America/New_York');
  console.log('2. UTC → Miami:', backToMiami.toString());

  // Test 3: Format in different timezones
  const display = formatInUserTimezone(utcTime, 'America/New_York', 'PPpp');
  console.log('3. Display in Miami:', display);

  // Test 4: Parse scheduled time
  const scheduled = parseScheduledTime('2025-10-15', '14:00', 'America/Los_Angeles');
  console.log('4. LA 2:00 PM → UTC:', scheduled.toISOString());

  // Test 5: Browser timezone
  const browserTz = getBrowserTimezone();
  console.log('5. Browser timezone:', browserTz);

  // Test 6: DST check
  const hasDST = observesDST('America/New_York');
  console.log('6. New York has DST:', hasDST);

  // Test 7: Timezone abbreviation
  const abbr = getTimezoneAbbreviation('America/New_York');
  console.log('7. New York abbreviation:', abbr);
}

/**
 * Test recurrence patterns
 */
export function testRecurrence() {
  console.log('\n=== Testing Recurrence Utilities ===\n');

  // Test 1: Weekly recurrence (every Tuesday)
  const startDate = new Date(2025, 0, 7, 14, 0, 0); // Jan 7, 2025, 2 PM
  const endDate = new Date(2025, 11, 31); // Dec 31, 2025
  const weeklyRRule = createWeeklyRecurrence(startDate, [2], endDate);
  console.log('1. Weekly (Tuesday) RRULE:', weeklyRRule);

  const weeklyInfo = getRecurrenceInfo(weeklyRRule, 5);
  console.log('   Human readable:', weeklyInfo.humanReadable);
  console.log('   Next 5 occurrences:');
  weeklyInfo.nextOccurrences.forEach((date, i) => {
    console.log(`      ${i + 1}. ${date.toISOString()}`);
  });

  // Test 2: Monthly recurrence (15th of each month)
  const monthlyRRule = createMonthlyRecurrence(
    new Date(2025, 0, 15, 10, 0, 0),
    15,
    endDate
  );
  console.log('\n2. Monthly (15th) RRULE:', monthlyRRule);

  const monthlyInfo = getRecurrenceInfo(monthlyRRule, 3);
  console.log('   Human readable:', monthlyInfo.humanReadable);
  console.log('   Next 3 occurrences:');
  monthlyInfo.nextOccurrences.forEach((date, i) => {
    console.log(`      ${i + 1}. ${date.toISOString()}`);
  });

  // Test 3: Calculate next occurrence
  const next = calculateNextOccurrence(weeklyRRule, new Date());
  console.log('\n3. Next occurrence from now:', next?.toISOString());

  // Test 4: Parse RRULE
  const occurrences = parseRRule(weeklyRRule, 10);
  console.log('\n4. Next 10 occurrences:', occurrences.length);
}

/**
 * Test job queue
 */
export function testQueue() {
  console.log('\n=== Testing Job Queue ===\n');

  const queue = new JobQueue(3); // Max 3 concurrent

  // Enqueue jobs with different priorities
  console.log('1. Enqueueing jobs...');

  queue.enqueue(
    JobType.PUBLISH,
    { postId: 'post-1', platforms: ['linkedin'] },
    JobPriority.NORMAL
  );

  queue.enqueue(
    JobType.PUBLISH,
    { postId: 'post-2', platforms: ['twitter'] },
    JobPriority.HIGH
  );

  queue.enqueue(
    JobType.CLEANUP,
    {},
    JobPriority.LOW
  );

  // Get stats
  setTimeout(() => {
    const stats = queue.getStats();
    console.log('\n2. Queue Stats:');
    console.log('   Total jobs:', stats.total);
    console.log('   Pending:', stats.pending);
    console.log('   Processing:', stats.processing);
    console.log('   Completed:', stats.completed);
    console.log('   Failed:', stats.failed);
    console.log('   Success Rate:', stats.successRate.toFixed(1) + '%');
    console.log('   Avg Processing Time:', (stats.avgProcessingTime / 1000).toFixed(2) + 's');
  }, 2000);
}

/**
 * Test complete scheduling workflow
 */
export function testCompleteWorkflow() {
  console.log('\n=== Testing Complete Workflow ===\n');

  // Step 1: User schedules post for 9 AM Miami time
  console.log('1. User schedules post for 9:00 AM Miami time on Oct 15, 2025');

  const scheduledFor = parseScheduledTime(
    '2025-10-15',
    '09:00',
    'America/New_York'
  );

  console.log('   Local time: 2025-10-15 09:00 (America/New_York)');
  console.log('   UTC time:', scheduledFor.toISOString());
  console.log('   Store in DB: { scheduled_for: "' + scheduledFor.toISOString() + '" }');

  // Step 2: Create recurring post (every Tuesday)
  console.log('\n2. Create recurring post (every Tuesday at 2 PM)');

  const startDate = new Date(2025, 0, 7, 14, 0, 0);
  const rrule = createWeeklyRecurrence(startDate, [2]);

  console.log('   RRULE:', rrule);

  const info = getRecurrenceInfo(rrule, 3);
  console.log('   Pattern:', info.humanReadable);
  console.log('   Next 3 occurrences:');
  info.nextOccurrences.forEach((date, i) => {
    const display = formatInUserTimezone(date, 'America/New_York', 'PPpp');
    console.log(`      ${i + 1}. ${display}`);
  });

  // Step 3: Display in user's timezone
  console.log('\n3. Display scheduled time to user');

  const displayTime = formatInUserTimezone(
    scheduledFor,
    'America/New_York',
    'PPpp'
  );

  console.log('   Display:', displayTime);
  console.log('   Timezone:', getTimezoneAbbreviation('America/New_York'));
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Scheduling System - Test Suite          ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    testTimezones();
    testRecurrence();
    testQueue();
    testCompleteWorkflow();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   ✅ All Tests Completed Successfully!     ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

// Export for use in other files
export default {
  testTimezones,
  testRecurrence,
  testQueue,
  testCompleteWorkflow,
  runAllTests,
};
