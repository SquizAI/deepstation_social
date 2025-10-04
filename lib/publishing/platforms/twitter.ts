/**
 * Twitter/X Publishing Service
 * Handles posting tweets with media using API v2
 * Supports 3-step media upload: INIT → APPEND → FINALIZE
 */

import {
  PublishRequest,
  PublishResult,
  TwitterMediaUploadInitResponse,
  TwitterTweetResponse,
  TwitterErrorResponse,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_UPLOAD_BASE = 'https://upload.twitter.com/1.1';

/**
 * Publish content to Twitter
 */
export async function publishToTwitter(
  request: PublishRequest
): Promise<PublishResult> {
  try {
    const { content, images, accessToken } = request;

    // Validate content length
    const config = PLATFORM_CONFIGS.twitter;
    if (content.length > config.characterLimit) {
      return {
        success: false,
        platform: 'twitter',
        error: `Content exceeds ${config.characterLimit} character limit`,
        errorCode: 'CONTENT_TOO_LONG',
        timestamp: new Date().toISOString(),
      };
    }

    let mediaIds: string[] = [];

    // Upload media if provided
    if (images && images.length > 0) {
      if (images.length > config.maxImages) {
        return {
          success: false,
          platform: 'twitter',
          error: `Maximum ${config.maxImages} images allowed`,
          errorCode: 'INVALID_MEDIA',
          timestamp: new Date().toISOString(),
        };
      }

      mediaIds = await uploadTwitterMedia(accessToken, images);
    }

    // Create tweet
    const tweetResponse = await createTweet(accessToken, content, mediaIds);

    // Extract tweet ID and construct URL
    const tweetId = tweetResponse.data.id;
    // Note: Twitter username would need to be stored or fetched separately
    // For now, use a generic format
    const postUrl = `https://twitter.com/i/web/status/${tweetId}`;

    return {
      success: true,
      platform: 'twitter',
      postId: tweetId,
      postUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Twitter publish error:', error);

    // Determine error code
    let errorCode: PublishResult['errorCode'] = 'UNKNOWN_ERROR';
    if (error.status === 401 || error.status === 403) {
      errorCode = 'AUTH_ERROR';
    } else if (error.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message?.includes('duplicate')) {
      errorCode = 'DUPLICATE_CONTENT';
    } else if (error.message?.includes('media')) {
      errorCode = 'INVALID_MEDIA';
    } else if (error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      platform: 'twitter',
      error: error.message || 'Failed to publish to Twitter',
      errorCode,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Upload multiple media files to Twitter
 */
async function uploadTwitterMedia(
  accessToken: string,
  imageUrls: string[]
): Promise<string[]> {
  const mediaIds: string[] = [];

  for (const imageUrl of imageUrls) {
    const mediaId = await uploadSingleTwitterMedia(accessToken, imageUrl);
    mediaIds.push(mediaId);
  }

  return mediaIds;
}

/**
 * Upload single media file to Twitter (3-step process)
 */
async function uploadSingleTwitterMedia(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Fetch image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const totalBytes = imageBuffer.byteLength;

  // Determine media type from URL or default to JPEG
  let mediaType = 'image/jpeg';
  const urlLower = imageUrl.toLowerCase();
  if (urlLower.includes('.png')) {
    mediaType = 'image/png';
  } else if (urlLower.includes('.gif')) {
    mediaType = 'image/gif';
  }

  // Step 1: INIT
  const initParams = new URLSearchParams({
    command: 'INIT',
    total_bytes: totalBytes.toString(),
    media_type: mediaType,
  });

  const initResponse = await fetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: initParams.toString(),
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error('Twitter media INIT failed:', errorText);
    throw new Error(`Failed to initialize Twitter media upload: ${initResponse.statusText}`);
  }

  const initData: TwitterMediaUploadInitResponse = await initResponse.json();
  const mediaIdString = initData.media_id_string;

  // Step 2: APPEND
  // Convert to base64 for upload
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  const appendParams = new URLSearchParams({
    command: 'APPEND',
    media_id: mediaIdString,
    media_data: base64Image,
    segment_index: '0',
  });

  const appendResponse = await fetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: appendParams.toString(),
    }
  );

  if (!appendResponse.ok) {
    const errorText = await appendResponse.text();
    console.error('Twitter media APPEND failed:', errorText);
    throw new Error(`Failed to append Twitter media: ${appendResponse.statusText}`);
  }

  // Step 3: FINALIZE
  const finalizeParams = new URLSearchParams({
    command: 'FINALIZE',
    media_id: mediaIdString,
  });

  const finalizeResponse = await fetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: finalizeParams.toString(),
    }
  );

  if (!finalizeResponse.ok) {
    const errorText = await finalizeResponse.text();
    console.error('Twitter media FINALIZE failed:', errorText);
    throw new Error(`Failed to finalize Twitter media: ${finalizeResponse.statusText}`);
  }

  return mediaIdString;
}

/**
 * Create a tweet with optional media
 */
async function createTweet(
  accessToken: string,
  text: string,
  mediaIds: string[]
): Promise<TwitterTweetResponse> {
  const tweetData: any = {
    text: text,
  };

  if (mediaIds.length > 0) {
    tweetData.media = {
      media_ids: mediaIds,
    };
  }

  const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetData),
  });

  if (!response.ok) {
    const errorData: TwitterErrorResponse = await response.json().catch(() => ({}));
    console.error('Twitter tweet creation failed:', errorData);

    let errorMessage = `Failed to create tweet: ${response.statusText}`;

    // Parse Twitter error format
    if (errorData.errors && errorData.errors.length > 0) {
      errorMessage = errorData.errors[0].message;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.title) {
      errorMessage = errorData.title;
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

/**
 * Create a Twitter thread (multiple connected tweets)
 */
export async function publishTwitterThread(
  accessToken: string,
  tweets: string[],
  imageUrlsPerTweet?: string[][]
): Promise<PublishResult> {
  try {
    let previousTweetId: string | null = null;
    const tweetIds: string[] = [];

    for (let i = 0; i < tweets.length; i++) {
      const text = tweets[i];
      const imageUrls = imageUrlsPerTweet?.[i] || [];

      // Validate length
      if (text.length > PLATFORM_CONFIGS.twitter.characterLimit) {
        return {
          success: false,
          platform: 'twitter',
          error: `Tweet ${i + 1} exceeds 280 character limit`,
          errorCode: 'CONTENT_TOO_LONG',
          timestamp: new Date().toISOString(),
        };
      }

      // Upload media if needed
      let mediaIds: string[] = [];
      if (imageUrls.length > 0) {
        mediaIds = await uploadTwitterMedia(accessToken, imageUrls);
      }

      // Build tweet data
      const tweetData: any = {
        text: text,
      };

      // Add reply reference for thread
      if (previousTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: previousTweetId,
        };
      }

      // Add media if present
      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      // Create tweet
      const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create tweet ${i + 1}: ${response.statusText}`
        );
      }

      const result: TwitterTweetResponse = await response.json();
      previousTweetId = result.data.id;
      tweetIds.push(result.data.id);
    }

    // Return first tweet URL
    const firstTweetUrl = `https://twitter.com/i/web/status/${tweetIds[0]}`;

    return {
      success: true,
      platform: 'twitter',
      postId: tweetIds[0],
      postUrl: firstTweetUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Twitter thread publish error:', error);

    return {
      success: false,
      platform: 'twitter',
      error: error.message || 'Failed to publish Twitter thread',
      errorCode: 'PLATFORM_ERROR',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check Twitter rate limit (estimated)
 */
export async function checkTwitterRateLimit(
  userId: string
): Promise<{ remaining: number; total: number }> {
  // In production, track this in your database
  // For now, return the monthly limit
  return {
    remaining: 500, // Twitter free tier: 500 posts/month
    total: 500,
  };
}
