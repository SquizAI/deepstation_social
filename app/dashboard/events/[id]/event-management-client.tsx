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
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'checkin' | 'analytics'>(
    'overview'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)

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
      : 'N/A',
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

  const sendEmailToAttendees = async () => {
    // TODO: Implement email sending (e.g., via Resend or SendGrid)
    console.log('Sending email to attendees:', emailMessage)
    setShowEmailModal(false)
    setEmailMessage('')
  }

  const copyEventLink = () => {
    const url = `${window.location.origin}/events/${event.slug}`
    navigator.clipboard.writeText(url)
    // Show toast notification
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Events
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="capitalize">{event.status}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyEventLink}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                Copy Link
              </button>
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                View Public Page
              </Link>
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Edit Event
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <p className="text-sm text-slate-400 mb-1">Total Registrations</p>
            <p className="text-3xl font-bold text-white">{stats.totalRegistrations}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <p className="text-sm text-slate-400 mb-1">Checked In</p>
            <p className="text-3xl font-bold text-white">{stats.checkedIn}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <p className="text-sm text-slate-400 mb-1">Revenue</p>
            <p className="text-3xl font-bold text-white">
              {event.ticket_types?.[0]?.currency || 'USD'} {stats.revenue}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <p className="text-sm text-slate-400 mb-1">Capacity</p>
            <p className="text-3xl font-bold text-white">{stats.conversionRate}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 mb-6">
          <div className="flex border-b border-white/10">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'attendees', label: 'Attendees' },
              { id: 'checkin', label: 'Check-in' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-fuchsia-500'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Event Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Location</p>
                      <p className="text-white capitalize">{event.location_type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Timezone</p>
                      <p className="text-white">{event.timezone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Max Capacity</p>
                      <p className="text-white">{event.max_capacity || 'Unlimited'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status</p>
                      <p className="text-white capitalize">{event.status}</p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Attendees Tab */}
            {activeTab === 'attendees' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search attendees..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                    >
                      Email All
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg hover:bg-fuchsia-500/30 transition-all"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {filteredRegistrations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No attendees found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Registered
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map((registration) => (
                          <tr key={registration.id} className="border-b border-white/5">
                            <td className="py-3 px-4 text-white">{registration.full_name}</td>
                            <td className="py-3 px-4 text-slate-400">{registration.email}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(registration.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  registration.check_in_status === 'checked_in'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-yellow-500/20 text-yellow-300'
                                }`}
                              >
                                {registration.check_in_status === 'checked_in'
                                  ? 'Checked In'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {registration.check_in_status !== 'checked_in' && (
                                <button
                                  onClick={() => handleCheckIn(registration.id)}
                                  className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
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
                )}
              </div>
            )}

            {/* Check-in Tab */}
            {activeTab === 'checkin' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-white/5 rounded-xl mb-4">
                    <svg
                      className="w-16 h-16 text-fuchsia-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">QR Code Check-in</h3>
                  <p className="text-slate-400 mb-6">
                    QR code scanner for quick attendee check-in will be available here
                  </p>
                  <p className="text-sm text-slate-500">
                    {stats.checkedIn} / {stats.totalRegistrations} attendees checked in
                  </p>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Registration Timeline
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 h-64 flex items-center justify-center">
                      <p className="text-slate-400">Chart will be rendered here</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Traffic Sources</h3>
                    <div className="bg-white/5 rounded-lg p-4 h-64 flex items-center justify-center">
                      <p className="text-slate-400">Chart will be rendered here</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Ticket Sales</h3>
                  {event.ticket_types && event.ticket_types.length > 0 ? (
                    <div className="space-y-2">
                      {event.ticket_types.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-white">{ticket.name}</p>
                            <p className="text-sm text-slate-400">
                              {ticket.currency} {ticket.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{ticket.quantity_sold} sold</p>
                            <p className="text-sm text-slate-400">
                              {ticket.currency} {ticket.price * ticket.quantity_sold} revenue
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">No ticket data available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="relative bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] rounded-2xl border border-white/10 max-w-2xl w-full p-8">
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Email All Attendees</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Recipients
                  </label>
                  <p className="text-sm text-slate-400">
                    {registrations.length} attendees will receive this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    placeholder="Enter your message..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmailToAttendees}
                    className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg hover:shadow-lg"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
