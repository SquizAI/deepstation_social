'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface NavbarProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#201033]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side - empty, logo is in sidebar */}
        <div className="flex items-center gap-2">
          {/* Logo removed - now only in sidebar */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-300 hover:bg-white/5 hover:backdrop-blur-sm hover:text-white hover:border hover:border-white/10 transition-all duration-300">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-fuchsia-500 shadow-lg shadow-fuchsia-500/50"></span>
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu
            trigger={
              <div className="flex items-center gap-2 rounded-lg hover:bg-white/5 hover:backdrop-blur-sm p-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/50">
                  <span className="text-white font-semibold text-sm">
                    {userInitials}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
                <svg
                  className="h-4 w-4 text-gray-400 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            }
          >
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <DropdownMenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              onClick={() => router.push('/dashboard/profile')}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              }
              onClick={() => router.push('/dashboard/my-events')}
            >
              My Events
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              onClick={() => router.push('/dashboard/settings/profile')}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              }
              onClick={handleLogout}
              className="text-fuchsia-400 hover:bg-fuchsia-500/10"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
