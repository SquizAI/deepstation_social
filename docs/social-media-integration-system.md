# Social Media Integration System

## Overview
This document outlines the architecture for DeepStation's direct social media integration system. The platform connects with LinkedIn, Instagram, X (Twitter), and Discord to enable automated posting with scheduling capabilities while maintaining brand standards.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DeepStation Platform                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │   Database   │     │
│  │   Next.js    │←→│   API Layer  │←→│  Supabase    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           ↓                                  │
│                  ┌────────────────┐                         │
│                  │  OAuth Manager │                         │
│                  └────────────────┘                         │
│                           ↓                                  │
│         ┌─────────────────┴─────────────────┐              │
│         ↓         ↓         ↓         ↓      ↓              │
│   ┌─────────┐ ┌──────┐ ┌──────┐ ┌─────────┐              │
│   │LinkedIn │ │Instagram│ │  X   │ │ Discord │              │
│   │   API   │ │Graph API│ │ API  │ │   API   │              │
│   └─────────┘ └──────┘ └──────┘ └─────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. OAuth Manager
Handles authentication and token management for all platforms.

**Responsibilities:**
- Initiate OAuth flows
- Store and encrypt access tokens
- Refresh tokens before expiration
- Handle token revocation
- Manage multi-account support

**Database Schema:**
```sql
-- OAuth tokens table
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT[],
  platform_user_id TEXT,
  platform_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON oauth_tokens
  USING (auth.uid() = user_id);
```

### 2. Post Manager
Manages content creation, storage, and multi-platform publishing.

**Features:**
- Draft creation and editing
- Multi-platform preview
- Image attachment handling
- Character count validation
- Hashtag management
- @mention handling

**Database Schema:**
```sql
-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB NOT NULL, -- Platform-specific content variants
  images TEXT[], -- Array of image URLs
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  platforms TEXT[] NOT NULL, -- ['linkedin', 'instagram', 'twitter', 'discord']
  metadata JSONB, -- Speaker info, event details, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform-specific post results
CREATE TABLE post_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT, -- ID from the social platform
  status TEXT CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  post_url TEXT,
  metrics JSONB, -- likes, shares, comments, etc.
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own posts"
  ON posts
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own post results"
  ON post_results
  USING (auth.uid() = (SELECT user_id FROM posts WHERE id = post_id));
```

### 3. Scheduler
Handles time-based post publishing with retry logic.

**Features:**
- Cron-based scheduling
- Timezone management
- Queue management
- Retry on failure
- Rate limit handling

**Implementation:**
```typescript
// Supabase Edge Function for scheduling
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get posts scheduled for now
  const { data: scheduledPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10)

  for (const post of scheduledPosts || []) {
    // Update status to publishing
    await supabase
      .from('posts')
      .update({ status: 'publishing' })
      .eq('id', post.id)

    // Publish to each platform
    await publishToAllPlatforms(post)
  }

  return new Response('OK', { status: 200 })
})
```

### 4. Media Manager
Handles image uploads, optimization, and platform-specific formatting.

**Features:**
- Image upload to Supabase Storage
- Automatic resizing per platform
- Format conversion (JPEG only for Instagram)
- Compression for optimal file size
- CDN delivery

**Storage Buckets:**
```sql
-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- RLS for storage
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');
```

## Platform-Specific Integration Details

### LinkedIn Integration

**Posting Endpoint:** `POST https://api.linkedin.com/v2/ugcPosts`

**Implementation:**
```typescript
async function postToLinkedIn(
  accessToken: string,
  personURN: string,
  content: string,
  imageUrls?: string[]
) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0'
  };

  let media = [];
  if (imageUrls && imageUrls.length > 0) {
    // Upload images first
    media = await Promise.all(
      imageUrls.map(url => uploadLinkedInImage(accessToken, personURN, url))
    );
  }

  const postData = {
    author: personURN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE',
        ...(media.length > 0 && {
          media: media.map(m => ({
            status: 'READY',
            description: {
              text: 'DeepStation Event'
            },
            media: m.asset,
            title: {
              text: 'Speaker Announcement'
            }
          }))
        })
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers,
    body: JSON.stringify(postData)
  });

  return response.json();
}

async function uploadLinkedInImage(
  accessToken: string,
  personURN: string,
  imageUrl: string
) {
  // 1. Register upload
  const registerResponse = await fetch(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: personURN,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      })
    }
  );

  const { value } = await registerResponse.json();
  const uploadUrl = value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = value.asset;

  // 2. Upload image
  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream'
    },
    body: imageBuffer
  });

  return { asset };
}
```

**Rate Limits:**
- 500 API calls per user per day
- Implement exponential backoff

### Instagram Integration

**Posting Flow:** Container Creation → Media Upload → Publishing

**Implementation:**
```typescript
async function postToInstagram(
  accessToken: string,
  igUserId: string,
  caption: string,
  imageUrl: string
) {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v23.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      })
    }
  );

  const { id: containerId } = await containerResponse.json();

  // Step 2: Check container status
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 5) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const statusResponse = await fetch(
      `https://graph.facebook.com/v23.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );

    const statusData = await statusResponse.json();
    status = statusData.status_code;
    attempts++;
  }

  if (status !== 'FINISHED') {
    throw new Error(`Container status: ${status}`);
  }

  // Step 3: Publish container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v23.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken
      })
    }
  );

  return publishResponse.json();
}

// Check rate limits
async function checkInstagramRateLimit(
  accessToken: string,
  igUserId: string
) {
  const response = await fetch(
    `https://graph.facebook.com/v23.0/${igUserId}/content_publishing_limit?access_token=${accessToken}`
  );

  const data = await response.json();
  // data.quota_usage shows posts published in last 24 hours
  // data.config.quota_total is 100

  if (data.quota_usage >= 95) {
    throw new Error('Instagram rate limit nearly reached');
  }

  return data;
}
```

**Constraints:**
- 100 posts per 24 hours
- JPEG images only
- Images must be publicly accessible

### X (Twitter) Integration

**Posting Endpoint:** `POST https://api.twitter.com/2/tweets`

**Implementation:**
```typescript
async function postToTwitter(
  accessToken: string,
  text: string,
  imageUrls?: string[]
) {
  let mediaIds = [];

  if (imageUrls && imageUrls.length > 0) {
    // Upload media first
    mediaIds = await Promise.all(
      imageUrls.map(url => uploadTwitterMedia(accessToken, url))
    );
  }

  const tweetData = {
    text: text,
    ...(mediaIds.length > 0 && {
      media: {
        media_ids: mediaIds
      }
    })
  };

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tweetData)
  });

  return response.json();
}

async function uploadTwitterMedia(
  accessToken: string,
  imageUrl: string
) {
  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // INIT
  const initResponse = await fetch(
    'https://upload.twitter.com/1.1/media/upload.json',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        command: 'INIT',
        total_bytes: imageBuffer.byteLength.toString(),
        media_type: 'image/jpeg'
      })
    }
  );

  const { media_id_string } = await initResponse.json();

  // APPEND
  await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      command: 'APPEND',
      media_id: media_id_string,
      media_data: base64Image,
      segment_index: '0'
    })
  });

  // FINALIZE
  await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: media_id_string
    })
  });

  return media_id_string;
}

// Thread support
async function postTwitterThread(
  accessToken: string,
  tweets: string[],
  imageUrls?: string[][]
) {
  let previousTweetId: string | null = null;

  for (let i = 0; i < tweets.length; i++) {
    const tweetData: any = {
      text: tweets[i]
    };

    if (previousTweetId) {
      tweetData.reply = {
        in_reply_to_tweet_id: previousTweetId
      };
    }

    if (imageUrls && imageUrls[i]) {
      const mediaIds = await Promise.all(
        imageUrls[i].map(url => uploadTwitterMedia(accessToken, url))
      );
      tweetData.media = { media_ids: mediaIds };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetData)
    });

    const result = await response.json();
    previousTweetId = result.data.id;
  }
}
```

**Free Tier Limits (2025):**
- 500 posts per month
- Must use OAuth 2.0

### Discord Integration

**Posting via Webhooks**

**Implementation:**
```typescript
async function postToDiscord(
  webhookUrl: string,
  content: string,
  embeds?: any[],
  files?: { name: string; url: string }[]
) {
  const formData = new FormData();

  const payload = {
    content: content,
    username: 'DeepStation',
    avatar_url: 'https://deepstation.ai/logo.png',
    ...(embeds && { embeds })
  };

  formData.append('payload_json', JSON.stringify(payload));

  // Attach files if provided
  if (files && files.length > 0) {
    for (const file of files) {
      const blob = await fetch(file.url).then(r => r.blob());
      formData.append('file', blob, file.name);
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.statusText}`);
  }

  return response;
}

// Rich embed example
async function postDiscordAnnouncement(
  webhookUrl: string,
  speaker: SpeakerForm,
  imageUrl: string
) {
  const embed = {
    title: '🎤 New Speaker Announcement',
    description: `**${speaker.fullName}** is joining us!`,
    color: 0x5865F2, // Discord blurple
    fields: [
      {
        name: '📋 Speaker',
        value: `${speaker.fullName}, ${speaker.title} at ${speaker.company}`,
        inline: false
      },
      {
        name: '🎯 Topic',
        value: speaker.presentationTitle,
        inline: false
      },
      {
        name: '📅 Date',
        value: formatDate(speaker.eventDate),
        inline: true
      },
      {
        name: '📍 Location',
        value: speaker.eventLocation,
        inline: true
      }
    ],
    image: {
      url: imageUrl
    },
    footer: {
      text: 'DeepStation • AI Education & Community',
      icon_url: 'https://deepstation.ai/favicon.ico'
    },
    timestamp: new Date().toISOString()
  };

  return postToDiscord(
    webhookUrl,
    '@everyone',
    [embed]
  );
}
```

**Rate Limits:**
- 5 requests per 2 seconds per webhook
- 30 requests per minute per webhook

## Unified Publishing Service

```typescript
interface PublishRequest {
  post: Post;
  platforms: Platform[];
  tokens: Map<Platform, OAuthToken>;
}

interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

class SocialMediaPublisher {
  async publish(request: PublishRequest): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    for (const platform of request.platforms) {
      const token = request.tokens.get(platform);
      if (!token) {
        results.push({
          platform,
          success: false,
          error: 'No auth token found'
        });
        continue;
      }

      try {
        // Check token expiration
        if (this.isTokenExpired(token)) {
          await this.refreshToken(token);
        }

        // Platform-specific content
        const content = request.post.content[platform];
        const images = request.post.images;

        let result;
        switch (platform) {
          case 'linkedin':
            result = await postToLinkedIn(
              token.access_token,
              token.platform_user_id,
              content,
              images
            );
            break;
          case 'instagram':
            result = await postToInstagram(
              token.access_token,
              token.platform_user_id,
              content,
              images[0] // Instagram single image
            );
            break;
          case 'twitter':
            result = await postToTwitter(
              token.access_token,
              content,
              images
            );
            break;
          case 'discord':
            result = await postToDiscord(
              token.webhook_url,
              content,
              undefined,
              images?.map(url => ({ name: 'announcement.png', url }))
            );
            break;
        }

        results.push({
          platform,
          success: true,
          postId: result.id,
          postUrl: this.constructPostUrl(platform, result)
        });
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  private isTokenExpired(token: OAuthToken): boolean {
    if (!token.expires_at) return false;
    return new Date(token.expires_at) <= new Date();
  }

  private async refreshToken(token: OAuthToken): Promise<void> {
    // Platform-specific refresh logic
    // Update token in database
  }

  private constructPostUrl(platform: Platform, result: any): string {
    // Construct public URL to the published post
    const urlMap = {
      linkedin: `https://www.linkedin.com/feed/update/${result.id}`,
      instagram: `https://www.instagram.com/p/${result.id}`,
      twitter: `https://twitter.com/user/status/${result.data.id}`,
      discord: result.url || ''
    };
    return urlMap[platform] || '';
  }
}
```

## Error Handling & Retry Logic

```typescript
async function publishWithRetry(
  publishFn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await publishFn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors
      if (error.status === 401 || error.status === 403) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

## Monitoring & Analytics

```sql
-- Analytics view
CREATE VIEW post_analytics AS
SELECT
  p.id,
  p.title,
  p.scheduled_for,
  p.published_at,
  jsonb_array_length(p.platforms::jsonb) as platform_count,
  COUNT(pr.id) as publish_attempts,
  COUNT(pr.id) FILTER (WHERE pr.status = 'success') as successful_publishes,
  SUM((pr.metrics->>'likes')::int) as total_likes,
  SUM((pr.metrics->>'shares')::int) as total_shares,
  SUM((pr.metrics->>'comments')::int) as total_comments
FROM posts p
LEFT JOIN post_results pr ON p.id = pr.post_id
GROUP BY p.id;
```

## Security Considerations

1. **Token Encryption**: Encrypt access tokens at rest
2. **Secure Webhooks**: Validate Discord webhook signatures
3. **Rate Limiting**: Implement application-level rate limiting
4. **Input Validation**: Sanitize all user inputs
5. **Audit Logging**: Log all publish attempts
6. **Token Rotation**: Rotate tokens regularly
7. **Scope Minimization**: Request minimum required scopes

## Deployment Checklist

- [ ] Configure OAuth apps on all platforms
- [ ] Set up Supabase database tables
- [ ] Deploy edge functions for scheduling
- [ ] Configure storage buckets
- [ ] Set up monitoring and alerts
- [ ] Test error handling and retries
- [ ] Document rate limits and quotas
- [ ] Create admin dashboard for monitoring
- [ ] Set up webhook endpoints
- [ ] Test multi-platform publishing flow
