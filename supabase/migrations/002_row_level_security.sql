-- DeepStation Social Media Automation Platform
-- Row Level Security (RLS) Policies Migration
-- Version: 002
-- Description: Enables RLS and creates comprehensive security policies for all tables

BEGIN;

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================
-- RLS ensures users can only access their own data
-- Service role can bypass RLS for system operations

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- OAUTH_TOKENS POLICIES
-- =============================================
-- Users can only manage their own OAuth tokens
-- Tokens contain sensitive data and must be strictly isolated

-- SELECT: Users can view their own OAuth tokens
CREATE POLICY "Users can view own oauth_tokens"
  ON oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own oauth_tokens" ON oauth_tokens IS
  'Allows users to view only their own OAuth tokens for connected platforms';

-- INSERT: Users can create OAuth tokens for themselves
CREATE POLICY "Users can insert own oauth_tokens"
  ON oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert own oauth_tokens" ON oauth_tokens IS
  'Allows users to add new OAuth tokens when connecting social media accounts';

-- UPDATE: Users can update their own OAuth tokens
CREATE POLICY "Users can update own oauth_tokens"
  ON oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own oauth_tokens" ON oauth_tokens IS
  'Allows users to update their OAuth tokens (e.g., refresh token, expiration)';

-- DELETE: Users can delete their own OAuth tokens
CREATE POLICY "Users can delete own oauth_tokens"
  ON oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own oauth_tokens" ON oauth_tokens IS
  'Allows users to disconnect social media accounts by deleting OAuth tokens';

-- =============================================
-- SCHEDULED_POSTS POLICIES
-- =============================================
-- Users have full CRUD access to their own scheduled posts

-- SELECT: Users can view their own scheduled posts
CREATE POLICY "Users can view own scheduled_posts"
  ON scheduled_posts
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own scheduled_posts" ON scheduled_posts IS
  'Allows users to view all their scheduled, draft, published, and failed posts';

-- INSERT: Users can create scheduled posts for themselves
CREATE POLICY "Users can insert own scheduled_posts"
  ON scheduled_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert own scheduled_posts" ON scheduled_posts IS
  'Allows users to create new scheduled posts for their social media accounts';

-- UPDATE: Users can update their own scheduled posts
CREATE POLICY "Users can update own scheduled_posts"
  ON scheduled_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own scheduled_posts" ON scheduled_posts IS
  'Allows users to edit their scheduled posts (content, schedule time, platforms)';

-- DELETE: Users can delete their own scheduled posts
CREATE POLICY "Users can delete own scheduled_posts"
  ON scheduled_posts
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own scheduled_posts" ON scheduled_posts IS
  'Allows users to cancel and delete their scheduled posts';

-- =============================================
-- POST_RESULTS POLICIES
-- =============================================
-- Users can view results for their own posts via JOIN to scheduled_posts
-- Only service role can INSERT/UPDATE results (Edge Functions)

-- SELECT: Users can view results for their own posts
CREATE POLICY "Users can view own post_results"
  ON post_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = post_results.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view own post_results" ON post_results IS
  'Allows users to view publishing results and metrics for their posts via JOIN';

-- INSERT: Only service role can insert post results (Edge Functions)
-- No user-facing policy needed - service role bypasses RLS
-- This ensures publishing results can only be created by the system

-- UPDATE: Only service role can update post results (Edge Functions)
-- No user-facing policy needed - service role bypasses RLS
-- This prevents users from manipulating engagement metrics

-- =============================================
-- RECURRING_POSTS POLICIES
-- =============================================
-- Users have full CRUD access to their own recurring posts

-- SELECT: Users can view their own recurring posts
CREATE POLICY "Users can view own recurring_posts"
  ON recurring_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = recurring_posts.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view own recurring_posts" ON recurring_posts IS
  'Allows users to view recurring schedules for their posts via JOIN';

-- INSERT: Users can create recurring posts for their own scheduled posts
CREATE POLICY "Users can insert own recurring_posts"
  ON recurring_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = recurring_posts.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can insert own recurring_posts" ON recurring_posts IS
  'Allows users to create recurring schedules for their posts';

-- UPDATE: Users can update their own recurring posts
CREATE POLICY "Users can update own recurring_posts"
  ON recurring_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = recurring_posts.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = recurring_posts.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can update own recurring_posts" ON recurring_posts IS
  'Allows users to modify recurring schedules (RRULE, timezone, active status)';

-- DELETE: Users can delete their own recurring posts
CREATE POLICY "Users can delete own recurring_posts"
  ON recurring_posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = recurring_posts.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can delete own recurring_posts" ON recurring_posts IS
  'Allows users to remove recurring schedules from their posts';

-- =============================================
-- PUBLISHING_QUEUE POLICIES
-- =============================================
-- Only service role can manage the publishing queue
-- Users have read-only access to see queue status for their posts

-- SELECT: Users can view queue items for their own posts
CREATE POLICY "Users can view own publishing_queue"
  ON publishing_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM scheduled_posts
      WHERE scheduled_posts.id = publishing_queue.post_id
        AND scheduled_posts.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view own publishing_queue" ON publishing_queue IS
  'Allows users to view publishing queue status for their posts (read-only)';

-- INSERT: Only service role can add items to the queue
-- No user-facing policy - Edge Functions manage queue via service role

-- UPDATE: Only service role can update queue items
-- No user-facing policy - Edge Functions manage queue via service role

-- DELETE: Only service role can remove items from the queue
-- No user-facing policy - Edge Functions manage queue via service role

-- =============================================
-- SPEAKERS POLICIES
-- =============================================
-- Users have full CRUD access to their own speaker profiles

-- SELECT: Users can view their own speaker profiles
CREATE POLICY "Users can view own speakers"
  ON speakers
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can view own speakers" ON speakers IS
  'Allows users to view all speaker profiles they have created';

-- INSERT: Users can create speaker profiles for themselves
CREATE POLICY "Users can insert own speakers"
  ON speakers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert own speakers" ON speakers IS
  'Allows users to create new speaker profiles for announcement generation';

-- UPDATE: Users can update their own speaker profiles
CREATE POLICY "Users can update own speakers"
  ON speakers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own speakers" ON speakers IS
  'Allows users to edit speaker information (bio, title, presentation details)';

-- DELETE: Users can delete their own speaker profiles
CREATE POLICY "Users can delete own speakers"
  ON speakers
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can delete own speakers" ON speakers IS
  'Allows users to remove speaker profiles they no longer need';

-- =============================================
-- SECURITY VERIFICATION FUNCTION
-- =============================================
-- Helper function to verify RLS is properly configured

CREATE OR REPLACE FUNCTION verify_rls_enabled()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    t.rowsecurity AS rls_enabled,
    COUNT(p.policyname) AS policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename IN (
      'oauth_tokens',
      'scheduled_posts',
      'post_results',
      'recurring_posts',
      'publishing_queue',
      'speakers'
    )
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_rls_enabled() IS
  'Verification function to check RLS status and policy count for all tables';

COMMIT;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this query to verify RLS setup:
-- SELECT * FROM verify_rls_enabled();
--
-- Expected output:
-- table_name         | rls_enabled | policy_count
-- -------------------+-------------+-------------
-- oauth_tokens       | true        | 4
-- publishing_queue   | true        | 1
-- post_results       | true        | 1
-- recurring_posts    | true        | 4
-- scheduled_posts    | true        | 4
-- speakers           | true        | 4
