'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ScheduleBuilderProps {
  initialCron?: string;
  onChange: (cron: string) => void;
}

type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

interface ScheduleConfig {
  frequency: Frequency;
  time: string; // HH:mm format
  timezone: string;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number; // 1-31
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export function ScheduleBuilder({ initialCron, onChange }: ScheduleBuilderProps) {
  const [config, setConfig] = useState<ScheduleConfig>({
    frequency: 'daily',
    time: '09:00',
    timezone: 'America/New_York',
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
  });

  const [nextRuns, setNextRuns] = useState<Date[]>([]);

  // Parse initial cron expression if provided
  useEffect(() => {
    if (initialCron) {
      const parsed = parseCronExpression(initialCron);
      if (parsed) {
        setConfig(parsed);
      }
    }
  }, [initialCron]);

  // Generate cron expression whenever config changes
  useEffect(() => {
    const cron = generateCronExpression(config);
    onChange(cron);
    calculateNextRuns();
  }, [config]);

  const parseCronExpression = (cron: string): ScheduleConfig | null => {
    // Basic cron parsing (simplified)
    const parts = cron.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const parsed: ScheduleConfig = {
      frequency: 'daily',
      time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      timezone: 'America/New_York',
    };

    // Determine frequency
    if (hour.includes('*/')) {
      parsed.frequency = 'hourly';
    } else if (dayOfWeek !== '*') {
      parsed.frequency = 'weekly';
      // Parse days of week
      if (dayOfWeek.includes(',')) {
        parsed.daysOfWeek = dayOfWeek.split(',').map(d => parseInt(d));
      } else if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(d => parseInt(d));
        parsed.daysOfWeek = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      } else {
        parsed.daysOfWeek = [parseInt(dayOfWeek)];
      }
    } else if (dayOfMonth !== '*') {
      parsed.frequency = 'monthly';
      parsed.dayOfMonth = parseInt(dayOfMonth);
    }

    return parsed;
  };

  const generateCronExpression = (config: ScheduleConfig): string => {
    const [hour, minute] = config.time.split(':');

    switch (config.frequency) {
      case 'hourly':
        return `0 * * * *`; // Every hour

      case 'daily':
        return `${minute} ${hour} * * *`; // Every day at specified time

      case 'weekly':
        if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
          return `${minute} ${hour} * * 1-5`; // Weekdays by default
        }
        const days = config.daysOfWeek.sort((a, b) => a - b).join(',');
        return `${minute} ${hour} * * ${days}`;

      case 'monthly':
        const day = config.dayOfMonth || 1;
        return `${minute} ${hour} ${day} * *`;

      default:
        return `${minute} ${hour} * * *`;
    }
  };

  const calculateNextRuns = () => {
    // Calculate next 5 run times based on cron expression
    const runs: Date[] = [];
    const now = new Date();

    switch (config.frequency) {
      case 'hourly':
        for (let i = 0; i < 5; i++) {
          const next = new Date(now);
          next.setHours(now.getHours() + i + 1);
          next.setMinutes(0);
          next.setSeconds(0);
          runs.push(next);
        }
        break;

      case 'daily':
        for (let i = 0; i < 5; i++) {
          const next = new Date(now);
          next.setDate(now.getDate() + i);
          const [hour, minute] = config.time.split(':').map(Number);
          next.setHours(hour, minute, 0, 0);
          if (next > now) {
            runs.push(next);
          }
        }
        break;

      case 'weekly':
        const selectedDays = config.daysOfWeek || [1, 2, 3, 4, 5];
        let daysChecked = 0;
        let currentDate = new Date(now);

        while (runs.length < 5 && daysChecked < 30) {
          currentDate.setDate(currentDate.getDate() + 1);
          const dayOfWeek = currentDate.getDay();

          if (selectedDays.includes(dayOfWeek)) {
            const next = new Date(currentDate);
            const [hour, minute] = config.time.split(':').map(Number);
            next.setHours(hour, minute, 0, 0);
            if (next > now) {
              runs.push(new Date(next));
            }
          }
          daysChecked++;
        }
        break;

      case 'monthly':
        for (let i = 0; i < 5; i++) {
          const next = new Date(now);
          next.setMonth(now.getMonth() + i);
          next.setDate(config.dayOfMonth || 1);
          const [hour, minute] = config.time.split(':').map(Number);
          next.setHours(hour, minute, 0, 0);
          if (next > now) {
            runs.push(next);
          }
        }
        break;
    }

    setNextRuns(runs.slice(0, 5));
  };

  const toggleDayOfWeek = (day: number) => {
    setConfig(prev => {
      const days = prev.daysOfWeek || [];
      if (days.includes(day)) {
        return { ...prev, daysOfWeek: days.filter(d => d !== day) };
      } else {
        return { ...prev, daysOfWeek: [...days, day].sort((a, b) => a - b) };
      }
    });
  };

  const formatNextRun = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let timeStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);

    let relativeStr = '';
    if (diffDays === 0) {
      relativeStr = 'Today';
    } else if (diffDays === 1) {
      relativeStr = 'Tomorrow';
    } else if (diffDays < 7) {
      relativeStr = `In ${diffDays} days`;
    } else {
      relativeStr = `In ${Math.floor(diffDays / 7)} weeks`;
    }

    return { timeStr, relativeStr };
  };

  return (
    <div className="space-y-6">
      {/* Frequency Selector */}
      <div>
        <label className="text-slate-300 text-sm mb-3 block font-medium">Frequency</label>
        <div className="grid grid-cols-4 gap-2">
          {(['hourly', 'daily', 'weekly', 'monthly'] as Frequency[]).map((freq) => (
            <button
              key={freq}
              onClick={() => setConfig({ ...config, frequency: freq })}
              className={`px-4 py-3 rounded-lg text-sm font-semibold capitalize transition-all ${
                config.frequency === freq
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Time Picker (not for hourly) */}
      {config.frequency !== 'hourly' && (
        <div>
          <label className="text-slate-300 text-sm mb-2 block font-medium">Time</label>
          <input
            type="time"
            value={config.time}
            onChange={(e) => setConfig({ ...config, time: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none text-lg font-mono"
          />
        </div>
      )}

      {/* Days of Week Selector (for weekly) */}
      {config.frequency === 'weekly' && (
        <div>
          <label className="text-slate-300 text-sm mb-3 block font-medium">Days of Week</label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDayOfWeek(day.value)}
                className={`px-3 py-3 rounded-lg text-sm font-bold transition-all ${
                  config.daysOfWeek?.includes(day.value)
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                }`}
                title={day.fullLabel}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Select one or more days when the workflow should run
          </p>
        </div>
      )}

      {/* Day of Month Selector (for monthly) */}
      {config.frequency === 'monthly' && (
        <div>
          <label className="text-slate-300 text-sm mb-2 block font-medium">Day of Month</label>
          <select
            value={config.dayOfMonth || 1}
            onChange={(e) => setConfig({ ...config, dayOfMonth: parseInt(e.target.value) })}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timezone Selector */}
      <div>
        <label className="text-slate-300 text-sm mb-2 block font-medium">Timezone</label>
        <select
          value={config.timezone}
          onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:border-fuchsia-500 focus:outline-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Generated Cron Expression */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-300 text-xs font-semibold">Cron Expression</p>
        </div>
        <code className="text-blue-200 font-mono text-sm bg-blue-900/30 px-3 py-2 rounded block">
          {generateCronExpression(config)}
        </code>
      </div>

      {/* Next Run Times Preview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-5 w-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-white text-sm font-semibold">Next 5 Run Times</p>
        </div>
        <div className="space-y-2">
          {nextRuns.length > 0 ? (
            nextRuns.map((run, index) => {
              const { timeStr, relativeStr } = formatNextRun(run);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-white text-sm font-medium">{timeStr}</p>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold">{relativeStr}</p>
                </div>
              );
            })
          ) : (
            <p className="text-slate-400 text-xs text-center py-4">
              No upcoming runs scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
