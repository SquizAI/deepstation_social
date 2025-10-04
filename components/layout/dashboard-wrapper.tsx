'use client'

import { UniversalVoiceAssistant } from '@/components/ai-agent/universal-voice-assistant'

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Universal voice assistant - shows only on pages with forms */}
      <UniversalVoiceAssistant />
    </>
  )
}
