'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { DateRange, DateRangePreset } from '@/lib/types/analytics'

interface DateRangePickerProps {
  value: DateRangePreset
  customStart?: Date
  customEnd?: Date
  onChange: (preset: DateRangePreset, customStart?: Date, customEnd?: Date) => void
}

export function DateRangePicker({ value, customStart, customEnd, onChange }: DateRangePickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [tempStart, setTempStart] = useState<Date | undefined>(customStart)
  const [tempEnd, setTempEnd] = useState<Date | undefined>(customEnd)

  const presets = [
    { value: '7d' as DateRangePreset, label: 'Last 7 days' },
    { value: '30d' as DateRangePreset, label: 'Last 30 days' },
    { value: '90d' as DateRangePreset, label: 'Last 90 days' },
    { value: 'custom' as DateRangePreset, label: 'Custom range' }
  ]

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomPicker(true)
    } else {
      setShowCustomPicker(false)
      onChange(preset)
    }
  }

  const handleCustomApply = () => {
    if (tempStart && tempEnd) {
      onChange('custom', tempStart, tempEnd)
      setShowCustomPicker(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {presets.map(preset => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === preset.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {showCustomPicker && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Calendar
                mode="single"
                selected={tempStart}
                onSelect={setTempStart}
                disabled={(date) => date > new Date()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Calendar
                mode="single"
                selected={tempEnd}
                onSelect={setTempEnd}
                disabled={(date) => date > new Date() || (tempStart && date < tempStart)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {tempStart && tempEnd && (
                <span>
                  {format(tempStart, 'MMM d, yyyy')} - {format(tempEnd, 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomPicker(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomApply}
                disabled={!tempStart || !tempEnd}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
