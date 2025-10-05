'use client'

import type { Event } from '@/lib/types/event'

interface SpeakersSectionProps {
  event: Event
}

export function SpeakersSection({ event }: SpeakersSectionProps) {
  if (!event.hosts || event.hosts.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-fuchsia-500 to-purple-600 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Featured {event.hosts.length === 1 ? 'Speaker' : 'Speakers'}
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {event.hosts.map((host) => (
          <div
            key={host.id}
            className="group relative bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 hover:border-fuchsia-500/50 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/0 to-purple-500/0 group-hover:from-fuchsia-500/5 group-hover:to-purple-500/5 transition-all" />
            <div className="relative flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden shadow-lg">
                {host.avatar_url ? (
                  <img
                    src={host.avatar_url}
                    alt={host.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  host.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{host.name}</h3>
                {host.title && (
                  <p className="text-sm text-fuchsia-400 mb-2 font-medium">{host.title}</p>
                )}
                {host.bio && (
                  <p className="text-sm text-slate-300 line-clamp-3">{host.bio}</p>
                )}
                {host.social_links && (
                  <div className="flex gap-3 mt-3">
                    {host.social_links.linkedin && (
                      <a
                        href={host.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-fuchsia-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {host.social_links.twitter && (
                      <a
                        href={host.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-fuchsia-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {host.social_links.website && (
                      <a
                        href={host.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-fuchsia-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
