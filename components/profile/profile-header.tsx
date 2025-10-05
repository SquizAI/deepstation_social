'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ProfileHeaderProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
  profile: {
    id: string
    full_name?: string
    bio?: string
    avatar_url?: string
  } | null
}

export function ProfileHeader({ user, profile }: ProfileHeaderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
    bio: profile?.bio || ''
  })

  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Profile update error:', error)
        alert('Failed to update profile. Please try again.')
      } else {
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/50">
            {profile?.avatar_url || user.user_metadata?.avatar_url ? (
              <img
                src={profile?.avatar_url || user.user_metadata?.avatar_url}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-3xl">
                {userInitials}
              </span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-fuchsia-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          {!isEditing ? (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
                <p className="text-slate-400">{user.email}</p>
              </div>
              {profile?.bio && (
                <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium border border-white/20 hover:bg-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      full_name: profile?.full_name || user.user_metadata?.full_name || '',
                      bio: profile?.bio || ''
                    })
                  }}
                  disabled={loading}
                  className="bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-medium border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
