'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An unexpected error occurred.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoClick = () => {
    router.push('/signup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group z-50"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* Login Container */}
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
              <p className="text-slate-400 text-sm mt-2">Social Media Automation</p>
            </div>
          </Link>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Demo Credentials Info */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-cyan-400 font-semibold text-sm mb-2">Try Demo Account</p>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-300">
                    <span className="text-slate-500">Email:</span> <span className="font-mono text-cyan-300">demo@deepstation.ai</span>
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-500">Password:</span> <span className="font-mono text-cyan-300">DeepStation2025!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Signup Button */}
          <button
            onClick={handleDemoClick}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Free Trial
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#15092b] text-slate-500">or</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-white/5 text-white placeholder:text-slate-500 px-4 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-fuchsia-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/25"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
