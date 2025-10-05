import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { EventRegistrationButton } from '@/components/events/event-registration-button'
import Link from 'next/link'

export default async function SimpleEventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Get event details - try both is_published and status='published'
  let event
  let error

  // First try with is_published
  const result1 = await supabase
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (result1.data) {
    event = result1.data
  } else {
    // Try with status='published'
    const result2 = await supabase
      .from('events')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    event = result2.data
    error = result2.error
  }

  if (error || !event) {
    notFound()
  }

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is already registered (if logged in)
  let isRegistered = false
  if (user) {
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .eq('status', 'registered')
      .single()

    isRegistered = !!registration
  }

  const eventDate = new Date(event.event_date)
  const formattedDate = format(eventDate, 'MMMM dd, yyyy')
  const dayOfMonth = format(eventDate, 'd')
  const month = format(eventDate, 'MMM')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#201033]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/50">
                  <span className="text-3xl drop-shadow-lg">⚡</span>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                DeepStation
              </span>
            </Link>
            <Link href="/events" className="text-slate-300 hover:text-white transition-colors">
              Back to Events
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          {/* Hero Image */}
          <div className="relative mb-12 rounded-3xl overflow-hidden">
            {event.image_url || event.cover_image_url ? (
              <img
                src={event.image_url || event.cover_image_url}
                alt={event.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center">
                <svg className="w-32 h-32 text-fuchsia-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            )}

            {/* Date Badge */}
            <div className="absolute top-8 left-8 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl p-4 text-center shadow-2xl shadow-fuchsia-500/50">
              <div className="text-4xl font-bold text-white">{dayOfMonth}</div>
              <div className="text-sm font-medium text-white/90 uppercase">{month}</div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                  {event.title}
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed">
                  {event.description || event.short_description}
                </p>
              </div>

              {event.long_description && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
                  <div className="text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                    {event.long_description}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6 sticky top-24">
                {/* Event Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-fuchsia-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-slate-400">Date & Time</p>
                      <p className="text-white font-medium">{formattedDate}</p>
                      {event.event_time && <p className="text-white">{event.event_time}</p>}
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-fuchsia-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-slate-400">Location</p>
                        <p className="text-white">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {(event.max_attendees || event.max_capacity) && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-fuchsia-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <div>
                        <p className="text-sm text-slate-400">Attendees</p>
                        <p className="text-white font-medium">
                          {event.attendee_count || event.current_attendees || 0} / {event.max_attendees || event.max_capacity} registered
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Button */}
                <EventRegistrationButton
                  eventId={event.id}
                  eventSlug={event.slug}
                  isRegistered={isRegistered}
                  isLoggedIn={!!user}
                  isFull={(event.max_attendees || event.max_capacity) ? ((event.attendee_count || event.current_attendees || 0) >= (event.max_attendees || event.max_capacity)) : false}
                />

                {isRegistered && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-green-400 font-medium text-sm">You're Registered!</p>
                      <p className="text-green-300/80 text-xs">Check your email for details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
