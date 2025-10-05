'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface Subscriber {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  tags: string[]
  status: string
  created_at: string
}

interface SubscriberManagerProps {
  subscribers: Subscriber[]
  onRefresh: () => void
}

export function SubscriberManager({ subscribers, onRefresh }: SubscriberManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unsubscribed'>('all')
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])

  // Add Subscriber Form State
  const [newEmail, setNewEmail] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newTags, setNewTags] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.last_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('email_subscribers').insert([
        {
          email: newEmail,
          first_name: newFirstName || null,
          last_name: newLastName || null,
          tags: newTags ? newTags.split(',').map((t) => t.trim()) : [],
          status: 'active',
        },
      ])

      if (error) throw error

      setNewEmail('')
      setNewFirstName('')
      setNewLastName('')
      setNewTags('')
      setShowAddModal(false)
      onRefresh()
    } catch (error: any) {
      console.error('Error adding subscriber:', error)
      if (error.code === '23505') {
        alert('This email address is already subscribed')
      } else {
        alert('Failed to add subscriber')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

        const subscribers = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(',').map((v) => v.trim())
            const emailIndex = headers.indexOf('email')
            const firstNameIndex = headers.indexOf('first_name') || headers.indexOf('firstname')
            const lastNameIndex = headers.indexOf('last_name') || headers.indexOf('lastname')
            const tagsIndex = headers.indexOf('tags')

            return {
              email: values[emailIndex],
              first_name: firstNameIndex >= 0 ? values[firstNameIndex] : null,
              last_name: lastNameIndex >= 0 ? values[lastNameIndex] : null,
              tags: tagsIndex >= 0 ? values[tagsIndex].split(';') : [],
              status: 'active',
            }
          })

        const { error } = await supabase.from('email_subscribers').insert(subscribers)

        if (error) throw error

        setShowImportModal(false)
        onRefresh()
        alert(`Successfully imported ${subscribers.length} subscribers`)
      } catch (error) {
        console.error('Error importing CSV:', error)
        alert('Failed to import CSV. Please check the format.')
      } finally {
        setLoading(false)
      }
    }

    reader.readAsText(file)
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedSubscribers.length} selected subscribers?`)) {
      return
    }

    setLoading(true)
    const { error } = await supabase.from('email_subscribers').delete().in('id', selectedSubscribers)

    if (error) {
      console.error('Error deleting subscribers:', error)
      alert('Failed to delete subscribers')
    } else {
      setSelectedSubscribers([])
      onRefresh()
    }
    setLoading(false)
  }

  const handleUnsubscribeSelected = async () => {
    if (!confirm(`Unsubscribe ${selectedSubscribers.length} selected subscribers?`)) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('email_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .in('id', selectedSubscribers)

    if (error) {
      console.error('Error unsubscribing:', error)
      alert('Failed to unsubscribe')
    } else {
      setSelectedSubscribers([])
      onRefresh()
    }
    setLoading(false)
  }

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([])
    } else {
      setSelectedSubscribers(filteredSubscribers.map((s) => s.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subscriber
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import CSV
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'unsubscribed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs opacity-60">
              ({subscribers.filter((s) => status === 'all' || s.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedSubscribers.length > 0 && (
        <Card className="bg-fuchsia-600/10 border-fuchsia-500/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{selectedSubscribers.length} selected</span>
              <div className="flex gap-2">
                <Button
                  onClick={handleUnsubscribeSelected}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Unsubscribe
                </Button>
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribers Table */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-white/5 text-fuchsia-600 focus:ring-fuchsia-500"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-300">Tags</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-300">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSubscribers.includes(subscriber.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubscribers([...selectedSubscribers, subscriber.id])
                            } else {
                              setSelectedSubscribers(selectedSubscribers.filter((id) => id !== subscriber.id))
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-fuchsia-600 focus:ring-fuchsia-500"
                        />
                      </td>
                      <td className="p-4 text-white">{subscriber.email}</td>
                      <td className="p-4 text-gray-300">
                        {subscriber.first_name || subscriber.last_name
                          ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {subscriber.tags.length > 0 ? (
                            subscriber.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded border border-purple-500/30"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${
                            subscriber.status === 'active'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}
                        >
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a1a2e] border-white/10 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Add New Subscriber</span>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubscriber} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="subscriber@example.com"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <Input
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <Input
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                  <Input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="newsletter, vip, tech"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700">
                    Add Subscriber
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a1a2e] border-white/10 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Import Subscribers</span>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Upload a CSV file with columns: email, first_name, last_name, tags (optional)
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  disabled={loading}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-fuchsia-600 file:text-white file:cursor-pointer hover:file:bg-fuchsia-700"
                />
              </div>
              <Button variant="outline" onClick={() => setShowImportModal(false)} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
