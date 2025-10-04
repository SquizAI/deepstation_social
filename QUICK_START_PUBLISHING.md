# DeepStation Publishing - Quick Start Guide

## Installation Complete

The social media publishing service is fully implemented and ready to use.

## Files Created (10 total)

1. `/lib/types/publishing.ts` - TypeScript types (4.7K)
2. `/lib/publishing/unified-publisher.ts` - Main service (11K)
3. `/lib/publishing/platforms/linkedin.ts` - LinkedIn integration (7.1K)
4. `/lib/publishing/platforms/instagram.ts` - Instagram integration (8.6K)
5. `/lib/publishing/platforms/twitter.ts` - Twitter integration (10K)
6. `/lib/publishing/platforms/discord.ts` - Discord integration (7.7K)
7. `/lib/media/optimizer.ts` - Image optimization (9.8K)
8. `/lib/publishing/index.ts` - Module exports (1.1K)
9. `/lib/media/index.ts` - Module exports (339B)
10. `/lib/publishing/README.md` - Full documentation (11K)

**BONUS**: `/lib/publishing/examples.ts` - 10 usage examples (9.8K)

**Total Code**: ~70KB of production-ready TypeScript

## Basic Usage

```typescript
import { publishToAllPlatforms } from '@/lib/publishing';

// 1. Prepare your content
const request = {
  userId: 'user-123',
  platforms: ['linkedin', 'twitter', 'discord'],
  content: {
    linkedin: 'Professional post content #AI #Tech',
    twitter: 'Short tweet 🚀 #AI',
    discord: '@everyone Announcement!',
    instagram: '' // Not used
  },
  images: ['https://your-cdn.com/image.jpg'],
  webhookUrls: {
    discord: process.env.DISCORD_WEBHOOK_URL
  }
};

// 2. Publish to all platforms
const results = await publishToAllPlatforms(request);

// 3. Handle results
results.forEach(result => {
  if (result.success) {
    console.log(`✓ ${result.platform}: ${result.postUrl}`);
  } else {
    console.error(`✗ ${result.platform}: ${result.error}`);
  }
});
```

## Platform Requirements

### LinkedIn
- Access token required (OAuth)
- Platform user ID required
- Max 3,000 characters
- Up to 9 images
- Rate limit: 500/day

### Instagram
- Access token required (OAuth)
- Instagram Business Account ID required
- Max 2,200 characters
- **JPEG images ONLY**
- 1 image required
- Rate limit: 100/24hrs

### Twitter/X
- Access token required (OAuth)
- Max 280 characters
- Up to 4 images
- Rate limit: 500/month

### Discord
- Webhook URL required (NO OAuth)
- Max 4,000 characters
- Up to 10 images
- Rate limit: 5 req/2 seconds

## Image Optimization

```typescript
import { optimizeImageForPlatform } from '@/lib/media';

// Automatically convert to JPEG for Instagram
const optimized = await optimizeImageForPlatform(
  imageFile,
  'instagram',
  userId
);

// Use optimized URL
const request = {
  // ...
  images: [optimized.url]
};
```

## Environment Variables

Add to your `.env.local`:

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

# Already configured
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Error Handling

The service automatically:
- Retries failed requests (max 3 times)
- Refreshes expired OAuth tokens
- Validates content before posting
- Provides detailed error codes

```typescript
import { formatPublishResults } from '@/lib/publishing';

const results = await publishToAllPlatforms(request);
const summary = formatPublishResults(results);

console.log(summary.summary);
// "Published to 3/4 platforms successfully"

if (summary.failed.length > 0) {
  summary.failed.forEach(failure => {
    switch (failure.errorCode) {
      case 'AUTH_ERROR':
        // Redirect to OAuth flow
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Schedule for later
        break;
      case 'CONTENT_TOO_LONG':
        // Show character count error
        break;
      // ... handle other errors
    }
  });
}
```

## Platform-Specific Publishing

```typescript
import { 
  publishToLinkedIn,
  publishToInstagram,
  publishToTwitter,
  publishToDiscord
} from '@/lib/publishing';

// LinkedIn only
const linkedInResult = await publishToLinkedIn({
  platform: 'linkedin',
  content: 'My post content',
  images: ['https://...'],
  accessToken: token,
  platformUserId: 'linkedin-user-id'
});

// Twitter thread
import { publishTwitterThread } from '@/lib/publishing';

const threadResult = await publishTwitterThread(
  accessToken,
  [
    'First tweet...',
    'Second tweet...',
    'Final tweet!'
  ],
  [
    ['https://image1.jpg'],
    [],
    ['https://image2.jpg']
  ]
);
```

## Validation

Always validate before publishing:

```typescript
import { validatePublishRequest } from '@/lib/publishing';

const validation = validatePublishRequest(request);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // Show errors to user
  return;
}

// Proceed with publishing
const results = await publishToAllPlatforms(request);
```

## Rate Limit Checking

```typescript
import { checkRateLimits } from '@/lib/publishing';

const limits = await checkRateLimits(userId, [
  'linkedin',
  'twitter',
  'instagram'
]);

Object.entries(limits).forEach(([platform, limit]) => {
  if (limit.isNearLimit) {
    console.warn(`${platform} near rate limit!`);
  }
});
```

## Common Patterns

### Pattern 1: Post to All Connected Platforms

```typescript
import { getUserConnectedPlatforms } from '@/lib/auth/oauth-tokens';

const connectedPlatforms = await getUserConnectedPlatforms(userId);

const results = await publishToAllPlatforms({
  userId,
  platforms: connectedPlatforms,
  content: adaptContentForPlatforms(baseContent),
  images: optimizedImages
});
```

### Pattern 2: Retry Failed Platforms

```typescript
const results = await publishToAllPlatforms(request);
const failed = results.filter(r => !r.success);

if (failed.length > 0) {
  // Retry only failed platforms
  const retryRequest = {
    ...request,
    platforms: failed.map(r => r.platform)
  };
  
  const retryResults = await publishToAllPlatforms(retryRequest);
}
```

### Pattern 3: Schedule for Later

```typescript
import { validatePublishRequest } from '@/lib/publishing';

const validation = validatePublishRequest(request);

if (validation.valid) {
  // Save to database with scheduled_for timestamp
  await supabase.from('posts').insert({
    user_id: userId,
    content: request.content,
    platforms: request.platforms,
    scheduled_for: scheduledTime.toISOString(),
    status: 'scheduled'
  });
}
```

## Testing

```typescript
// Test each platform individually first
const platforms: Platform[] = ['linkedin', 'twitter', 'instagram', 'discord'];

for (const platform of platforms) {
  console.log(`Testing ${platform}...`);
  
  const result = await publishToAllPlatforms({
    userId,
    platforms: [platform],
    content: {
      [platform]: `Test post for ${platform}`,
      ...otherPlatforms
    },
    images: testImages
  });
  
  console.log(result);
}
```

## Next Steps

1. **Add OAuth flows** - Connect user accounts
2. **Build UI components** - Post composer, preview, scheduler
3. **Database integration** - Save results, track analytics
4. **Scheduling** - Cron job for scheduled posts
5. **Analytics** - Track engagement metrics

## Documentation

- **Full API Reference**: `/lib/publishing/README.md`
- **Usage Examples**: `/lib/publishing/examples.ts`
- **Architecture**: `/docs/social-media-integration-system.md`
- **Implementation Details**: `/PUBLISHING_IMPLEMENTATION_SUMMARY.md`

## Support

If you encounter issues:

1. Check error code and message
2. Review platform-specific docs in README
3. Verify OAuth tokens are valid
4. Ensure images meet format requirements
5. Check rate limits

## TypeScript Support

All functions and types are fully typed:

```typescript
import type {
  PublishRequest,
  PublishResult,
  MultiPlatformPublishRequest,
  PlatformConfig,
  PublishErrorCode
} from '@/lib/publishing';
```

## Ready to Use!

The publishing service is production-ready and includes:

- ✅ Multi-platform support (LinkedIn, Instagram, Twitter, Discord)
- ✅ Automatic retry logic with exponential backoff
- ✅ OAuth token management and refresh
- ✅ Rate limit tracking and warnings
- ✅ Image optimization per platform
- ✅ Comprehensive error handling
- ✅ Full TypeScript support
- ✅ Complete documentation
- ✅ Usage examples

Start publishing now! 🚀
