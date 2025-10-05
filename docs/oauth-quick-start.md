# OAuth Quick Start Guide

## 5-Minute Setup

### Step 1: Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output (32 characters).

### Step 2: Create `.env.local`

```bash
cp .env.local.example .env.local
```

Add your credentials:

```bash
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=paste_your_32_char_key_here

# Add credentials for platforms you want to enable
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret

TWITTER_CLIENT_ID=your_id
TWITTER_CLIENT_SECRET=your_secret

FACEBOOK_APP_ID=your_id
FACEBOOK_APP_SECRET=your_secret

DISCORD_CLIENT_ID=your_id
DISCORD_CLIENT_SECRET=your_secret
```

### Step 3: Configure Platform Redirect URIs

Add these URLs to each platform's developer portal:

| Platform | Developer Portal | Redirect URI |
|----------|------------------|--------------|
| LinkedIn | [linkedin.com/developers](https://www.linkedin.com/developers/apps) | `http://localhost:3000/api/auth/linkedin/callback` |
| Twitter | [developer.x.com](https://developer.x.com) | `http://localhost:3000/api/auth/twitter/callback` |
| Instagram | [developers.facebook.com](https://developers.facebook.com) | `http://localhost:3000/api/auth/instagram/callback` |
| Discord | [discord.com/developers](https://discord.com/developers/applications) | `http://localhost:3000/api/auth/discord/callback` |

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Test OAuth

1. Navigate to: `http://localhost:3000/dashboard/settings/social-accounts`
2. Click "Connect" for any platform
3. Authorize the application
4. Verify successful connection

## Platform-Specific Setup

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create new app or select existing
3. Under "Auth" tab:
   - Add redirect URL: `http://localhost:3000/api/auth/linkedin/callback`
   - Request access to scopes: `openid`, `profile`, `email`, `w_member_social`
4. Copy Client ID and Client Secret to `.env.local`

### Twitter (X)

1. Go to [X Developer Portal](https://developer.x.com)
2. Create new app or select existing
3. Enable OAuth 2.0 in app settings
4. Set app permissions to "Read and Write"
5. Add callback URL: `http://localhost:3000/api/auth/twitter/callback`
6. Copy Client ID and Client Secret to `.env.local`

**Important:** Twitter OAuth 2.0 requires PKCE (automatically handled).

### Instagram

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create new app or select existing
3. Add "Instagram" product to your app
4. Configure OAuth redirect: `http://localhost:3000/api/auth/instagram/callback`
5. Copy App ID and App Secret to `.env.local` (as FACEBOOK_APP_ID and FACEBOOK_APP_SECRET)

**Requirements:**
- Instagram account must be Business or Creator type
- Account must be linked to a Facebook Page

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application or select existing
3. Under OAuth2 settings:
   - Add redirect: `http://localhost:3000/api/auth/discord/callback`
   - Select scopes: `identify`, `guilds`, `webhook.incoming`
4. Copy Client ID and Client Secret to `.env.local`

## API Endpoints

### Initiation (Redirect to Platform)
- `GET /api/auth/linkedin` - Start LinkedIn OAuth
- `GET /api/auth/twitter` - Start Twitter OAuth
- `GET /api/auth/instagram` - Start Instagram OAuth
- `GET /api/auth/discord` - Start Discord OAuth

### Callbacks (Platform Redirects Here)
- `GET /api/auth/linkedin/callback` - LinkedIn callback
- `GET /api/auth/twitter/callback` - Twitter callback
- `GET /api/auth/instagram/callback` - Instagram callback
- `GET /api/auth/discord/callback` - Discord callback

### Account Management
- `GET /api/auth/accounts` - Get all connected accounts
- `GET /api/auth/status` - Get connection status
- `DELETE /api/auth/disconnect?platform=linkedin` - Disconnect platform

## Using OAuth Tokens in Your Code

### Get Valid Token (with Auto-Refresh)

```typescript
import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';

// In your API route or server component
const token = await getValidOAuthToken(userId, 'linkedin');

if (!token) {
  return { error: 'LinkedIn not connected' };
}

// Use token.accessToken to make API calls
const response = await fetch('https://api.linkedin.com/v2/me', {
  headers: {
    'Authorization': `Bearer ${token.accessToken}`,
  },
});
```

### Check if Platform is Connected

```typescript
import { isPlatformConnected } from '@/lib/auth/oauth-tokens';

const isConnected = await isPlatformConnected(userId, 'twitter');
if (!isConnected) {
  return { error: 'Please connect Twitter first' };
}
```

### Manual Token Refresh

```typescript
import { refreshOAuthToken } from '@/lib/auth/oauth-tokens';

const refreshedToken = await refreshOAuthToken(userId, 'linkedin');
```

## React Hooks

### useOAuth Hook

```typescript
import { useOAuth } from '@/lib/hooks/useOAuth';

function MyComponent() {
  const { status, isConnected, connect, disconnect, isLoading } = useOAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {!isConnected('linkedin') ? (
        <button onClick={() => connect('linkedin')}>
          Connect LinkedIn
        </button>
      ) : (
        <button onClick={() => disconnect('linkedin')}>
          Disconnect LinkedIn
        </button>
      )}
    </div>
  );
}
```

## Database Schema

### oauth_tokens Table

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform TEXT CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  access_token TEXT NOT NULL,  -- Encrypted
  refresh_token TEXT,           -- Encrypted
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  provider_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

## Troubleshooting

### "OAuth is not configured"
- Check `.env.local` has correct credentials
- Restart dev server after adding variables
- Verify variable names (case-sensitive)

### "Redirect URI mismatch"
- Ensure exact URL match in platform settings
- Check for trailing slashes
- Verify HTTP vs HTTPS

### "Invalid client"
- Double-check Client ID and Secret
- Ensure credentials are copied correctly
- Verify app is in correct environment

### Token Refresh Fails
- Check if platform provides refresh tokens
- Verify refresh token is stored
- Check platform API status

## Security Notes

- Tokens are encrypted with AES-256-GCM
- CSRF protection via state parameter
- Row-level security in database
- HTTP-only cookies for state storage
- HTTPS required in production
- Automatic token cleanup on errors

## Next Steps

1. Test all platform connections
2. Implement posting functionality
3. Set up automatic token refresh job
4. Add email notifications for expiring tokens
5. Monitor OAuth usage and errors

## Resources

- [Full Documentation](./oauth-implementation-summary.md)
- [Environment Setup](./oauth-environment-setup.md)
- [OAuth Flow Diagram](./oauth-flow.md)
- Platform Documentation:
  - [LinkedIn API](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
  - [Twitter API](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
  - [Instagram API](https://developers.facebook.com/docs/instagram-api)
  - [Discord API](https://discord.com/developers/docs/topics/oauth2)
