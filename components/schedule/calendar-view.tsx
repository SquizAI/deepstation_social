'use client'

import { useState, useMemo } from 'react'
import { ScheduledPost, PLATFORM_COLORS, STATUS_COLORS } from '@/lib/types/schedule'
import { Badge } from '@/components/ui/badge'

interface CalendarViewProps {
  posts: ScheduledPost[]
  onPostClick: (postId: string) => void
  onDateChange: (date: Date) => void
  onPostReschedule: (postId: string, newDate: string) => Promise<void>
}

export function CalendarView({ posts, onPostClick, onDateChange, onPostReschedule }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [draggedPost, setDraggedPost] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()))

  const calendarDays = useMemo(() => {
    const days = []
    const current = new Date(startDate)

    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [startDate, endDate])

  const postsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {}

    posts.forEach(post => {
      if (post.scheduled_for) {
        const dateKey = new Date(post.scheduled_for).toISOString().split('T')[0]
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(post)
      }
    })

    return grouped
  }, [posts])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPost(postId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    setHoveredDate(dateKey)
  }

  const handleDrop = async (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    if (!draggedPost) return

    const post = posts.find(p => p.id === draggedPost)
    if (!post || !post.scheduled_for) return

    const oldDate = new Date(post.scheduled_for)
    const newDate = new Date(dateKey)
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes())

    await onPostReschedule(draggedPost, newDate.toISOString())
    setDraggedPost(null)
    setHoveredDate(null)
  }

  const getDateKey = (date: Date) => date.toISOString().split('T')[0]

  const isToday = (date: Date) => {
    const today = new Date()
    return getDateKey(date) === getDateKey(today)
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth()

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getDayPosts = (date: Date) => {
    const dateKey = getDateKey(date)
    return postsByDate[dateKey] || []
  }

  const handleDateClick = (date: Date) => {
    const dateKey = getDateKey(date)
    setSelectedDate(selectedDate === dateKey ? null : dateKey)
    onDateChange(date)
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">{formatMonthYear()}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 hover:bg-white/10 rounded-lg text-gray-400 text-sm transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-400 border-r border-white/10 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(date => {
          const dateKey = getDateKey(date)
          const dayPosts = getDayPosts(date)
          const isSelected = selectedDate === dateKey
          const isHovered = hoveredDate === dateKey

          return (
            <div
              key={dateKey}
              className={`
                min-h-[120px] p-2 border-r border-b border-white/10 last:border-r-0
                ${!isCurrentMonth(date) ? 'bg-white/[0.02]' : ''}
                ${isToday(date) ? 'bg-fuchsia-500/10' : ''}
                ${isHovered && draggedPost ? 'bg-purple-500/20 ring-2 ring-purple-500' : ''}
                ${isSelected ? 'bg-white/10' : ''}
                transition-all cursor-pointer
              `}
              onClick={() => handleDateClick(date)}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDrop={(e) => handleDrop(e, dateKey)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-medium
                  ${isToday(date) ? 'text-fuchsia-400 font-bold' : ''}
                  ${isCurrentMonth(date) ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  {date.getDate()}
                </span>
                {dayPosts.length > 0 && (
                  <Badge variant="outline" className="text-xs border-white/20 bg-white/5">
                    {dayPosts.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => {
                  const primaryPlatform = post.platforms[0]
                  const platformColor = PLATFORM_COLORS[primaryPlatform]
                  const statusColor = STATUS_COLORS[post.status]

                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        onPostClick(post.id)
                      }}
                      className="group relative p-1.5 rounded text-xs cursor-move hover:shadow-lg transition-all"
                      style={{
                        backgroundColor: `${platformColor}20`,
                        borderLeft: `3px solid ${statusColor}`
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {post.platforms.map(platform => (
                            <div
                              key={platform}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                            />
                          ))}
                        </div>
                        <span className="text-white truncate flex-1">
                          {post.content.linkedin?.slice(0, 30) || post.content.twitter?.slice(0, 30) || 'Post'}
                        </span>
                      </div>

                      {/* Hover tooltip */}
                      <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 p-3 bg-gray-900 border border-white/20 rounded-lg shadow-xl min-w-[250px] max-w-[300px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: statusColor }} className="text-xs">
                              {post.status}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(post.scheduled_for!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-white line-clamp-3">
                            {post.content.linkedin || post.content.twitter}
                          </p>
                          <div className="flex gap-1 pt-2 border-t border-white/10">
                            {post.platforms.map(platform => (
                              <Badge
                                key={platform}
                                style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                                className="text-xs"
                              >
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {dayPosts.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDateClick(date)
                    }}
                    className="w-full text-xs text-fuchsia-400 hover:text-fuchsia-300 text-center py-1"
                  >
                    +{dayPosts.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Details Modal */}
      {selectedDate && postsByDate[selectedDate] && (
        <div className="border-t border-white/10 p-4 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Posts on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {postsByDate[selectedDate].map(post => (
              <div
                key={post.id}
                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onPostClick(post.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: STATUS_COLORS[post.status] }} className="text-xs">
                        {post.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(post.scheduled_for!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-white line-clamp-2 mb-2">
                      {post.content.linkedin || post.content.twitter}
                    </p>
                    <div className="flex gap-1">
                      {post.platforms.map(platform => (
                        <Badge
                          key={platform}
                          style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                          className="text-xs"
                        >
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
