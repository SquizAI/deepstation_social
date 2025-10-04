import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyEventsClient } from './my-events-client'

export default async function MyEventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's event registrations with event details
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select(
      `
      *,
      event:events(*)
    `
    )
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .order('created_at', { ascending: false })

  return <MyEventsClient registrations={registrations || []} />
}
