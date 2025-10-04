'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // No confirmation needed, redirect to dashboard
          router.push('/dashboard')
          router.refresh()
        } else {
          // Email confirmation required
          setSuccess(true)
        }
      }
    } catch (error) {
      setError('An unexpected error occurred.')
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] flex items-center justify-center p-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
        </div>

        <div className="relative w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-slate-400">We sent a confirmation link to <span className="text-white font-medium">{email}</span></p>
          </div>

          <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg p-4 text-left">
            <p className="text-fuchsia-300 font-semibold mb-2">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
              <li>Open your email inbox</li>
              <li>Click the confirmation link</li>
              <li>Sign in to your account</li>
            </ol>
          </div>

          <Link href="/login" className="inline-block text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Signup Container */}
      <div className="relative w-full max-w-md">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
                  DeepStation
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-2">Create Your Account</p>
            </div>
          </Link>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-white/5 text-white placeholder:text-slate-500 px-4 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="w-full bg-white/5 text-white placeholder:text-slate-500 px-4 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/25"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
