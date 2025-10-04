'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { Speaker, EventLocation } from '@/lib/types/speakers'

export default function SpeakersPage() {
  const router = useRouter()
  const [speakers, setSpeakers] = React.useState<Speaker[]>([])
  const [filteredSpeakers, setFilteredSpeakers] = React.useState<Speaker[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [locationFilter, setLocationFilter] = React.useState<EventLocation | 'all'>('all')

  React.useEffect(() => {
    loadSpeakers()
  }, [])

  React.useEffect(() => {
    filterSpeakers()
  }, [speakers, searchQuery, locationFilter])

  const loadSpeakers = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in')
      }

      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })

      if (error) throw error

      setSpeakers(data || [])
      setIsLoading(false)
    } catch (err) {
      console.error('Error loading speakers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load speakers')
      setIsLoading(false)
    }
  }

  const filterSpeakers = () => {
    let filtered = speakers

    // Filter by location
    if (locationFilter !== 'all') {
      filtered = filtered.filter((speaker) => speaker.event_location === locationFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (speaker) =>
          speaker.full_name.toLowerCase().includes(query) ||
          speaker.company.toLowerCase().includes(query) ||
          speaker.title.toLowerCase().includes(query) ||
          speaker.presentation_title.toLowerCase().includes(query)
      )
    }

    setFilteredSpeakers(filtered)
  }

  const handleDeleteSpeaker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('speakers').delete().eq('id', id)

      if (error) throw error

      setSpeakers(speakers.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Error deleting speaker:', err)
      alert('Failed to delete speaker')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading speakers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Speakers</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage speakers and generate announcements</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/speakers/new')}
            className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg shadow-fuchsia-500/25"
          >
            Add New Speaker
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
              />
            </div>
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as EventLocation | 'all')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
              >
                <option value="all" className="bg-[#201033]">All Locations</option>
                <option value="Miami" className="bg-[#201033]">Miami</option>
                <option value="Brazil" className="bg-[#201033]">Brazil</option>
                <option value="Virtual" className="bg-[#201033]">Virtual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Speaker List */}
        {filteredSpeakers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <p className="text-slate-400 text-lg mb-4">
              {searchQuery || locationFilter !== 'all'
                ? 'No speakers found matching your filters'
                : 'No speakers yet'}
            </p>
            {!searchQuery && locationFilter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/speakers/new')}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg"
              >
                Add Your First Speaker
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSpeakers.map((speaker) => (
              <div key={speaker.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-white/20 hover:shadow-[0_0_30px_rgba(217,70,239,0.2)] transition-all">
                {/* Speaker Photo */}
                {speaker.profile_photo_url ? (
                  <img
                    src={speaker.profile_photo_url}
                    alt={speaker.full_name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">
                      {speaker.full_name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Speaker Info */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-white line-clamp-1">
                        {speaker.full_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">
                        {speaker.title} at {speaker.company}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-medium text-slate-300 line-clamp-2">
                      {speaker.presentation_title}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30">
                      {speaker.presentation_type}
                    </span>
                    {speaker.expertise.slice(0, 2).map((exp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                        {exp}
                      </span>
                    ))}
                    {speaker.expertise.length > 2 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                        +{speaker.expertise.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      {formatDate(speaker.event_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      {speaker.event_location}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/speakers/preview/${speaker.id}`)}
                      className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/speakers/preview/${speaker.id}`)}
                      className="bg-white/5 border border-white/10 text-slate-300 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      Announce
                    </button>
                    <button
                      onClick={() => handleDeleteSpeaker(speaker.id)}
                      className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{speakers.length}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Total Speakers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {speakers.filter((s) => s.event_location === 'Miami').length}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Miami</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {speakers.filter((s) => s.event_location === 'Brazil').length}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Brazil</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {speakers.filter((s) => s.event_location === 'Virtual').length}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Virtual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
