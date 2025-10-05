# Credential Storage System Guide

## Overview

DeepStation uses a secure, dual-mode credential storage system that supports both OAuth tokens and API keys for social media platforms and email services.

## Architecture

### Database Schema

All credentials are stored in the `oauth_tokens` table with the following structure:

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT, -- 'linkedin', 'instagram', 'twitter', 'discord', 'resend', 'sendgrid'
  credential_type TEXT, -- 'oauth' or 'api_key'

  -- OAuth fields (for OAuth authentication)
  access_token TEXT,
  refresh_token TEXT,
  provider_user_id TEXT,
  expires_at TIMESTAMP,

  -- API key fields (for manual API credentials)
  credentials JSONB, -- Flexible JSONB storage for API keys
  metadata JSONB,    -- Additional platform-specific data

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  UNIQUE(user_id, platform)
);
```

### Security Features

1. **Row Level Security (RLS)**: Users can only access their own credentials
2. **Encryption**: Sensitive values can be encrypted using the `ENCRYPTION_KEY` in `.env.local`
3. **Credential Masking**: API endpoints return masked credentials (show only last 4 characters)
4. **JSONB Storage**: Flexible structure for different platform requirements

## Credential Types

### 1. OAuth Authentication

**Used for**: Full OAuth flow with refresh tokens

**Platforms**: LinkedIn, Instagram (via Facebook), Twitter/X

**Storage Format**:
```typescript
{
  credential_type: 'oauth',
  access_token: 'encrypted_access_token',
  refresh_token: 'encrypted_refresh_token',
  provider_user_id: 'platform_user_id',
  expires_at: '2025-10-05T00:00:00Z',
  is_active: true
}
```

**Retrieval**: Use `getValidOAuthToken(userId, platform)` from `/lib/auth/oauth-tokens.ts`

### 2. API Key Authentication

**Used for**: User-provided API keys/tokens

**Platforms**: All platforms + email services (Resend, SendGrid)

**Storage Format**:
```typescript
{
  credential_type: 'api_key',
  credentials: {
    // Platform-specific structure
    accessToken: 'user_provided_token',
    // OR
    apiKey: 'user_provided_api_key',
    // Additional fields as needed
  },
  metadata: {
    userId: 'platform_user_id',
    // Other platform-specific metadata
  },
  is_active: true
}
```

**Retrieval**: Use `getStoredCredentials(userId, platform)` from `/lib/credentials/get-credentials.ts`

## Platform-Specific Credential Formats

### LinkedIn

**OAuth**:
```json
{
  "credential_type": "oauth",
  "access_token": "AQV...",
  "refresh_token": "AQX...",
  "provider_user_id": "LinkedIn_User_ID",
  "expires_at": "2025-10-05T00:00:00Z"
}
```

**API Key** (if using personal access token):
```json
{
  "credential_type": "api_key",
  "credentials": {
    "accessToken": "your_linkedin_token",
    "userId": "your_linkedin_user_id"
  }
}
```

### Instagram

**OAuth** (via Facebook):
```json
{
  "credential_type": "oauth",
  "access_token": "IGQV...",
  "provider_user_id": "Instagram_Business_Account_ID",
  "expires_at": "2025-12-05T00:00:00Z"
}
```

**API Key** (using Graph API token):
```json
{
  "credential_type": "api_key",
  "credentials": {
    "accessToken": "IGQV...",
    "userId": "instagram_business_account_id"
  }
}
```

### Twitter/X

**OAuth**:
```json
{
  "credential_type": "oauth",
  "access_token": "Bearer_Token",
  "refresh_token": "Refresh_Token",
  "expires_at": "2025-10-05T00:00:00Z"
}
```

**API Key** (using Bearer token):
```json
{
  "credential_type": "api_key",
  "credentials": {
    "accessToken": "Bearer_your_twitter_token"
  }
}
```

### Discord

**Webhook-based** (no OAuth needed):
```json
{
  "credential_type": "api_key",
  "credentials": {
    "webhookUrl": "https://discord.com/api/webhooks/..."
  }
}
```

### Email Services (Resend, SendGrid)

**Resend**:
```json
{
  "credential_type": "api_key",
  "credentials": {
    "apiKey": "re_...",
    "fromEmail": "noreply@yourdomain.com",
    "fromName": "Your Name"
  }
}
```

**SendGrid**:
```json
{
  "credential_type": "api_key",
  "credentials": {
    "apiKey": "SG...",
    "fromEmail": "noreply@yourdomain.com",
    "fromName": "Your Name"
  }
}
```

## Using the Credential System

### 1. Saving Credentials (API)

**Endpoint**: `POST /api/auth/credentials`

```typescript
const response = await fetch('/api/auth/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'linkedin',
    credentials: {
      accessToken: 'user_provided_token',
      userId: 'linkedin_user_id'
    }
  })
});
```

### 2. Retrieving Credentials (Server-side)

```typescript
import { getStoredCredentials } from '@/lib/credentials/get-credentials';

// Get credentials for any platform
const creds = await getStoredCredentials(userId, 'linkedin');

if (creds) {
  if (creds.credentialType === 'oauth') {
    const accessToken = creds.credentials.accessToken;
    const userId = creds.metadata?.providerUserId;
  } else if (creds.credentialType === 'api_key') {
    const accessToken = creds.credentials.accessToken ||
                       creds.credentials.apiKey;
  }
}
```

### 3. Using in Publishing System

The unified publisher (`/lib/publishing/unified-publisher.ts`) automatically handles credential retrieval:

```typescript
import { publishToAllPlatforms } from '@/lib/publishing/unified-publisher';

const results = await publishToAllPlatforms({
  userId: 'user_id',
  platforms: ['linkedin', 'twitter', 'instagram'],
  content: {
    linkedin: 'Professional post content...',
    twitter: 'Concise tweet...',
    instagram: 'Visual-first caption...'
  },
  images: ['https://example.com/image.jpg']
});
```

The publisher will:
1. Check `getStoredCredentials()` for user-provided API keys
2. Fall back to `getValidOAuthToken()` for OAuth tokens
3. Return clear error messages if no credentials found

## Credential Fallback Hierarchy

For each platform, the system checks credentials in this order:

1. **User-provided API keys** in `oauth_tokens.credentials` (JSONB)
2. **OAuth tokens** in `oauth_tokens.access_token` (encrypted)
3. **Environment variables** (for system-level fallback)

Example for email services:

```typescript
// 1. Check user credentials
const userCreds = await getStoredCredentials(userId, 'resend');

// 2. Fall back to environment
if (!userCreds && process.env.RESEND_API_KEY) {
  return {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL
  };
}
```

## Security Best Practices

### 1. Never Store Credentials in Code

❌ **Bad**:
```typescript
const accessToken = 'hardcoded_token';
```

✅ **Good**:
```typescript
const creds = await getStoredCredentials(userId, platform);
const accessToken = creds?.credentials.accessToken;
```

### 2. Always Validate Before Use

```typescript
const creds = await getStoredCredentials(userId, platform);

if (!creds) {
  throw new Error('No credentials found');
}

if (!creds.credentials.accessToken) {
  throw new Error('Invalid credential format');
}
```

### 3. Mask Credentials in API Responses

The GET endpoint automatically masks sensitive values:

```typescript
// API returns:
{
  hasCredentials: true,
  credentials: {
    apiKey: "••••3f2a",  // Only last 4 shown
    fromEmail: "noreply@example.com"
  }
}
```

### 4. Use RLS Policies

The database has RLS enabled:

```sql
CREATE POLICY "Users can view their own tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);
```

## Migration Guide

### Migrating from Environment Variables to User Credentials

**Old approach** (environment variables):
```bash
# .env.local
LINKEDIN_ACCESS_TOKEN=xyz123
TWITTER_BEARER_TOKEN=abc456
```

**New approach** (user credentials):

1. User enters credentials in UI (`/dashboard/settings/social-credentials`)
2. Credentials saved via `POST /api/auth/credentials`
3. Publisher automatically uses stored credentials
4. Environment variables only used as fallback

### Advantages

1. **Multi-user support**: Each user has their own credentials
2. **Higher rate limits**: Users use their own API quotas
3. **No app-level OAuth setup needed**: Users can provide direct API tokens
4. **Secure storage**: Database-level encryption and RLS
5. **Flexible**: Supports both OAuth and API keys

## Troubleshooting

### "No credentials found for X platform"

**Solution**: User needs to either:
1. Connect via OAuth flow, OR
2. Manually add API credentials in Settings → Social Credentials

### "Invalid credentials format"

**Solution**: Ensure credentials are saved with correct structure:
- For OAuth: `accessToken` field in credentials object
- For API keys: `apiKey` or `accessToken` field in credentials object

### Publishing fails with 401 error

**Solution**:
1. Check if OAuth token is expired (check `expires_at`)
2. Verify API key is still valid
3. Test credentials directly with platform API

## Environment Variables (Optional Fallback)

These are only used if no user credentials are found:

```bash
# OAuth App Credentials (for OAuth flow)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# System-level API Keys (fallback)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Encryption
ENCRYPTION_KEY=your_32_character_key_here
```

## API Reference

### `getStoredCredentials(userId, platform)`

Returns credentials for a platform (OAuth or API key).

**Returns**: `PlatformCredentials | null`

```typescript
interface PlatformCredentials {
  platform: Platform;
  credentials: Record<string, string>;
  metadata?: Record<string, any>;
  credentialType: 'oauth' | 'api_key';
}
```

### `getEmailCredentials(userId)`

Returns email service credentials with fallback to env vars.

**Returns**: `{ provider, apiKey, fromEmail, fromName } | null`

### `getOAuthToken(userId, platform)`

Returns decrypted OAuth token (legacy OAuth system).

**Returns**: `{ accessToken, refreshToken, expiresAt, providerUserId } | null`

## Summary

✅ **Credential storage is fully implemented and secure**
✅ **Supports both OAuth and API key authentication**
✅ **User credentials take priority over environment variables**
✅ **Publishing system updated to use credential storage**
✅ **All platforms supported: LinkedIn, Instagram, Twitter, Discord, Resend, SendGrid**

The system is production-ready and follows security best practices.
