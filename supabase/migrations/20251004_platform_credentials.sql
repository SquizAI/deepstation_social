-- Platform Credentials Enhancement
-- Adds support for user-provided API credentials in addition to OAuth

-- Add new columns to oauth_tokens table
ALTER TABLE oauth_tokens
ADD COLUMN IF NOT EXISTS credential_type TEXT DEFAULT 'oauth' CHECK (credential_type IN ('oauth', 'api_key')),
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_credential_type ON oauth_tokens(credential_type);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_platform ON oauth_tokens(user_id, platform);

-- Add comments
COMMENT ON COLUMN oauth_tokens.credential_type IS 'Type of credential: oauth (from OAuth flow) or api_key (user-provided)';
COMMENT ON COLUMN oauth_tokens.credentials IS 'Platform-specific credential data (client_id, client_secret, bearer_token, etc.)';
COMMENT ON COLUMN oauth_tokens.metadata IS 'Additional metadata (rate limits, custom settings, etc.)';

-- Update RLS policies to include new credential types
DROP POLICY IF EXISTS "Users can view their own tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON oauth_tokens;

CREATE POLICY "Users can view their own tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);
