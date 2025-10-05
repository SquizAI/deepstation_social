import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateBuilderClient } from './template-builder-client'

export default async function TemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <TemplateBuilderClient />
}
