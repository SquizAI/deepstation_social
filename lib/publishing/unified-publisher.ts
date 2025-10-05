/**
 * Unified Publishing Service
 * Orchestrates multi-platform social media publishing with retry logic
 */

import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';
import { getStoredCredentials } from '@/lib/credentials/get-credentials';
import { Platform } from '@/lib/types/oauth';
import {
  PublishRequest,
  PublishResult,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';
import { publishToLinkedIn } from './platforms/linkedin';
import { publishToInstagram } from './platforms/instagram';
import { publishToTwitter } from './platforms/twitter';
import { publishToDiscord } from './platforms/discord';

/**
 * Request to publish to multiple platforms
 */
export interface MultiPlatformPublishRequest {
  userId: string;
  platforms: Platform[];
  content: Record<Platform, string>;
  images?: string[];
  webhookUrls?: Record<string, string>; // For Discord
}

/**
 * Publish to all requested platforms
 */
export async function publishToAllPlatforms(
  request: MultiPlatformPublishRequest
): Promise<PublishResult[]> {
  const { userId, platforms, content, images, webhookUrls } = request;
  const results: PublishResult[] = [];

  console.log(`Publishing to ${platforms.length} platforms for user ${userId}`);

  // Publish to each platform
  for (const platform of platforms) {
    try {
      // Get platform-specific content
      const platformContent = content[platform];
      if (!platformContent) {
        results.push({
          success: false,
          platform,
          error: `No content provided for ${platform}`,
          errorCode: 'PLATFORM_ERROR',
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Validate content length
      const config = PLATFORM_CONFIGS[platform];
      if (platformContent.length > config.characterLimit) {
        results.push({
          success: false,
          platform,
          error: `Content exceeds ${config.characterLimit} character limit`,
          errorCode: 'CONTENT_TOO_LONG',
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Get auth token (except for Discord which uses webhooks)
      let accessToken = '';
      let platformUserId = '';

      if (platform === 'discord') {
        const webhookUrl = webhookUrls?.[platform];
        if (!webhookUrl) {
          results.push({
            success: false,
            platform,
            error: 'Discord webhook URL not provided',
            errorCode: 'INVALID_WEBHOOK',
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        // Publish to Discord
        const result = await publishWithRetry(
          () =>
            publishToDiscord({
              platform,
              content: platformContent,
              images,
              accessToken: '', // Not needed for Discord
              webhookUrl,
            }),
          DEFAULT_RETRY_CONFIG
        );

        results.push(result);
        continue;
      }

      // Get credentials (OAuth or API keys) from secure storage
      const credentials = await getStoredCredentials(userId, platform);

      if (!credentials) {
        // Fallback: Try old OAuth token system for backward compatibility
        const tokenData = await getValidOAuthToken(userId, platform);
        if (!tokenData) {
          results.push({
            success: false,
            platform,
            error: `No credentials found for ${platform}. Please connect your account or add API credentials.`,
            errorCode: 'AUTH_ERROR',
            timestamp: new Date().toISOString(),
          });
          continue;
        }
        accessToken = tokenData.accessToken;
        platformUserId = tokenData.providerUserId || '';
      } else {
        // Use credentials from secure storage
        if (credentials.credentialType === 'oauth') {
          accessToken = credentials.credentials.accessToken || '';
          platformUserId = credentials.metadata?.providerUserId || '';
        } else if (credentials.credentialType === 'api_key') {
          // For API keys, the structure depends on the platform
          // Most platforms store the access token in the credentials object
          accessToken = credentials.credentials.accessToken ||
                       credentials.credentials.apiKey ||
                       credentials.credentials.token || '';
          platformUserId = credentials.metadata?.userId || '';
        }

        if (!accessToken) {
          results.push({
            success: false,
            platform,
            error: `Invalid credentials format for ${platform}`,
            errorCode: 'AUTH_ERROR',
            timestamp: new Date().toISOString(),
          });
          continue;
        }
      }

      // Publish to platform with retry
      const publishRequest: PublishRequest = {
        platform,
        content: platformContent,
        images,
        accessToken,
        platformUserId,
      };

      const result = await publishWithRetry(
        () => publishToPlatform(publishRequest),
        DEFAULT_RETRY_CONFIG
      );

      results.push(result);
    } catch (error: any) {
      console.error(`Failed to publish to ${platform}:`, error);
      results.push({
        success: false,
        platform,
        error: error.message || `Unexpected error publishing to ${platform}`,
        errorCode: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Log summary
  const successful = results.filter((r) => r.success).length;
  console.log(
    `Publishing complete: ${successful}/${platforms.length} successful`
  );

  return results;
}

/**
 * Publish to a single platform
 */
export async function publishToPlatform(
  request: PublishRequest
): Promise<PublishResult> {
  const { platform } = request;

  switch (platform) {
    case 'linkedin':
      return await publishToLinkedIn(request);

    case 'instagram':
      return await publishToInstagram(request);

    case 'twitter':
      return await publishToTwitter(request);

    case 'discord':
      return await publishToDiscord(request);

    default:
      return {
        success: false,
        platform,
        error: `Unsupported platform: ${platform}`,
        errorCode: 'PLATFORM_ERROR',
        timestamp: new Date().toISOString(),
      };
  }
}

/**
 * Publish with retry logic and exponential backoff
 */
export async function publishWithRetry(
  publishFn: () => Promise<PublishResult>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PublishResult> {
  let lastResult: PublishResult | null = null;
  let attempt = 0;

  while (attempt < config.maxRetries) {
    try {
      const result = await publishFn();

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      lastResult = result;

      // Don't retry on auth errors (401, 403)
      if (result.errorCode === 'AUTH_ERROR') {
        console.log(
          `Auth error for ${result.platform}, not retrying`,
          result.error
        );
        return result;
      }

      // Don't retry on content errors
      if (
        result.errorCode === 'CONTENT_TOO_LONG' ||
        result.errorCode === 'INVALID_MEDIA' ||
        result.errorCode === 'INVALID_WEBHOOK' ||
        result.errorCode === 'DUPLICATE_CONTENT'
      ) {
        console.log(
          `Content error for ${result.platform}, not retrying`,
          result.error
        );
        return result;
      }

      // Retry for other errors
      attempt++;

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        console.log(
          `Retrying ${result.platform} after ${delay}ms (attempt ${attempt}/${config.maxRetries})`
        );

        await sleep(delay);
      }
    } catch (error: any) {
      console.error(`Error during publish attempt ${attempt + 1}:`, error);

      lastResult = {
        success: false,
        platform: 'unknown' as Platform,
        error: error.message || 'Unknown error',
        errorCode: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      };

      attempt++;

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        await sleep(delay);
      }
    }
  }

  // Return last result after all retries exhausted
  return (
    lastResult || {
      success: false,
      platform: 'unknown' as Platform,
      error: 'All retry attempts failed',
      errorCode: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Check rate limits for all platforms
 */
export async function checkRateLimits(
  userId: string,
  platforms: Platform[]
): Promise<
  Record<
    Platform,
    {
      remaining: number;
      total: number;
      isNearLimit: boolean;
    }
  >
> {
  const results: any = {};

  for (const platform of platforms) {
    try {
      const limit = await checkPlatformRateLimit(userId, platform);
      results[platform] = {
        ...limit,
        isNearLimit: limit.remaining < 10,
      };
    } catch (error) {
      console.error(`Failed to check rate limit for ${platform}:`, error);
      results[platform] = {
        remaining: 0,
        total: 0,
        isNearLimit: true,
      };
    }
  }

  return results;
}

/**
 * Check rate limit for a specific platform
 */
async function checkPlatformRateLimit(
  userId: string,
  platform: Platform
): Promise<{ remaining: number; total: number }> {
  // In production, implement actual rate limit checks
  // For now, return platform limits
  const config = PLATFORM_CONFIGS[platform];

  return {
    remaining: config.rateLimitPerDay || config.rateLimitPerMonth || 999,
    total: config.rateLimitPerDay || config.rateLimitPerMonth || 999,
  };
}

/**
 * Validate publish request before sending
 */
export function validatePublishRequest(
  request: MultiPlatformPublishRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate platforms
  if (!request.platforms || request.platforms.length === 0) {
    errors.push('At least one platform must be selected');
  }

  // Validate content for each platform
  for (const platform of request.platforms) {
    const content = request.content[platform];
    if (!content || content.trim().length === 0) {
      errors.push(`Content is required for ${platform}`);
      continue;
    }

    const config = PLATFORM_CONFIGS[platform];
    if (content.length > config.characterLimit) {
      errors.push(
        `Content for ${platform} exceeds ${config.characterLimit} character limit`
      );
    }
  }

  // Validate images
  if (request.images) {
    for (const platform of request.platforms) {
      const config = PLATFORM_CONFIGS[platform];

      if (platform === 'instagram' && request.images.length === 0) {
        errors.push('Instagram requires at least one image');
      }

      if (request.images.length > config.maxImages) {
        errors.push(
          `${platform} supports maximum ${config.maxImages} images`
        );
      }
    }
  }

  // Validate Discord webhook
  if (request.platforms.includes('discord')) {
    const webhookUrl = request.webhookUrls?.discord;
    if (!webhookUrl) {
      errors.push('Discord webhook URL is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format publish results for display
 */
export function formatPublishResults(results: PublishResult[]): {
  summary: string;
  successful: PublishResult[];
  failed: PublishResult[];
  totalSuccess: number;
  totalFailed: number;
} {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const summary = `Published to ${successful.length}/${results.length} platforms successfully`;

  return {
    summary,
    successful,
    failed,
    totalSuccess: successful.length,
    totalFailed: failed.length,
  };
}
