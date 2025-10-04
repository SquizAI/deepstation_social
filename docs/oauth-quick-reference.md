# OAuth Quick Reference Guide

## Getting Started

### 1. Setup (First Time Only)

```bash
# Generate encryption key
node scripts/generate-encryption-key.js

# Copy output to .env.local
ENCRYPTION_KEY=your-generated-key

# Run database migration
supabase migration up
# Or paste SQL from supabase/migrations/20250104_oauth_tokens.sql
```

### 2. Configure OAuth Apps

Add credentials to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

LINKEDIN_CLIENT_ID=your-id
LINKEDIN_CLIENT_SECRET=your-secret

FACEBOOK_APP_ID=your-id
FACEBOOK_APP_SECRET=your-secret

TWITTER_CLIENT_ID=your-id
TWITTER_CLIENT_SECRET=your-secret

DISCORD_CLIENT_ID=your-id
DISCORD_CLIENT_SECRET=your-secret
```

All platforms use the same redirect URI: `{NEXT_PUBLIC_APP_URL}/auth/callback`

## API Endpoints

### Connect Platform
```
GET /api/auth/connect?platform={platform}
```
Redirects user to OAuth authorization page.

**Platforms**: `linkedin`, `instagram`, `twitter`, `discord`

### Disconnect Platform
```
DELETE /api/auth/disconnect?platform={platform}
```
Removes platform connection.

### Get Status
```
GET /api/auth/status
```
Returns all connected platforms.

**Response**:
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

## Code Examples

### React Component with useOAuth Hook

```tsx
'use client';

import { useOAuth } from '@/lib/hooks/useOAuth';

export function SocialConnections() {
  const { status, isConnected, connect, disconnect, isLoading } = useOAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Connected Platforms ({status?.totalConnected})</h2>

      {/* LinkedIn */}
      {!isConnected('linkedin') ? (
        <button onClick={() => connect('linkedin')}>
          Connect LinkedIn
        </button>
      ) : (
        <button onClick={() => disconnect('linkedin')}>
          Disconnect LinkedIn
        </button>
      )}

      {/* Twitter */}
      {!isConnected('twitter') ? (
        <button onClick={() => connect('twitter')}>
          Connect Twitter
        </button>
      ) : (
        <button onClick={() => disconnect('twitter')}>
          Disconnect Twitter
        </button>
      )}

      {/* Instagram */}
      {!isConnected('instagram') ? (
        <button onClick={() => connect('instagram')}>
          Connect Instagram
        </button>
      ) : (
        <button onClick={() => disconnect('instagram')}>
          Disconnect Instagram
        </button>
      )}

      {/* Discord */}
      {!isConnected('discord') ? (
        <button onClick={() => connect('discord')}>
          Connect Discord
        </button>
      ) : (
        <button onClick={() => disconnect('discord')}>
          Disconnect Discord
        </button>
      )}
    </div>
  );
}
```

### Server-Side: Get Valid Token

```typescript
import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';

// In API route or Server Action
export async function POST(request: Request) {
  const userId = 'user-uuid'; // Get from session

  // Automatically handles token refresh if needed
  const token = await getValidOAuthToken(userId, 'linkedin');

  if (!token) {
    return Response.json(
      { error: 'LinkedIn not connected' },
      { status: 400 }
    );
  }

  // Use token to make API calls
  const response = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
    },
  });

  return Response.json(await response.json());
}
```

### Server-Side: Post to Platform

```typescript
import { getValidOAuthToken } from '@/lib/auth/oauth-tokens';

async function postToLinkedIn(userId: string, text: string) {
  const token = await getValidOAuthToken(userId, 'linkedin');

  if (!token) {
    throw new Error('LinkedIn not connected');
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      author: `urn:li:person:${token.providerUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  return response.json();
}
```

### Check Token Manually

```typescript
import { getOAuthToken, checkTokenExpiration } from '@/lib/auth/oauth-tokens';

const token = await getOAuthToken(userId, 'linkedin');

if (token && checkTokenExpiration(token.expiresAt)) {
  console.log('Token is expired or about to expire');
  // Use getValidOAuthToken() instead - it auto-refreshes
}
```

### Manual Token Refresh

```typescript
import { refreshOAuthToken } from '@/lib/auth/oauth-tokens';

// Usually not needed - getValidOAuthToken() handles this automatically
const newToken = await refreshOAuthToken(userId, 'linkedin');
```

## Platform-Specific Notes

### LinkedIn
- **Rate Limit**: 500 API calls/day
- **Token Lifespan**: 60 days
- **Refresh Token**: 1 year
- **Auto-refresh**: ✅ Recommended

### Instagram
- **Setup**: Requires Facebook Business account
- **Rate Limit**: 100 posts/24 hours
- **Token Lifespan**: 60 days
- **Publishing**: Container-based (2-step process)

### Twitter/X
- **PKCE**: Required (automatically handled)
- **Free Tier**: 500 posts/month
- **Token Lifespan**: 2 hours
- **Refresh Token**: ✅ Required

### Discord
- **Webhooks**: Preferred method for posting
- **Rate Limits**: No strict limits
- **Token Lifespan**: Long-lived
- **Easiest**: Simplest OAuth flow

## Troubleshooting

### "Invalid state parameter"
- CSRF token mismatch
- Cookie expired (10 min timeout)
- Clear cookies and try again

### "Missing PKCE verifier for Twitter"
- PKCE cookie expired
- Ensure cookies enabled
- Try OAuth flow again

### "Failed to decrypt data"
- Wrong `ENCRYPTION_KEY` in `.env.local`
- Ensure key is exactly 32 characters
- Don't change key after storing tokens

### "Token refresh failed"
- Refresh token expired
- User must reconnect platform
- Check platform rate limits

### "redirect_uri_mismatch"
- Callback URL doesn't match platform settings
- Ensure exact match including http/https
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`

## Security Checklist

- ✅ Tokens encrypted at rest (AES-256-GCM)
- ✅ CSRF protection via state parameter
- ✅ HTTP-only cookies for state/PKCE
- ✅ Row Level Security on database
- ✅ Automatic token refresh
- ✅ HTTPS in production
- ✅ Environment variables for secrets
- ✅ No tokens in client-side code

## Production Deployment

1. **Set HTTPS URL**: Update `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
2. **Update OAuth Apps**: Change redirect URIs to production URL
3. **Generate New Encryption Key**: Don't reuse dev key in production
4. **Run Migration**: Apply SQL in production Supabase project
5. **Test Each Platform**: Verify OAuth flows work in production
6. **Monitor Logs**: Watch for authentication errors

## File Locations

```
DeepStation/
├── lib/
│   ├── auth/
│   │   ├── encryption.ts          # Token encryption
│   │   ├── oauth-config.ts        # Platform configs
│   │   ├── oauth-tokens.ts        # Token management
│   │   └── csrf.ts                # CSRF protection
│   ├── hooks/
│   │   └── useOAuth.ts            # React hook
│   └── types/
│       └── oauth.ts               # TypeScript types
├── app/
│   ├── api/auth/
│   │   ├── connect/route.ts       # Initiate OAuth
│   │   ├── disconnect/route.ts    # Disconnect platform
│   │   └── status/route.ts        # Get status
│   └── auth/
│       └── callback/route.ts      # OAuth callback
├── supabase/migrations/
│   └── 20250104_oauth_tokens.sql  # Database schema
├── scripts/
│   └── generate-encryption-key.js # Key generator
└── docs/
    ├── oauth-flow.md              # OAuth documentation
    ├── oauth-implementation.md    # Implementation guide
    └── oauth-quick-reference.md   # This file
```

## Testing Commands

```bash
# Test encryption key generation
node scripts/generate-encryption-key.js

# Check if all env vars are set
node -e "require('dotenv').config({ path: '.env.local' }); console.log({
  linkedin: !!process.env.LINKEDIN_CLIENT_ID,
  instagram: !!process.env.FACEBOOK_APP_ID,
  twitter: !!process.env.TWITTER_CLIENT_ID,
  discord: !!process.env.DISCORD_CLIENT_ID,
  encryption: process.env.ENCRYPTION_KEY?.length === 32
});"

# Run dev server
npm run dev

# Test OAuth flow
# Visit: http://localhost:3000/api/auth/connect?platform=linkedin
```

## Support Links

- [LinkedIn OAuth Docs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Instagram API Docs](https://developers.facebook.com/docs/instagram-api)
- [Twitter OAuth Docs](https://developer.x.com/en/docs/authentication/oauth-2-0)
- [Discord OAuth Docs](https://discord.com/developers/docs/topics/oauth2)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Need Help?** See `/docs/oauth-implementation.md` for detailed documentation.
