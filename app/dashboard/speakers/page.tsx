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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading speakers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Speakers</h1>
          <p className="text-gray-600 mt-1">Manage speakers and generate announcements</p>
        </div>
        <Button onClick={() => router.push('/dashboard/speakers/new')} size="lg">
          Add New Speaker
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Search speakers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value as EventLocation | 'all')}
            >
              <option value="all">All Locations</option>
              <option value="Miami">Miami</option>
              <option value="Brazil">Brazil</option>
              <option value="Virtual">Virtual</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Speaker List */}
      {filteredSpeakers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery || locationFilter !== 'all'
                ? 'No speakers found matching your filters'
                : 'No speakers yet'}
            </p>
            {!searchQuery && locationFilter === 'all' && (
              <Button onClick={() => router.push('/dashboard/speakers/new')}>
                Add Your First Speaker
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeakers.map((speaker) => (
            <Card key={speaker.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Speaker Photo */}
              {speaker.profile_photo_url ? (
                <img
                  src={speaker.profile_photo_url}
                  alt={speaker.full_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">
                    {speaker.full_name.charAt(0)}
                  </span>
                </div>
              )}

              {/* Speaker Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                      {speaker.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {speaker.title} at {speaker.company}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {speaker.presentation_title}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="info" className="text-xs">
                    {speaker.presentation_type}
                  </Badge>
                  {speaker.expertise.slice(0, 2).map((exp, idx) => (
                    <Badge key={idx} variant="default" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                  {speaker.expertise.length > 2 && (
                    <Badge variant="default" className="text-xs">
                      +{speaker.expertise.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
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
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/speakers/preview/${speaker.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/dashboard/speakers/preview/${speaker.id}`)}
                  >
                    Announce
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDeleteSpeaker(speaker.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <Card className="p-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{speakers.length}</p>
            <p className="text-sm text-gray-600">Total Speakers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {speakers.filter((s) => s.event_location === 'Miami').length}
            </p>
            <p className="text-sm text-gray-600">Miami</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {speakers.filter((s) => s.event_location === 'Brazil').length}
            </p>
            <p className="text-sm text-gray-600">Brazil</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {speakers.filter((s) => s.event_location === 'Virtual').length}
            </p>
            <p className="text-sm text-gray-600">Virtual</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
