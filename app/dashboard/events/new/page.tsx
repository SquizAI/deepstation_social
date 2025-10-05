'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types/event'
import { Label } from '@/components/ui/label'

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user's organizations
      const { data: memberships, error: orgsError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            slug,
            stripe_onboarding_completed
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (orgsError) throw orgsError

      const userOrgs = memberships?.map(m => m.organizations).filter(Boolean) || []
      setOrganizations(userOrgs)

      // Auto-select first organization
      if (userOrgs.length > 0) {
        setSelectedOrg(userOrgs[0].id)
      }
    } catch (err: any) {
      console.error('Error loading organizations:', err)
      setError(err.message || 'Failed to load organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (data: Partial<Event>) => {
    if (!selectedOrg) {
      setError('Please select an organization')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create an event')
      }

      // Insert event with organization_id
      const { data: event, error: insertError } = await supabase
        .from('events')
        .insert({
          ...data,
          organization_id: selectedOrg,
          user_id: user.id,
          current_attendees: 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to event management page
      router.push(`/dashboard/events/${event.slug || event.id}`)
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingOrgs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-fuchsia-400 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
        <div className="max-w-2xl mx-auto pt-20 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
            <svg className="h-16 w-16 mx-auto text-fuchsia-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">No Organizations Found</h2>
            <p className="text-gray-400 mb-6">
              You need to create an organization before you can create events.
            </p>
            <button
              onClick={() => router.push('/dashboard/organization/new')}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-fuchsia-500/50 transition-all"
            >
              Create Organization
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
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
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-slate-400">
            Fill in the details below to create your event. You can save as draft and publish
            later.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Organization Selector */}
        <div className="mb-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <Label htmlFor="organization" className="text-white mb-2 block">
            Select Organization *
          </Label>
          <select
            id="organization"
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20"
            required
          >
            {organizations.map((org: any) => (
              <option key={org.id} value={org.id}>
                {org.name} {!org.stripe_onboarding_completed && '(Payments not set up)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">
            The organization that will host this event and receive payments
          </p>
        </div>

        {/* Form - voice assistant will populate fields automatically */}
        <EventForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
