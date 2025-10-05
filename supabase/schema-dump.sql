-- ============================================================================
-- DeepStation Database Schema
-- Complete schema dump for replication
-- Generated: 2025-10-04
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- ============================================================================
-- OAUTH TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord', 'resend', 'sendgrid')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  provider_user_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  credential_type TEXT DEFAULT 'oauth' CHECK (credential_type IN ('oauth', 'api_key')),
  credentials JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

COMMENT ON TABLE public.oauth_tokens IS 'Stores OAuth tokens and API credentials for platform integrations';
COMMENT ON COLUMN public.oauth_tokens.platform IS 'Platform: linkedin, instagram, twitter, discord, resend, or sendgrid';
COMMENT ON COLUMN public.oauth_tokens.access_token IS 'Encrypted OAuth access token (for OAuth platforms)';
COMMENT ON COLUMN public.oauth_tokens.refresh_token IS 'Encrypted OAuth refresh token (if available)';
COMMENT ON COLUMN public.oauth_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN public.oauth_tokens.provider_user_id IS 'User ID from the OAuth provider (optional)';
COMMENT ON COLUMN public.oauth_tokens.credential_type IS 'Type of credential: oauth (from OAuth flow) or api_key (user-provided)';
COMMENT ON COLUMN public.oauth_tokens.credentials IS 'Platform-specific credential data (client_id, client_secret, bearer_token, etc.)';
COMMENT ON COLUMN public.oauth_tokens.metadata IS 'Additional metadata (rate limits, custom settings, etc.)';

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON public.oauth_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_credential_type ON public.oauth_tokens(credential_type);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_platform ON public.oauth_tokens(user_id, platform);

-- ============================================================================
-- SCHEDULED POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  images TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  platforms TEXT[] NOT NULL CHECK (array_length(platforms, 1) > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.scheduled_posts IS 'Stores scheduled posts for multi-platform publishing';
COMMENT ON COLUMN public.scheduled_posts.content IS 'JSONB object with platform-specific content, e.g., {"linkedin": "...", "twitter": "..."}';
COMMENT ON COLUMN public.scheduled_posts.images IS 'Array of image URLs from Supabase Storage';
COMMENT ON COLUMN public.scheduled_posts.scheduled_for IS 'UTC timestamp when post should be published';
COMMENT ON COLUMN public.scheduled_posts.timezone IS 'User timezone for display purposes';
COMMENT ON COLUMN public.scheduled_posts.platforms IS 'Array of platforms to publish to';
COMMENT ON COLUMN public.scheduled_posts.status IS 'Current post status: draft, scheduled, published, or failed';

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);

-- ============================================================================
-- POST RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.post_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  platform_post_id TEXT,
  post_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.post_results IS 'Stores publishing results and engagement metrics per platform';
COMMENT ON COLUMN public.post_results.platform_post_id IS 'ID of the post on the platform (e.g., LinkedIn URN, Tweet ID)';
COMMENT ON COLUMN public.post_results.post_url IS 'Direct URL to the published post';
COMMENT ON COLUMN public.post_results.metrics IS 'JSONB object with engagement metrics: {"likes": 10, "shares": 5, "comments": 3}';

CREATE INDEX IF NOT EXISTS idx_post_results_post_id ON public.post_results(post_id);
CREATE INDEX IF NOT EXISTS idx_post_results_platform ON public.post_results(platform);

-- ============================================================================
-- RECURRING POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recurring_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  recurrence_rule TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  next_occurrence TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.recurring_posts IS 'Stores recurring post schedules using RRULE (RFC 5545) format';
COMMENT ON COLUMN public.recurring_posts.recurrence_rule IS 'RRULE format string, e.g., "FREQ=DAILY" or "FREQ=WEEKLY;BYDAY=MO,WE,FR"';
COMMENT ON COLUMN public.recurring_posts.next_occurrence IS 'Next scheduled occurrence in UTC';

CREATE INDEX IF NOT EXISTS idx_recurring_posts_post_id ON public.recurring_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_recurring_posts_next_occurrence ON public.recurring_posts(next_occurrence);

-- ============================================================================
-- PUBLISHING QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.publishing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.publishing_queue IS 'Job queue for managing and prioritizing publishing tasks';
COMMENT ON COLUMN public.publishing_queue.priority IS 'Job priority (1=highest, 10=lowest), default=5';
COMMENT ON COLUMN public.publishing_queue.status IS 'Queue job status: queued, processing, completed, or failed';

CREATE INDEX IF NOT EXISTS idx_publishing_queue_status ON public.publishing_queue(status);
CREATE INDEX IF NOT EXISTS idx_publishing_queue_priority ON public.publishing_queue(priority);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  location_type TEXT CHECK (location_type IN ('online', 'in-person', 'hybrid')),
  venue_name TEXT,
  venue_address TEXT,
  meeting_url TEXT,
  virtual_platform TEXT,
  capacity INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  approval_message TEXT,
  allows_guests BOOLEAN DEFAULT true,
  max_guests_per_registration INTEGER DEFAULT 5,
  cover_image_url TEXT,
  og_image_url TEXT,
  custom_branding JSONB DEFAULT '{}'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule TEXT,
  parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  event_type TEXT DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'conference', 'meetup', 'webinar', 'course', 'networking', 'other')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  tags TEXT[],
  recording_url TEXT,
  confirmation_message TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  luma_event_id TEXT UNIQUE,
  luma_event_url TEXT,
  luma_api_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured) WHERE featured = true;

-- ============================================================================
-- TICKET TYPES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_free BOOLEAN GENERATED ALWAYS AS (price = 0) STORED,
  quantity_total INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN quantity_total IS NULL THEN NULL
      ELSE GREATEST(0, quantity_total - quantity_sold)
    END
  ) STORED,
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  min_per_order INTEGER DEFAULT 1,
  max_per_order INTEGER DEFAULT 10,
  requires_approval BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_is_active ON public.ticket_types(is_active) WHERE is_active = true;

-- ============================================================================
-- EVENT REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  num_guests INTEGER DEFAULT 0,
  guest_names TEXT[],
  answers JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_intent_id TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON public.event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

-- ============================================================================
-- SPEAKERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  bio TEXT NOT NULL,
  profile_photo_url TEXT,
  presentation_title TEXT NOT NULL,
  presentation_description TEXT,
  presentation_type TEXT CHECK (presentation_type IN ('workshop', 'presentation', 'panel', 'fireside_chat')),
  expertise TEXT[],
  event_date DATE,
  event_location TEXT CHECK (event_location IN ('miami', 'brazil', 'virtual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.speakers IS 'Stores speaker information for AI-powered announcement generation';
COMMENT ON COLUMN public.speakers.presentation_type IS 'Type of presentation: workshop, presentation, panel, or fireside_chat';
COMMENT ON COLUMN public.speakers.expertise IS 'Array of expertise tags, e.g., ["AI", "Blockchain", "Web3"]';

CREATE INDEX IF NOT EXISTS idx_speakers_user_id ON public.speakers(user_id);

-- ============================================================================
-- SPEAKER ANNOUNCEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.speaker_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id UUID UNIQUE NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  generated_content JSONB NOT NULL,
  speaker_card_images JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speaker_announcements_speaker_id ON public.speaker_announcements(speaker_id);

-- ============================================================================
-- VIDEO GENERATION JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  resolution TEXT,
  has_audio BOOLEAN DEFAULT false,
  error_message TEXT,
  cost NUMERIC,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_user_id ON public.video_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_status ON public.video_generation_jobs(status);

-- ============================================================================
-- EMAIL SUBSCRIBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.email_subscribers IS 'Stores email subscribers';

CREATE INDEX IF NOT EXISTS idx_email_subscribers_user_id ON public.email_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON public.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON public.email_subscribers(status);

-- ============================================================================
-- SUBSCRIBER LISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriber_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subscriber_lists IS 'Stores subscriber lists/segments';

CREATE INDEX IF NOT EXISTS idx_subscriber_lists_user_id ON public.subscriber_lists(user_id);

-- ============================================================================
-- LIST SUBSCRIBERS TABLE (Junction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.list_subscribers (
  list_id UUID NOT NULL REFERENCES public.subscriber_lists(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, subscriber_id)
);

COMMENT ON TABLE public.list_subscribers IS 'Junction table for lists and subscribers';

CREATE INDEX IF NOT EXISTS idx_list_subscribers_list_id ON public.list_subscribers(list_id);
CREATE INDEX IF NOT EXISTS idx_list_subscribers_subscriber_id ON public.list_subscribers(subscriber_id);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  html_content TEXT NOT NULL,
  category TEXT DEFAULT 'custom' CHECK (category IN ('newsletter', 'announcement', 'product', 'event', 'promotional', 'custom')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.email_templates IS 'Stores email templates';

CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON public.email_templates(user_id);

-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  preview_text TEXT,
  content TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "bounced": 0, "clicked": 0, "unsubscribed": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.email_campaigns IS 'Stores email campaigns/newsletters';

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON public.email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);

-- ============================================================================
-- CAMPAIGN RECIPIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.campaign_recipients IS 'Tracks individual campaign recipients and their interactions';

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_subscriber_id ON public.campaign_recipients(subscriber_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- OAuth Tokens Policies
CREATE POLICY "Users can manage their own oauth tokens" ON public.oauth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Scheduled Posts Policies
CREATE POLICY "Users can manage their own posts" ON public.scheduled_posts
  FOR ALL USING (auth.uid() = user_id);

-- Post Results Policies
CREATE POLICY "Users can view results for their posts" ON public.post_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scheduled_posts WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- Events Policies
CREATE POLICY "Users can view published public events" ON public.events
  FOR SELECT USING (
    visibility = 'public' AND status = 'published'
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Event Registrations Policies
CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own registrations" ON public.event_registrations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid()
    )
  );

-- Speakers Policies
CREATE POLICY "Users can manage their own speakers" ON public.speakers
  FOR ALL USING (auth.uid() = user_id);

-- Video Generation Jobs Policies
CREATE POLICY "Users can manage their own video jobs" ON public.video_generation_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Email Subscribers Policies
CREATE POLICY "Users can manage their own subscribers" ON public.email_subscribers
  FOR ALL USING (auth.uid() = user_id);

-- Email Campaigns Policies
CREATE POLICY "Users can manage their own campaigns" ON public.email_campaigns
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
