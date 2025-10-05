'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  subject: string
  preview_text: string | null
  content: string
  template_id: string | null
  status: string
  scheduled_for: string | null
  sent_at: string | null
  recipient_count: number
  stats: {
    sent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  created_at: string
}

interface CampaignListProps {
  campaigns: Campaign[]
  onEdit: (campaign: Campaign) => void
  onRefresh: () => void
}

export function CampaignList({ campaigns, onEdit, onRefresh }: CampaignListProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all')
  const supabase = createClient()

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true
    return campaign.status === filter
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return
    }

    const { error } = await supabase.from('email_campaigns').delete().eq('id', id)

    if (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
    } else {
      onRefresh()
    }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    const { id, created_at, sent_at, stats, ...campaignData } = campaign

    const { error } = await supabase.from('email_campaigns').insert([
      {
        ...campaignData,
        subject: `${campaign.subject} (Copy)`,
        status: 'draft',
      },
    ])

    if (error) {
      console.error('Error duplicating campaign:', error)
      alert('Failed to duplicate campaign')
    } else {
      onRefresh()
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      sending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      sent: 'bg-green-500/20 text-green-300 border-green-500/30',
      failed: 'bg-red-500/20 text-red-300 border-red-500/30',
    }

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.stats.sent === 0) return 0
    return Math.round((campaign.stats.opened / campaign.stats.sent) * 100)
  }

  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.stats.sent === 0) return 0
    return Math.round((campaign.stats.clicked / campaign.stats.sent) * 100)
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'draft', 'scheduled', 'sent'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs opacity-60">
              ({campaigns.filter((c) => status === 'all' || c.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-400 text-lg mb-2">No campaigns found</p>
            <p className="text-gray-500 text-sm">
              {filter === 'all'
                ? 'Create your first email campaign to get started'
                : `No ${filter} campaigns yet`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {campaign.subject}
                      </h3>
                      {getStatusBadge(campaign.status)}
                    </div>

                    {campaign.preview_text && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {campaign.preview_text}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {campaign.sent_at
                          ? `Sent ${formatDate(campaign.sent_at)}`
                          : campaign.scheduled_for
                          ? `Scheduled for ${formatDate(campaign.scheduled_for)}`
                          : `Created ${formatDate(campaign.created_at)}`}
                      </span>

                      {campaign.status === 'sent' && (
                        <>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            {calculateOpenRate(campaign)}% opened
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                              />
                            </svg>
                            {calculateClickRate(campaign)}% clicked
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                            {campaign.stats.sent} sent
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        onClick={() => onEdit(campaign)}
                        size="sm"
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </Button>
                    )}

                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-gray-300 hover:bg-white/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </Button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleDuplicate(campaign)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 rounded-t-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-b-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
