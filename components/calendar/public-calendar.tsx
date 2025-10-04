'use client'

import React, { useState, useMemo } from 'react'
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  isToday,
  getEventsForDate,
  formatDateToYMD,
  formatTime,
  formatDisplayDate,
  type CalendarEvent
} from '@/lib/calendar/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PublicCalendarProps {
  events: CalendarEvent[]
  initialMonth?: number
  initialYear?: number
  compact?: boolean
}

export function PublicCalendar({
  events,
  initialMonth,
  initialYear,
  compact = false
}: PublicCalendarProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? now.getMonth())
  const [currentYear, setCurrentYear] = useState(initialYear ?? now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  const handleDateClick = (date: Date) => {
    const dateEvents = getEventsForDate(date, events)
    if (dateEvents.length > 0) {
      setSelectedDate(date)
    }
  }

  const handleCloseModal = () => {
    setSelectedDate(null)
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl ${compact ? 'p-4' : 'p-6'} mb-6`}>
        <div className="flex items-center justify-between">
          {/* Month/Year Display */}
          <h2 className={`font-bold text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
            {getMonthName(currentMonth)} {currentYear}
          </h2>

          {/* Navigation */}
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

      {/* Calendar Grid */}
      <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {getDayNames().map((day) => (
            <div
              key={day}
              className={`text-center font-semibold text-slate-400 uppercase tracking-wider ${compact ? 'text-xs py-1' : 'text-sm py-2'}`}
            >
              {compact ? day.substring(0, 1) : day}
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
                const dayEvents = getEventsForDate(date, events)
                const hasEvents = dayEvents.length > 0

                return (
                  <button
                    key={dayIndex}
                    onClick={() => handleDateClick(date)}
                    disabled={!hasEvents}
                    className={`group relative aspect-square ${compact ? 'p-1' : 'p-2'} rounded-lg border transition-all ${
                      today
                        ? 'border-purple-500 bg-purple-500/10'
                        : hasEvents
                        ? 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                        : 'border-white/5 bg-white/[0.02] cursor-default'
                    }`}
                  >
                    {/* Date Number */}
                    <div
                      className={`${compact ? 'text-xs' : 'text-sm'} font-semibold mb-1 ${
                        today ? 'text-purple-300' : hasEvents ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Event Indicator */}
                    {hasEvents && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                    )}

                    {/* Hover Effect */}
                    {hasEvents && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-fuchsia-500/0 group-hover:from-purple-500/10 group-hover:to-fuchsia-500/10 rounded-lg transition-all pointer-events-none" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        {!compact && (
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-slate-400">Speaker Events</span>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Dialog open={selectedDate !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 text-white max-w-2xl">
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

          <div className="space-y-4 p-6 pt-0">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No events on this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Event Icon */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-xl font-bold text-white">{event.title}</h3>
                          {event.time && (
                            <span className="text-sm text-slate-400 flex-shrink-0">
                              {formatTime(event.date)}
                            </span>
                          )}
                        </div>

                        {event.speakerName && (
                          <div className="mb-3">
                            <span className="text-sm text-slate-400">Speaker: </span>
                            <span className="text-sm text-white font-medium">{event.speakerName}</span>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-slate-300 mb-4 leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
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
