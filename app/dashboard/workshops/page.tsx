import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkshopsClient } from './workshops-client'

export default async function WorkshopsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch workshops
  const { data: workshops } = await supabase
    .from('workshops')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  // Fetch sync history
  const { data: syncHistory } = await supabase
    .from('luma_sync_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return <WorkshopsClient workshops={workshops || []} syncHistory={syncHistory || []} />
}
