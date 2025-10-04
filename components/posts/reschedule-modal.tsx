'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { ScheduledPost } from '@/lib/types/posts'

interface RescheduleModalProps {
  post: ScheduledPost | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo Time (BRT)' }
]

export function RescheduleModal({ post, open, onClose, onSuccess }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedTime, setSelectedTime] = React.useState<string>('09:00')
  const [timezone, setTimezone] = React.useState<string>('America/New_York')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const minDate = React.useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Initialize form when post changes
  React.useEffect(() => {
    if (post && post.scheduled_for) {
      const scheduledDate = new Date(post.scheduled_for)
      setSelectedDate(scheduledDate.toISOString().split('T')[0])
      setSelectedTime(
        `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`
      )
      setTimezone(post.timezone || 'America/New_York')
    }
  }, [post])

  const handleReschedule = async () => {
    if (!post || !selectedDate) {
      setError('Please select a date')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledDate = new Date(selectedDate)
      scheduledDate.setHours(hours, minutes, 0, 0)

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          scheduled_for: scheduledDate.toISOString(),
          timezone,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null)
      onClose()
    }
  }

  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Post</DialogTitle>
          <DialogDescription>
            Update the scheduled date and time for this post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="error">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <label htmlFor="reschedule-date" className="text-sm font-medium text-gray-900">
              Date
            </label>
            <input
              type="date"
              id="reschedule-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label htmlFor="reschedule-time" className="text-sm font-medium text-gray-900">
              Time
            </label>
            <input
              type="time"
              id="reschedule-time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
          </div>

          {/* Timezone Selector */}
          <div className="space-y-2">
            <label htmlFor="reschedule-timezone" className="text-sm font-medium text-gray-900">
              Timezone
            </label>
            <Select
              id="reschedule-timezone"
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

          {/* Preview */}
          {selectedDate && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-1">New scheduled time:</p>
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
                {TIMEZONES.find((tz) => tz.value === timezone)?.label}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={!selectedDate || isSubmitting}>
            {isSubmitting ? 'Rescheduling...' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
