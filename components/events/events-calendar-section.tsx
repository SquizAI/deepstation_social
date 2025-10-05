import { createClient } from '@/lib/supabase/server'
import { SimpleEventCard } from './simple-event-card'
import Link from 'next/link'

export async function EventsCalendarSection() {
  try {
    const supabase = await createClient()

    // Fetch upcoming public events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .limit(6)

    // Don't show section if no events or error
    if (error || !events || events.length === 0) {
      return null
    }

  return (
    <section className="relative py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-6">
            Upcoming Events & Workshops
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Join our vibrant community at exclusive events, workshops, and networking sessions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => (
            <SimpleEventCard key={event.id} event={event} />
          ))}
        </div>

        {/* View All Events Button */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold border-2 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            View All Events
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
  } catch (error) {
    console.error('Error loading events calendar section:', error)
    return null
  }
}
