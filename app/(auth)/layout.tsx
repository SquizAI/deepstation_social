import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // If user is already authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DeepStation</h1>
          <p className="text-gray-300">Social Media Automation Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-300 text-sm">
            Join 3,000+ members across Miami and Brazil
          </p>
        </div>
      </div>
    </div>
  )
}
