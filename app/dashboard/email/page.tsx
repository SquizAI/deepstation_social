'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailEditor } from '@/components/email/email-editor'
import { EmailPreview } from '@/components/email/email-preview'
import { TemplateGallery } from '@/components/email/template-gallery'
import { SubscriberManager } from '@/components/email/subscriber-manager'
import { CampaignList } from '@/components/email/campaign-list'

type View = 'campaigns' | 'editor' | 'subscribers' | 'templates'

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

interface Subscriber {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  tags: string[]
  status: string
  created_at: string
}

export default function EmailPage() {
  const [view, setView] = useState<View>('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalCampaigns: 0,
    sentCampaigns: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load campaigns
      const { data: campaignsData } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsData) {
        setCampaigns(campaignsData)
      }

      // Load subscribers
      const { data: subscribersData } = await supabase
        .from('email_subscribers')
        .select('*')
        .order('created_at', { ascending: false })

      if (subscribersData) {
        setSubscribers(subscribersData)
      }

      // Calculate stats
      const totalSubscribers = subscribersData?.length || 0
      const activeSubscribers = subscribersData?.filter(s => s.status === 'active').length || 0
      const totalCampaigns = campaignsData?.length || 0
      const sentCampaigns = campaignsData?.filter(c => c.status === 'sent').length || 0

      setStats({
        totalSubscribers,
        activeSubscribers,
        totalCampaigns,
        sentCampaigns,
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = () => {
    setSelectedCampaign(null)
    setView('editor')
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setView('editor')
  }

  const handleSaveCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      if (selectedCampaign) {
        // Update existing campaign
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', selectedCampaign.id)

        if (error) throw error
      } else {
        // Create new campaign
        const { error } = await supabase
          .from('email_campaigns')
          .insert([campaignData])

        if (error) throw error
      }

      await loadData()
      setView('campaigns')
      setSelectedCampaign(null)
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Failed to save campaign. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Marketing</h1>
          <p className="text-gray-400">Create and send beautiful newsletters to your subscribers</p>
        </div>
        <Button
          onClick={handleCreateCampaign}
          className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-500/30"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Subscribers</CardDescription>
            <CardTitle className="text-3xl font-bold text-white">{stats.totalSubscribers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-green-400 font-medium">{stats.activeSubscribers} active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Total Campaigns</CardDescription>
            <CardTitle className="text-3xl font-bold text-white">{stats.totalCampaigns}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-fuchsia-400 font-medium">{stats.sentCampaigns} sent</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Avg. Open Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce((acc, c) => acc + (c.stats.sent > 0 ? (c.stats.opened / c.stats.sent) * 100 : 0), 0) / campaigns.length
                  )
                : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-blue-400 font-medium">Industry avg: 21%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400">Avg. Click Rate</CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce((acc, c) => acc + (c.stats.sent > 0 ? (c.stats.clicked / c.stats.sent) * 100 : 0), 0) / campaigns.length
                  )
                : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-purple-400 font-medium">Industry avg: 2.6%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setView('campaigns')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'campaigns'
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Campaigns
        </button>
        <button
          onClick={() => setView('subscribers')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'subscribers'
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Subscribers ({stats.totalSubscribers})
        </button>
        <button
          onClick={() => setView('templates')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'templates'
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Templates
        </button>
      </div>

      {/* Content Views */}
      {view === 'campaigns' && (
        <CampaignList
          campaigns={campaigns}
          onEdit={handleEditCampaign}
          onRefresh={loadData}
        />
      )}

      {view === 'editor' && (
        <EmailEditor
          campaign={selectedCampaign}
          onSave={handleSaveCampaign}
          onCancel={() => {
            setView('campaigns')
            setSelectedCampaign(null)
          }}
        />
      )}

      {view === 'subscribers' && (
        <SubscriberManager
          subscribers={subscribers}
          onRefresh={loadData}
        />
      )}

      {view === 'templates' && (
        <TemplateGallery
          onSelectTemplate={(templateId) => {
            console.log('Selected template:', templateId)
            // Handle template selection
          }}
        />
      )}
    </div>
  )
}
