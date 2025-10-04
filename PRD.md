# DeepStation Social Media Automation Platform - PRD & Implementation Roadmap

## Project Overview
Build a comprehensive social media automation platform for DeepStation that enables:
- Multi-platform OAuth authentication (LinkedIn, Instagram, X, Discord)
- Speaker announcement generation with AI
- Direct posting to social platforms
- Scheduling with timezone support
- Branded content creation

---

## Phase 1: Foundation & Infrastructure
**Agent: `supabase-architect`**

### 1.1 Project Initialization
- [ ] Initialize Next.js 14+ project with TypeScript
  - [ ] Run `npx create-next-app@latest deepstation-platform --typescript --tailwind --app`
  - [ ] Configure TypeScript strict mode
  - [ ] Set up ESLint and Prettier
  - [ ] Create `.env.local` file structure

### 1.2 Supabase Project Setup
- [ ] Create new Supabase project
  - [ ] Note project URL and anon key
  - [ ] Note service role key (keep secure)
  - [ ] Configure project settings
  - [ ] Set up local development with Supabase CLI

### 1.3 Database Schema Creation
- [ ] Create migration file: `001_initial_schema.sql`
- [ ] Define `oauth_tokens` table
  - [ ] id (UUID, PK)
  - [ ] user_id (UUID, FK to auth.users)
  - [ ] platform (TEXT, CHECK constraint)
  - [ ] access_token (TEXT, encrypted)
  - [ ] refresh_token (TEXT, encrypted)
  - [ ] expires_at (TIMESTAMPTZ)
  - [ ] platform_user_id (TEXT)
  - [ ] is_active (BOOLEAN)
  - [ ] created_at, updated_at (TIMESTAMPTZ)
  - [ ] UNIQUE constraint on (user_id, platform, platform_user_id)
  - [ ] Index on user_id
- [ ] Define `scheduled_posts` table
  - [ ] id (UUID, PK)
  - [ ] user_id (UUID, FK)
  - [ ] content (JSONB) - platform-specific content
  - [ ] images (TEXT[])
  - [ ] scheduled_for (TIMESTAMPTZ)
  - [ ] timezone (TEXT)
  - [ ] platforms (TEXT[])
  - [ ] status (TEXT, CHECK: draft/scheduled/published/failed)
  - [ ] retry_count (INTEGER, default 0)
  - [ ] max_retries (INTEGER, default 3)
  - [ ] last_error (TEXT)
  - [ ] created_at, updated_at (TIMESTAMPTZ)
  - [ ] Indexes on user_id, scheduled_for, status
- [ ] Define `post_results` table
  - [ ] id (UUID, PK)
  - [ ] post_id (UUID, FK to scheduled_posts)
  - [ ] platform (TEXT)
  - [ ] platform_post_id (TEXT)
  - [ ] post_url (TEXT)
  - [ ] status (TEXT, CHECK: pending/success/failed)
  - [ ] error_message (TEXT)
  - [ ] metrics (JSONB) - likes, shares, comments
  - [ ] posted_at (TIMESTAMPTZ)
  - [ ] created_at (TIMESTAMPTZ)
  - [ ] Index on post_id
- [ ] Define `recurring_posts` table
  - [ ] id (UUID, PK)
  - [ ] post_id (UUID, FK to scheduled_posts)
  - [ ] recurrence_rule (TEXT) - RRULE format
  - [ ] timezone (TEXT)
  - [ ] next_occurrence (TIMESTAMPTZ)
  - [ ] is_active (BOOLEAN)
  - [ ] created_at, updated_at (TIMESTAMPTZ)
- [ ] Define `publishing_queue` table
  - [ ] id (UUID, PK)
  - [ ] post_id (UUID, FK)
  - [ ] platform (TEXT)
  - [ ] priority (INTEGER)
  - [ ] status (TEXT, CHECK: queued/processing/completed/failed)
  - [ ] queued_at, started_at, completed_at (TIMESTAMPTZ)

### 1.4 Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policy: "Users can view own oauth_tokens"
  - [ ] SELECT: `auth.uid() = user_id`
- [ ] Create policy: "Users can insert own oauth_tokens"
  - [ ] INSERT: `auth.uid() = user_id`
- [ ] Create policy: "Users can update own oauth_tokens"
  - [ ] UPDATE: `auth.uid() = user_id`
- [ ] Create policy: "Users can delete own oauth_tokens"
  - [ ] DELETE: `auth.uid() = user_id`
- [ ] Repeat RLS policies for all user-facing tables
- [ ] Test RLS policies with different user contexts

### 1.5 Database Functions & Triggers
- [ ] Create `update_updated_at_column()` function
- [ ] Add trigger for `scheduled_posts` updated_at
- [ ] Add trigger for `oauth_tokens` updated_at
- [ ] Add trigger for `recurring_posts` updated_at
- [ ] Create `cleanup_expired_tokens()` function
- [ ] Schedule cron job for token cleanup (hourly)

### 1.6 Storage Buckets
- [ ] Create `post-images` bucket (public: true)
- [ ] Create `speaker-photos` bucket (public: true)
- [ ] Create policy: "Users can upload own images"
  - [ ] Bucket: post-images
  - [ ] Folder structure: {user_id}/{filename}
- [ ] Create policy: "Public can view images"
- [ ] Create policy: "Users can delete own images"
- [ ] Test upload, download, delete operations

### 1.7 Analytics Views
- [ ] Create `post_analytics` view
  - [ ] Aggregate metrics by post
  - [ ] Calculate success rates
  - [ ] Join posts with results
- [ ] Create `scheduler_health` view
  - [ ] Track job completion rates
  - [ ] Monitor queue depth
  - [ ] Calculate average processing time

---

## Phase 2: Authentication & OAuth Flows
**Agent: `oauth-specialist`**

### 2.1 Supabase Auth Configuration
- [ ] Enable email/password authentication
- [ ] Configure email templates (confirmation, reset password)
- [ ] Set up redirect URLs
- [ ] Configure JWT settings

### 2.2 LinkedIn OAuth Integration
- [ ] Create LinkedIn app in developer portal
  - [ ] Add product: Sign In with LinkedIn using OpenID Connect
  - [ ] Add product: Share on LinkedIn
  - [ ] Configure redirect URIs
  - [ ] Note Client ID and Client Secret
- [ ] Configure Supabase Auth provider for LinkedIn OIDC
  - [ ] Add scopes: `openid profile email w_member_social`
  - [ ] Set client ID and secret in Supabase dashboard
- [ ] Create OAuth callback route: `app/auth/callback/route.ts`
- [ ] Implement token exchange and storage
- [ ] Implement refresh token flow
  - [ ] Check token expiration before API calls
  - [ ] Auto-refresh when within 24 hours of expiry
  - [ ] Update database with new tokens
- [ ] Test full OAuth flow
  - [ ] Authorization redirect
  - [ ] Callback handling
  - [ ] Token storage
  - [ ] Token refresh

### 2.3 Instagram OAuth Integration
- [ ] Create Facebook app in Meta developers
  - [ ] Add Instagram product
  - [ ] Configure Instagram Business account
  - [ ] Add redirect URIs
  - [ ] Note App ID and App Secret
- [ ] Configure required scopes
  - [ ] `instagram_business_basic`
  - [ ] `instagram_business_content_publish`
  - [ ] `pages_read_engagement`
- [ ] Implement Facebook Login flow
- [ ] Get Instagram Business Account ID
- [ ] Store tokens with extended expiration (60 days)
- [ ] Implement token refresh flow
- [ ] Test OAuth flow end-to-end

### 2.4 X (Twitter) OAuth Integration
- [ ] Create X app in developer portal
  - [ ] Enable OAuth 2.0
  - [ ] Configure callback URL
  - [ ] Note Client ID and Client Secret
  - [ ] Enable read/write permissions
- [ ] Implement OAuth 2.0 with PKCE
  - [ ] Generate code_verifier (random 128-char string)
  - [ ] Generate code_challenge (SHA256 hash)
  - [ ] Store verifier in session
- [ ] Configure scopes: `tweet.read tweet.write users.read`
- [ ] Implement authorization flow
- [ ] Implement token exchange with code_verifier
- [ ] Store access and refresh tokens
- [ ] Implement token refresh
- [ ] Test OAuth flow

### 2.5 Discord OAuth Integration
- [ ] Create Discord application
  - [ ] Note Client ID and Client Secret
  - [ ] Add redirect URI
- [ ] Configure OAuth scopes
  - [ ] `identify`
  - [ ] `guilds`
  - [ ] `webhook.incoming`
- [ ] Implement Discord OAuth flow
- [ ] Store bot token for webhook posting
- [ ] Create webhook management UI
- [ ] Test webhook creation and posting

### 2.6 Security Implementation
- [ ] Implement CSRF protection with state parameter
  - [ ] Generate random 32+ character state
  - [ ] Store in secure HTTP-only cookie
  - [ ] Validate on callback
- [ ] Implement token encryption
  - [ ] Use AES-256-GCM encryption
  - [ ] Store encryption key in environment variable
  - [ ] Encrypt before database storage
  - [ ] Decrypt when retrieving
- [ ] Implement secure session management
- [ ] Add rate limiting for OAuth endpoints
- [ ] Log all OAuth events for audit trail
- [ ] Test security measures

### 2.7 Token Management Dashboard
- [ ] Create connected accounts page
- [ ] Display active OAuth connections
- [ ] Show token expiration status
- [ ] Add "Reconnect" button for expired tokens
- [ ] Add "Disconnect" button to revoke access
- [ ] Test all token management operations

---

## Phase 3: Social Media API Integration
**Agent: `api-integrator`**

### 3.1 Unified Publishing Service
- [ ] Create `lib/publishing/unified-publisher.ts`
- [ ] Define `PublishRequest` interface
  - [ ] platform
  - [ ] content
  - [ ] images
  - [ ] accessToken
  - [ ] platformUserId
- [ ] Define `PublishResult` interface
  - [ ] success
  - [ ] postId
  - [ ] postUrl
  - [ ] error
  - [ ] platform
- [ ] Implement retry logic with exponential backoff
  - [ ] Max 3 retries
  - [ ] Skip auth errors (401, 403)
  - [ ] Delay: 2^n seconds
- [ ] Implement rate limit checking
- [ ] Create error handler for API errors

### 3.2 LinkedIn Publishing API
- [ ] Create `lib/publishing/platforms/linkedin.ts`
- [ ] Implement text-only post
  - [ ] POST to `https://api.linkedin.com/v2/ugcPosts`
  - [ ] Set header: `X-Restli-Protocol-Version: 2.0.0`
  - [ ] Build request body with author URN
  - [ ] Handle response and extract post ID
  - [ ] Construct post URL
- [ ] Implement image upload
  - [ ] Step 1: Register upload (`registerUpload` endpoint)
  - [ ] Step 2: Upload binary to asset URL
  - [ ] Step 3: Reference asset in post
- [ ] Implement rate limit tracking (500/day)
- [ ] Add character limit validation (3000)
- [ ] Test with various content types
- [ ] Handle common errors
  - [ ] Invalid token
  - [ ] Rate limit exceeded
  - [ ] Invalid media

### 3.3 Instagram Publishing API
- [ ] Create `lib/publishing/platforms/instagram.ts`
- [ ] Implement container-based publishing
  - [ ] Step 1: Create media container
    - [ ] POST `/{ig-user-id}/media`
    - [ ] Parameters: image_url, caption
    - [ ] Get creation_id
  - [ ] Step 2: Check container status
    - [ ] GET `/{ig-container-id}?fields=status_code`
    - [ ] Poll until status = "FINISHED"
    - [ ] Max 5 attempts, 1 second delay
  - [ ] Step 3: Publish container
    - [ ] POST `/{ig-user-id}/media_publish`
    - [ ] Get post ID
- [ ] Implement JPEG validation
  - [ ] Check file format
  - [ ] Convert PNG to JPEG if needed
- [ ] Ensure image is publicly accessible
- [ ] Check rate limit: GET `/{ig-user-id}/content_publishing_limit`
- [ ] Add character limit validation (2200)
- [ ] Test full publishing flow
- [ ] Handle container status errors
  - [ ] ERROR status
  - [ ] EXPIRED status
  - [ ] Timeout waiting for FINISHED

### 3.4 X (Twitter) Publishing API
- [ ] Create `lib/publishing/platforms/twitter.ts`
- [ ] Implement text-only tweet
  - [ ] POST to `https://api.twitter.com/2/tweets`
  - [ ] Build request body with text
  - [ ] Extract tweet ID from response
  - [ ] Construct tweet URL
- [ ] Implement media upload (three-step)
  - [ ] Step 1: INIT
    - [ ] POST `https://upload.twitter.com/1.1/media/upload.json`
    - [ ] command=INIT
    - [ ] total_bytes, media_type
    - [ ] Get media_id
  - [ ] Step 2: APPEND
    - [ ] POST with command=APPEND
    - [ ] media_id, segment_index
    - [ ] Upload chunks (max 5MB per chunk)
  - [ ] Step 3: FINALIZE
    - [ ] POST with command=FINALIZE
    - [ ] Wait for processing_info completion
- [ ] Attach media to tweet
  - [ ] Include media_ids in tweet request
- [ ] Implement thread support
  - [ ] Use `reply.in_reply_to_tweet_id`
  - [ ] Chain multiple tweets
- [ ] Add character limit validation (280)
- [ ] Track rate limits (500 posts/month free tier)
- [ ] Test various tweet types
- [ ] Handle errors
  - [ ] Duplicate content
  - [ ] Rate limit
  - [ ] Invalid media

### 3.5 Discord Publishing API
- [ ] Create `lib/publishing/platforms/discord.ts`
- [ ] Implement webhook posting
  - [ ] POST to webhook URL
  - [ ] Build JSON body with content
  - [ ] Add embeds for rich formatting
  - [ ] Add username and avatar_url
- [ ] Implement rich embeds
  - [ ] title, description, color
  - [ ] fields for structured data
  - [ ] image and thumbnail
  - [ ] footer with timestamp
- [ ] Implement file attachments
  - [ ] Use multipart/form-data
  - [ ] Attach files directly
- [ ] Respect rate limit (5 requests per 2 seconds)
- [ ] Add character limit validation (4000)
- [ ] Test webhook posting
- [ ] Handle errors
  - [ ] Invalid webhook
  - [ ] Webhook deleted
  - [ ] Rate limit

### 3.6 Media Optimization Service
- [ ] Create `lib/media/optimizer.ts`
- [ ] Implement platform-specific image optimization
  - [ ] LinkedIn: Accept JPEG, PNG
  - [ ] Instagram: Convert to JPEG, ensure public URL
  - [ ] Twitter: Optimize for 1200x675
  - [ ] Discord: Flexible, optimize file size
- [ ] Add image validation
  - [ ] Check dimensions
  - [ ] Check file size
  - [ ] Check format
- [ ] Implement format conversion
  - [ ] PNG to JPEG
  - [ ] Resize if too large
  - [ ] Compress for file size limits
- [ ] Upload to Supabase Storage
  - [ ] Generate unique filename
  - [ ] Upload to user's folder
  - [ ] Get public URL
- [ ] Test with various image types

### 3.7 Integration Testing
- [ ] Create test suite for each platform
- [ ] Test successful posting
- [ ] Test with invalid tokens
- [ ] Test rate limit handling
- [ ] Test media uploads
- [ ] Test error scenarios
- [ ] Create mock API responses for CI/CD

---

## Phase 4: Scheduling System
**Agent: `scheduler-expert`**

### 4.1 Timezone Management
- [ ] Install dependencies: `npm install date-fns date-fns-tz`
- [ ] Create `lib/scheduling/timezone.ts`
- [ ] Implement `convertToUTC(localDate, timezone)`
  - [ ] Use `toDate` from date-fns-tz
  - [ ] Return UTC timestamp
- [ ] Implement `convertFromUTC(utcDate, timezone)`
  - [ ] Use `formatInTimeZone`
  - [ ] Return formatted local time
- [ ] Create timezone selector options
  - [ ] America/New_York (Eastern)
  - [ ] America/Chicago (Central)
  - [ ] America/Denver (Mountain)
  - [ ] America/Los_Angeles (Pacific)
  - [ ] America/Sao_Paulo (Brazil)
- [ ] Add validation for timezone strings
- [ ] Test timezone conversions
  - [ ] Edge cases: DST transitions
  - [ ] Different timezones
  - [ ] Midnight boundaries

### 4.2 Recurring Events (RRULE)
- [ ] Install dependency: `npm install rrule`
- [ ] Create `lib/scheduling/recurrence.ts`
- [ ] Implement RRULE generation
  - [ ] Daily: FREQ=DAILY
  - [ ] Weekly: FREQ=WEEKLY;BYDAY=MO,WE,FR
  - [ ] Monthly: FREQ=MONTHLY;BYMONTHDAY=1
  - [ ] Custom intervals
- [ ] Implement RRULE parsing
  - [ ] Parse RRULE string
  - [ ] Calculate next occurrence
  - [ ] Get next N occurrences
- [ ] Add UNTIL date for end conditions
- [ ] Add COUNT for number of occurrences
- [ ] Create UI helpers for recurrence selection
- [ ] Test RRULE generation and parsing
  - [ ] Various frequencies
  - [ ] Complex patterns
  - [ ] Edge cases

### 4.3 Supabase Edge Function - Scheduler
- [ ] Create Edge Function: `supabase/functions/process-scheduled-posts/index.ts`
- [ ] Implement main handler
  - [ ] Get current time with 1-minute buffer
  - [ ] Query scheduled_posts WHERE status='scheduled' AND scheduled_for <= now+buffer
  - [ ] Limit to 50 posts per run
- [ ] Implement post processing loop
  - [ ] Update status to 'queued'
  - [ ] Get user's OAuth tokens
  - [ ] Process each platform
  - [ ] Call publishToPlatform for each
  - [ ] Store results in post_results table
  - [ ] Update post status based on results
- [ ] Implement error handling
  - [ ] Catch platform-specific errors
  - [ ] Call handleFailedPost on error
  - [ ] Log errors for debugging
- [ ] Implement retry logic
  - [ ] Check retry_count vs max_retries
  - [ ] Calculate exponential backoff: 2^n minutes
  - [ ] Reschedule post for retry
  - [ ] Mark as failed after max retries
- [ ] Implement recurring post processing
  - [ ] Query recurring_posts WHERE is_active=true AND next_occurrence <= now
  - [ ] Create new scheduled_post from template
  - [ ] Calculate next occurrence using RRULE
  - [ ] Update recurring_posts.next_occurrence
  - [ ] Deactivate if no more occurrences
- [ ] Add performance logging
  - [ ] Log start time
  - [ ] Log posts processed
  - [ ] Log duration
  - [ ] Log success/failure counts
- [ ] Return JSON response with results
- [ ] Test Edge Function locally
  - [ ] Use Supabase CLI: `supabase functions serve`
  - [ ] Test with sample data
  - [ ] Verify database updates

### 4.4 Deploy and Schedule Edge Function
- [ ] Deploy Edge Function
  - [ ] Run: `supabase functions deploy process-scheduled-posts --no-verify-jwt`
  - [ ] Set environment variables
    - [ ] SUPABASE_URL
    - [ ] SUPABASE_SERVICE_ROLE_KEY
    - [ ] Platform API credentials
- [ ] Schedule cron job
  - [ ] Run every 1 minute: `supabase functions schedule process-scheduled-posts --cron "* * * * *"`
  - [ ] OR every 5 minutes: `--cron "*/5 * * * *"` (more efficient)
- [ ] Monitor Edge Function logs
  - [ ] Check for errors
  - [ ] Monitor execution time
  - [ ] Track success rates
- [ ] Set up alerts for failures
- [ ] Test scheduled execution

### 4.5 Optimal Posting Time Analysis
- [ ] Create `lib/analytics/optimal-times.ts`
- [ ] Implement `analyzeOptimalTimes(userId, platform)`
  - [ ] Query post_results for last 90 days
  - [ ] Extract hour and day from posted_at
  - [ ] Calculate engagement score: likes + (shares*2) + (comments*3)
  - [ ] Group by hour of day
  - [ ] Group by day of week
  - [ ] Calculate averages
  - [ ] Return top 3 hours and top 3 days
- [ ] Create UI component to display optimal times
- [ ] Add "Schedule for optimal time" button
- [ ] Test with sample historical data

### 4.6 Queue Management
- [ ] Create `lib/scheduling/queue.ts`
- [ ] Implement JobQueue class
  - [ ] enqueue(job)
  - [ ] processQueue()
  - [ ] processJob(job)
- [ ] Add priority system
  - [ ] High priority: user-triggered immediate posts
  - [ ] Normal priority: scheduled posts
  - [ ] Low priority: retries
- [ ] Implement queue monitoring
  - [ ] Track queue depth
  - [ ] Monitor processing time
  - [ ] Alert on stuck jobs
- [ ] Create admin view for queue status
- [ ] Test queue under load

### 4.7 Monitoring and Health Checks
- [ ] Create database view: `scheduler_health`
  - [ ] Aggregate jobs by hour
  - [ ] Count completed, failed, pending
  - [ ] Calculate average duration
- [ ] Create query to detect stuck jobs
  - [ ] WHERE status='processing' AND started_at < now - 10 minutes
- [ ] Create monitoring dashboard
  - [ ] Display scheduler health metrics
  - [ ] Show recent failures
  - [ ] Display queue depth
- [ ] Set up email alerts for critical issues
  - [ ] High failure rate (>20%)
  - [ ] Stuck jobs
  - [ ] Queue backlog (>100)
- [ ] Test monitoring and alerts

---

## Phase 5: Frontend Development
**Agent: `frontend-builder`**

### 5.1 Project Structure Setup
- [ ] Create directory structure
  - [ ] `app/(auth)/` for authentication pages
  - [ ] `app/dashboard/` for main app
  - [ ] `components/ui/` for base components
  - [ ] `components/auth/` for auth components
  - [ ] `components/posts/` for post components
  - [ ] `components/layout/` for layout components
  - [ ] `lib/supabase/` for Supabase clients
  - [ ] `lib/utils/` for utilities
  - [ ] `lib/types/` for TypeScript types

### 5.2 Supabase Client Configuration
- [ ] Create `lib/supabase/client.ts` (browser client)
  - [ ] Use `createBrowserClient` from @supabase/ssr
  - [ ] Export createClient function
- [ ] Create `lib/supabase/server.ts` (server client)
  - [ ] Use `createServerClient` from @supabase/ssr
  - [ ] Handle cookies from Next.js
  - [ ] Export createClient function
- [ ] Create `middleware.ts` for auth
  - [ ] Create Supabase client in middleware
  - [ ] Call `getSession()` to refresh token
  - [ ] Protect `/dashboard/*` routes
- [ ] Test client initialization

### 5.3 Authentication Pages
- [ ] Create `app/(auth)/login/page.tsx`
  - [ ] Login form with email/password
  - [ ] Social login buttons component
  - [ ] Link to signup page
  - [ ] Redirect if already authenticated
- [ ] Create `components/auth/social-login-buttons.tsx`
  - [ ] LinkedIn login button
  - [ ] Instagram login button
  - [ ] Twitter login button
  - [ ] Discord login button
  - [ ] Handle OAuth redirects
  - [ ] Show loading states
- [ ] Create `app/auth/callback/route.ts`
  - [ ] Exchange code for session
  - [ ] Handle OAuth callback
  - [ ] Redirect to dashboard
  - [ ] Handle errors
- [ ] Create `app/(auth)/signup/page.tsx`
  - [ ] Signup form
  - [ ] Email confirmation message
- [ ] Test authentication flows

### 5.4 Dashboard Layout
- [ ] Create `app/dashboard/layout.tsx`
  - [ ] Check authentication
  - [ ] Redirect to login if not authenticated
  - [ ] Include navbar
  - [ ] Include sidebar
- [ ] Create `components/layout/navbar.tsx`
  - [ ] DeepStation logo
  - [ ] User profile dropdown
  - [ ] Logout button
  - [ ] Notifications icon
- [ ] Create `components/layout/sidebar.tsx`
  - [ ] Navigation links
    - [ ] Dashboard
    - [ ] New Post
    - [ ] Scheduled Posts
    - [ ] Speaker Announcements
    - [ ] Connected Accounts
    - [ ] Analytics
  - [ ] Active state styling
  - [ ] Responsive: collapsible on mobile
- [ ] Implement responsive layout
  - [ ] Mobile-first approach
  - [ ] Hamburger menu for mobile
  - [ ] Tablet breakpoints
- [ ] Test layout on various screen sizes

### 5.5 Dashboard Home Page
- [ ] Create `app/dashboard/page.tsx`
  - [ ] Welcome message
  - [ ] Quick stats cards
    - [ ] Posts scheduled
    - [ ] Posts published this week
    - [ ] Connected platforms
    - [ ] Engagement rate
  - [ ] Recent posts list
  - [ ] Upcoming scheduled posts
  - [ ] Quick action buttons
- [ ] Fetch data from Supabase
  - [ ] User's scheduled posts
  - [ ] Post results for analytics
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with various data states

### 5.6 Post Editor Component
- [ ] Create `components/posts/post-editor.tsx`
  - [ ] Tabbed interface for each platform
  - [ ] Textarea for each platform
  - [ ] Character counter for each
  - [ ] Platform-specific limits
    - [ ] LinkedIn: 3000
    - [ ] Instagram: 2200
    - [ ] Twitter: 280
    - [ ] Discord: 4000
  - [ ] Image upload button
  - [ ] Image preview
  - [ ] Remove image button
- [ ] Implement form state management
  - [ ] Use React useState or form library
  - [ ] Validate character limits
  - [ ] Validate required fields
- [ ] Add auto-save draft
- [ ] Test character counting
- [ ] Test image upload

### 5.7 Platform Preview Component
- [ ] Create `components/posts/platform-preview.tsx`
  - [ ] LinkedIn preview
    - [ ] Profile header
    - [ ] Post content
    - [ ] Image display
  - [ ] Instagram preview
    - [ ] Square image layout
    - [ ] Caption display
  - [ ] Twitter preview
    - [ ] Tweet card layout
    - [ ] Character wrapping
  - [ ] Discord preview
    - [ ] Embed style
    - [ ] Rich formatting
- [ ] Make previews responsive
- [ ] Update preview in real-time
- [ ] Test with various content types

### 5.8 Schedule Picker Component
- [ ] Create `components/posts/schedule-picker.tsx`
  - [ ] Calendar component
    - [ ] Disable past dates
    - [ ] Highlight today
  - [ ] Time picker (hour and minute)
  - [ ] Timezone selector dropdown
  - [ ] "Schedule" button
  - [ ] "Post now" button
  - [ ] Recurring options
    - [ ] None (one-time)
    - [ ] Daily
    - [ ] Weekly (select days)
    - [ ] Monthly (select date)
    - [ ] Custom (RRULE builder)
- [ ] Implement date/time validation
  - [ ] Cannot schedule in the past
  - [ ] Must select both date and time
- [ ] Display optimal posting times
  - [ ] Show suggestion based on analytics
  - [ ] "Use optimal time" button
- [ ] Test schedule creation

### 5.9 New Post Page
- [ ] Create `app/dashboard/posts/new/page.tsx`
  - [ ] Platform selection checkboxes
  - [ ] PostEditor component
  - [ ] PlatformPreview component (for each selected)
  - [ ] SchedulePicker component
  - [ ] Save as draft button
  - [ ] Schedule post button
  - [ ] Post now button
- [ ] Implement save draft functionality
  - [ ] Insert into scheduled_posts with status='draft'
  - [ ] Show success message
  - [ ] Redirect or stay on page
- [ ] Implement schedule post
  - [ ] Validate all fields
  - [ ] Convert time to UTC
  - [ ] Insert into database
  - [ ] Show success message
  - [ ] Redirect to scheduled posts
- [ ] Implement post now
  - [ ] Call publishing API directly
  - [ ] Show loading state
  - [ ] Show success/error
  - [ ] Display post URLs
- [ ] Test all posting flows

### 5.10 Scheduled Posts Page
- [ ] Create `app/dashboard/posts/scheduled/page.tsx`
  - [ ] List of scheduled posts
  - [ ] Filter by status (scheduled, draft, published, failed)
  - [ ] Sort by scheduled_for date
  - [ ] Pagination
- [ ] Create post card component
  - [ ] Post preview
  - [ ] Scheduled time (in user timezone)
  - [ ] Platforms
  - [ ] Status badge
  - [ ] Actions: Edit, Delete, Reschedule
- [ ] Implement edit functionality
  - [ ] Redirect to edit page
  - [ ] Pre-fill form with post data
- [ ] Implement delete functionality
  - [ ] Confirmation dialog
  - [ ] Delete from database
  - [ ] Remove from list
- [ ] Implement reschedule
  - [ ] Show schedule picker modal
  - [ ] Update scheduled_for in database
- [ ] Test CRUD operations

### 5.11 Connected Accounts Page
- [ ] Create `app/dashboard/accounts/page.tsx`
  - [ ] List of connected platforms
  - [ ] Platform card for each
    - [ ] Platform logo
    - [ ] Connection status
    - [ ] Token expiration date
    - [ ] Reconnect button (if expired)
    - [ ] Disconnect button
- [ ] Implement connect flow
  - [ ] Redirect to OAuth
  - [ ] Handle callback
  - [ ] Show success message
- [ ] Implement reconnect flow
  - [ ] Same as connect
  - [ ] Update existing token
- [ ] Implement disconnect
  - [ ] Confirmation dialog
  - [ ] Set is_active=false
  - [ ] Show success message
- [ ] Test all account operations

### 5.12 Analytics Page
- [ ] Create `app/dashboard/analytics/page.tsx`
  - [ ] Date range selector
  - [ ] Platform filter
  - [ ] Metrics cards
    - [ ] Total posts
    - [ ] Total engagement
    - [ ] Average engagement
    - [ ] Success rate
  - [ ] Charts
    - [ ] Posts over time (line chart)
    - [ ] Engagement by platform (bar chart)
    - [ ] Best posting times (heatmap)
  - [ ] Top performing posts table
- [ ] Fetch analytics data from Supabase
  - [ ] Use post_analytics view
  - [ ] Filter by date range
  - [ ] Aggregate metrics
- [ ] Install charting library: `npm install recharts`
- [ ] Implement charts with Recharts
- [ ] Test with various data ranges

### 5.13 Styling and Branding
- [ ] Configure Tailwind theme
  - [ ] Primary color: #1a1a2e (DeepStation dark blue)
  - [ ] Secondary color: #16213e
  - [ ] Accent colors for platforms
    - [ ] LinkedIn: #0A66C2
    - [ ] Instagram: gradient (purple to pink)
    - [ ] Twitter: #1DA1F2
    - [ ] Discord: #5865F2
- [ ] Create base UI components
  - [ ] Button component with variants
  - [ ] Input component
  - [ ] Textarea component
  - [ ] Card component
  - [ ] Badge component
  - [ ] Modal/Dialog component
- [ ] Add DeepStation logo
- [ ] Implement dark mode toggle (optional)
- [ ] Test accessibility (WCAG 2.1)
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast
  - [ ] Focus states

---

## Phase 6: Speaker Announcement System
**Agents: `frontend-builder` + `api-integrator`**

### 6.1 Speaker Form Page
- [ ] Create `app/dashboard/speakers/new/page.tsx`
  - [ ] Form fields
    - [ ] Full Name (required)
    - [ ] Title (required)
    - [ ] Company (required)
    - [ ] Bio (textarea, required)
    - [ ] Profile Photo (upload)
    - [ ] Presentation Title (required)
    - [ ] Presentation Description (textarea)
    - [ ] Presentation Type (dropdown)
      - [ ] Workshop
      - [ ] Presentation
      - [ ] Panel
      - [ ] Fireside Chat
    - [ ] Expertise (multi-select tags)
    - [ ] Event Date (date picker)
    - [ ] Event Location (dropdown)
      - [ ] Miami
      - [ ] Brazil
      - [ ] Virtual
- [ ] Implement form validation
  - [ ] Required fields
  - [ ] Valid date
  - [ ] Image format validation
- [ ] Add "Generate Announcement" button
- [ ] Test form submission

### 6.2 AI Content Generation
- [ ] Create `lib/ai/speaker-announcement.ts`
- [ ] Set up OpenAI API client
  - [ ] Install: `npm install openai`
  - [ ] Configure API key
- [ ] Create prompt templates
  - [ ] LinkedIn template (professional, 3000 chars)
  - [ ] Twitter template (engaging, 280 chars)
  - [ ] Instagram template (visual, 2200 chars, hashtags)
  - [ ] Discord template (community, rich formatting)
- [ ] Implement `generateSpeakerAnnouncement(speakerData)`
  - [ ] Build platform-specific prompts
  - [ ] Call OpenAI API for each platform
  - [ ] Include DeepStation brand voice
    - [ ] "Join us as we welcome..."
    - [ ] Community-focused language
    - [ ] Professional yet approachable
  - [ ] Return content for all platforms
- [ ] Add retry logic for API failures
- [ ] Test with sample speaker data

### 6.3 Branded Speaker Card Generation
- [ ] Create `lib/images/speaker-card.ts`
- [ ] Design speaker card template
  - [ ] DeepStation branding
  - [ ] Speaker photo
  - [ ] Name and title
  - [ ] Event details
  - [ ] Platform: 1080x1080 (Instagram)
  - [ ] Platform: 1200x675 (Twitter/LinkedIn)
- [ ] Implement image generation
  - [ ] Option 1: Use Canvas API in Edge Function
  - [ ] Option 2: Use third-party service (Cloudinary, Bannerbear)
  - [ ] Option 3: Pre-designed Figma template + automation
- [ ] Upload generated image to Supabase Storage
- [ ] Return public URL
- [ ] Test image generation

### 6.4 Speaker Announcement Preview
- [ ] Create preview page: `app/dashboard/speakers/preview/page.tsx`
  - [ ] Display generated content for each platform
  - [ ] Show PlatformPreview for each
  - [ ] Display generated speaker card image
  - [ ] Edit buttons for each platform's content
  - [ ] Regenerate button
  - [ ] Schedule/Post buttons
- [ ] Implement content editing
  - [ ] Allow manual edits to AI-generated content
  - [ ] Preserve edits
- [ ] Implement regeneration
  - [ ] Call AI API again
  - [ ] Replace content
  - [ ] Confirm with user
- [ ] Test preview and editing

### 6.5 Integration with Publishing
- [ ] Add speaker announcement option to New Post page
  - [ ] "Create Speaker Announcement" button
  - [ ] Redirect to speaker form
- [ ] Save speaker data to database
  - [ ] Create `speakers` table
  - [ ] Store speaker info
  - [ ] Link to generated posts
- [ ] Test end-to-end flow
  - [ ] Fill speaker form
  - [ ] Generate content
  - [ ] Preview content
  - [ ] Schedule/post announcement

---

## Phase 7: Testing & Quality Assurance
**All Agents**

### 7.1 Unit Testing
- [ ] Set up testing framework
  - [ ] Install: `npm install -D jest @testing-library/react @testing-library/jest-dom`
  - [ ] Configure Jest for Next.js
- [ ] Write tests for utilities
  - [ ] Timezone conversions
  - [ ] RRULE generation
  - [ ] Form validation
  - [ ] Content formatting
- [ ] Write tests for API functions
  - [ ] LinkedIn publishing
  - [ ] Instagram publishing
  - [ ] Twitter publishing
  - [ ] Discord publishing
  - [ ] Mock API responses
- [ ] Write tests for components
  - [ ] PostEditor
  - [ ] SchedulePicker
  - [ ] PlatformPreview
- [ ] Achieve >80% code coverage
- [ ] Run tests in CI/CD

### 7.2 Integration Testing
- [ ] Set up integration test suite
- [ ] Test OAuth flows end-to-end
  - [ ] Use test accounts
  - [ ] Verify token storage
  - [ ] Verify token refresh
- [ ] Test publishing flows
  - [ ] Schedule post
  - [ ] Verify post in database
  - [ ] Trigger Edge Function manually
  - [ ] Verify post published
  - [ ] Check post_results
- [ ] Test error scenarios
  - [ ] Invalid tokens
  - [ ] Rate limits
  - [ ] Network errors
  - [ ] Database errors
- [ ] Test scheduling edge cases
  - [ ] Timezone edge cases
  - [ ] DST transitions
  - [ ] Recurring posts
  - [ ] Failed posts with retries

### 7.3 End-to-End Testing
- [ ] Set up E2E testing
  - [ ] Install Playwright: `npm install -D @playwright/test`
  - [ ] Configure Playwright
- [ ] Write E2E tests
  - [ ] User signup and login
  - [ ] Connect social accounts
  - [ ] Create and schedule post
  - [ ] View scheduled posts
  - [ ] Edit scheduled post
  - [ ] Delete scheduled post
  - [ ] Create speaker announcement
  - [ ] View analytics
- [ ] Run E2E tests in CI/CD
- [ ] Test on multiple browsers
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari

### 7.4 Performance Testing
- [ ] Test page load times
  - [ ] Lighthouse scores >90
  - [ ] First Contentful Paint <1.5s
  - [ ] Time to Interactive <3s
- [ ] Test database query performance
  - [ ] Add indexes where needed
  - [ ] Optimize slow queries
- [ ] Test Edge Function performance
  - [ ] Monitor execution time
  - [ ] Optimize if >5s
- [ ] Load test with concurrent users
  - [ ] Use k6 or Artillery
  - [ ] Test 100 concurrent posts
  - [ ] Monitor database connections

### 7.5 Security Audit
- [ ] Review RLS policies
  - [ ] Verify no data leaks
  - [ ] Test with different users
- [ ] Review token encryption
  - [ ] Verify tokens encrypted at rest
  - [ ] Test decryption
- [ ] Check for XSS vulnerabilities
  - [ ] Sanitize user input
  - [ ] Use proper escaping
- [ ] Check for CSRF vulnerabilities
  - [ ] Verify state parameter
  - [ ] Check session validation
- [ ] Review environment variables
  - [ ] No secrets in client code
  - [ ] Proper .env.local setup
- [ ] Run security scanner
  - [ ] npm audit
  - [ ] Snyk or similar

### 7.6 User Acceptance Testing
- [ ] Create test user accounts
- [ ] Recruit beta testers from DeepStation
- [ ] Provide testing checklist
  - [ ] Create account
  - [ ] Connect platforms
  - [ ] Schedule posts
  - [ ] Create speaker announcements
  - [ ] Review analytics
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Iterate based on feedback

---

## Phase 8: Deployment & Launch
**Agent: `supabase-architect`**

### 8.1 Supabase Production Setup
- [ ] Create production Supabase project
- [ ] Run database migrations
  - [ ] Apply all migration files
  - [ ] Verify schema
  - [ ] Verify RLS policies
- [ ] Set up production environment variables
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OAuth credentials for all platforms
  - [ ] OpenAI API key
  - [ ] Encryption key
- [ ] Configure storage buckets
- [ ] Deploy Edge Functions
  - [ ] `supabase functions deploy process-scheduled-posts`
  - [ ] Set up cron schedule
  - [ ] Verify execution
- [ ] Set up monitoring
  - [ ] Enable Supabase logs
  - [ ] Set up alerts

### 8.2 Next.js Production Deployment
- [ ] Choose hosting platform
  - [ ] Option 1: Vercel (recommended for Next.js)
  - [ ] Option 2: Netlify
  - [ ] Option 3: Self-hosted
- [ ] Configure build settings
  - [ ] Set Node.js version
  - [ ] Set build command
  - [ ] Set environment variables
- [ ] Deploy to production
  - [ ] Connect Git repository
  - [ ] Trigger deployment
  - [ ] Verify build success
- [ ] Test production deployment
  - [ ] Verify all pages load
  - [ ] Test authentication
  - [ ] Test posting
  - [ ] Test scheduling

### 8.3 Domain and SSL
- [ ] Configure custom domain
  - [ ] Add DNS records
  - [ ] Verify domain
- [ ] Enable SSL/HTTPS
  - [ ] Automatic with Vercel/Netlify
  - [ ] Or use Let's Encrypt
- [ ] Update OAuth redirect URIs
  - [ ] Update all platform apps
  - [ ] Use production domain

### 8.4 Monitoring and Analytics
- [ ] Set up application monitoring
  - [ ] Sentry for error tracking
  - [ ] LogRocket for session replay (optional)
- [ ] Set up analytics
  - [ ] Plausible or PostHog (privacy-friendly)
  - [ ] Track key events
    - [ ] User signups
    - [ ] Platform connections
    - [ ] Posts scheduled
    - [ ] Posts published
- [ ] Set up uptime monitoring
  - [ ] Pingdom or UptimeRobot
  - [ ] Alert on downtime
- [ ] Create admin dashboard
  - [ ] System health metrics
  - [ ] User statistics
  - [ ] Error logs

### 8.5 Documentation
- [ ] Create user documentation
  - [ ] Getting started guide
  - [ ] How to connect platforms
  - [ ] How to schedule posts
  - [ ] How to create speaker announcements
  - [ ] FAQ
- [ ] Create admin documentation
  - [ ] System architecture
  - [ ] Deployment process
  - [ ] Troubleshooting guide
  - [ ] Database schema reference
- [ ] Create API documentation (if exposing APIs)
- [ ] Record demo videos
  - [ ] Platform overview
  - [ ] Key features walkthrough

### 8.6 Launch Preparation
- [ ] Final pre-launch checklist
  - [ ] All tests passing
  - [ ] Security audit complete
  - [ ] Performance benchmarks met
  - [ ] Documentation complete
  - [ ] Monitoring set up
  - [ ] Backup strategy in place
- [ ] Create launch plan
  - [ ] Announce to DeepStation community
  - [ ] Email existing members
  - [ ] Social media posts
  - [ ] Demo at next event
- [ ] Prepare support channels
  - [ ] Email support
  - [ ] Discord channel for help
  - [ ] Issue tracker

### 8.7 Post-Launch
- [ ] Monitor for issues
  - [ ] Watch error logs
  - [ ] Monitor performance
  - [ ] Track user feedback
- [ ] Quick bug fixes
  - [ ] Prioritize critical bugs
  - [ ] Deploy fixes rapidly
- [ ] Gather user feedback
  - [ ] Survey users
  - [ ] Track feature requests
- [ ] Plan next iteration
  - [ ] Prioritize features
  - [ ] Create roadmap

---

## Success Metrics

### Technical Metrics
- [ ] API uptime: >99.5%
- [ ] Page load time: <2 seconds
- [ ] Edge Function execution: <5 seconds
- [ ] Post success rate: >95%
- [ ] Test coverage: >80%

### User Metrics
- [ ] User signups: Track growth
- [ ] Platform connections: Avg 2+ platforms per user
- [ ] Posts scheduled: Track monthly volume
- [ ] Posts published: Track success rate
- [ ] User retention: >60% after 30 days

### Business Metrics
- [ ] Time saved per post: >15 minutes
- [ ] Engagement increase: Track vs manual posting
- [ ] User satisfaction: >4/5 rating
- [ ] Feature adoption: Speaker announcements used by >30% of users

---

## Future Enhancements (Post-MVP)

### Phase 9: Advanced Features
- [ ] AI-powered content suggestions
- [ ] Hashtag recommendations
- [ ] Image generation for posts (DALL-E integration)
- [ ] Video upload support
- [ ] Thread/carousel support
- [ ] A/B testing for post content
- [ ] Bulk scheduling (CSV import)
- [ ] Team collaboration features
- [ ] Approval workflows
- [ ] White-label solution for other communities

### Phase 10: Analytics & Insights
- [ ] Advanced analytics dashboard
- [ ] Engagement predictions
- [ ] Competitor analysis
- [ ] Audience insights
- [ ] Custom reports
- [ ] Data export (CSV, PDF)
- [ ] API for external integrations

### Phase 11: Additional Platforms
- [ ] Facebook
- [ ] TikTok
- [ ] YouTube (community posts)
- [ ] Threads
- [ ] Mastodon
- [ ] BlueSky

---

## Agent Handoff Guide

**When to use each agent:**

1. **supabase-architect**: Database changes, RLS policies, Edge Functions, storage configuration
2. **oauth-specialist**: OAuth flows, token management, authentication issues
3. **api-integrator**: Platform API integration, publishing logic, media handling
4. **scheduler-expert**: Scheduling, timezones, RRULE, cron jobs, queue management
5. **frontend-builder**: UI components, pages, forms, Next.js app structure

**Sequential workflow example:**
1. `supabase-architect` creates database schema
2. `oauth-specialist` implements OAuth flows and stores tokens
3. `api-integrator` builds publishing APIs using stored tokens
4. `scheduler-expert` creates scheduling system that calls publishing APIs
5. `frontend-builder` creates UI that uses all backend systems

---

## Notes

- Always reference documentation in `/docs/` for implementation details
- Use TypeScript for all code
- Follow Next.js best practices (Server Components, App Router)
- Maintain security best practices (RLS, token encryption, HTTPS)
- Test thoroughly at each phase before moving to next
- Document decisions and technical debt
- Keep user experience as top priority
