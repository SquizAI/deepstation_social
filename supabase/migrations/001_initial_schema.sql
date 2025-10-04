-- DeepStation Social Media Automation Platform
-- Initial Database Schema Migration
-- Version: 001
-- Description: Creates core tables for OAuth, scheduling, publishing, and speaker management

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- OAUTH TOKENS TABLE
-- =============================================
-- Stores OAuth access and refresh tokens for connected social media platforms
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one active connection per platform per user
  UNIQUE(user_id, platform, platform_user_id)
);

-- Indexes for oauth_tokens
CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at) WHERE is_active = true;

COMMENT ON TABLE oauth_tokens IS 'Stores OAuth tokens for social media platform authentication';
COMMENT ON COLUMN oauth_tokens.platform IS 'Social media platform: linkedin, instagram, twitter, or discord';
COMMENT ON COLUMN oauth_tokens.access_token IS 'OAuth access token (should be encrypted at application level)';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Token expiration timestamp for refresh logic';

-- =============================================
-- SCHEDULED POSTS TABLE
-- =============================================
-- Stores posts to be published across multiple platforms
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  images TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure platforms array is not empty
  CONSTRAINT platforms_not_empty CHECK (array_length(platforms, 1) > 0)
);

-- Indexes for scheduled_posts
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_status_scheduled_for ON scheduled_posts(status, scheduled_for)
  WHERE status IN ('scheduled', 'failed');

COMMENT ON TABLE scheduled_posts IS 'Stores scheduled posts for multi-platform publishing';
COMMENT ON COLUMN scheduled_posts.content IS 'JSONB object with platform-specific content, e.g., {"linkedin": "...", "twitter": "..."}';
COMMENT ON COLUMN scheduled_posts.images IS 'Array of image URLs from Supabase Storage';
COMMENT ON COLUMN scheduled_posts.scheduled_for IS 'UTC timestamp when post should be published';
COMMENT ON COLUMN scheduled_posts.timezone IS 'User timezone for display purposes';
COMMENT ON COLUMN scheduled_posts.platforms IS 'Array of platforms to publish to';
COMMENT ON COLUMN scheduled_posts.status IS 'Current post status: draft, scheduled, published, or failed';

-- =============================================
-- POST RESULTS TABLE
-- =============================================
-- Stores publishing results and metrics for each platform
CREATE TABLE post_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  platform_post_id TEXT,
  post_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  metrics JSONB DEFAULT '{}',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for post_results
CREATE INDEX idx_post_results_post_id ON post_results(post_id);
CREATE INDEX idx_post_results_platform ON post_results(platform);
CREATE INDEX idx_post_results_status ON post_results(status);
CREATE INDEX idx_post_results_posted_at ON post_results(posted_at DESC) WHERE status = 'success';

COMMENT ON TABLE post_results IS 'Stores publishing results and engagement metrics per platform';
COMMENT ON COLUMN post_results.platform_post_id IS 'ID of the post on the platform (e.g., LinkedIn URN, Tweet ID)';
COMMENT ON COLUMN post_results.post_url IS 'Direct URL to the published post';
COMMENT ON COLUMN post_results.metrics IS 'JSONB object with engagement metrics: {"likes": 10, "shares": 5, "comments": 3}';

-- =============================================
-- RECURRING POSTS TABLE
-- =============================================
-- Stores recurring post schedules using RRULE format
CREATE TABLE recurring_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  recurrence_rule TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  next_occurrence TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recurring_posts
CREATE INDEX idx_recurring_posts_post_id ON recurring_posts(post_id);
CREATE INDEX idx_recurring_posts_next_occurrence ON recurring_posts(next_occurrence)
  WHERE is_active = true;

COMMENT ON TABLE recurring_posts IS 'Stores recurring post schedules using RRULE (RFC 5545) format';
COMMENT ON COLUMN recurring_posts.recurrence_rule IS 'RRULE format string, e.g., "FREQ=DAILY" or "FREQ=WEEKLY;BYDAY=MO,WE,FR"';
COMMENT ON COLUMN recurring_posts.next_occurrence IS 'Next scheduled occurrence in UTC';

-- =============================================
-- PUBLISHING QUEUE TABLE
-- =============================================
-- Job queue for managing post publishing tasks
CREATE TABLE publishing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for publishing_queue
CREATE INDEX idx_publishing_queue_post_id ON publishing_queue(post_id);
CREATE INDEX idx_publishing_queue_status_priority ON publishing_queue(status, priority DESC)
  WHERE status = 'queued';
CREATE INDEX idx_publishing_queue_platform ON publishing_queue(platform);

COMMENT ON TABLE publishing_queue IS 'Job queue for managing and prioritizing publishing tasks';
COMMENT ON COLUMN publishing_queue.priority IS 'Job priority (1=highest, 10=lowest), default=5';
COMMENT ON COLUMN publishing_queue.status IS 'Queue job status: queued, processing, completed, or failed';

-- =============================================
-- SPEAKERS TABLE
-- =============================================
-- Stores speaker information for announcement generation
CREATE TABLE speakers (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for speakers
CREATE INDEX idx_speakers_user_id ON speakers(user_id);
CREATE INDEX idx_speakers_event_date ON speakers(event_date);
CREATE INDEX idx_speakers_event_location ON speakers(event_location);

COMMENT ON TABLE speakers IS 'Stores speaker information for AI-powered announcement generation';
COMMENT ON COLUMN speakers.expertise IS 'Array of expertise tags, e.g., ["AI", "Blockchain", "Web3"]';
COMMENT ON COLUMN speakers.presentation_type IS 'Type of presentation: workshop, presentation, panel, or fireside_chat';

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to current timestamp';

-- Function to cleanup expired OAuth tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE oauth_tokens
  SET is_active = false,
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Marks expired OAuth tokens as inactive';

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for scheduled_posts.updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for oauth_tokens.updated_at
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for recurring_posts.updated_at
CREATE TRIGGER update_recurring_posts_updated_at
  BEFORE UPDATE ON recurring_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for speakers.updated_at
CREATE TRIGGER update_speakers_updated_at
  BEFORE UPDATE ON speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
