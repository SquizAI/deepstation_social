/**
 * Discord Publishing Service
 * Handles posting messages via webhooks with rich embeds and attachments
 */

import {
  PublishRequest,
  PublishResult,
  DiscordEmbed,
  DiscordWebhookPayload,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';

/**
 * Publish content to Discord via webhook
 */
export async function publishToDiscord(
  request: PublishRequest
): Promise<PublishResult> {
  try {
    const { content, images, webhookUrl } = request;

    // Validate webhook URL
    if (!webhookUrl) {
      return {
        success: false,
        platform: 'discord',
        error: 'Discord webhook URL is required',
        errorCode: 'INVALID_WEBHOOK',
        timestamp: new Date().toISOString(),
      };
    }

    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return {
        success: false,
        platform: 'discord',
        error: 'Invalid Discord webhook URL format',
        errorCode: 'INVALID_WEBHOOK',
        timestamp: new Date().toISOString(),
      };
    }

    // Validate content length
    const config = PLATFORM_CONFIGS.discord;
    if (content.length > config.characterLimit) {
      return {
        success: false,
        platform: 'discord',
        error: `Content exceeds ${config.characterLimit} character limit`,
        errorCode: 'CONTENT_TOO_LONG',
        timestamp: new Date().toISOString(),
      };
    }

    // Post to Discord with images
    const response = await postDiscordMessage(
      webhookUrl,
      content,
      images
    );

    return {
      success: true,
      platform: 'discord',
      postUrl: response.url || webhookUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Discord publish error:', error);

    // Determine error code
    let errorCode: PublishResult['errorCode'] = 'UNKNOWN_ERROR';
    if (error.status === 404) {
      errorCode = 'INVALID_WEBHOOK';
    } else if (error.status === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      platform: 'discord',
      error: error.message || 'Failed to publish to Discord',
      errorCode,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Post message to Discord webhook
 */
async function postDiscordMessage(
  webhookUrl: string,
  content: string,
  imageUrls?: string[]
): Promise<{ url?: string }> {
  const formData = new FormData();

  // Build payload
  const payload: DiscordWebhookPayload = {
    content: content,
    username: 'DeepStation',
    avatar_url: 'https://deepstation.ai/logo.png',
  };

  formData.append('payload_json', JSON.stringify(payload));

  // Attach images as files
  if (imageUrls && imageUrls.length > 0) {
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];

      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image ${i + 1}: ${imageUrl}`);
          continue;
        }

        const imageBlob = await imageResponse.blob();
        const fileName = `image_${i + 1}.${getFileExtensionFromUrl(imageUrl) || 'jpg'}`;

        formData.append(`file${i}`, imageBlob, fileName);
      } catch (error) {
        console.error(`Error attaching image ${i + 1}:`, error);
      }
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Discord webhook failed:', errorText);

    const error: any = new Error(
      `Discord webhook failed: ${response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  // Discord webhooks don't return a post ID, but we can return the webhook URL
  return { url: webhookUrl };
}

/**
 * Post rich embed to Discord
 */
export async function publishDiscordEmbed(
  webhookUrl: string,
  embed: DiscordEmbed,
  content?: string
): Promise<PublishResult> {
  try {
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return {
        success: false,
        platform: 'discord',
        error: 'Invalid Discord webhook URL format',
        errorCode: 'INVALID_WEBHOOK',
        timestamp: new Date().toISOString(),
      };
    }

    const payload: DiscordWebhookPayload = {
      username: 'DeepStation',
      avatar_url: 'https://deepstation.ai/logo.png',
      embeds: [embed],
    };

    if (content) {
      payload.content = content;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord embed post failed:', errorText);

      const error: any = new Error(
        `Failed to post Discord embed: ${response.statusText}`
      );
      error.status = response.status;
      throw error;
    }

    return {
      success: true,
      platform: 'discord',
      postUrl: webhookUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Discord embed publish error:', error);

    return {
      success: false,
      platform: 'discord',
      error: error.message || 'Failed to publish Discord embed',
      errorCode: error.status === 404 ? 'INVALID_WEBHOOK' : 'PLATFORM_ERROR',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create a rich embed for announcements
 */
export function createAnnouncementEmbed(
  title: string,
  description: string,
  imageUrl?: string,
  fields?: Array<{ name: string; value: string; inline?: boolean }>
): DiscordEmbed {
  const embed: DiscordEmbed = {
    title: title,
    description: description,
    color: 0x5865F2, // Discord blurple
    footer: {
      text: 'DeepStation • AI Education & Community',
      icon_url: 'https://deepstation.ai/favicon.ico',
    },
    timestamp: new Date().toISOString(),
  };

  if (imageUrl) {
    embed.image = { url: imageUrl };
  }

  if (fields && fields.length > 0) {
    embed.fields = fields;
  }

  return embed;
}

/**
 * Validate Discord webhook URL format
 */
function isValidDiscordWebhookUrl(url: string): boolean {
  try {
    const webhookUrl = new URL(url);
    return (
      webhookUrl.hostname === 'discord.com' ||
      webhookUrl.hostname === 'discordapp.com'
    ) && webhookUrl.pathname.includes('/api/webhooks/');
  } catch {
    return false;
  }
}

/**
 * Extract file extension from URL
 */
function getFileExtensionFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Rate limit tracking for Discord webhooks
 * Note: Discord webhooks have a limit of 5 requests per 2 seconds
 */
export class DiscordRateLimiter {
  private requests: number[] = [];
  private readonly windowMs = 2000; // 2 seconds
  private readonly maxRequests = 5;

  /**
   * Check if we can make a request
   */
  canMakeRequest(): boolean {
    this.cleanOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Wait until we can make a request
   */
  async waitForSlot(): Promise<void> {
    while (!this.canMakeRequest()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.cleanOldRequests();
    }
    this.recordRequest();
  }

  /**
   * Clean up old requests outside the time window
   */
  private cleanOldRequests(): void {
    const now = Date.now();
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
  }
}
