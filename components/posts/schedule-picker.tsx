'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface SchedulePickerProps {
  onSchedule: (date: Date, timezone: string, recurring?: RecurringOptions) => void
  onPostNow: () => void
}

interface RecurringOptions {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly'
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo Time (BRT)' }
]

const OPTIMAL_TIMES = {
  linkedin: '9:00 AM - 10:00 AM (Weekdays)',
  instagram: '11:00 AM - 1:00 PM',
  twitter: '12:00 PM - 3:00 PM',
  discord: '6:00 PM - 9:00 PM'
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

export function SchedulePicker({ onSchedule, onPostNow }: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedTime, setSelectedTime] = React.useState<string>('09:00')
  const [timezone, setTimezone] = React.useState<string>('America/New_York')
  const [recurringFrequency, setRecurringFrequency] = React.useState<RecurringOptions['frequency']>('none')
  const [selectedDays, setSelectedDays] = React.useState<number[]>([])
  const [showOptimalTimes, setShowOptimalTimes] = React.useState(false)

  const minDate = React.useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  const handleSchedule = () => {
    if (!selectedDate) {
      alert('Please select a date')
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledDate = new Date(selectedDate)
    scheduledDate.setHours(hours, minutes, 0, 0)

    const recurring: RecurringOptions | undefined =
      recurringFrequency !== 'none'
        ? {
            frequency: recurringFrequency,
            daysOfWeek: recurringFrequency === 'weekly' ? selectedDays : undefined
          }
        : undefined

    onSchedule(scheduledDate, timezone, recurring)
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const isValidSchedule = selectedDate !== ''

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Post</h3>

        {/* Date Picker */}
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium text-gray-900">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="schedule_date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>

        {/* Time Picker */}
        <div className="space-y-2 mt-4">
          <label htmlFor="time" className="text-sm font-medium text-gray-900">
            Time
          </label>
          <input
            type="time"
            id="time"
            name="schedule_time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>

        {/* Timezone Selector */}
        <div className="space-y-2 mt-4">
          <label htmlFor="timezone" className="text-sm font-medium text-gray-900">
            Timezone
          </label>
          <Select
            id="timezone"
            name="schedule_timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Recurring Options */}
        <div className="space-y-2 mt-4">
          <label htmlFor="recurring" className="text-sm font-medium text-gray-900">
            Recurring
          </label>
          <Select
            id="recurring"
            name="schedule_recurring"
            value={recurringFrequency}
            onChange={(e) => setRecurringFrequency(e.target.value as RecurringOptions['frequency'])}
          >
            <option value="none">One-time post</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </div>

        {/* Weekly Day Selection */}
        {recurringFrequency === 'weekly' && (
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium text-gray-900">Select Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-600">Please select at least one day</p>
            )}
          </div>
        )}
      </div>

      {/* Optimal Posting Times */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <button
          onClick={() => setShowOptimalTimes(!showOptimalTimes)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-green-900">
            💡 Optimal Posting Times
          </span>
          <span className="text-green-700">
            {showOptimalTimes ? '▼' : '▶'}
          </span>
        </button>

        {showOptimalTimes && (
          <div className="mt-3 space-y-2">
            {Object.entries(OPTIMAL_TIMES).map(([platform, time]) => (
              <div key={platform} className="text-xs text-green-800">
                <span className="font-medium capitalize">{platform}:</span> {time}
              </div>
            ))}
            <p className="text-xs text-green-700 mt-2 italic">
              These are general recommendations. Your audience insights may vary.
            </p>
          </div>
        )}
      </div>

      {/* Preview scheduled time */}
      {selectedDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Scheduled for:</p>
          <p className="text-sm text-gray-700">
            {new Date(selectedDate + 'T' + selectedTime).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: timezone
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Timezone: {TIMEZONES.find(tz => tz.value === timezone)?.label}
          </p>
          {recurringFrequency !== 'none' && (
            <p className="text-xs text-gray-500 mt-1">
              Frequency: {recurringFrequency.charAt(0).toUpperCase() + recurringFrequency.slice(1)}
              {recurringFrequency === 'weekly' && selectedDays.length > 0 &&
                ` on ${selectedDays.map(d => DAYS_OF_WEEK[d].label).join(', ')}`
              }
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={onPostNow}
          variant="outline"
          className="flex-1"
        >
          Post Now
        </Button>
        <Button
          onClick={handleSchedule}
          disabled={!isValidSchedule || (recurringFrequency === 'weekly' && selectedDays.length === 0)}
          className="flex-1"
        >
          Schedule Post
        </Button>
      </div>
    </div>
  )
}
