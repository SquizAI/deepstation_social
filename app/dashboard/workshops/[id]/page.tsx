import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkshopDetail } from '@/components/workshops/workshop-detail'
import Link from 'next/link'

interface WorkshopPageProps {
  params: {
    id: string
  }
}

export default async function WorkshopPage({ params }: WorkshopPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch workshop
  const { data: workshop, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !workshop) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/workshops"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Workshops
        </Link>
      </div>

      <WorkshopDetail workshop={workshop} />
    </div>
  )
}
