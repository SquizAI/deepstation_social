'use client'

import { useState } from 'react'
import { WorkshopCard } from '@/components/workshops/workshop-card'
import { WorkshopDetail, type Workshop } from '@/components/workshops/workshop-detail'

interface SyncLog {
  id: string
  sync_status: string
  events_synced: number
  events_created: number
  events_updated: number
  created_at: string
}

interface WorkshopsClientProps {
  workshops: Workshop[]
  syncHistory: SyncLog[]
}

export function WorkshopsClient({ workshops: initialWorkshops, syncHistory }: WorkshopsClientProps) {
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const response = await fetch('/api/workshops/sync-luma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSyncMessage({
          type: 'success',
          text: `Synced ${data.stats.total_events} events! Created: ${data.stats.created}, Updated: ${data.stats.updated}`,
        })

        // Refresh workshops list
        const workshopsResponse = await fetch('/api/workshops?upcoming=true')
        const workshopsData = await workshopsResponse.json()
        if (workshopsData.success) {
          setWorkshops(workshopsData.workshops)
        }
      } else {
        setSyncMessage({
          type: 'error',
          text: data.error || 'Failed to sync workshops',
        })
      }
    } catch (error: any) {
      setSyncMessage({
        type: 'error',
        text: error.message || 'An error occurred while syncing',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const upcomingWorkshops = workshops.filter(
    (w) => new Date(w.event_date) >= new Date() && w.status === 'published'
  )
  const pastWorkshops = workshops.filter((w) => new Date(w.event_date) < new Date())

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative space-y-8 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Workshops
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Manage your workshop events from Luma
            </p>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync from Luma'}
          </button>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div
            className={`p-4 rounded-xl border ${
              syncMessage.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {syncMessage.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{upcomingWorkshops.length}</div>
            <p className="text-sm text-slate-400">Upcoming workshops</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Past</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{pastWorkshops.length}</div>
            <p className="text-sm text-slate-400">Past workshops</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{workshops.length}</div>
            <p className="text-sm text-slate-400">Total workshops</p>
          </div>
        </div>

        {/* Upcoming Workshops */}
        {upcomingWorkshops.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Workshops</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingWorkshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  onClick={() => setSelectedWorkshop(workshop)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Workshops */}
        {pastWorkshops.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Past Workshops</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastWorkshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  onClick={() => setSelectedWorkshop(workshop)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {workshops.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No workshops yet</h3>
            <p className="text-slate-400 mb-6">
              Sync your workshops from Luma to get started
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isSyncing ? 'Syncing...' : 'Sync from Luma'}
            </button>
          </div>
        )}

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Sync History</h2>
            <div className="space-y-3">
              {syncHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        log.sync_status === 'success'
                          ? 'bg-green-500'
                          : log.sync_status === 'partial'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {log.events_synced} events synced
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Created: {log.events_created} | Updated: {log.events_updated}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workshop Detail Modal */}
      {selectedWorkshop && (
        <WorkshopDetail workshop={selectedWorkshop} onClose={() => setSelectedWorkshop(null)} />
      )}
    </div>
  )
}
