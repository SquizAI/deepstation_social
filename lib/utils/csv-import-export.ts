import { ScheduledPost, PostContent, Platform } from '@/lib/types/schedule'

/**
 * Export scheduled posts to CSV format
 */
export function exportPostsToCSV(posts: ScheduledPost[]): string {
  const headers = [
    'ID',
    'Status',
    'Platforms',
    'Scheduled For',
    'Timezone',
    'LinkedIn Content',
    'Instagram Content',
    'Twitter Content',
    'Discord Content',
    'Image URLs',
    'Recurring Pattern',
    'Created At'
  ]

  const rows = posts.map(post => [
    post.id,
    post.status,
    post.platforms.join(';'),
    post.scheduled_for || '',
    post.timezone || 'UTC',
    escapeCSV(post.content.linkedin || ''),
    escapeCSV(post.content.instagram || ''),
    escapeCSV(post.content.twitter || ''),
    escapeCSV(post.content.discord || ''),
    post.images?.map(img => img.url).join(';') || '',
    post.recurring_pattern ? JSON.stringify(post.recurring_pattern) : '',
    post.created_at
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

/**
 * Parse CSV content to scheduled posts
 */
export function parseCSVToPosts(csvContent: string, userId: string): {
  posts: Partial<ScheduledPost>[]
  errors: { row: number; error: string }[]
} {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const headers = parseCSVRow(lines[0])
  const posts: Partial<ScheduledPost>[] = []
  const errors: { row: number; error: string }[] = []

  // Validate headers
  const requiredHeaders = ['Platforms', 'LinkedIn Content', 'Twitter Content']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

  if (missingHeaders.length > 0) {
    errors.push({
      row: 0,
      error: `Missing required headers: ${missingHeaders.join(', ')}`
    })
    return { posts, errors }
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVRow(lines[i])
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate platforms
      const platforms = row['Platforms']?.split(';').filter(Boolean) as Platform[]
      if (!platforms || platforms.length === 0) {
        errors.push({ row: i + 1, error: 'No platforms specified' })
        continue
      }

      // Build content object
      const content: PostContent = {
        linkedin: row['LinkedIn Content'] || '',
        instagram: row['Instagram Content'] || '',
        twitter: row['Twitter Content'] || '',
        discord: row['Discord Content'] || ''
      }

      // Validate content
      const hasContent = platforms.some(platform => content[platform]?.trim())
      if (!hasContent) {
        errors.push({ row: i + 1, error: 'No content provided for selected platforms' })
        continue
      }

      // Parse images
      const images = row['Image URLs']?.split(';').filter(Boolean).map((url, idx) => ({
        platform: platforms[idx % platforms.length],
        url: url.trim()
      }))

      // Parse scheduled time
      const scheduledFor = row['Scheduled For']?.trim()
        ? new Date(row['Scheduled For']).toISOString()
        : undefined

      // Parse recurring pattern
      let recurringPattern
      if (row['Recurring Pattern']) {
        try {
          recurringPattern = JSON.parse(row['Recurring Pattern'])
        } catch {
          errors.push({ row: i + 1, error: 'Invalid recurring pattern JSON' })
        }
      }

      posts.push({
        user_id: userId,
        content,
        images,
        platforms,
        scheduled_for: scheduledFor,
        timezone: row['Timezone'] || 'UTC',
        recurring_pattern: recurringPattern,
        status: scheduledFor ? 'scheduled' : 'draft'
      })
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Failed to parse row'
      })
    }
  }

  return { posts, errors }
}

/**
 * Parse a single CSV row handling quoted values
 */
function parseCSVRow(row: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    const nextChar = row[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quotes
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last value
  values.push(current)

  return values
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (!value) return ''

  // If value contains comma, quotes, or newlines, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Create CSV template for importing posts
 */
export function createCSVTemplate(): string {
  const headers = [
    'Platforms',
    'Scheduled For',
    'Timezone',
    'LinkedIn Content',
    'Instagram Content',
    'Twitter Content',
    'Discord Content',
    'Image URLs',
    'Recurring Pattern'
  ]

  const exampleRow = [
    'linkedin;twitter',
    '2025-10-15 14:00',
    'America/New_York',
    'Check out our latest update! 🚀',
    'New update alert! 📱',
    'Latest update is here! 🎉',
    'Hey @everyone! New update! 💻',
    'https://example.com/image.jpg',
    '{"frequency":"weekly","daysOfWeek":[1,3,5]}'
  ]

  return [
    headers.join(','),
    exampleRow.map(escapeCSV).join(',')
  ].join('\n')
}

/**
 * Validate CSV file before import
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' }
  }

  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'Invalid file type. Please upload a CSV file' }
  }

  return { valid: true }
}

/**
 * Read CSV file content
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}
