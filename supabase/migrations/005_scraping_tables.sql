-- DeepStation Scraping Tables Migration
-- Version: 005
-- Description: Creates tables for storing scraped YouTube videos and newsletter topics

BEGIN;

-- =============================================
-- YOUTUBE EXTRACTIONS TABLE
-- =============================================
-- Stores extracted YouTube video metadata for content reuse
CREATE TABLE youtube_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT NOT NULL,
  channel_id TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  view_count INTEGER,
  published_at TIMESTAMPTZ,
  transcript TEXT,
  metadata JSONB DEFAULT '{}',
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate extractions of the same video by the same user
  UNIQUE(user_id, video_id)
);

-- Indexes for youtube_extractions
CREATE INDEX idx_youtube_extractions_user_id ON youtube_extractions(user_id);
CREATE INDEX idx_youtube_extractions_video_id ON youtube_extractions(video_id);
CREATE INDEX idx_youtube_extractions_scraped_at ON youtube_extractions(scraped_at DESC);
CREATE INDEX idx_youtube_extractions_channel_id ON youtube_extractions(channel_id);

COMMENT ON TABLE youtube_extractions IS 'Stores extracted YouTube video metadata for content generation';
COMMENT ON COLUMN youtube_extractions.video_id IS 'YouTube video ID (11 characters)';
COMMENT ON COLUMN youtube_extractions.metadata IS 'JSONB object with additional metadata: thumbnails, tags, etc.';
COMMENT ON COLUMN youtube_extractions.transcript IS 'Video transcript if available';
COMMENT ON COLUMN youtube_extractions.scraped_at IS 'When the video metadata was extracted';

-- =============================================
-- NEWSLETTER TOPICS TABLE
-- =============================================
-- Stores scraped news articles and trending topics for newsletter generation
CREATE TABLE newsletter_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  author TEXT,
  image_url TEXT,
  tags TEXT[],
  relevance_score DECIMAL(3, 2),
  search_query TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate articles from the same search
  UNIQUE(user_id, article_id)
);

-- Indexes for newsletter_topics
CREATE INDEX idx_newsletter_topics_user_id ON newsletter_topics(user_id);
CREATE INDEX idx_newsletter_topics_source ON newsletter_topics(source);
CREATE INDEX idx_newsletter_topics_scraped_at ON newsletter_topics(scraped_at DESC);
CREATE INDEX idx_newsletter_topics_published_at ON newsletter_topics(published_at DESC);
CREATE INDEX idx_newsletter_topics_search_query ON newsletter_topics(search_query);
CREATE INDEX idx_newsletter_topics_relevance_score ON newsletter_topics(relevance_score DESC);
CREATE INDEX idx_newsletter_topics_tags ON newsletter_topics USING GIN(tags);

COMMENT ON TABLE newsletter_topics IS 'Stores scraped news articles and trending topics for newsletter content';
COMMENT ON COLUMN newsletter_topics.article_id IS 'Unique identifier for the article (generated from URL)';
COMMENT ON COLUMN newsletter_topics.relevance_score IS 'Calculated relevance score (0.00 to 1.00)';
COMMENT ON COLUMN newsletter_topics.search_query IS 'The search query used to find this topic';
COMMENT ON COLUMN newsletter_topics.tags IS 'Array of topic tags/categories';

-- =============================================
-- SCRAPED CONTENT USAGE TABLE
-- =============================================
-- Tracks when scraped content is used in posts
CREATE TABLE scraped_content_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('youtube', 'article')),
  content_id UUID NOT NULL,
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for scraped_content_usage
CREATE INDEX idx_scraped_content_usage_user_id ON scraped_content_usage(user_id);
CREATE INDEX idx_scraped_content_usage_content_type ON scraped_content_usage(content_type);
CREATE INDEX idx_scraped_content_usage_post_id ON scraped_content_usage(post_id);
CREATE INDEX idx_scraped_content_usage_used_at ON scraped_content_usage(used_at DESC);

COMMENT ON TABLE scraped_content_usage IS 'Tracks when scraped content is used in published posts';
COMMENT ON COLUMN scraped_content_usage.content_type IS 'Type of content: youtube or article';
COMMENT ON COLUMN scraped_content_usage.content_id IS 'UUID of the youtube_extraction or newsletter_topic';

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get recent YouTube extractions
CREATE OR REPLACE FUNCTION get_recent_youtube_extractions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  video_id TEXT,
  title TEXT,
  channel_name TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  scraped_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ye.id,
    ye.video_id,
    ye.title,
    ye.channel_name,
    ye.thumbnail_url,
    ye.duration,
    ye.scraped_at
  FROM youtube_extractions ye
  WHERE ye.user_id = p_user_id
  ORDER BY ye.scraped_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recent_youtube_extractions IS 'Get recent YouTube video extractions for a user';

-- Function to get trending newsletter topics
CREATE OR REPLACE FUNCTION get_trending_topics(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_min_relevance DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  url TEXT,
  source TEXT,
  relevance_score DECIMAL,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.id,
    nt.title,
    nt.summary,
    nt.url,
    nt.source,
    nt.relevance_score,
    nt.published_at
  FROM newsletter_topics nt
  WHERE nt.user_id = p_user_id
    AND nt.relevance_score >= p_min_relevance
  ORDER BY nt.relevance_score DESC, nt.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_trending_topics IS 'Get trending newsletter topics sorted by relevance';

-- Function to search newsletter topics by keyword
CREATE OR REPLACE FUNCTION search_newsletter_topics(
  p_user_id UUID,
  p_keyword TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  url TEXT,
  source TEXT,
  tags TEXT[],
  relevance_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.id,
    nt.title,
    nt.summary,
    nt.url,
    nt.source,
    nt.tags,
    nt.relevance_score
  FROM newsletter_topics nt
  WHERE nt.user_id = p_user_id
    AND (
      nt.title ILIKE '%' || p_keyword || '%'
      OR nt.summary ILIKE '%' || p_keyword || '%'
      OR p_keyword = ANY(nt.tags)
    )
  ORDER BY nt.relevance_score DESC, nt.scraped_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_newsletter_topics IS 'Search newsletter topics by keyword in title, summary, or tags';

-- Function to cleanup old scraped content
CREATE OR REPLACE FUNCTION cleanup_old_scraped_content(
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete YouTube extractions older than specified days
  DELETE FROM youtube_extractions
  WHERE scraped_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete newsletter topics older than specified days
  DELETE FROM newsletter_topics
  WHERE scraped_at < NOW() - (p_days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_scraped_content IS 'Delete scraped content older than specified days (default: 90)';

COMMIT;
