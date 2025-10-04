-- Profiles Table Migration
-- Creates profiles table for user settings and preferences
-- Version: 006

BEGIN;

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Stores user profile information and settings
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  bio TEXT,
  company TEXT,
  website TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

COMMENT ON TABLE profiles IS 'Stores user profile information and settings';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile photo in Supabase Storage';
COMMENT ON COLUMN profiles.website IS 'User or company website URL';

-- =============================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================
-- Stores user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_published BOOLEAN NOT NULL DEFAULT true,
  token_expiration BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  speaker_reminders BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one preferences record per user
  UNIQUE(user_id)
);

-- Index for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'Stores user email notification preferences';
COMMENT ON COLUMN notification_preferences.post_published IS 'Send email when posts are published';
COMMENT ON COLUMN notification_preferences.token_expiration IS 'Send warnings when OAuth tokens are expiring';
COMMENT ON COLUMN notification_preferences.weekly_digest IS 'Send weekly analytics digest';
COMMENT ON COLUMN notification_preferences.speaker_reminders IS 'Send reminders about upcoming speaker events';

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for notification_preferences.updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile and notification preferences for new users';

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMIT;
