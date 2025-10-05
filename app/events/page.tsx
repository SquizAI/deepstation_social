import { createClient } from '@/lib/supabase/server'
import { SimpleEventCard } from '@/components/events/simple-event-card'
import Link from 'next/link'

export default async function EventsPage() {
  const supabase = await createClient()

  // Fetch all upcoming public events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .eq('is_published', true)
    .order('event_date', { ascending: true })

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
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
              Upcoming Events & Workshops
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Join our vibrant community at exclusive events, workshops, and networking sessions
            </p>
          </div>

          {/* Events Grid */}
          {error || !events || events.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-16 text-center">
              <svg className="w-24 h-24 mx-auto text-slate-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-3">No Upcoming Events</h3>
              <p className="text-slate-400 mb-8">
                Check back soon for exciting new events and workshops!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30"
              >
                Back to Home
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <SimpleEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
