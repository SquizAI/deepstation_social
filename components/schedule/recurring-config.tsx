'use client'

import { useState } from 'react'
import { RecurringPattern } from '@/lib/types/schedule'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { formatRecurringPattern, validateRecurringPattern } from '@/lib/utils/recurring-posts'

interface RecurringConfigProps {
  pattern: RecurringPattern
  onChange: (pattern: RecurringPattern) => void
}

export function RecurringConfig({ pattern, onChange }: RecurringConfigProps) {
  const [validationError, setValidationError] = useState<string>()

  const handleChange = (updates: Partial<RecurringPattern>) => {
    const newPattern = { ...pattern, ...updates }
    const validation = validateRecurringPattern(newPattern)

    if (!validation.valid) {
      setValidationError(validation.error)
    } else {
      setValidationError(undefined)
    }

    onChange(newPattern)
  }

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ]

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <div>
        <Label className="text-white mb-2">Recurrence</Label>
        <Select
          value={pattern.frequency}
          onChange={(e) => handleChange({ frequency: e.target.value as any })}
          className="bg-white/5 border-white/10 text-white"
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </Select>
      </div>

      {pattern.frequency !== 'none' && (
        <>
          {/* Interval */}
          <div>
            <Label className="text-white mb-2">
              Repeat every
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={pattern.interval || 1}
                onChange={(e) => handleChange({ interval: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10 text-white w-20"
              />
              <span className="text-gray-400">
                {pattern.frequency === 'daily' && 'day(s)'}
                {pattern.frequency === 'weekly' && 'week(s)'}
                {pattern.frequency === 'monthly' && 'month(s)'}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly) */}
          {pattern.frequency === 'weekly' && (
            <div>
              <Label className="text-white mb-2">On these days</Label>
              <div className="flex gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.value}
                    onClick={() => {
                      const days = pattern.daysOfWeek || []
                      const newDays = days.includes(day.value)
                        ? days.filter(d => d !== day.value)
                        : [...days, day.value].sort()
                      handleChange({ daysOfWeek: newDays })
                    }}
                    className={`
                      w-10 h-10 rounded-full text-sm font-medium transition-colors
                      ${(pattern.daysOfWeek || []).includes(day.value)
                        ? 'bg-fuchsia-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }
                    `}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {pattern.frequency === 'monthly' && (
            <div>
              <Label className="text-white mb-2">Day of month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={pattern.dayOfMonth || ''}
                onChange={(e) => handleChange({ dayOfMonth: parseInt(e.target.value) })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Leave empty for same day each month"
              />
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label className="text-white">Ends</Label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!pattern.endDate && !pattern.occurrenceCount}
                  onChange={() => handleChange({ endDate: undefined, occurrenceCount: undefined })}
                  className="w-4 h-4 text-fuchsia-500"
                />
                <span className="text-gray-300">Never</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!pattern.endDate}
                  onChange={() => handleChange({ endDate: new Date().toISOString().split('T')[0], occurrenceCount: undefined })}
                  className="w-4 h-4 text-fuchsia-500"
                />
                <span className="text-gray-300">On</span>
                {pattern.endDate && (
                  <Input
                    type="date"
                    value={pattern.endDate.split('T')[0]}
                    onChange={(e) => handleChange({ endDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white ml-2"
                  />
                )}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!pattern.occurrenceCount}
                  onChange={() => handleChange({ occurrenceCount: 10, endDate: undefined })}
                  className="w-4 h-4 text-fuchsia-500"
                />
                <span className="text-gray-300">After</span>
                {pattern.occurrenceCount && (
                  <>
                    <Input
                      type="number"
                      min="1"
                      value={pattern.occurrenceCount}
                      onChange={(e) => handleChange({ occurrenceCount: parseInt(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white w-20 ml-2"
                    />
                    <span className="text-gray-300">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-4">
            <p className="text-sm text-fuchsia-300">
              <strong>Summary:</strong> {formatRecurringPattern(pattern)}
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{validationError}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
