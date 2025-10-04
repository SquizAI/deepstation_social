# OAuth Token Management System - Implementation Summary

## Overview
Complete OAuth 2.0 token management system for DeepStation supporting LinkedIn, Instagram (Facebook), Twitter/X, and Discord integrations with enterprise-grade security.

## Implementation Status: ✅ Complete

### Files Created

#### 1. Core Authentication Libraries (`/lib/auth/`)

**`encryption.ts`** - AES-256-GCM Token Encryption
- `encrypt(text: string)`: Encrypts tokens using AES-256-GCM
- `decrypt(encryptedText: string)`: Decrypts stored tokens
- `generateEncryptionKey()`: Utility to generate 32-char encryption keys
- Uses environment variable `ENCRYPTION_KEY` (must be 32 characters)

**`oauth-config.ts`** - Platform OAuth Configurations
- `getOAuthConfig(platform)`: Returns platform-specific OAuth settings
- `buildAuthorizationUrl()`: Generates OAuth authorization URLs
- `exchangeCodeForToken()`: Exchanges auth code for access token
- `refreshAccessToken()`: Refreshes expired tokens
- `generatePKCEChallenge()`: Creates PKCE challenge for Twitter OAuth 2.0
- `validatePlatformConfig()`: Validates environment variables
- Supports: LinkedIn, Instagram, Twitter, Discord

**`oauth-tokens.ts`** - Token Storage & Management
- `storeOAuthToken()`: Stores encrypted tokens in Supabase
- `getOAuthToken()`: Retrieves and decrypts tokens
- `refreshOAuthToken()`: Auto-refreshes expired tokens
- `getValidOAuthToken()`: Main function - gets valid token or refreshes
- `deleteOAuthToken()`: Removes platform connection
- `getUserConnectedPlatforms()`: Lists all connected platforms
- `isPlatformConnected()`: Checks if platform is connected
- `checkTokenExpiration()`: Validates token freshness

**`csrf.ts`** - CSRF Protection & State Management
- `generateState()`: Creates cryptographically secure state parameter
- `storeState()`: Stores state in HTTP-only cookie
- `validateState()`: Validates state and extracts platform
- `storePKCEVerifier()`: Stores PKCE verifier for Twitter
- `getPKCEVerifier()`: Retrieves PKCE verifier
- `cleanupOAuthCookies()`: Cleanup utility for error cases

#### 2. API Routes (`/app/api/auth/`)

**`connect/route.ts`** - Initiate OAuth Flow
- **Endpoint**: `GET /api/auth/connect?platform={platform}`
- Validates user authentication
- Generates CSRF state token
- Creates PKCE challenge for Twitter
- Redirects to OAuth provider authorization page

**`disconnect/route.ts`** - Disconnect Platform
- **Endpoint**: `DELETE /api/auth/disconnect?platform={platform}`
- Removes OAuth token from database
- Validates user ownership

**`status/route.ts`** - Get Connection Status
- **Endpoint**: `GET /api/auth/status`
- Returns all connected platforms for current user
- Response format:
  ```json
  {
    "userId": "uuid",
    "connectedPlatforms": {
      "linkedin": true,
      "instagram": false,
      "twitter": true,
      "discord": false
    },
    "totalConnected": 2
  }
  ```

#### 3. OAuth Callback Handler (`/app/auth/callback/route.ts`)

**Enhanced Callback Route** - Handles All OAuth Callbacks
- Validates CSRF state parameter
- Distinguishes between:
  - Supabase Auth callbacks (primary login)
  - Social platform OAuth callbacks (platform connections)
- Exchanges authorization code for tokens
- Handles PKCE verification for Twitter
- Stores encrypted tokens in database
- Platform-specific error handling
- Automatic cookie cleanup

#### 4. Database Migration (`/supabase/migrations/`)

**`20250104_oauth_tokens.sql`** - OAuth Tokens Table
```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  provider_user_id TEXT,
  access_token TEXT NOT NULL,        -- Encrypted
  refresh_token TEXT,                -- Encrypted
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, platform)
);
```

**Security Features**:
- Row Level Security (RLS) enabled
- Users can only access their own tokens
- Automatic `updated_at` trigger
- Indexes for performance

#### 5. Type Definitions (`/lib/types/oauth.ts`)

Complete TypeScript interfaces for:
- `Platform` type union
- `OAuthToken` database schema
- `TokenData` decrypted format
- `OAuthConfig` platform settings
- `PKCEChallenge` Twitter OAuth
- `PlatformStatus` connection status
- `PLATFORM_LIMITS` rate limits & constraints

#### 6. Utilities (`/scripts/`)

**`generate-encryption-key.js`** - Encryption Key Generator
- Generates secure 32-character encryption keys
- Run: `node scripts/generate-encryption-key.js`

## Configuration Required

### Environment Variables (`.env.local`)

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Use https:// in production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Instagram/Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Twitter/X OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Encryption (MUST be exactly 32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Platform OAuth Setup

#### LinkedIn
1. Create app at [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Add redirect URI: `{NEXT_PUBLIC_APP_URL}/auth/callback`
3. Request scopes: `openid`, `profile`, `email`, `w_member_social`
4. Copy Client ID and Secret to `.env.local`

#### Instagram (via Facebook)
1. Create app at [Meta for Developers](https://developers.facebook.com)
2. Add Instagram product to app
3. Configure redirect URI: `{NEXT_PUBLIC_APP_URL}/auth/callback`
4. Request scopes: `instagram_business_basic`, `instagram_business_content_publish`, `pages_read_engagement`
5. Note: Requires Business Instagram account

#### Twitter/X
1. Create app at [X Developer Portal](https://developer.x.com)
2. Enable OAuth 2.0 with PKCE
3. Add callback URL: `{NEXT_PUBLIC_APP_URL}/auth/callback`
4. Request scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
5. Free tier: 500 posts/month (2025)

#### Discord
1. Create app at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add OAuth2 redirect: `{NEXT_PUBLIC_APP_URL}/auth/callback`
3. Request scopes: `identify`, `guilds`, `webhook.incoming`

## Database Setup

Run the migration in Supabase:

```bash
# Apply migration via Supabase CLI
supabase migration up

# Or run SQL directly in Supabase Dashboard → SQL Editor
```

## Usage Examples

### Connect a Platform

```typescript
// Client-side: Redirect to OAuth flow
window.location.href = '/api/auth/connect?platform=linkedin';

// Or use a fetch to get the redirect URL
const response = await fetch('/api/auth/connect?platform=twitter');
// Will redirect automatically
```

### Get Valid Access Token (Server-side)

```typescript
import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';

// Automatically handles token refresh if needed
const token = await getValidOAuthToken(userId, 'linkedin');

if (token) {
  // Use token.accessToken to make API calls
  console.log('Access Token:', token.accessToken);
  console.log('Expires At:', token.expiresAt);
}
```

### Check Connection Status

```typescript
// Client-side
const response = await fetch('/api/auth/status');
const data = await response.json();

console.log(data.connectedPlatforms);
// { linkedin: true, instagram: false, twitter: true, discord: false }
```

### Disconnect Platform

```typescript
// Client-side
await fetch('/api/auth/disconnect?platform=linkedin', {
  method: 'DELETE',
});
```

## Security Features

1. **Token Encryption**: All tokens encrypted at rest using AES-256-GCM
2. **CSRF Protection**: State parameter validation prevents CSRF attacks
3. **PKCE Support**: Twitter OAuth uses Proof Key for Code Exchange
4. **Row Level Security**: Database policies ensure users only access their tokens
5. **HTTP-Only Cookies**: State and PKCE stored in secure cookies
6. **Automatic Cleanup**: Cookies cleaned up after OAuth flow
7. **Token Refresh**: Automatic token refresh before expiration
8. **Secure Redirects**: All redirects validated and sanitized

## Error Handling

The system handles common OAuth errors:

- `access_denied`: User declined authorization
- `invalid_grant`: Authorization code expired (30 min lifespan)
- `invalid_client`: Wrong Client ID or Secret
- `redirect_uri_mismatch`: Callback URL doesn't match platform settings
- `invalid_scope`: Requested scopes not approved
- Token expiration: Automatic refresh attempted

## Token Lifecycle

1. **Authorization**: User clicks "Connect Platform"
2. **Redirect**: User sent to platform's OAuth page
3. **Callback**: Platform redirects back with authorization code
4. **Exchange**: Code exchanged for access + refresh tokens
5. **Storage**: Tokens encrypted and stored in database
6. **Usage**: Token retrieved and decrypted when needed
7. **Refresh**: Auto-refreshed when within 5 minutes of expiration
8. **Revocation**: User can disconnect anytime

## Platform-Specific Notes

### LinkedIn
- Access token lifespan: 60 days
- Refresh token lifespan: 1 year
- Rate limit: 500 API calls/day per user
- Auto-refresh recommended

### Instagram
- Requires Facebook Business account
- Uses container-based publishing
- Rate limit: 100 posts per 24 hours
- Token lifespan: 60 days

### Twitter/X
- Requires OAuth 2.0 with PKCE
- Free tier: 500 posts/month
- Token lifespan: 2 hours
- Refresh token MUST be used

### Discord
- Simplest implementation
- Webhook-based posting recommended
- No strict rate limits
- Long-lived tokens

## Next Steps

1. **Run Database Migration**: Apply the SQL migration in Supabase
2. **Generate Encryption Key**: Run `node scripts/generate-encryption-key.js`
3. **Configure Environment**: Add all OAuth credentials to `.env.local`
4. **Setup Platform Apps**: Create OAuth apps on each platform
5. **Test OAuth Flow**: Connect each platform in development
6. **Implement UI**: Create connect/disconnect buttons in dashboard
7. **Add Platform APIs**: Implement posting logic for each platform
8. **Error Monitoring**: Add logging/monitoring for OAuth events
9. **Production Setup**: Use HTTPS and production OAuth apps

## Testing Checklist

- [ ] Generate encryption key and add to `.env.local`
- [ ] Run database migration
- [ ] Configure LinkedIn OAuth app and test connection
- [ ] Configure Instagram OAuth app and test connection
- [ ] Configure Twitter OAuth app and test PKCE flow
- [ ] Configure Discord OAuth app and test connection
- [ ] Test token refresh for expired tokens
- [ ] Test disconnect functionality
- [ ] Verify RLS policies prevent cross-user access
- [ ] Test error handling (denied access, invalid codes)
- [ ] Verify CSRF protection works
- [ ] Test in production with HTTPS

## Architecture Diagram

```
User Browser
    ↓
[Connect Button] → /api/auth/connect?platform=linkedin
    ↓
[CSRF State Generated & Stored in Cookie]
    ↓
[Redirect to LinkedIn OAuth]
    ↓
User Authorizes
    ↓
LinkedIn Redirects → /auth/callback?code=XXX&state=YYY
    ↓
[Validate State] → [Exchange Code for Token]
    ↓
[Encrypt Tokens] → [Store in Supabase oauth_tokens]
    ↓
[Clean Cookies] → [Redirect to Dashboard]
    ↓
Success: Platform Connected!

Later...
    ↓
[Need to Post] → getValidOAuthToken(userId, 'linkedin')
    ↓
[Check Expiration] → [Auto-refresh if needed]
    ↓
[Return Valid Token] → Use for API calls
```

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| `lib/auth/encryption.ts` | 94 | AES-256-GCM encryption/decryption |
| `lib/auth/oauth-config.ts` | 227 | Platform configs & token exchange |
| `lib/auth/oauth-tokens.ts` | 269 | Token storage & refresh logic |
| `lib/auth/csrf.ts` | 138 | CSRF protection & state management |
| `lib/types/oauth.ts` | 107 | TypeScript type definitions |
| `app/auth/callback/route.ts` | 143 | OAuth callback handler |
| `app/api/auth/connect/route.ts` | 68 | Initiate OAuth flow |
| `app/api/auth/disconnect/route.ts` | 70 | Disconnect platform |
| `app/api/auth/status/route.ts` | 43 | Get connection status |
| `supabase/migrations/20250104_oauth_tokens.sql` | 77 | Database schema |
| **Total** | **1,236** | Complete OAuth system |

## Support & Documentation

- OAuth Flow Documentation: `/docs/oauth-flow.md`
- Platform Documentation:
  - [LinkedIn OAuth](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
  - [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
  - [Twitter OAuth 2.0](https://developer.x.com/en/docs/authentication/oauth-2-0)
  - [Discord OAuth](https://discord.com/developers/docs/topics/oauth2)

---

**Status**: ✅ Ready for Testing & Deployment
**Version**: 1.0.0
**Last Updated**: 2025-01-04
