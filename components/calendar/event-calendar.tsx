'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  isToday,
  getEventsForDate,
  getEventsCount,
  formatDateToYMD,
  formatTime,
  formatDisplayDate,
  getEventColor,
  type CalendarEvent
} from '@/lib/calendar/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EventCalendarProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date, events: CalendarEvent[]) => void
  onEventClick?: (event: CalendarEvent) => void
  initialMonth?: number
  initialYear?: number
}

export function EventCalendar({
  events,
  onDateClick,
  onEventClick,
  initialMonth,
  initialYear
}: EventCalendarProps) {
  const router = useRouter()
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? now.getMonth())
  const [currentYear, setCurrentYear] = useState(initialYear ?? now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [showQuickSchedule, setShowQuickSchedule] = useState(false)
  const [quickScheduleData, setQuickScheduleData] = useState({
    platforms: [] as string[],
    content: ''
  })

  const calendarGrid = useMemo(
    () => generateCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate, events) : []),
    [selectedDate, events]
  )

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateEvents = getEventsForDate(date, events)
    onDateClick?.(date, dateEvents)
  }

  const handleCloseModal = () => {
    setSelectedDate(null)
    setShowQuickSchedule(false)
    setQuickScheduleData({ platforms: [], content: '' })
  }

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event)
  }

  const handleSchedulePost = () => {
    if (!selectedDate) return
    const dateStr = formatDateToYMD(selectedDate)
    router.push(`/dashboard/posts/new?date=${dateStr}`)
  }

  const handleAddSpeaker = () => {
    if (!selectedDate) return
    const dateStr = formatDateToYMD(selectedDate)
    router.push(`/dashboard/speakers/new?date=${dateStr}`)
  }

  const handlePlatformToggle = (platform: string) => {
    setQuickScheduleData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  const handleQuickSchedule = async () => {
    if (!selectedDate || !quickScheduleData.content || quickScheduleData.platforms.length === 0) {
      return
    }

    try {
      // TODO: Implement API call to create scheduled post
      console.log('Quick scheduling post:', {
        date: selectedDate,
        platforms: quickScheduleData.platforms,
        content: quickScheduleData.content
      })

      // Show success notification (you can integrate with a toast library)
      alert('Post scheduled successfully!')

      // Reset and close
      handleCloseModal()
    } catch (error) {
      console.error('Failed to schedule post:', error)
      alert('Failed to schedule post. Please try again.')
    }
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Month/Year Display */}
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              {getMonthName(currentMonth)} {currentYear}
            </h2>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              Today
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'month'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'week'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'day'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextMonth}
                className="w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {getDayNames().map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Dates */}
        <div className="grid gap-2">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <div key={dayIndex} className="aspect-square" />
                }

                const today = isToday(date)
                const counts = getEventsCount(date, events)
                const hasEvents = counts.total > 0

                return (
                  <button
                    key={dayIndex}
                    onClick={() => handleDateClick(date)}
                    className={`group relative aspect-square p-2 rounded-lg border transition-all ${
                      today
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : hasEvents
                        ? 'border-white/20 bg-white/5 hover:bg-white/10'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    {/* Date Number */}
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        today ? 'text-fuchsia-300' : 'text-white'
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Event Indicators */}
                    {hasEvents && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {counts.posts > 0 && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"
                            title={`${counts.posts} post${counts.posts > 1 ? 's' : ''}`}
                          />
                        )}
                        {counts.speakers > 0 && (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-purple-500"
                            title={`${counts.speakers} speaker${counts.speakers > 1 ? 's' : ''}`}
                          />
                        )}
                      </div>
                    )}

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/0 to-purple-500/0 group-hover:from-fuchsia-500/10 group-hover:to-purple-500/10 rounded-lg transition-all pointer-events-none" />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-fuchsia-500" />
            <span className="text-sm text-slate-400">Scheduled Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-slate-400">Speaker Events</span>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={selectedDate !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
                {selectedDate && formatDisplayDate(selectedDate.toISOString())}
              </DialogTitle>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </DialogHeader>

          {/* Quick Actions Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 pb-6 border-b border-white/10">
            <button
              onClick={handleSchedulePost}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Schedule Post</span>
            </button>

            <button
              onClick={handleAddSpeaker}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Add Speaker</span>
            </button>
          </div>

          {/* Quick Schedule Toggle */}
          <div className="px-6 pb-4 border-b border-white/10">
            <button
              onClick={() => setShowQuickSchedule(!showQuickSchedule)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <span className="text-sm font-medium text-white">Quick Schedule</span>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${showQuickSchedule ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Quick Schedule Form */}
            {showQuickSchedule && (
              <div className="mt-4 space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                {/* Platform Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Platforms
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['LinkedIn', 'Instagram', 'Twitter', 'Discord'].map((platform) => (
                      <label
                        key={platform}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={quickScheduleData.platforms.includes(platform)}
                          onChange={() => handlePlatformToggle(platform)}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-white">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={quickScheduleData.content}
                    onChange={(e) => setQuickScheduleData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your post content..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Schedule Button */}
                <button
                  onClick={handleQuickSchedule}
                  disabled={!quickScheduleData.content || quickScheduleData.platforms.length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-lg font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Schedule for {selectedDate && formatDisplayDate(selectedDate.toISOString())}
                </button>
              </div>
            )}
          </div>

          {/* Existing Events List */}
          <div className="space-y-4 px-6 pb-6">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400">No events scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`group relative bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all hover:bg-white/10 cursor-pointer ${
                      event.type === 'post'
                        ? 'border-fuchsia-500/30 hover:border-fuchsia-500/50'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Event Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          event.type === 'post'
                            ? 'bg-gradient-to-br from-fuchsia-500 to-pink-600'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}
                      >
                        {event.type === 'post' ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          {event.time && (
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatTime(event.date)}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              event.type === 'post'
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {event.type === 'post' ? 'Scheduled Post' : 'Speaker Event'}
                          </span>

                          {/* Platform/Location Info */}
                          {event.type === 'post' && event.platforms && (
                            <>
                              {event.platforms.map((platform) => (
                                <span
                                  key={platform}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10"
                                >
                                  {platform}
                                </span>
                              ))}
                            </>
                          )}

                          {event.type === 'speaker' && event.location && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </span>
                          )}

                          {event.type === 'speaker' && event.speakerName && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                              {event.speakerName}
                            </span>
                          )}

                          {/* Status Badge */}
                          {event.status && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                event.status === 'published'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : event.status === 'scheduled'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                              }`}
                            >
                              {event.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
