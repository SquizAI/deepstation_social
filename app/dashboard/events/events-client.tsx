'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EventCard } from '@/components/events/event-card'
import type { Event } from '@/lib/types/event'

interface EventsClientProps {
  events: Event[]
}

export function EventsClient({ events: initialEvents }: EventsClientProps) {
  const [events] = useState(initialEvents)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filterEvents = () => {
    let filtered = events

    // Apply status filter
    if (filter === 'upcoming') {
      const now = new Date()
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.event_date)
        return eventDate >= now && event.status === 'published'
      })
    } else if (filter === 'past') {
      const now = new Date()
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.event_date)
        return eventDate < now
      })
    } else if (filter === 'draft') {
      filtered = filtered.filter((event) => event.status === 'draft')
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredEvents = filterEvents()

  // Calculate stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => {
      const eventDate = new Date(e.event_date)
      return eventDate >= new Date() && e.status === 'published'
    }).length,
    draft: events.filter((e) => e.status === 'draft').length,
    totalRegistrations: events.reduce((sum, e) => sum + e.current_attendees, 0),
  }

  return (
    <div className="min-h-screen bg-[#0a0513]">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0a0513] via-[#15092b] to-[#0a0513] opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-fuchsia-600/8 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-3">
              Event Management
            </h1>
            <p className="text-xl text-slate-400">
              Orchestrate events across all channels from one platform
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="mt-6 md:mt-0 group relative overflow-hidden bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:from-fuchsia-500 hover:to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Events */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">All Events</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
              <p className="text-sm text-slate-400">Total events created</p>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Upcoming</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.upcoming}</div>
              <p className="text-sm text-slate-400">Scheduled events</p>
            </div>
          </div>

          {/* Draft Events */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Drafts</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.draft}</div>
              <p className="text-sm text-slate-400">Unpublished events</p>
            </div>
          </div>

          {/* Total Registrations */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Attendees</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalRegistrations}</div>
              <p className="text-sm text-slate-400">Total registrations</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Filter Events</h2>
            <div className="flex bg-purple-950/30 rounded-lg p-1 border border-purple-900/30">
              {['all', 'upcoming', 'past', 'draft'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title..."
                className="w-full px-4 py-3 pl-12 bg-purple-950/30 border border-purple-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-16 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/10 to-purple-600/10 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-20 h-20 mx-auto mb-6 bg-purple-950/40 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchQuery ? 'No events match your search' : 'No events yet'}
            </h3>
            <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                : 'Get started by creating your first event and begin orchestrating across all channels'}
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/events/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-semibold transition-all hover:from-fuchsia-500 hover:to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Create Your First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} isManagement={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
