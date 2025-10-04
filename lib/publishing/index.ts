/**
 * Publishing Module Entry Point
 * Exports all publishing functionality for easy imports
 */

// Main publishing service
export {
  publishToAllPlatforms,
  publishToPlatform,
  publishWithRetry,
  checkRateLimits,
  validatePublishRequest,
  formatPublishResults,
} from './unified-publisher';

export type { MultiPlatformPublishRequest } from './unified-publisher';

// Platform-specific publishers
export { publishToLinkedIn, checkLinkedInRateLimit } from './platforms/linkedin';
export { publishToInstagram, checkInstagramRateLimit, validateInstagramImage } from './platforms/instagram';
export { publishToTwitter, publishTwitterThread, checkTwitterRateLimit } from './platforms/twitter';
export {
  publishToDiscord,
  publishDiscordEmbed,
  createAnnouncementEmbed,
  DiscordRateLimiter,
} from './platforms/discord';

// Re-export types
export type {
  PublishRequest,
  PublishResult,
  PublishErrorCode,
  PlatformConfig,
  MediaUploadResult,
  RateLimitInfo,
  RetryConfig,
  DiscordEmbed,
} from '../types/publishing';

export { PLATFORM_CONFIGS, DEFAULT_RETRY_CONFIG } from '../types/publishing';
