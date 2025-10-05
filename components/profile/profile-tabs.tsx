'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

interface ProfileTabsProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    id: string
    full_name?: string
    bio?: string
  } | null
  registrations: Array<{
    id: string
    status: string
    created_at: string
    events: {
      id: string
      title: string
      description: string
      slug: string
      event_date: string
      event_time?: string
      image_url?: string
      location?: string
      max_attendees?: number
      attendee_count?: number
    } | null
  }>
}

type TabType = 'events' | 'settings'

export function ProfileTabs({ user, profile, registrations }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('events')
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  const filterEvents = () => {
    const now = new Date()

    return registrations.filter((reg) => {
      if (!reg.events) return false
      if (reg.status !== 'registered') return false

      const eventDate = new Date(reg.events.event_date)

      if (eventFilter === 'upcoming') {
        return eventDate >= now
      } else if (eventFilter === 'past') {
        return eventDate < now
      }
      return true
    })
  }

  const filteredRegistrations = filterEvents()

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-fuchsia-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            My Events
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-fuchsia-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Event Filters */}
          <div className="flex gap-3">
            <button
              onClick={() => setEventFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                eventFilter === 'all'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setEventFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                eventFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setEventFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                eventFilter === 'past'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Past Events
            </button>
          </div>

          {/* Events List */}
          {filteredRegistrations.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-slate-400 mb-6">
                {eventFilter === 'all' && "You haven't registered for any events yet."}
                {eventFilter === 'upcoming' && "You don't have any upcoming events."}
                {eventFilter === 'past' && "You haven't attended any past events."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30"
              >
                Browse Events
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredRegistrations.map((registration) => {
                if (!registration.events) return null
                const event = registration.events
                const eventDate = new Date(event.event_date)
                const isPast = eventDate < new Date()

                return (
                  <div
                    key={registration.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-fuchsia-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Event Image */}
                      <div className="md:w-48 h-48 md:h-auto relative">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center">
                            <svg className="w-12 h-12 text-fuchsia-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isPast
                              ? 'bg-gray-500/80 text-white'
                              : 'bg-green-500/80 text-white'
                          }`}>
                            {isPast ? 'Attended' : 'Registered'}
                          </span>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2">
                              {event.title}
                            </h3>
                            <p className="text-slate-400 line-clamp-2">
                              {event.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {format(eventDate, 'MMMM dd, yyyy')}
                              {event.event_time && ` at ${event.event_time}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{event.location}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              Registered {format(new Date(registration.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link
                            href={`/events/${event.slug}`}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30"
                          >
                            View Event
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Email Preferences */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Email Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Event Reminders</p>
                  <p className="text-sm text-slate-400">Get reminded about upcoming events</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Event Updates</p>
                  <p className="text-sm text-slate-400">Receive updates about events you're registered for</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">New Events</p>
                  <p className="text-sm text-slate-400">Be notified when new events are announced</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Show Profile</p>
                  <p className="text-sm text-slate-400">Make your profile visible to other attendees</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Public Event History</p>
                  <p className="text-sm text-slate-400">Show events you've attended on your profile</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500" />
              </label>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Account</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all">
                Change Password
              </button>
              <button className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all">
                Export My Data
              </button>
              <button className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
