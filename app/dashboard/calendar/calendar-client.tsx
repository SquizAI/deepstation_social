'use client'

import React, { useState, useMemo } from 'react'
import { EventCalendar } from '@/components/calendar/event-calendar'
import { filterEventsByType, getUpcomingEvents, type CalendarEvent } from '@/lib/calendar/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CalendarClientProps {
  events: CalendarEvent[]
  stats: {
    totalUpcoming: number
    upcomingPosts: number
    upcomingSpeakers: number
    totalEvents: number
  }
}

export function CalendarClient({ events, stats }: CalendarClientProps) {
  const router = useRouter()
  const [filterType, setFilterType] = useState<'all' | 'post' | 'speaker'>('all')

  const filteredEvents = useMemo(
    () => filterEventsByType(events, filterType),
    [events, filterType]
  )

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(filteredEvents, 5),
    [filteredEvents]
  )

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'post') {
      router.push(`/dashboard/posts/${event.id}`)
    } else {
      router.push(`/dashboard/speakers/preview/${event.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative space-y-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
              Event Calendar
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Manage your scheduled posts and speaker events
            </p>
          </div>

          {/* Add Event Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/posts/new">
              <button className="group relative overflow-hidden bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </button>
            </Link>
            <Link href="/dashboard/speakers/new">
              <button className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                New Speaker
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Upcoming */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Upcoming</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalUpcoming}</div>
              <p className="text-sm text-slate-400">Total upcoming events</p>
            </div>
          </div>

          {/* Scheduled Posts */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Posts</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.upcomingPosts}</div>
              <p className="text-sm text-slate-400">Scheduled posts</p>
            </div>
          </div>

          {/* Speaker Events */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Speakers</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.upcomingSpeakers}</div>
              <p className="text-sm text-slate-400">Speaker events</p>
            </div>
          </div>

          {/* Total Events */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalEvents}</div>
              <p className="text-sm text-slate-400">All events</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Filter Events</h2>
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterType('post')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterType === 'post'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Posts Only
              </button>
              <button
                onClick={() => setFilterType('speaker')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filterType === 'speaker'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Speakers Only
              </button>
            </div>
          </div>
        </div>

        {/* Main Calendar */}
        <EventCalendar
          events={filteredEvents}
          onEventClick={handleEventClick}
        />

        {/* Upcoming Events List */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
              <p className="text-sm text-slate-400 mt-1">Next 5 scheduled events</p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`group cursor-pointer bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all hover:bg-white/10 ${
                    event.type === 'post'
                      ? 'border-fuchsia-500/30 hover:border-fuchsia-500/50'
                      : 'border-purple-500/30 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 bg-white/5 rounded-lg p-3 text-center border border-white/10">
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {new Date(event.date).getDate()}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            event.type === 'post'
                              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {event.type === 'post' ? 'Post' : 'Speaker'}
                        </span>
                        {event.location && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                            {event.location}
                          </span>
                        )}
                        {event.time && (
                          <span className="text-xs text-slate-500">
                            {new Date(event.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
