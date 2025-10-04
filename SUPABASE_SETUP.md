# Supabase Setup Guide for DeepStation

## Manual Setup Instructions

Since automated setup via CLI requires additional configuration, here's the step-by-step manual setup process:

### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Click "New Project"

2. **Configure Project**
   - **Project Name**: `deepstation-production`
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users (e.g., `us-east-1` for East Coast)
   - **Plan**: Free tier is fine to start, upgrade to Pro ($25/mo) for production

3. **Wait for Provisioning** (2-3 minutes)

### Step 2: Get Your Credentials

1. Go to **Settings → API**
2. Copy these values:
   ```bash
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   Anon/Public Key: eyJhbGc...
   Service Role Key: eyJhbGc... (keep this secret!)
   ```

3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### Step 3: Run Database Migrations

#### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Run each migration file in order:

**Migration 1: Initial Schema**
```sql
-- Copy contents from: supabase/migrations/001_initial_schema.sql
-- Paste and run
```

**Migration 2: Row Level Security**
```sql
-- Copy contents from: supabase/migrations/002_row_level_security.sql
-- Paste and run
```

**Migration 3: Storage Buckets**
```sql
-- Copy contents from: supabase/migrations/003_storage_buckets.sql
-- Paste and run
```

**Migration 4: Analytics Views**
```sql
-- Copy contents from: supabase/migrations/004_analytics_views.sql
-- Paste and run
```

**Migration 5: OAuth Tokens** (if exists)
```sql
-- Copy contents from: supabase/migrations/20250104_oauth_tokens.sql
-- Paste and run (skip if already in 001)
```

**Migration 6: Speakers Tables**
```sql
-- Copy contents from: supabase/migrations/20250104_speakers_tables.sql
-- Paste and run
```

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xxxxxxxxxxxxx

# Push migrations
supabase db push
```

### Step 4: Verify Database Setup

1. Go to **Table Editor**
2. You should see these tables:
   - `oauth_tokens`
   - `scheduled_posts`
   - `post_results`
   - `recurring_posts`
   - `publishing_queue`
   - `speakers`
   - `speaker_announcements`

### Step 5: Set Up Storage

1. Go to **Storage**
2. Verify buckets were created:
   - `post-images` (public)
   - `speaker-photos` (public)

3. Check policies:
   - Click each bucket → Policies
   - Should see INSERT, SELECT, UPDATE, DELETE policies

### Step 6: Deploy Edge Functions

1. Install Supabase CLI (see Option B above)

2. Deploy the scheduler function:
   ```bash
   cd /Users/mattysquarzoni/Documents/Documents\ -\ \ MacBook\ Skynet/Deepstation

   supabase functions deploy process-scheduled-posts --project-ref xxxxxxxxxxxxx
   ```

3. Set environment variables for the Edge Function:
   - Go to **Edge Functions → Settings**
   - Add these secrets:
     ```bash
     SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
     LINKEDIN_CLIENT_ID=
     LINKEDIN_CLIENT_SECRET=
     FACEBOOK_APP_ID=
     FACEBOOK_APP_SECRET=
     TWITTER_CLIENT_ID=
     TWITTER_CLIENT_SECRET=
     DISCORD_CLIENT_ID=
     DISCORD_CLIENT_SECRET=
     ENCRYPTION_KEY=a1e6dcd04acb15a2eb229e49753d86a2
     ```

4. Schedule the function (cron job):
   ```bash
   supabase functions schedule process-scheduled-posts \
     --cron "*/5 * * * *" \
     --project-ref xxxxxxxxxxxxx
   ```

### Step 7: Test the Setup

1. **Test Database Connection**:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3055 and try to sign up

2. **Test Edge Function**:
   ```bash
   curl -X POST \
     https://xxxxxxxxxxxxx.supabase.co/functions/v1/process-scheduled-posts \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

### Step 8: Enable Extensions (Optional)

Go to **Database → Extensions** and enable:
- `pg_cron` - For scheduled jobs
- `pg_net` - For HTTP requests
- `uuid-ossp` - For UUID generation

### Troubleshooting

#### Issue: Migration fails with "table already exists"
**Solution**: Drop the table first or skip to next migration

#### Issue: RLS policies not working
**Solution**:
1. Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Check policies in Table Editor → Policies tab

#### Issue: Storage upload fails
**Solution**:
1. Check bucket policies allow authenticated uploads
2. Verify file size limits (default 50MB)
3. Check CORS settings in Storage → Configuration

#### Issue: Edge Function not running
**Solution**:
1. Check logs in Edge Functions → Logs
2. Verify environment variables are set
3. Test manually with curl
4. Check cron schedule: `supabase functions schedule list`

### Upgrade to Pro (Optional)

For production, consider upgrading to Pro plan ($25/mo):

**Benefits:**
- 8GB database (vs 500MB)
- 100GB file storage (vs 1GB)
- 250GB bandwidth (vs 5GB)
- Daily backups
- Priority support
- Advanced security

**To Upgrade:**
1. Go to **Settings → Billing**
2. Click "Upgrade to Pro"
3. Add payment method

### Cost Estimates

**Free Tier:**
- Perfect for development and testing
- Up to 500MB database
- 1GB file storage

**Pro Tier ($25/mo):**
- Recommended for production
- 8GB database
- 100GB file storage
- Daily backups

**Usage-Based:**
- Additional database: $0.125/GB/mo
- Additional storage: $0.021/GB/mo
- Additional bandwidth: $0.09/GB

### Next Steps

Once Supabase is set up:
1. ✅ Update `.env.local` with credentials
2. ✅ Run the app: `npm run dev`
3. ✅ Test user signup/login
4. ✅ Create a test post
5. ✅ Deploy to Netlify

---

## Quick Reference

**Dashboard**: https://supabase.com/dashboard
**Docs**: https://supabase.com/docs
**CLI Docs**: https://supabase.com/docs/guides/cli

**Your Project:**
- URL: https://xxxxxxxxxxxxx.supabase.co
- Database: PostgreSQL 15
- Region: [Your chosen region]

**Support:**
- Community: https://github.com/supabase/supabase/discussions
- Discord: https://discord.supabase.com
