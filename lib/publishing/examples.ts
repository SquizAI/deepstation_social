/**
 * Publishing Service Usage Examples
 * Demonstrates common use cases for the DeepStation publishing service
 */

import {
  publishToAllPlatforms,
  validatePublishRequest,
  formatPublishResults,
  checkRateLimits,
  type MultiPlatformPublishRequest,
} from './index';

import { optimizeImageForPlatform } from '../media';

/**
 * Example 1: Simple multi-platform post with validation
 */
export async function publishSimplePost() {
  const request: MultiPlatformPublishRequest = {
    userId: 'user-123',
    platforms: ['linkedin', 'twitter'],
    content: {
      linkedin:
        'Excited to share our latest AI workshop! Join us to learn about cutting-edge machine learning techniques. #AI #MachineLearning',
      twitter:
        'New AI workshop alert! 🚀 Learn cutting-edge ML techniques with us. #AI #MachineLearning',
      instagram: '',
      discord: '',
    },
    images: ['https://cdn.deepstation.ai/workshop-banner.jpg'],
  };

  // Validate before publishing
  const validation = validatePublishRequest(request);
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    return;
  }

  // Publish to all platforms
  const results = await publishToAllPlatforms(request);

  // Format and display results
  const summary = formatPublishResults(results);
  console.log(summary.summary);

  summary.successful.forEach((result) => {
    console.log(`✓ ${result.platform}: ${result.postUrl}`);
  });

  summary.failed.forEach((result) => {
    console.log(
      `✗ ${result.platform}: ${result.error} (${result.errorCode})`
    );
  });

  return results;
}

/**
 * Example 2: Instagram-only post with image optimization
 */
export async function publishInstagramPost(imageFile: File, userId: string) {
  // Optimize image for Instagram (converts to JPEG if needed)
  const optimizedImage = await optimizeImageForPlatform(
    imageFile,
    'instagram',
    userId
  );

  console.log('Image optimized:', optimizedImage);

  const request: MultiPlatformPublishRequest = {
    userId,
    platforms: ['instagram'],
    content: {
      instagram:
        'Beautiful sunset over the mountains! 🌄 #photography #nature #sunset',
      linkedin: '',
      twitter: '',
      discord: '',
    },
    images: [optimizedImage.url],
  };

  const results = await publishToAllPlatforms(request);
  return results[0]; // Return Instagram result
}

/**
 * Example 3: Discord announcement with embed
 */
export async function publishDiscordAnnouncement() {
  // For Discord, we can use simple content or rich embeds
  const request: MultiPlatformPublishRequest = {
    userId: 'user-123',
    platforms: ['discord'],
    content: {
      discord: '@everyone New speaker announcement! 🎤',
      linkedin: '',
      twitter: '',
      instagram: '',
    },
    images: ['https://cdn.deepstation.ai/speaker-headshot.jpg'],
    webhookUrls: {
      discord: process.env.DISCORD_WEBHOOK_URL!,
    },
  };

  const results = await publishToAllPlatforms(request);
  return results[0];
}

/**
 * Example 4: Check rate limits before bulk posting
 */
export async function checkRateLimitsBeforePublishing(userId: string) {
  const platforms = ['linkedin', 'twitter', 'instagram'] as const;

  // Check rate limits
  const limits = await checkRateLimits(userId, [...platforms]);

  console.log('Rate Limits:');
  Object.entries(limits).forEach(([platform, limit]) => {
    console.log(
      `${platform}: ${limit.remaining}/${limit.total} remaining`
    );

    if (limit.isNearLimit) {
      console.warn(`⚠️  Warning: ${platform} is near rate limit!`);
    }
  });

  // Only proceed if all platforms have capacity
  const allPlatformsOk = Object.values(limits).every(
    (limit) => !limit.isNearLimit
  );

  if (!allPlatformsOk) {
    console.error('Some platforms are near rate limit. Aborting.');
    return false;
  }

  return true;
}

/**
 * Example 5: Publishing with custom error handling
 */
export async function publishWithCustomErrorHandling() {
  const request: MultiPlatformPublishRequest = {
    userId: 'user-123',
    platforms: ['linkedin', 'twitter', 'instagram', 'discord'],
    content: {
      linkedin: 'Professional post content for LinkedIn...',
      twitter: 'Short tweet for Twitter! 🐦',
      instagram: 'Instagram caption with hashtags #photo',
      discord: '@everyone Discord announcement!',
    },
    images: ['https://cdn.deepstation.ai/post-image.jpg'],
    webhookUrls: {
      discord: process.env.DISCORD_WEBHOOK_URL!,
    },
  };

  const results = await publishToAllPlatforms(request);

  // Custom error handling per platform
  results.forEach((result) => {
    if (result.success) {
      // Success - store in database, notify user, etc.
      console.log(`✓ Published to ${result.platform}`);
      // saveToDatabase(result);
      // notifyUser('success', result);
    } else {
      // Failure - handle specific error codes
      switch (result.errorCode) {
        case 'AUTH_ERROR':
          console.error(`${result.platform} auth error - need to reconnect`);
          // redirectToOAuthFlow(result.platform);
          break;

        case 'RATE_LIMIT_EXCEEDED':
          console.error(`${result.platform} rate limit - schedule for later`);
          // scheduleForLater(result.platform, request);
          break;

        case 'CONTENT_TOO_LONG':
          console.error(`${result.platform} content too long - need to edit`);
          // suggestContentEdit(result.platform, request.content);
          break;

        case 'INVALID_MEDIA':
          console.error(`${result.platform} media error - check format`);
          // showMediaError(result.error);
          break;

        default:
          console.error(`${result.platform} error: ${result.error}`);
          // logError(result);
      }
    }
  });

  return results;
}

/**
 * Example 6: Schedule post for later (with validation)
 */
export async function schedulePostForLater(
  request: MultiPlatformPublishRequest,
  scheduledTime: Date
) {
  // Validate the request first
  const validation = validatePublishRequest(request);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // Check rate limits
  const limits = await checkRateLimits(request.userId, request.platforms);
  const nearLimit = Object.values(limits).some((l) => l.isNearLimit);

  if (nearLimit) {
    console.warn('Some platforms near rate limit - consider rescheduling');
  }

  // In a real implementation, save to database with scheduled_for timestamp
  // For now, just return the prepared request
  return {
    success: true,
    scheduledFor: scheduledTime,
    request,
    validation,
    rateLimits: limits,
  };
}

/**
 * Example 7: Publish to single platform with custom retry
 */
export async function publishToSinglePlatform() {
  const { publishToLinkedIn } = await import('./platforms/linkedin');
  const { publishWithRetry } = await import('./unified-publisher');

  const customRetryConfig = {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  };

  const result = await publishWithRetry(
    () =>
      publishToLinkedIn({
        platform: 'linkedin',
        content: 'My LinkedIn post',
        images: [],
        accessToken: 'token',
        platformUserId: 'user-id',
      }),
    customRetryConfig
  );

  return result;
}

/**
 * Example 8: Batch publishing multiple posts
 */
export async function batchPublishPosts(
  posts: Array<{
    content: Record<string, string>;
    images?: string[];
    platforms: Array<'linkedin' | 'twitter' | 'instagram' | 'discord'>;
  }>,
  userId: string
) {
  const results = [];

  for (const post of posts) {
    const request: MultiPlatformPublishRequest = {
      userId,
      platforms: post.platforms,
      content: post.content as any,
      images: post.images,
    };

    // Add delay between posts to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const postResults = await publishToAllPlatforms(request);
    results.push(postResults);
  }

  // Aggregate results
  const totalPosts = results.flat().length;
  const successfulPosts = results.flat().filter((r) => r.success).length;

  console.log(`Batch complete: ${successfulPosts}/${totalPosts} successful`);

  return results;
}

/**
 * Example 9: Platform-specific content adaptation
 */
export function adaptContentForPlatforms(baseContent: string): Record<
  string,
  string
> {
  return {
    linkedin: `${baseContent}\n\n#DeepStation #AI #MachineLearning`,
    twitter: `${baseContent.substring(0, 240)} 🚀 #AI #ML`,
    instagram: `${baseContent}\n\n📸 Follow for more!\n\n#ai #machinelearning #tech`,
    discord: `@everyone ${baseContent}`,
  };
}

/**
 * Example 10: Error recovery and retry
 */
export async function publishWithRetryOnFailure(
  request: MultiPlatformPublishRequest,
  maxAttempts: number = 3
) {
  let attempts = 0;
  let results;

  while (attempts < maxAttempts) {
    results = await publishToAllPlatforms(request);

    const failed = results.filter((r) => !r.success);

    if (failed.length === 0) {
      // All succeeded
      console.log('All platforms published successfully!');
      return { success: true, results };
    }

    // Check if failures are retryable
    const retryable = failed.filter(
      (r) =>
        r.errorCode !== 'AUTH_ERROR' &&
        r.errorCode !== 'CONTENT_TOO_LONG' &&
        r.errorCode !== 'INVALID_MEDIA'
    );

    if (retryable.length === 0) {
      // No retryable failures
      console.log('No retryable failures, stopping.');
      return { success: false, results };
    }

    // Retry only failed platforms
    request.platforms = retryable.map((r) => r.platform);
    attempts++;

    console.log(
      `Retrying ${request.platforms.length} failed platforms (attempt ${attempts}/${maxAttempts})`
    );

    // Wait before retry
    await new Promise((resolve) =>
      setTimeout(resolve, 5000 * attempts)
    );
  }

  return { success: false, results };
}
