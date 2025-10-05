'use client'

import type { Event } from '@/lib/types/event'

interface AboutSectionProps {
  event: Event
}

export function AboutSection({ event }: AboutSectionProps) {
  if (!event.description) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-fuchsia-500 to-purple-600 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          About This Event
        </h2>
      </div>
      <div className="bg-purple-950/20 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-8">
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">
            {event.description}
          </p>
        </div>
      </div>
    </div>
  )
}
