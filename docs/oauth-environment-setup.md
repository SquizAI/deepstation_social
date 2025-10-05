# OAuth Environment Setup Guide

This guide explains how to configure OAuth credentials for social media platform integrations in DeepStation.

## Required Environment Variables

Add these to your `.env.local` file (development) or environment configuration (production):

### Core Application

```bash
# Your application URL (must be HTTPS in production)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://deepstation.ai  # Production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Encryption Key for OAuth Tokens (32 characters exactly)
# Generate with: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### LinkedIn OAuth

1. Create an app at [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Add redirect URL: `http://localhost:3000/api/auth/linkedin/callback` (dev) or `https://deepstation.ai/api/auth/linkedin/callback` (prod)
3. Add these to your `.env.local`:

```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

**LinkedIn Configuration:**
- **Scopes Needed:** `openid`, `profile`, `email`, `w_member_social`
- **Token Lifespan:** 60 days
- **Refresh Token:** Yes (1 year)
- **Rate Limit:** 500 API calls/day per user

### Instagram OAuth (via Facebook Graph API)

1. Create an app at [Meta for Developers](https://developers.facebook.com)
2. Add Instagram product to your app
3. Configure OAuth redirect URIs: `http://localhost:3000/api/auth/instagram/callback`
4. Add these to your `.env.local`:

```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Instagram Requirements:**
- **Account Type:** Business or Creator account required
- **Facebook Page:** Must be linked to a Facebook Page
- **Scopes Needed:** `instagram_business_basic`, `instagram_business_content_publish`, `pages_read_engagement`
- **Token Lifespan:** 60 days
- **Rate Limit:** 100 posts per 24 hours

### Twitter (X) OAuth 2.0

1. Create an app at [X Developer Portal](https://developer.x.com)
2. Enable OAuth 2.0 in app settings
3. Add callback URL: `http://localhost:3000/api/auth/twitter/callback`
4. Set app permissions to "Read and Write"
5. Add these to your `.env.local`:

```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

**Twitter Configuration:**
- **OAuth Type:** OAuth 2.0 with PKCE (required)
- **Scopes Needed:** `tweet.read`, `tweet.write`, `users.read`, `offline.access`
- **Token Lifespan:** 2 hours (auto-refresh enabled)
- **Refresh Token:** Yes
- **Rate Limit:** 500 posts/month (Free tier 2025)

### Discord OAuth

1. Create an app at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add OAuth2 redirect: `http://localhost:3000/api/auth/discord/callback`
3. Add these to your `.env.local`:

```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

**Discord Configuration:**
- **Scopes Needed:** `identify`, `guilds`, `webhook.incoming`
- **Token Lifespan:** Non-expiring
- **Posting Method:** Webhooks (recommended)
- **Rate Limit:** None for webhooks

## Complete .env.local Template

```bash
# ===================================
# DeepStation Environment Variables
# ===================================

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Encryption (32 characters exactly)
ENCRYPTION_KEY=generate_32_char_key_using_crypto

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Instagram OAuth (via Facebook)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

## Setting Up OAuth Redirect URLs

### Development (localhost:3000)
Each platform's developer portal should have these redirect URLs configured:

- **LinkedIn:** `http://localhost:3000/api/auth/linkedin/callback`
- **Instagram:** `http://localhost:3000/api/auth/instagram/callback`
- **Twitter:** `http://localhost:3000/api/auth/twitter/callback`
- **Discord:** `http://localhost:3000/api/auth/discord/callback`

### Production (deepstation.ai)
Update to HTTPS URLs:

- **LinkedIn:** `https://deepstation.ai/api/auth/linkedin/callback`
- **Instagram:** `https://deepstation.ai/api/auth/instagram/callback`
- **Twitter:** `https://deepstation.ai/api/auth/twitter/callback`
- **Discord:** `https://deepstation.ai/api/auth/discord/callback`

**Important:** The redirect URLs must match exactly (including trailing slashes) in both your environment variables and the platform's developer portal settings.

## Generating Encryption Key

Run this command to generate a secure 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output and use it as your `ENCRYPTION_KEY`.

## Security Best Practices

1. **Never commit `.env.local` to version control** - Add it to `.gitignore`
2. **Use different credentials for development and production**
3. **Rotate secrets periodically** (every 90 days recommended)
4. **Use environment-specific URLs** - localhost for dev, HTTPS for production
5. **Enable 2FA** on all social platform developer accounts
6. **Monitor OAuth usage** via platform analytics dashboards
7. **Set up alerts** for unusual authentication patterns

## Testing OAuth Configuration

After setting up environment variables, you can test each platform:

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard/settings/social-accounts`
3. Click "Connect" for each platform
4. Authorize the application
5. Verify successful connection in the dashboard

## Troubleshooting

### Common Issues

**"OAuth is not configured" error:**
- Check that environment variables are set correctly
- Restart your development server after adding new variables
- Verify variable names match exactly (case-sensitive)

**"Redirect URI mismatch" error:**
- Ensure callback URL in platform settings matches exactly
- Check for trailing slashes
- Verify HTTP vs HTTPS matches your environment

**"Invalid client" error:**
- Double-check Client ID and Client Secret
- Ensure credentials are for the correct environment (dev/prod)
- Verify the app is published/approved (some platforms require approval)

**Instagram "Business account required" error:**
- Convert Instagram account to Business or Creator account
- Link account to a Facebook Page
- Ensure proper permissions are granted in Facebook settings

## Platform-Specific Notes

### LinkedIn
- Personal accounts can post via API
- Company pages require separate authentication
- API access may require LinkedIn review for production apps

### Instagram
- MUST be Business or Creator account
- Personal accounts will fail OAuth flow
- Container-based publishing (2-step process: create container, then publish)

### Twitter
- Free tier limits: 500 tweets/month
- PKCE is mandatory (automatically handled)
- Short-lived tokens (2 hours) with automatic refresh

### Discord
- Easiest platform to integrate
- Webhook-based posting (no complex API)
- Tokens don't expire
- Can post to multiple servers

## Support

If you encounter issues:
1. Check platform status pages for outages
2. Review platform-specific developer documentation
3. Verify your app's approval status (some platforms require review)
4. Contact platform support for credential issues
5. Check DeepStation logs for detailed error messages

## Additional Resources

- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Discord OAuth Documentation](https://discord.com/developers/docs/topics/oauth2)
- [DeepStation OAuth Flow Documentation](./oauth-flow.md)
