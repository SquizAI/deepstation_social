# DeepStation Social Media Publishing Service

Comprehensive multi-platform social media publishing system with automatic retry logic, rate limiting, and media optimization.

## Features

- **Multi-Platform Support**: LinkedIn, Instagram, Twitter/X, Discord
- **Automatic Retry Logic**: Exponential backoff with configurable retries
- **Rate Limit Management**: Platform-specific rate limit tracking
- **Media Optimization**: Automatic image optimization per platform
- **Error Handling**: Comprehensive error codes and messages
- **Type Safety**: Full TypeScript support

## Installation

The publishing service is already integrated into DeepStation. Just import what you need:

```typescript
import {
  publishToAllPlatforms,
  validatePublishRequest,
  formatPublishResults,
} from '@/lib/publishing';
```

## Quick Start

### Basic Publishing

```typescript
import { publishToAllPlatforms } from '@/lib/publishing';

const request = {
  userId: 'user-123',
  platforms: ['linkedin', 'twitter', 'discord'],
  content: {
    linkedin: 'Excited to announce our new AI workshop! #AI #DeepLearning',
    twitter: 'Join us for our upcoming AI workshop! 🚀 #AI',
    discord: 'Hey @everyone! New AI workshop announcement 🎉',
  },
  images: ['https://example.com/workshop-banner.jpg'],
  webhookUrls: {
    discord: 'https://discord.com/api/webhooks/...',
  },
};

const results = await publishToAllPlatforms(request);

// Check results
results.forEach((result) => {
  if (result.success) {
    console.log(`✓ Published to ${result.platform}: ${result.postUrl}`);
  } else {
    console.error(`✗ Failed to publish to ${result.platform}: ${result.error}`);
  }
});
```

### Validate Before Publishing

```typescript
import { validatePublishRequest } from '@/lib/publishing';

const validation = validatePublishRequest(request);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Proceed with publishing
const results = await publishToAllPlatforms(request);
```

### Platform-Specific Publishing

```typescript
import { publishToLinkedIn } from '@/lib/publishing/platforms/linkedin';

const result = await publishToLinkedIn({
  platform: 'linkedin',
  content: 'My LinkedIn post content',
  images: ['https://example.com/image.jpg'],
  accessToken: 'your-access-token',
  platformUserId: 'linkedin-user-id',
});
```

## Platform-Specific Details

### LinkedIn

- **Character Limit**: 3,000
- **Max Images**: 9
- **Image Formats**: JPEG, PNG
- **Rate Limit**: 500 API calls/day
- **Requirements**: `platformUserId` (LinkedIn person URN)

**Image Upload**: 2-step process
1. Register upload to get asset URN
2. Upload binary data to provided URL

```typescript
import { publishToLinkedIn } from '@/lib/publishing';

const result = await publishToLinkedIn({
  platform: 'linkedin',
  content: 'Professional post content here...',
  images: ['https://cdn.example.com/image1.jpg'],
  accessToken: linkedInToken,
  platformUserId: 'abc123', // LinkedIn user ID
});
```

### Instagram

- **Character Limit**: 2,200
- **Max Images**: 1 (single image posts)
- **Image Formats**: JPEG ONLY
- **Rate Limit**: 100 posts/24 hours
- **Requirements**: `platformUserId` (Instagram Business Account ID)

**Publishing Flow**: 3-step container process
1. Create media container
2. Poll status until FINISHED
3. Publish container

```typescript
import { publishToInstagram } from '@/lib/publishing';

// Image must be JPEG and publicly accessible
const result = await publishToInstagram({
  platform: 'instagram',
  content: 'Amazing photo! #photography',
  images: ['https://cdn.example.com/photo.jpg'], // Must be JPEG
  accessToken: instagramToken,
  platformUserId: 'instagram-business-id',
});
```

**Important**: Instagram images must be:
- JPEG format (use media optimizer to convert)
- Publicly accessible URL
- Between 320x320 and 1080x1350 pixels

### Twitter/X

- **Character Limit**: 280
- **Max Images**: 4
- **Image Formats**: JPEG, PNG, GIF
- **Rate Limit**: 500 posts/month (Free tier 2025)

**Media Upload**: 3-step chunked process
1. INIT - Initialize upload
2. APPEND - Upload base64 data
3. FINALIZE - Complete upload

```typescript
import { publishToTwitter, publishTwitterThread } from '@/lib/publishing';

// Single tweet
const result = await publishToTwitter({
  platform: 'twitter',
  content: 'Short and sweet tweet! 🐦',
  images: ['https://cdn.example.com/img1.jpg'],
  accessToken: twitterToken,
});

// Thread
const threadResult = await publishTwitterThread(
  twitterToken,
  [
    'First tweet in the thread...',
    'Second tweet continues the story...',
    'Final tweet with conclusion!',
  ],
  [
    ['https://cdn.example.com/img1.jpg'], // Images for tweet 1
    [], // No images for tweet 2
    ['https://cdn.example.com/img2.jpg'], // Images for tweet 3
  ]
);
```

### Discord

- **Character Limit**: 4,000
- **Max Images**: 10
- **Image Formats**: JPEG, PNG, GIF, WebP
- **Rate Limit**: 5 requests/2 seconds per webhook
- **Requirements**: `webhookUrl`

**Method**: Webhook-based (no OAuth required)

```typescript
import {
  publishToDiscord,
  publishDiscordEmbed,
  createAnnouncementEmbed,
} from '@/lib/publishing';

// Simple message
const result = await publishToDiscord({
  platform: 'discord',
  content: '@everyone New announcement!',
  images: ['https://cdn.example.com/banner.jpg'],
  accessToken: '', // Not needed
  webhookUrl: 'https://discord.com/api/webhooks/...',
});

// Rich embed
const embed = createAnnouncementEmbed(
  '🎤 New Speaker Announcement',
  'Join us for an amazing session on AI!',
  'https://cdn.example.com/speaker.jpg',
  [
    { name: '📋 Speaker', value: 'John Doe, AI Researcher', inline: false },
    { name: '📅 Date', value: 'October 15, 2025', inline: true },
    { name: '📍 Location', value: 'Virtual', inline: true },
  ]
);

await publishDiscordEmbed(webhookUrl, embed, '@everyone');
```

## Media Optimization

Automatically optimize images for each platform:

```typescript
import { optimizeImageForPlatform } from '@/lib/media';

// Optimize for Instagram (converts to JPEG)
const optimized = await optimizeImageForPlatform(
  imageFile, // File object
  'instagram',
  userId
);

console.log(optimized.url); // Publicly accessible URL
console.log(optimized.format); // 'jpeg'
console.log(optimized.size); // File size in bytes
```

### Platform-Specific Optimizations

- **LinkedIn**: Max 1200x1200, JPEG/PNG, 5MB
- **Instagram**: Max 1080x1350, JPEG only, 8MB
- **Twitter**: Max 1200x675, JPEG/PNG/GIF, 5MB
- **Discord**: Max 1920x1080, All formats, 8MB

## Error Handling

### Error Codes

```typescript
type PublishErrorCode =
  | 'AUTH_ERROR' // Invalid or expired token
  | 'RATE_LIMIT_EXCEEDED' // Too many requests
  | 'INVALID_MEDIA' // Image format/size issue
  | 'CONTENT_TOO_LONG' // Exceeds character limit
  | 'DUPLICATE_CONTENT' // Duplicate post
  | 'NETWORK_ERROR' // Network failure
  | 'PLATFORM_ERROR' // Platform-specific error
  | 'INVALID_WEBHOOK' // Discord webhook issue
  | 'CONTAINER_ERROR' // Instagram container issue
  | 'TIMEOUT_ERROR' // Request timeout
  | 'UNKNOWN_ERROR'; // Unexpected error
```

### Retry Logic

The publishing service automatically retries failed requests:

- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **No Retry**: Auth errors, content errors, duplicate content

```typescript
import { publishWithRetry, DEFAULT_RETRY_CONFIG } from '@/lib/publishing';

// Custom retry configuration
const customConfig = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

const result = await publishWithRetry(
  () => publishToPlatform(request),
  customConfig
);
```

## Rate Limit Management

Check rate limits before publishing:

```typescript
import { checkRateLimits } from '@/lib/publishing';

const limits = await checkRateLimits(userId, ['linkedin', 'twitter', 'instagram']);

Object.entries(limits).forEach(([platform, limit]) => {
  console.log(`${platform}: ${limit.remaining}/${limit.total}`);

  if (limit.isNearLimit) {
    console.warn(`Warning: ${platform} approaching rate limit!`);
  }
});
```

## Format Results

Get a formatted summary of publish results:

```typescript
import { formatPublishResults } from '@/lib/publishing';

const results = await publishToAllPlatforms(request);
const summary = formatPublishResults(results);

console.log(summary.summary);
// "Published to 3/4 platforms successfully"

summary.successful.forEach((result) => {
  console.log(`✓ ${result.platform}: ${result.postUrl}`);
});

summary.failed.forEach((result) => {
  console.log(`✗ ${result.platform}: ${result.error} (${result.errorCode})`);
});
```

## TypeScript Types

All types are fully documented:

```typescript
import type {
  PublishRequest,
  PublishResult,
  MultiPlatformPublishRequest,
  PlatformConfig,
  DiscordEmbed,
} from '@/lib/publishing';
```

## Environment Variables Required

```env
# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Instagram (via Facebook)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Twitter
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Discord
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Supabase (for media storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Best Practices

1. **Always validate** before publishing
2. **Check rate limits** for high-volume posting
3. **Optimize images** per platform requirements
4. **Handle errors gracefully** in your UI
5. **Log results** for debugging
6. **Use retry logic** for transient failures
7. **Store webhook URLs** securely

## Testing

```typescript
// Test individual platforms first
const linkedInResult = await publishToLinkedIn(linkedInRequest);
const twitterResult = await publishToTwitter(twitterRequest);
const instagramResult = await publishToInstagram(instagramRequest);
const discordResult = await publishToDiscord(discordRequest);

// Then test multi-platform
const allResults = await publishToAllPlatforms(multiRequest);
```

## Troubleshooting

### LinkedIn Issues

- **401/403 Error**: Token expired, refresh required
- **Upload Failed**: Check image is < 5MB and JPEG/PNG

### Instagram Issues

- **Container EXPIRED**: Image took too long to process
- **Container ERROR**: Image not JPEG or not publicly accessible
- **Rate Limit**: Max 100 posts per 24 hours

### Twitter Issues

- **Duplicate**: Same content posted recently
- **Media Failed**: Check image is < 5MB
- **Rate Limit**: 500 posts/month on free tier

### Discord Issues

- **404 Error**: Webhook deleted or invalid URL
- **Rate Limit**: Max 5 requests per 2 seconds

## Support

For issues or questions:
1. Check error code and message
2. Review platform-specific documentation
3. Check `/docs/social-media-integration-system.md`
4. Verify OAuth tokens are valid
5. Ensure images meet platform requirements
