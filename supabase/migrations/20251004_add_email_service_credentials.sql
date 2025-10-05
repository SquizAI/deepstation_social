-- Add Email Service Provider Support
-- Extends platform_credentials to support email services like Resend and SendGrid

-- Update the platform check constraint to include email service providers
ALTER TABLE oauth_tokens
DROP CONSTRAINT IF EXISTS oauth_tokens_platform_check;

ALTER TABLE oauth_tokens
ADD CONSTRAINT oauth_tokens_platform_check
CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'discord', 'resend', 'sendgrid'));

-- Add index for email service lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_email_service ON oauth_tokens(platform)
WHERE platform IN ('resend', 'sendgrid');

-- Add comments
COMMENT ON CONSTRAINT oauth_tokens_platform_check ON oauth_tokens IS
'Supported platforms: linkedin, instagram, twitter, discord, resend, sendgrid';
