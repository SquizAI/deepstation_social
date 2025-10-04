import { Platform, PostContent, PLATFORM_LIMITS } from '@/lib/types/posts'

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate post content for a specific platform
 */
export function validatePlatformContent(
  platform: Platform,
  content: string
): ValidationError | null {
  const limit = PLATFORM_LIMITS[platform]

  if (content.length === 0) {
    return {
      field: platform,
      message: `${platform} content cannot be empty`
    }
  }

  if (content.length > limit) {
    return {
      field: platform,
      message: `${platform} content exceeds ${limit} character limit (current: ${content.length})`
    }
  }

  return null
}

/**
 * Validate all post content
 */
export function validatePostContent(
  content: PostContent,
  selectedPlatforms: Platform[]
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const platform of selectedPlatforms) {
    const error = validatePlatformContent(platform, content[platform])
    if (error) {
      errors.push(error)
    }
  }

  return errors
}

/**
 * Check if content is within safe limits (90% of max)
 */
export function isContentSafe(platform: Platform, content: string): boolean {
  const limit = PLATFORM_LIMITS[platform]
  const safeLimit = limit * 0.9
  return content.length <= safeLimit
}

/**
 * Get character count info for a platform
 */
export interface CharacterCountInfo {
  current: number
  max: number
  remaining: number
  percentage: number
  isOverLimit: boolean
  isNearLimit: boolean
}

export function getCharacterCountInfo(
  platform: Platform,
  content: string
): CharacterCountInfo {
  const max = PLATFORM_LIMITS[platform]
  const current = content.length
  const remaining = max - current
  const percentage = (current / max) * 100
  const isOverLimit = current > max
  const isNearLimit = percentage > 90

  return {
    current,
    max,
    remaining,
    percentage,
    isOverLimit,
    isNearLimit
  }
}

/**
 * Validate image file
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  return { valid: true }
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize content for platform
 */
export function sanitizeContent(platform: Platform, content: string): string {
  let sanitized = content.trim()

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')

  // Platform-specific sanitization
  switch (platform) {
    case 'twitter':
      // Twitter automatically shortens URLs, but we can clean up extra spaces
      sanitized = sanitized.replace(/\s+/g, ' ')
      break

    case 'discord':
      // Discord supports markdown, ensure proper formatting
      break

    case 'linkedin':
      // LinkedIn supports some formatting
      break

    case 'instagram':
      // Instagram has specific hashtag rules
      break
  }

  return sanitized
}

/**
 * Extract hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map(tag => tag.toLowerCase()) : []
}

/**
 * Count hashtags in content
 */
export function countHashtags(content: string): number {
  return extractHashtags(content).length
}

/**
 * Validate hashtag count for platform
 */
export function validateHashtagCount(platform: Platform, content: string): boolean {
  const count = countHashtags(content)

  const limits: Record<Platform, number> = {
    linkedin: 5,
    instagram: 30,
    twitter: 2,
    discord: 10
  }

  return count <= limits[platform]
}

/**
 * Extract mentions from content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@[\w]+/g
  const matches = content.match(mentionRegex)
  return matches ? matches : []
}

/**
 * Validate scheduled date
 */
export function validateScheduledDate(date: Date): ValidationError | null {
  const now = new Date()

  if (date < now) {
    return {
      field: 'scheduled_date',
      message: 'Scheduled date must be in the future'
    }
  }

  // Check if date is too far in the future (e.g., 1 year)
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  if (date > oneYearFromNow) {
    return {
      field: 'scheduled_date',
      message: 'Scheduled date cannot be more than 1 year in the future'
    }
  }

  return null
}
