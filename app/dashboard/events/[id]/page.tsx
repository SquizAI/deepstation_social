import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EventManagementClient } from './event-management-client'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EventManagementPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!event) {
    notFound()
  }

  // Fetch registrations
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false })

  return <EventManagementClient event={event} registrations={registrations || []} />
}
