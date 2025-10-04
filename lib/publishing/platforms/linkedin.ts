/**
 * LinkedIn Publishing Service
 * Handles posting text and images to LinkedIn using v2 API
 */

import {
  PublishRequest,
  PublishResult,
  LinkedInImageAsset,
  LinkedInPostResponse,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

/**
 * Publish content to LinkedIn
 */
export async function publishToLinkedIn(
  request: PublishRequest
): Promise<PublishResult> {
  try {
    const { content, images, accessToken, platformUserId } = request;

    // Validate content length
    const config = PLATFORM_CONFIGS.linkedin;
    if (content.length > config.characterLimit) {
      return {
        success: false,
        platform: 'linkedin',
        error: `Content exceeds ${config.characterLimit} character limit`,
        errorCode: 'CONTENT_TOO_LONG',
        timestamp: new Date().toISOString(),
      };
    }

    if (!platformUserId) {
      return {
        success: false,
        platform: 'linkedin',
        error: 'Platform user ID is required for LinkedIn',
        errorCode: 'AUTH_ERROR',
        timestamp: new Date().toISOString(),
      };
    }

    // Build author URN
    const authorUrn = `urn:li:person:${platformUserId}`;

    let mediaAssets: string[] = [];

    // Upload images if provided
    if (images && images.length > 0) {
      if (images.length > config.maxImages) {
        return {
          success: false,
          platform: 'linkedin',
          error: `Maximum ${config.maxImages} images allowed`,
          errorCode: 'INVALID_MEDIA',
          timestamp: new Date().toISOString(),
        };
      }

      mediaAssets = await uploadLinkedInImages(
        accessToken,
        authorUrn,
        images
      );
    }

    // Create post
    const postResponse = await createLinkedInPost(
      accessToken,
      authorUrn,
      content,
      mediaAssets
    );

    // Extract post ID and construct URL
    const postId = postResponse.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    return {
      success: true,
      platform: 'linkedin',
      postId,
      postUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('LinkedIn publish error:', error);

    // Determine error code
    let errorCode: PublishResult['errorCode'] = 'UNKNOWN_ERROR';
    if (error.status === 401 || error.status === 403) {
      errorCode = 'AUTH_ERROR';
    } else if (error.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      platform: 'linkedin',
      error: error.message || 'Failed to publish to LinkedIn',
      errorCode,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Upload multiple images to LinkedIn
 */
async function uploadLinkedInImages(
  accessToken: string,
  authorUrn: string,
  imageUrls: string[]
): Promise<string[]> {
  const assets: string[] = [];

  for (const imageUrl of imageUrls) {
    const asset = await uploadLinkedInImage(accessToken, authorUrn, imageUrl);
    assets.push(asset);
  }

  return assets;
}

/**
 * Upload a single image to LinkedIn (2-step process)
 */
async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string
): Promise<string> {
  // Step 1: Register upload
  const registerResponse = await fetch(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    }
  );

  if (!registerResponse.ok) {
    const errorText = await registerResponse.text();
    console.error('LinkedIn register upload failed:', errorText);
    throw new Error(
      `Failed to register LinkedIn upload: ${registerResponse.statusText}`
    );
  }

  const registerData = await registerResponse.json();
  const uploadUrl =
    registerData.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Upload image binary
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('LinkedIn image upload failed:', errorText);
    throw new Error(
      `Failed to upload image to LinkedIn: ${uploadResponse.statusText}`
    );
  }

  return asset;
}

/**
 * Create LinkedIn post with optional media
 */
async function createLinkedInPost(
  accessToken: string,
  authorUrn: string,
  content: string,
  mediaAssets: string[]
): Promise<LinkedInPostResponse> {
  const postData: any = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: mediaAssets.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // Add media if present
  if (mediaAssets.length > 0) {
    postData.specificContent['com.linkedin.ugc.ShareContent'].media =
      mediaAssets.map((asset) => ({
        status: 'READY',
        description: {
          text: 'DeepStation Post',
        },
        media: asset,
        title: {
          text: 'Image',
        },
      }));
  }

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LinkedIn post creation failed:', errorText);

    const error: any = new Error(
      `Failed to create LinkedIn post: ${response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

/**
 * Check LinkedIn rate limit (estimated)
 * Note: LinkedIn doesn't provide a direct rate limit endpoint
 * This is a placeholder for tracking on our side
 */
export async function checkLinkedInRateLimit(
  userId: string
): Promise<{ remaining: number; total: number }> {
  // In production, track this in your database
  // For now, return the daily limit
  return {
    remaining: 500, // LinkedIn limit: 500 calls/day
    total: 500,
  };
}
