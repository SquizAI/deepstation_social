# OAuth Flow for Login

## Overview
This document outlines the OAuth 2.0 authentication flow for the DeepStation social media integration system. The system will support multiple social platforms using Supabase Auth as the authentication provider.

## Architecture

### Authentication Flow
```
User → DeepStation App → Supabase Auth → Social Provider → Callback → Access Token Storage
```

## Supported Platforms

### 1. LinkedIn OAuth 2.0
**Endpoint:** `https://www.linkedin.com/oauth/v2/authorization`

**Required Scopes:**
- `openid` - OpenID Connect for user identity
- `profile` - Basic profile information
- `email` - User email address
- `w_member_social` - Post content on behalf of user

**Implementation Steps:**

1. **Configure LinkedIn App**
   - Create app at [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
   - Add redirect URL: `https://your-app.com/auth/linkedin/callback`
   - Copy Client ID and Client Secret

2. **Authorization Request**
```javascript
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}&scope=openid%20profile%20email%20w_member_social`;
```

3. **Exchange Authorization Code for Access Token**
```bash
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
code={authorization_code}
client_id={your_client_id}
client_secret={your_client_secret}
redirect_uri={your_callback_url}
```

4. **Token Response**
```json
{
  "access_token": "AQUvlL_DYEzvT2wz1QJiEPeLioeA",
  "expires_in": 5184000,
  "refresh_token": "AQV...",
  "refresh_token_expires_in": 31536000,
  "scope": "openid profile email w_member_social"
}
```

**Token Lifespan:**
- Access Token: 60 days (5,184,000 seconds)
- Refresh Token: 1 year (31,536,000 seconds)

**Refresh Tokens:**
LinkedIn access tokens have a 60-day lifespan. Implement programmatic refresh:
```javascript
const refreshToken = async (refreshToken) => {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  return response.json();
};
```

### 2. Instagram OAuth (Graph API)
**Endpoint:** `https://api.instagram.com/oauth/authorize`

**Required Scopes:**
- `instagram_business_basic` - Basic account info
- `instagram_business_content_publish` - Post content
- `pages_read_engagement` - Read Page engagement data

**Implementation Steps:**

1. **Configure Facebook App**
   - Create app at [Meta for Developers](https://developers.facebook.com)
   - Add Instagram Basic Display or Instagram Graph API product
   - Configure redirect URIs

2. **Authorization Request**
```javascript
const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code`;
```

3. **Exchange Code for Token**
```bash
POST https://api.instagram.com/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id={app-id}
client_secret={app-secret}
grant_type=authorization_code
redirect_uri={redirect-uri}
code={code}
```

4. **Publishing with Graph API**
```javascript
// Create media container
POST https://graph.facebook.com/v23.0/{ig-user-id}/media
  ?image_url={image-url}
  &caption={caption}
  &access_token={access-token}

// Publish media
POST https://graph.facebook.com/v23.0/{ig-user-id}/media_publish
  ?creation_id={creation-id}
  &access_token={access-token}
```

**Rate Limits:**
- 100 API-published posts per 24 hours
- Query rate limit endpoint: `GET /{ig-user-id}/content_publishing_limit`

### 3. X (Twitter) OAuth 2.0
**Endpoint:** `https://twitter.com/i/oauth2/authorize`

**Required Scopes:**
- `tweet.read` - Read tweets
- `tweet.write` - Post tweets
- `users.read` - Read user profile

**Implementation Steps:**

1. **Configure X Developer App**
   - Create app at [X Developer Portal](https://developer.x.com)
   - Enable OAuth 2.0
   - Add callback URL

2. **Authorization with PKCE**
```javascript
// Generate code verifier and challenge
const codeVerifier = generateRandomString(128);
const codeChallenge = base64URLEncode(sha256(codeVerifier));

const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read&state=${STATE}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
```

3. **Exchange Code for Token**
```bash
POST https://api.twitter.com/2/oauth2/token
Content-Type: application/x-www-form-urlencoded

code={authorization_code}
grant_type=authorization_code
client_id={client_id}
redirect_uri={redirect_uri}
code_verifier={code_verifier}
```

**Free Tier Limits (2025):**
- 500 posts per month
- OAuth 2.0 required for posting

### 4. Discord OAuth 2.0
**Endpoint:** `https://discord.com/oauth2/authorize`

**Required Scopes:**
- `identify` - Basic user info
- `guilds` - Access to user's guilds
- `webhook.incoming` - Create webhooks

**Implementation Steps:**

1. **Configure Discord App**
   - Create app at [Discord Developer Portal](https://discord.com/developers/applications)
   - Add OAuth2 redirect URL
   - Copy Client ID and Secret

2. **Authorization Request**
```javascript
const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds%20webhook.incoming`;
```

3. **Exchange Code for Token**
```bash
POST https://discord.com/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

client_id={client_id}
client_secret={client_secret}
grant_type=authorization_code
code={code}
redirect_uri={redirect_uri}
```

4. **Create Webhook for Posting**
```bash
POST https://discord.com/api/channels/{channel-id}/webhooks
Authorization: Bot {bot-token}
Content-Type: application/json

{
  "name": "DeepStation Bot"
}
```

## Supabase Integration

### Setup Supabase Auth Providers

1. **Enable Social Providers in Supabase Dashboard**
   - Navigate to Authentication → Providers
   - Enable LinkedIn, Google (for Instagram via Facebook), Twitter, Discord
   - Add Client IDs and Secrets

2. **Supabase Auth Configuration**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Sign in with LinkedIn
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'linkedin_oidc',
  options: {
    redirectTo: 'https://deepstation.ai/auth/callback',
    scopes: 'openid profile email w_member_social'
  }
})
```

3. **Store Provider Tokens**
```sql
-- Custom table to store social media tokens
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own accounts
CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);
```

4. **Token Storage Function**
```javascript
const storeSocialToken = async (userId, provider, tokenData) => {
  const { data, error } = await supabase
    .from('social_accounts')
    .upsert({
      user_id: userId,
      provider: provider,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    });

  return { data, error };
};
```

## Security Best Practices

1. **State Parameter**: Always use a random state parameter to prevent CSRF attacks
2. **PKCE for Twitter**: Use Proof Key for Code Exchange (PKCE) for enhanced security
3. **Token Encryption**: Encrypt tokens at rest in the database
4. **Token Rotation**: Implement automatic refresh token rotation
5. **Scope Minimization**: Request only necessary scopes
6. **Secure Storage**: Never expose tokens in client-side code
7. **HTTPS Only**: All OAuth flows must use HTTPS
8. **Token Expiration**: Monitor and refresh tokens before expiration

## Error Handling

```javascript
const handleOAuthError = (error) => {
  switch (error.error) {
    case 'access_denied':
      return 'User denied access';
    case 'invalid_request':
      return 'Invalid OAuth request parameters';
    case 'unauthorized_client':
      return 'Application not authorized';
    case 'invalid_grant':
      return 'Authorization code expired or invalid';
    default:
      return 'OAuth authentication failed';
  }
};
```

## Rate Limiting & Monitoring

- Implement exponential backoff for token refresh
- Monitor token expiration and refresh proactively
- Log all OAuth events for debugging
- Set up alerts for authentication failures

## Testing

1. **Local Development**: Use ngrok or similar tool for OAuth callback testing
2. **Sandbox Accounts**: Use test accounts for each platform
3. **Token Expiration**: Test refresh token flows
4. **Error Cases**: Test denial, timeout, and invalid state scenarios
