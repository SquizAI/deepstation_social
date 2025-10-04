-- DeepStation Analytics Views and Functions
-- Version: 004
-- Description: Creates analytics views, indexes, and functions for reporting

BEGIN;

-- =============================================
-- POST ANALYTICS VIEW
-- =============================================
-- Aggregates post metrics with engagement calculations
CREATE OR REPLACE VIEW post_analytics AS
SELECT
  sp.id AS post_id,
  sp.user_id,
  sp.content,
  sp.platforms,
  sp.scheduled_for,
  sp.timezone,
  sp.status,
  sp.created_at,
  sp.updated_at,

  -- Aggregate metrics from post_results
  COALESCE(
    jsonb_object_agg(
      pr.platform,
      jsonb_build_object(
        'platform_post_id', pr.platform_post_id,
        'post_url', pr.post_url,
        'status', pr.status,
        'metrics', pr.metrics,
        'posted_at', pr.posted_at
      )
    ) FILTER (WHERE pr.platform IS NOT NULL),
    '{}'::jsonb
  ) AS platform_results,

  -- Calculate total engagement across all platforms
  COALESCE(
    SUM(
      COALESCE((pr.metrics->>'likes')::int, 0) +
      COALESCE((pr.metrics->>'shares')::int, 0) +
      COALESCE((pr.metrics->>'comments')::int, 0) +
      COALESCE((pr.metrics->>'retweets')::int, 0) +
      COALESCE((pr.metrics->>'reactions')::int, 0)
    ),
    0
  ) AS total_engagement,

  -- Individual engagement metrics
  COALESCE(SUM(COALESCE((pr.metrics->>'likes')::int, 0)), 0) AS total_likes,
  COALESCE(SUM(COALESCE((pr.metrics->>'shares')::int, 0)), 0) AS total_shares,
  COALESCE(SUM(COALESCE((pr.metrics->>'comments')::int, 0)), 0) AS total_comments,
  COALESCE(SUM(COALESCE((pr.metrics->>'retweets')::int, 0)), 0) AS total_retweets,
  COALESCE(SUM(COALESCE((pr.metrics->>'reactions')::int, 0)), 0) AS total_reactions,

  -- Success metrics
  COUNT(pr.id) FILTER (WHERE pr.status = 'success') AS successful_platforms,
  COUNT(pr.id) FILTER (WHERE pr.status = 'failed') AS failed_platforms,
  array_length(sp.platforms, 1) AS total_platforms,

  -- Calculate success rate
  CASE
    WHEN array_length(sp.platforms, 1) > 0
    THEN ROUND(
      (COUNT(pr.id) FILTER (WHERE pr.status = 'success')::numeric / array_length(sp.platforms, 1)::numeric) * 100,
      2
    )
    ELSE 0
  END AS success_rate

FROM scheduled_posts sp
LEFT JOIN post_results pr ON sp.id = pr.post_id
GROUP BY sp.id;

COMMENT ON VIEW post_analytics IS 'Aggregated analytics view for posts with engagement metrics';

-- =============================================
-- PLATFORM PERFORMANCE VIEW
-- =============================================
-- Aggregates performance metrics by platform
CREATE OR REPLACE VIEW platform_performance AS
SELECT
  user_id,
  platform,
  COUNT(*) AS total_posts,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_posts,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_posts,

  -- Success rate
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*)::numeric) * 100,
    2
  ) AS success_rate,

  -- Engagement metrics
  COALESCE(SUM(COALESCE((metrics->>'likes')::int, 0)), 0) AS total_likes,
  COALESCE(SUM(COALESCE((metrics->>'shares')::int, 0)), 0) AS total_shares,
  COALESCE(SUM(COALESCE((metrics->>'comments')::int, 0)), 0) AS total_comments,
  COALESCE(SUM(COALESCE((metrics->>'retweets')::int, 0)), 0) AS total_retweets,
  COALESCE(SUM(COALESCE((metrics->>'reactions')::int, 0)), 0) AS total_reactions,

  -- Total engagement
  COALESCE(
    SUM(
      COALESCE((metrics->>'likes')::int, 0) +
      COALESCE((metrics->>'shares')::int, 0) +
      COALESCE((metrics->>'comments')::int, 0) +
      COALESCE((metrics->>'retweets')::int, 0) +
      COALESCE((metrics->>'reactions')::int, 0)
    ),
    0
  ) AS total_engagement,

  -- Average engagement per post
  ROUND(
    COALESCE(
      SUM(
        COALESCE((metrics->>'likes')::int, 0) +
        COALESCE((metrics->>'shares')::int, 0) +
        COALESCE((metrics->>'comments')::int, 0) +
        COALESCE((metrics->>'retweets')::int, 0) +
        COALESCE((metrics->>'reactions')::int, 0)
      )::numeric / NULLIF(COUNT(*) FILTER (WHERE status = 'success'), 0)::numeric,
      0
    ),
    2
  ) AS avg_engagement_per_post,

  -- Date range
  MIN(posted_at) AS first_post_at,
  MAX(posted_at) AS last_post_at

FROM (
  SELECT
    sp.user_id,
    unnest(sp.platforms) AS platform,
    pr.status,
    pr.metrics,
    pr.posted_at
  FROM scheduled_posts sp
  LEFT JOIN post_results pr ON sp.id = pr.post_id AND pr.platform = unnest(sp.platforms)
  WHERE sp.status IN ('published', 'failed')
) platform_posts
GROUP BY user_id, platform;

COMMENT ON VIEW platform_performance IS 'Platform-specific performance metrics and success rates';

-- =============================================
-- POSTING TIME ANALYTICS FUNCTION
-- =============================================
-- Analyzes best posting times based on engagement
CREATE OR REPLACE FUNCTION get_best_posting_times(
  p_user_id UUID,
  p_platform TEXT DEFAULT NULL,
  p_date_range_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  day_of_week INTEGER,
  hour_of_day INTEGER,
  post_count BIGINT,
  avg_engagement NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM pr.posted_at AT TIME ZONE sp.timezone)::INTEGER AS day_of_week,
    EXTRACT(HOUR FROM pr.posted_at AT TIME ZONE sp.timezone)::INTEGER AS hour_of_day,
    COUNT(*) AS post_count,
    ROUND(
      AVG(
        COALESCE((pr.metrics->>'likes')::int, 0) +
        COALESCE((pr.metrics->>'shares')::int, 0) +
        COALESCE((pr.metrics->>'comments')::int, 0) +
        COALESCE((pr.metrics->>'retweets')::int, 0) +
        COALESCE((pr.metrics->>'reactions')::int, 0)
      ),
      2
    ) AS avg_engagement,
    ROUND(
      (COUNT(*) FILTER (WHERE pr.status = 'success')::numeric / COUNT(*)::numeric) * 100,
      2
    ) AS success_rate
  FROM scheduled_posts sp
  JOIN post_results pr ON sp.id = pr.post_id
  WHERE sp.user_id = p_user_id
    AND sp.status = 'published'
    AND pr.posted_at >= NOW() - (p_date_range_days || ' days')::INTERVAL
    AND (p_platform IS NULL OR pr.platform = p_platform)
  GROUP BY day_of_week, hour_of_day
  HAVING COUNT(*) >= 2  -- At least 2 posts for statistical relevance
  ORDER BY avg_engagement DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_best_posting_times IS 'Returns best posting times based on historical engagement data';

-- =============================================
-- TOP PERFORMING POSTS FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION get_top_posts(
  p_user_id UUID,
  p_platform TEXT DEFAULT NULL,
  p_date_range_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  post_id UUID,
  content JSONB,
  platforms TEXT[],
  scheduled_for TIMESTAMPTZ,
  total_engagement BIGINT,
  total_likes BIGINT,
  total_shares BIGINT,
  total_comments BIGINT,
  successful_platforms BIGINT,
  success_rate NUMERIC,
  posted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.post_id,
    pa.content,
    pa.platforms,
    pa.scheduled_for,
    pa.total_engagement,
    pa.total_likes,
    pa.total_shares,
    pa.total_comments,
    pa.successful_platforms,
    pa.success_rate,
    MAX(pr.posted_at) AS posted_at
  FROM post_analytics pa
  JOIN post_results pr ON pa.post_id = pr.post_id
  WHERE pa.user_id = p_user_id
    AND pa.status = 'published'
    AND pr.posted_at >= NOW() - (p_date_range_days || ' days')::INTERVAL
    AND (p_platform IS NULL OR pr.platform = p_platform)
  GROUP BY
    pa.post_id, pa.content, pa.platforms, pa.scheduled_for,
    pa.total_engagement, pa.total_likes, pa.total_shares,
    pa.total_comments, pa.successful_platforms, pa.success_rate
  ORDER BY pa.total_engagement DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_posts IS 'Returns top performing posts by engagement within date range';

-- =============================================
-- ANALYTICS SUMMARY FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_user_id UUID,
  p_platform TEXT DEFAULT NULL,
  p_date_range_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_posts BIGINT,
  published_posts BIGINT,
  failed_posts BIGINT,
  total_engagement BIGINT,
  avg_engagement_per_post NUMERIC,
  success_rate NUMERIC,
  most_engaged_platform TEXT,
  least_engaged_platform TEXT
) AS $$
DECLARE
  v_most_engaged TEXT;
  v_least_engaged TEXT;
BEGIN
  -- Get most and least engaged platforms
  SELECT platform INTO v_most_engaged
  FROM platform_performance
  WHERE user_id = p_user_id
    AND (p_platform IS NULL OR platform = p_platform)
    AND total_posts > 0
  ORDER BY avg_engagement_per_post DESC
  LIMIT 1;

  SELECT platform INTO v_least_engaged
  FROM platform_performance
  WHERE user_id = p_user_id
    AND (p_platform IS NULL OR platform = p_platform)
    AND total_posts > 0
  ORDER BY avg_engagement_per_post ASC
  LIMIT 1;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT sp.id) AS total_posts,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'published') AS published_posts,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'failed') AS failed_posts,
    COALESCE(SUM(
      COALESCE((pr.metrics->>'likes')::int, 0) +
      COALESCE((pr.metrics->>'shares')::int, 0) +
      COALESCE((pr.metrics->>'comments')::int, 0) +
      COALESCE((pr.metrics->>'retweets')::int, 0) +
      COALESCE((pr.metrics->>'reactions')::int, 0)
    ), 0) AS total_engagement,
    ROUND(
      COALESCE(
        SUM(
          COALESCE((pr.metrics->>'likes')::int, 0) +
          COALESCE((pr.metrics->>'shares')::int, 0) +
          COALESCE((pr.metrics->>'comments')::int, 0) +
          COALESCE((pr.metrics->>'retweets')::int, 0) +
          COALESCE((pr.metrics->>'reactions')::int, 0)
        )::numeric / NULLIF(COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'published'), 0)::numeric,
        0
      ),
      2
    ) AS avg_engagement_per_post,
    ROUND(
      COALESCE(
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'published')::numeric /
        NULLIF(COUNT(DISTINCT sp.id), 0)::numeric * 100,
        0
      ),
      2
    ) AS success_rate,
    v_most_engaged AS most_engaged_platform,
    v_least_engaged AS least_engaged_platform
  FROM scheduled_posts sp
  LEFT JOIN post_results pr ON sp.id = pr.post_id
  WHERE sp.user_id = p_user_id
    AND sp.created_at >= NOW() - (p_date_range_days || ' days')::INTERVAL
    AND (p_platform IS NULL OR pr.platform = p_platform);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_analytics_summary IS 'Returns overall analytics summary for dashboard';

-- =============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =============================================

-- Index for date range queries on post_results
CREATE INDEX IF NOT EXISTS idx_post_results_user_date
ON post_results(posted_at DESC)
WHERE status = 'success';

-- Index for platform filtering with metrics
CREATE INDEX IF NOT EXISTS idx_post_results_platform_metrics
ON post_results(platform, posted_at DESC)
WHERE status = 'success' AND metrics IS NOT NULL;

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_analytics
ON scheduled_posts(user_id, status, created_at DESC)
WHERE status IN ('published', 'failed');

COMMIT;
