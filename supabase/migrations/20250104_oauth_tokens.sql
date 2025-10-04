-- Create oauth_tokens table for storing encrypted social media OAuth tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, platform)
);

-- Add provider_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oauth_tokens' AND column_name = 'provider_user_id'
  ) THEN
    ALTER TABLE oauth_tokens ADD COLUMN provider_user_id TEXT;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update own oauth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete own oauth tokens" ON oauth_tokens;

-- RLS Policies: Users can only access their own OAuth tokens
CREATE POLICY "Users can view own oauth tokens"
  ON oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth tokens"
  ON oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth tokens"
  ON oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth tokens"
  ON oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at_trigger ON oauth_tokens;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_oauth_tokens_updated_at_trigger
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();

-- Add comment to table
COMMENT ON TABLE oauth_tokens IS 'Stores encrypted OAuth tokens for social media platform integrations';
COMMENT ON COLUMN oauth_tokens.access_token IS 'Encrypted access token';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'Encrypted refresh token (if available)';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN oauth_tokens.provider_user_id IS 'User ID from the OAuth provider (optional)';
