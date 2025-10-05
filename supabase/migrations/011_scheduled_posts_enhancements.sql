-- Enhanced Scheduled Posts System
-- Version: 011
-- Description: Adds recurring posts support, analytics tracking, and CSV import/export capabilities

BEGIN;

-- =============================================
-- ALTER SCHEDULED_POSTS TABLE
-- =============================================
-- Add new columns for enhanced scheduling features

ALTER TABLE scheduled_posts
ADD COLUMN IF NOT EXISTS recurring_pattern JSONB,
ADD COLUMN IF NOT EXISTS parent_recurring_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS publish_results JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Update status enum to include 'publishing'
ALTER TABLE scheduled_posts
DROP CONSTRAINT IF EXISTS scheduled_posts_status_check;

ALTER TABLE scheduled_posts
ADD CONSTRAINT scheduled_posts_status_check
CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_parent_recurring_id
ON scheduled_posts(parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_published_at
ON scheduled_posts(published_at DESC) WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_retry_count
ON scheduled_posts(retry_count) WHERE status = 'failed';

COMMENT ON COLUMN scheduled_posts.recurring_pattern IS 'JSONB object defining recurring schedule: {frequency, interval, daysOfWeek, endDate, occurrenceCount}';
COMMENT ON COLUMN scheduled_posts.parent_recurring_id IS 'Links to the parent recurring post template';
COMMENT ON COLUMN scheduled_posts.publish_results IS 'JSONB object with per-platform publish results: {platform: {success, error, post_id, post_url}}';
COMMENT ON COLUMN scheduled_posts.retry_count IS 'Number of retry attempts for failed posts';
COMMENT ON COLUMN scheduled_posts.max_retries IS 'Maximum number of retry attempts allowed';

-- =============================================
-- RECURRING POSTS TABLE (Enhanced)
-- =============================================
-- Enhanced recurring posts table with better tracking

CREATE TABLE IF NOT EXISTS recurring_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  pattern JSONB NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  next_occurrence TIMESTAMPTZ NOT NULL,
  last_occurrence TIMESTAMPTZ,
  occurrence_count INTEGER DEFAULT 0,
  max_occurrences INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recurring_posts
CREATE INDEX IF NOT EXISTS idx_recurring_posts_user_id ON recurring_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_posts_post_id ON recurring_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_recurring_posts_next_occurrence
ON recurring_posts(next_occurrence) WHERE is_active = true;

COMMENT ON TABLE recurring_posts IS 'Manages recurring post schedules with pattern-based generation';
COMMENT ON COLUMN recurring_posts.pattern IS 'JSONB defining recurrence: {frequency, interval, daysOfWeek, dayOfMonth}';
COMMENT ON COLUMN recurring_posts.occurrence_count IS 'Number of times this recurring post has been generated';
COMMENT ON COLUMN recurring_posts.max_occurrences IS 'Maximum number of occurrences (null = infinite)';

-- =============================================
-- POST ANALYTICS TABLE
-- =============================================
-- Track engagement metrics for published posts

CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  platform_post_id TEXT,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  reach INTEGER,
  expected_engagement INTEGER,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(post_id, platform)
);

-- Indexes for post_analytics
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_platform ON post_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_post_analytics_fetched_at ON post_analytics(fetched_at DESC);

COMMENT ON TABLE post_analytics IS 'Stores engagement metrics and analytics for published posts';
COMMENT ON COLUMN post_analytics.expected_engagement IS 'Predicted engagement based on historical data';
COMMENT ON COLUMN post_analytics.fetched_at IS 'Last time analytics were fetched from platform';

-- =============================================
-- CSV IMPORT HISTORY TABLE
-- =============================================
-- Track CSV imports for auditing

CREATE TABLE IF NOT EXISTS csv_import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_imports INTEGER NOT NULL,
  failed_imports INTEGER NOT NULL,
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for csv_import_history
CREATE INDEX IF NOT EXISTS idx_csv_import_history_user_id ON csv_import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_history_created_at ON csv_import_history(created_at DESC);

COMMENT ON TABLE csv_import_history IS 'Tracks CSV import operations for scheduled posts';
COMMENT ON COLUMN csv_import_history.error_log IS 'JSONB array of import errors: [{row, error}]';

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate next recurring post instance
CREATE OR REPLACE FUNCTION generate_recurring_post_instance()
RETURNS void AS $$
DECLARE
  recurring_record RECORD;
  new_scheduled_time TIMESTAMPTZ;
  pattern JSONB;
BEGIN
  -- Find active recurring posts ready for next instance
  FOR recurring_record IN
    SELECT * FROM recurring_posts
    WHERE is_active = true
      AND next_occurrence <= NOW()
      AND (max_occurrences IS NULL OR occurrence_count < max_occurrences)
  LOOP
    -- Get the original post
    pattern := recurring_record.pattern;

    -- Calculate next occurrence based on pattern
    CASE pattern->>'frequency'
      WHEN 'daily' THEN
        new_scheduled_time := recurring_record.next_occurrence + INTERVAL '1 day' * COALESCE((pattern->>'interval')::INTEGER, 1);
      WHEN 'weekly' THEN
        new_scheduled_time := recurring_record.next_occurrence + INTERVAL '1 week' * COALESCE((pattern->>'interval')::INTEGER, 1);
      WHEN 'monthly' THEN
        new_scheduled_time := recurring_record.next_occurrence + INTERVAL '1 month' * COALESCE((pattern->>'interval')::INTEGER, 1);
      ELSE
        new_scheduled_time := recurring_record.next_occurrence + INTERVAL '1 day';
    END CASE;

    -- Create new post instance
    INSERT INTO scheduled_posts (
      user_id,
      content,
      images,
      platforms,
      scheduled_for,
      timezone,
      parent_recurring_id,
      recurring_pattern,
      status
    )
    SELECT
      user_id,
      content,
      images,
      platforms,
      recurring_record.next_occurrence,
      timezone,
      recurring_record.post_id,
      recurring_record.pattern,
      'scheduled'
    FROM scheduled_posts
    WHERE id = recurring_record.post_id;

    -- Update recurring post record
    UPDATE recurring_posts
    SET
      last_occurrence = recurring_record.next_occurrence,
      next_occurrence = new_scheduled_time,
      occurrence_count = occurrence_count + 1,
      updated_at = NOW()
    WHERE id = recurring_record.id;

    -- Check if we've reached max occurrences
    IF recurring_record.max_occurrences IS NOT NULL AND
       recurring_record.occurrence_count + 1 >= recurring_record.max_occurrences THEN
      UPDATE recurring_posts
      SET is_active = false
      WHERE id = recurring_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_recurring_post_instance() IS 'Generates new scheduled post instances from active recurring patterns';

-- Function to cleanup old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM post_analytics
  WHERE fetched_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_analytics(INTEGER) IS 'Removes analytics data older than specified days (default 90)';

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for recurring_posts.updated_at
CREATE TRIGGER update_recurring_posts_updated_at
  BEFORE UPDATE ON recurring_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for post_analytics.updated_at
CREATE TRIGGER update_post_analytics_updated_at
  BEFORE UPDATE ON post_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- View for post performance summary
CREATE OR REPLACE VIEW post_performance_summary AS
SELECT
  sp.id,
  sp.user_id,
  sp.status,
  sp.scheduled_for,
  sp.published_at,
  sp.platforms,
  COALESCE(
    jsonb_object_agg(
      pa.platform,
      jsonb_build_object(
        'impressions', pa.impressions,
        'engagements', pa.engagements,
        'engagement_rate',
        CASE WHEN pa.impressions > 0
          THEN ROUND((pa.engagements::DECIMAL / pa.impressions) * 100, 2)
          ELSE 0
        END
      )
    ) FILTER (WHERE pa.platform IS NOT NULL),
    '{}'::jsonb
  ) AS analytics,
  sp.created_at
FROM scheduled_posts sp
LEFT JOIN post_analytics pa ON sp.id = pa.post_id
WHERE sp.status = 'published'
GROUP BY sp.id, sp.user_id, sp.status, sp.scheduled_for, sp.published_at, sp.platforms, sp.created_at;

COMMENT ON VIEW post_performance_summary IS 'Aggregated view of post performance across platforms';

COMMIT;
