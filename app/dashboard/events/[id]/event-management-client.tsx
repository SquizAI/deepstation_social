'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Event, EventRegistration } from '@/lib/types/event'
import { createClient } from '@/lib/supabase/client'

interface EventManagementClientProps {
  event: Event
  registrations: EventRegistration[]
}

export function EventManagementClient({
  event: initialEvent,
  registrations: initialRegistrations,
}: EventManagementClientProps) {
  const [event, setEvent] = useState(initialEvent)
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'broadcast' | 'analytics'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Broadcast state
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastSubject, setBroadcastSubject] = useState('')

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalRegistrations: registrations.length,
    checkedIn: registrations.filter((r) => r.check_in_status === 'checked_in').length,
    revenue: registrations
      .filter((r) => r.payment_status === 'completed')
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0),
    conversionRate: event.max_capacity
      ? ((registrations.length / event.max_capacity) * 100).toFixed(1)
      : '100',
  }

  const channels = [
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-purple-600 via-pink-600 to-orange-600' },
    { id: 'x', name: 'X (Twitter)', icon: '🐦', color: 'from-slate-700 to-slate-900' },
    { id: 'discord', name: 'Discord', icon: '💬', color: 'from-indigo-600 to-indigo-700' },
    { id: 'email', name: 'Email', icon: '✉️', color: 'from-emerald-600 to-emerald-700' },
  ]

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleCheckIn = async (registrationId: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('event_registrations')
      .update({
        check_in_status: 'checked_in',
        check_in_time: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (!error) {
      setRegistrations(
        registrations.map((r) =>
          r.id === registrationId
            ? { ...r, check_in_status: 'checked_in', check_in_time: new Date().toISOString() }
            : r
        )
      )
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Registration Date', 'Ticket Type', 'Payment Status', 'Check-in Status']
    const rows = registrations.map((r) => [
      r.full_name,
      r.email,
      new Date(r.created_at).toLocaleDateString(),
      r.ticket_type_id || 'Free',
      r.payment_status || 'N/A',
      r.check_in_status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.slug}-attendees.csv`
    link.click()
  }

  const handleBroadcast = async () => {
    // TODO: Implement multi-channel broadcasting
    console.log('Broadcasting to channels:', selectedChannels)
    console.log('Message:', broadcastMessage)
    console.log('Subject:', broadcastSubject)
  }

  const copyEventLink = () => {
    const url = `${window.location.origin}/events/${event.slug}`
    navigator.clipboard.writeText(url)
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
        <div className="mb-12">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-fuchsia-400 mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-3">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'published'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyEventLink}
                className="px-5 py-2.5 bg-purple-950/30 backdrop-blur-sm text-white rounded-xl border border-purple-900/30 hover:bg-purple-950/50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Copy Link
              </button>
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                className="px-5 py-2.5 bg-purple-950/30 backdrop-blur-sm text-white rounded-xl border border-purple-900/30 hover:bg-purple-950/50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                View Public
              </Link>
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-semibold hover:from-fuchsia-500 hover:to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit Event
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Registrations */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-900/50">
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

          {/* Checked In */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Checked In</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.checkedIn}</div>
              <p className="text-sm text-slate-400">Attendees present</p>
            </div>
          </div>

          {/* Revenue */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Revenue</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${stats.revenue.toLocaleString()}</div>
              <p className="text-sm text-slate-400">Ticket sales</p>
            </div>
          </div>

          {/* Capacity */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 p-6 rounded-2xl hover:border-purple-700/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Capacity</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.conversionRate}%</div>
              <p className="text-sm text-slate-400">Venue filled</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden">
          <div className="flex border-b border-purple-900/30 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              { id: 'attendees', label: 'Attendees', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'broadcast', label: 'Broadcast', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
              { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'text-white bg-purple-950/40 border-b-2 border-fuchsia-500'
                    : 'text-slate-400 hover:text-white hover:bg-purple-950/20'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Event Details</h3>
                    <div className="space-y-4">
                      <div className="bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                        <p className="text-sm text-slate-400 mb-1">Location</p>
                        <p className="text-lg text-white font-medium capitalize">{event.location_type}</p>
                        {event.location_city && <p className="text-sm text-slate-300 mt-1">{event.location_city}</p>}
                      </div>

                      <div className="bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                        <p className="text-sm text-slate-400 mb-1">Date & Time</p>
                        <p className="text-lg text-white font-medium">
                          {new Date(event.event_date).toLocaleString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">{event.timezone}</p>
                      </div>

                      <div className="bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                        <p className="text-sm text-slate-400 mb-1">Capacity</p>
                        <p className="text-lg text-white font-medium">
                          {event.max_capacity ? `${stats.totalRegistrations} / ${event.max_capacity} registered` : 'Unlimited'}
                        </p>
                      </div>

                      {event.luma_url && (
                        <div className="bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                          <p className="text-sm text-slate-400 mb-1">Luma Event</p>
                          <a
                            href={event.luma_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg text-fuchsia-400 hover:text-fuchsia-300 font-medium flex items-center gap-2"
                          >
                            View on Luma
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Description</h3>
                    <div className="bg-purple-950/20 rounded-xl p-6 border border-purple-900/30">
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {event.description || 'No description provided.'}
                      </p>
                    </div>

                    {event.short_description && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Short Description</h4>
                        <div className="bg-purple-950/20 rounded-xl p-4 border border-purple-900/30">
                          <p className="text-slate-300">{event.short_description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attendees Tab */}
            {activeTab === 'attendees' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search attendees by name or email..."
                        className="w-full px-4 py-3 pl-12 bg-purple-950/30 border border-purple-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all"
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={exportToCSV}
                    className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-semibold hover:from-fuchsia-500 hover:to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export CSV
                  </button>
                </div>

                {filteredRegistrations.length === 0 ? (
                  <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-purple-950/40 rounded-2xl flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No attendees {searchQuery && 'found'}</h3>
                    <p className="text-lg text-slate-400">
                      {searchQuery ? 'Try adjusting your search terms' : 'Registrations will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-purple-900/30">
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Name</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Email</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Registered</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Status</th>
                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegistrations.map((registration, index) => (
                            <tr
                              key={registration.id}
                              className={`border-b border-purple-900/20 hover:bg-purple-950/30 transition-colors ${
                                index % 2 === 0 ? 'bg-purple-950/10' : ''
                              }`}
                            >
                              <td className="py-4 px-6 text-white font-medium">{registration.full_name}</td>
                              <td className="py-4 px-6 text-slate-400">{registration.email}</td>
                              <td className="py-4 px-6 text-slate-400">
                                {new Date(registration.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                    registration.check_in_status === 'checked_in'
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {registration.check_in_status === 'checked_in' ? 'Checked In' : 'Registered'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                {registration.check_in_status !== 'checked_in' && (
                                  <button
                                    onClick={() => handleCheckIn(registration.id)}
                                    className="text-sm font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                                  >
                                    Check In
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Broadcast Tab */}
            {activeTab === 'broadcast' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Multi-Channel Broadcast</h3>
                  <p className="text-lg text-slate-400">
                    Promote your event or communicate with attendees across all channels from one place
                  </p>
                </div>

                {/* Channel Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-4">Select Channels</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => toggleChannel(channel.id)}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          selectedChannels.includes(channel.id)
                            ? 'bg-purple-950/40 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20'
                            : 'bg-purple-950/20 border-purple-900/30 hover:border-purple-700/50'
                        }`}
                      >
                        {selectedChannels.includes(channel.id) && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}
                        <div className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-br ${channel.color} rounded-xl flex items-center justify-center text-3xl shadow-lg`}>
                          {channel.icon}
                        </div>
                        <p className="text-white font-semibold text-sm text-center">{channel.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Subject / Title</label>
                    <input
                      type="text"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      placeholder="Enter your message subject..."
                      className="w-full px-4 py-3 bg-purple-950/30 border border-purple-900/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Message</label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={10}
                      placeholder="Craft your message... This will be adapted for each platform automatically."
                      className="w-full px-4 py-3 bg-purple-950/30 border border-purple-900/30 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Your message will be automatically optimized for each selected platform
                    </p>
                  </div>
                </div>

                {/* Send Button */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => {
                      setBroadcastMessage('')
                      setBroadcastSubject('')
                      setSelectedChannels([])
                    }}
                    className="px-6 py-3 bg-purple-950/30 backdrop-blur-sm text-white rounded-xl border border-purple-900/30 hover:bg-purple-950/50 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBroadcast}
                    disabled={selectedChannels.length === 0 || !broadcastMessage}
                    className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-fuchsia-500 hover:to-purple-600 hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                    </svg>
                    Broadcast to {selectedChannels.length} {selectedChannels.length === 1 ? 'Channel' : 'Channels'}
                  </button>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Event Analytics</h3>
                  <p className="text-lg text-slate-400">Track performance and engagement metrics</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Registration Timeline</h4>
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Chart visualization will appear here
                    </div>
                  </div>

                  <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Traffic Sources</h4>
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Chart visualization will appear here
                    </div>
                  </div>
                </div>

                {event.ticket_types && event.ticket_types.length > 0 && (
                  <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Ticket Sales Breakdown</h4>
                    <div className="space-y-3">
                      {event.ticket_types.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-4 bg-purple-950/30 rounded-xl border border-purple-900/30"
                        >
                          <div>
                            <p className="font-semibold text-white">{ticket.name}</p>
                            <p className="text-sm text-slate-400">
                              {ticket.currency} {ticket.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{ticket.quantity_sold}</p>
                            <p className="text-sm text-slate-400">
                              {ticket.currency} {(ticket.price * ticket.quantity_sold).toLocaleString()} revenue
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
