/**
 * Publishing Type Definitions for DeepStation
 * Comprehensive types for multi-platform social media publishing
 */

import { Platform } from './oauth';

// Re-export Platform for convenience
export type { Platform };

/**
 * Request to publish content to social media platforms
 */
export interface PublishRequest {
  platform: Platform;
  content: string;
  images?: string[];
  accessToken: string;
  platformUserId?: string;
  webhookUrl?: string; // For Discord
}

/**
 * Result of publishing to a single platform
 */
export interface PublishResult {
  success: boolean;
  platform: Platform;
  postId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: PublishErrorCode;
  timestamp: string;
}

/**
 * Platform-specific configuration
 */
export interface PlatformConfig {
  name: Platform;
  characterLimit: number;
  maxImages: number;
  supportsMultipleImages: boolean;
  imageFormats: string[];
  maxImageSize: number; // in bytes
  rateLimitPerDay?: number;
  rateLimitPerMonth?: number;
}

/**
 * Media upload result
 */
export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  asset?: string; // LinkedIn asset URN
  url?: string;
  error?: string;
}

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  platform: Platform;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

/**
 * Optimized image result
 */
export interface OptimizedImage {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  platform: Platform;
  remaining: number;
  total: number;
  resetAt?: Date;
  isNearLimit: boolean;
}

/**
 * LinkedIn specific types
 */
export interface LinkedInImageAsset {
  asset: string;
  uploadUrl: string;
}

export interface LinkedInPostResponse {
  id: string;
}

/**
 * Instagram specific types
 */
export interface InstagramContainerResponse {
  id: string;
}

export interface InstagramContainerStatus {
  status_code: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' | 'EXPIRED';
  id: string;
}

export interface InstagramPublishResponse {
  id: string;
}

export interface InstagramRateLimitResponse {
  data: {
    quota_usage: number;
    config: {
      quota_total: number;
    };
  };
}

/**
 * Twitter specific types
 */
export interface TwitterMediaUploadInitResponse {
  media_id_string: string;
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

export interface TwitterErrorResponse {
  errors?: Array<{
    message: string;
    code: number;
  }>;
  title?: string;
  detail?: string;
  type?: string;
}

/**
 * Discord specific types
 */
export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Publishing error codes
 */
export type PublishErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_MEDIA'
  | 'CONTENT_TOO_LONG'
  | 'DUPLICATE_CONTENT'
  | 'NETWORK_ERROR'
  | 'PLATFORM_ERROR'
  | 'INVALID_WEBHOOK'
  | 'CONTAINER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Platform configurations with limits and constraints
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  linkedin: {
    name: 'linkedin',
    characterLimit: 3000,
    maxImages: 9,
    supportsMultipleImages: true,
    imageFormats: ['jpeg', 'jpg', 'png'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
    rateLimitPerDay: 500,
  },
  instagram: {
    name: 'instagram',
    characterLimit: 2200,
    maxImages: 1,
    supportsMultipleImages: false,
    imageFormats: ['jpeg', 'jpg'],
    maxImageSize: 8 * 1024 * 1024, // 8MB
    rateLimitPerDay: 100,
  },
  twitter: {
    name: 'twitter',
    characterLimit: 280,
    maxImages: 4,
    supportsMultipleImages: true,
    imageFormats: ['jpeg', 'jpg', 'png', 'gif'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
    rateLimitPerMonth: 500,
  },
  discord: {
    name: 'discord',
    characterLimit: 4000,
    maxImages: 10,
    supportsMultipleImages: true,
    imageFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    maxImageSize: 8 * 1024 * 1024, // 8MB
  },
};

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};
