/**
 * Instagram Publishing Service
 * Handles posting images to Instagram using Graph API v23.0+
 * Uses container-based publishing (3-step process)
 */

import {
  PublishRequest,
  PublishResult,
  InstagramContainerResponse,
  InstagramContainerStatus,
  InstagramPublishResponse,
  InstagramRateLimitResponse,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v23.0';

/**
 * Publish content to Instagram
 */
export async function publishToInstagram(
  request: PublishRequest
): Promise<PublishResult> {
  try {
    const { content, images, accessToken, platformUserId } = request;

    // Validate content length
    const config = PLATFORM_CONFIGS.instagram;
    if (content.length > config.characterLimit) {
      return {
        success: false,
        platform: 'instagram',
        error: `Content exceeds ${config.characterLimit} character limit`,
        errorCode: 'CONTENT_TOO_LONG',
        timestamp: new Date().toISOString(),
      };
    }

    if (!platformUserId) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram User ID is required',
        errorCode: 'AUTH_ERROR',
        timestamp: new Date().toISOString(),
      };
    }

    // Instagram requires at least one image
    if (!images || images.length === 0) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram requires at least one image',
        errorCode: 'INVALID_MEDIA',
        timestamp: new Date().toISOString(),
      };
    }

    // Instagram only supports single image posts (for now)
    const imageUrl = images[0];

    // Check rate limit before posting
    const rateLimitCheck = await checkInstagramRateLimit(
      accessToken,
      platformUserId
    );
    if (rateLimitCheck.quota_usage >= 95) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Instagram rate limit nearly reached (95/100 posts in 24hrs)',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      };
    }

    // Step 1: Create media container
    const containerId = await createInstagramContainer(
      accessToken,
      platformUserId,
      imageUrl,
      content
    );

    // Step 2: Poll container status until FINISHED
    const containerStatus = await pollContainerStatus(
      accessToken,
      containerId,
      5, // max attempts
      1000 // 1 second delay
    );

    if (containerStatus !== 'FINISHED') {
      return {
        success: false,
        platform: 'instagram',
        error: `Container status: ${containerStatus}`,
        errorCode: 'CONTAINER_ERROR',
        timestamp: new Date().toISOString(),
      };
    }

    // Step 3: Publish container
    const publishResponse = await publishInstagramContainer(
      accessToken,
      platformUserId,
      containerId
    );

    // Construct post URL (Instagram media ID format)
    const postId = publishResponse.id;
    const postUrl = `https://www.instagram.com/p/${postId}`;

    return {
      success: true,
      platform: 'instagram',
      postId,
      postUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Instagram publish error:', error);

    // Determine error code
    let errorCode: PublishResult['errorCode'] = 'UNKNOWN_ERROR';
    if (error.status === 401 || error.status === 403) {
      errorCode = 'AUTH_ERROR';
    } else if (error.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message?.includes('JPEG') || error.message?.includes('format')) {
      errorCode = 'INVALID_MEDIA';
    } else if (error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorCode = 'TIMEOUT_ERROR';
    }

    return {
      success: false,
      platform: 'instagram',
      error: error.message || 'Failed to publish to Instagram',
      errorCode,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Step 1: Create media container
 */
async function createInstagramContainer(
  accessToken: string,
  igUserId: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${igUserId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Instagram container creation failed:', errorData);

    const error: any = new Error(
      errorData.error?.message ||
        `Failed to create Instagram container: ${response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  const data: InstagramContainerResponse = await response.json();
  return data.id;
}

/**
 * Step 2: Poll container status until FINISHED
 */
async function pollContainerStatus(
  accessToken: string,
  containerId: string,
  maxAttempts: number = 5,
  delayMs: number = 1000
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Wait before checking status (except first attempt)
    if (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Instagram status check failed:', errorData);
      throw new Error(
        `Failed to check container status: ${response.statusText}`
      );
    }

    const statusData: InstagramContainerStatus = await response.json();
    const status = statusData.status_code;

    // Return immediately if finished or error
    if (status === 'FINISHED' || status === 'ERROR' || status === 'EXPIRED') {
      return status;
    }

    attempts++;
  }

  // Timeout after max attempts
  throw new Error(
    `Container status check timeout after ${maxAttempts} attempts`
  );
}

/**
 * Step 3: Publish the container
 */
async function publishInstagramContainer(
  accessToken: string,
  igUserId: string,
  containerId: string
): Promise<InstagramPublishResponse> {
  const response = await fetch(
    `${INSTAGRAM_API_BASE}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Instagram publish failed:', errorData);

    const error: any = new Error(
      errorData.error?.message ||
        `Failed to publish Instagram container: ${response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

/**
 * Check Instagram rate limit (100 posts per 24 hours)
 */
export async function checkInstagramRateLimit(
  accessToken: string,
  igUserId: string
): Promise<{ quota_usage: number; quota_total: number }> {
  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/${igUserId}/content_publishing_limit?access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error('Failed to check Instagram rate limit');
      // Return safe defaults
      return {
        quota_usage: 0,
        quota_total: 100,
      };
    }

    const data: InstagramRateLimitResponse = await response.json();

    return {
      quota_usage: data.data.quota_usage,
      quota_total: data.data.config.quota_total,
    };
  } catch (error) {
    console.error('Instagram rate limit check error:', error);
    return {
      quota_usage: 0,
      quota_total: 100,
    };
  }
}

/**
 * Validate that image is in JPEG format and publicly accessible
 */
export function validateInstagramImage(imageUrl: string): {
  valid: boolean;
  error?: string;
} {
  // Check if URL is accessible (basic check)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return {
      valid: false,
      error: 'Image must be a public HTTP/HTTPS URL',
    };
  }

  // Check file extension (basic validation)
  const urlLower = imageUrl.toLowerCase();
  const hasJpegExtension =
    urlLower.endsWith('.jpg') ||
    urlLower.endsWith('.jpeg') ||
    urlLower.includes('.jpg?') ||
    urlLower.includes('.jpeg?');

  if (!hasJpegExtension) {
    return {
      valid: false,
      error: 'Instagram only supports JPEG images. Please convert to JPEG format.',
    };
  }

  return { valid: true };
}
