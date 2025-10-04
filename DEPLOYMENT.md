# DeepStation - Deployment Guide

## Overview
This guide covers deploying DeepStation to Netlify with Supabase backend.

## Prerequisites

- [x] Netlify account (https://app.netlify.com/signup)
- [x] Supabase account (https://supabase.com)
- [x] GitHub repository (optional but recommended)
- [x] OAuth app credentials for all platforms
- [x] OpenAI API key

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - **Name**: DeepStation Production
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 1.2 Note Your Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy and save:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (anon key)
   - **Service Role Key**: `eyJhbGc...` (service_role - keep secret!)

### 1.3 Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_row_level_security.sql`
   - `supabase/migrations/003_storage_buckets.sql`
   - `supabase/migrations/004_analytics_views.sql`
   - `supabase/migrations/20250104_oauth_tokens.sql` (if not already in 001)
   - `supabase/migrations/20250104_speakers_tables.sql`
4. Run each query by clicking **Run** or `Cmd/Ctrl + Enter`
5. Verify no errors

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 1.4 Set Up Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Verify buckets were created:
   - `post-images`
   - `speaker-photos`
3. Check bucket policies are enabled (public read, authenticated write)

### 1.5 Deploy Edge Functions

```bash
# Navigate to your project
cd /Users/mattysquarzoni/Documents/Documents\ -\ \ MacBook\ Skynet/Deepstation

# Deploy the scheduler function
supabase functions deploy process-scheduled-posts --project-ref your-project-ref

# Set up cron schedule (runs every 5 minutes)
supabase functions schedule process-scheduled-posts --cron "*/5 * * * *" --project-ref your-project-ref
```

**Environment Variables for Edge Function:**
Set these in Supabase Dashboard → Edge Functions → Settings:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
ENCRYPTION_KEY=your-32-character-encryption-key
```

---

## Part 2: OAuth App Configuration

### 2.1 LinkedIn

1. Go to https://www.linkedin.com/developers/apps
2. Create new app or select existing
3. Add **Redirect URIs**:
   - Development: `http://localhost:3055/auth/callback`
   - Production: `https://your-domain.netlify.app/auth/callback`
4. Request access to:
   - Sign In with LinkedIn using OpenID Connect
   - Share on LinkedIn
5. Note your **Client ID** and **Client Secret**

### 2.2 Instagram (via Facebook)

1. Go to https://developers.facebook.com
2. Create new app or select existing
3. Add **Instagram** product
4. Configure **OAuth Redirect URIs**:
   - Development: `http://localhost:3055/auth/callback`
   - Production: `https://your-domain.netlify.app/auth/callback`
5. Add required permissions:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `pages_read_engagement`
6. Note **App ID** and **App Secret**

### 2.3 Twitter/X

1. Go to https://developer.x.com/en/portal/dashboard
2. Create new app or select existing
3. Enable **OAuth 2.0**
4. Set **Callback URI / Redirect URL**:
   - Development: `http://localhost:3055/auth/callback`
   - Production: `https://your-domain.netlify.app/auth/callback`
5. Set **App permissions**: Read and Write
6. Note **Client ID** and **Client Secret**

### 2.4 Discord

1. Go to https://discord.com/developers/applications
2. Create new application or select existing
3. Go to **OAuth2** settings
4. Add **Redirects**:
   - Development: `http://localhost:3055/auth/callback`
   - Production: `https://your-domain.netlify.app/auth/callback`
5. Note **Client ID** and **Client Secret**

### 2.5 Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Save this 32-character key for environment variables.

---

## Part 3: Netlify Deployment

### 3.1 Connect GitHub Repository (Recommended)

1. Push your code to GitHub:
```bash
cd /Users/mattysquarzoni/Documents/Documents\ -\ \ MacBook\ Skynet/Deepstation
git init
git add .
git commit -m "Initial commit - DeepStation platform"
git branch -M main
git remote add origin https://github.com/yourusername/deepstation.git
git push -u origin main
```

2. Go to https://app.netlify.com
3. Click **Add new site** → **Import an existing project**
4. Choose **GitHub**
5. Authorize Netlify
6. Select your repository

### 3.2 Configure Build Settings

Netlify should auto-detect Next.js settings. Verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: (leave blank for Next.js)

### 3.3 Set Environment Variables

In Netlify Dashboard → **Site settings** → **Environment variables**:

```bash
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.netlify.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service role)

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# OAuth - Instagram/Facebook
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# OAuth - Twitter/X
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# OAuth - Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 3.4 Deploy

1. Click **Deploy site**
2. Wait for build to complete (3-5 minutes)
3. Your site will be live at: `https://random-name-12345.netlify.app`

### 3.5 Set Custom Domain (Optional)

1. Go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration instructions
4. Wait for SSL certificate to provision (a few minutes)

---

## Part 4: Post-Deployment Configuration

### 4.1 Update OAuth Redirect URIs

Go back to each OAuth provider and update redirect URIs with your production URL:
- `https://your-domain.netlify.app/auth/callback`

### 4.2 Test OAuth Flows

1. Visit your deployed site
2. Click **Sign Up**
3. Test each OAuth provider:
   - LinkedIn
   - Instagram
   - Twitter
   - Discord
4. Verify tokens are stored in Supabase

### 4.3 Test Publishing

1. Create a test post
2. Connect at least one platform
3. Click **Post Now**
4. Verify post appears on the platform
5. Check post_results table in Supabase

### 4.4 Test Scheduling

1. Create a scheduled post (5 minutes in future)
2. Wait for Edge Function cron job to run
3. Verify post is published
4. Check post_results table

### 4.5 Test Speaker Announcements

1. Go to **Speaker Announcements**
2. Add a new speaker
3. Click **Generate Announcement**
4. Verify AI-generated content appears
5. Test scheduling the announcement

---

## Part 5: Monitoring & Maintenance

### 5.1 Monitor Edge Functions

1. Go to Supabase Dashboard → **Edge Functions**
2. View logs for `process-scheduled-posts`
3. Check for errors
4. Monitor execution times

### 5.2 Monitor Netlify Builds

1. Go to Netlify Dashboard → **Deploys**
2. View build logs
3. Check for warnings or errors
4. Monitor build times

### 5.3 Database Monitoring

1. Go to Supabase Dashboard → **Database**
2. Check **Table Editor** for data
3. Monitor **Logs** for slow queries
4. Review **Reports** for usage stats

### 5.4 Set Up Alerts (Optional)

**Supabase:**
- Database usage alerts
- API request limits

**Netlify:**
- Build failure notifications
- Deploy notifications

---

## Troubleshooting

### Build Fails on Netlify

**Issue**: `Module not found` errors
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### OAuth Callback Fails

**Issue**: `redirect_uri_mismatch`
**Solution**: Double-check redirect URIs in OAuth provider settings match exactly:
- `https://your-domain.netlify.app/auth/callback` (no trailing slash)

### Edge Function Not Running

**Issue**: Scheduled posts not publishing
**Solution**:
1. Check Edge Function logs in Supabase Dashboard
2. Verify cron schedule: `supabase functions schedule list`
3. Check environment variables are set
4. Manually invoke function to test:
```bash
curl -X POST https://xxxxx.supabase.co/functions/v1/process-scheduled-posts \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Database Connection Issues

**Issue**: `connection timeout` or `too many connections`
**Solution**:
1. Check Supabase project status
2. Verify connection pooling settings
3. Check row-level security policies

---

## Performance Optimization

### Enable Caching

Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Image Optimization

Next.js automatically optimizes images. Configure domains in `next.config.js`:
```javascript
images: {
  domains: ['your-supabase-project.supabase.co'],
}
```

---

## Security Checklist

- [ ] All environment variables set in Netlify (not committed to Git)
- [ ] `.env.local` added to `.gitignore`
- [ ] Service role key never exposed to client
- [ ] HTTPS enabled on production domain
- [ ] Row-level security enabled on all Supabase tables
- [ ] OAuth redirect URIs restricted to production domain
- [ ] API rate limiting configured
- [ ] Strong database password used
- [ ] Regular security updates via `npm audit`

---

## Maintenance Schedule

**Daily:**
- Monitor Edge Function logs for errors
- Check failed posts in database

**Weekly:**
- Review analytics for anomalies
- Check storage usage in Supabase
- Review OAuth token expiration

**Monthly:**
- Update dependencies: `npm update`
- Review and optimize slow database queries
- Check Supabase and Netlify usage limits
- Backup database (Supabase auto-backups enabled)

---

## Support

For issues or questions:
- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Cost Estimates

**Supabase Free Tier:**
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

**Netlify Free Tier:**
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

**Upgrade when needed:**
- Supabase Pro: $25/month
- Netlify Pro: $19/month

**OpenAI:**
- GPT-4: ~$0.01 per speaker announcement
- Estimate: $10-50/month depending on usage

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Configure OAuth providers
3. ✅ Test all features
4. 🔄 Invite beta testers
5. 🔄 Gather feedback
6. 🔄 Iterate and improve
7. 🚀 Launch to DeepStation community!

**Your DeepStation platform is now live! 🎉**
