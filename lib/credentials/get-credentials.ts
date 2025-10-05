import { createClient } from '@/lib/supabase/server';
import { Platform } from '@/lib/types/oauth';

export interface PlatformCredentials {
  platform: Platform;
  credentials: Record<string, string>;
  metadata?: Record<string, any>;
  credentialType: 'oauth' | 'api_key';
}

/**
 * Get stored credentials for a platform
 * Retrieves either OAuth tokens or API keys from the database
 */
export async function getStoredCredentials(
  userId: string,
  platform: Platform
): Promise<PlatformCredentials | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('credential_type, access_token, refresh_token, credentials, metadata, expires_at')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.error(`Failed to get credentials for ${platform}:`, error);
    return null;
  }

  // Check if token is expired (for OAuth)
  if (data.credential_type === 'oauth' && data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.warn(`OAuth token for ${platform} has expired`);
      return null;
    }
  }

  // Return OAuth credentials
  if (data.credential_type === 'oauth') {
    return {
      platform,
      credentialType: 'oauth',
      credentials: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || '',
      },
      metadata: data.metadata || {},
    };
  }

  // Return API key credentials
  return {
    platform,
    credentialType: 'api_key',
    credentials: data.credentials || {},
    metadata: data.metadata || {},
  };
}

/**
 * Get email service credentials (Resend or SendGrid)
 * Falls back to environment variables if no stored credentials
 */
export async function getEmailCredentials(
  userId: string
): Promise<{
  provider: 'resend' | 'sendgrid';
  apiKey: string;
  fromEmail: string;
  fromName?: string;
} | null> {
  // Try to get Resend credentials first
  const resendCreds = await getStoredCredentials(userId, 'resend');
  if (resendCreds && resendCreds.credentials.apiKey) {
    return {
      provider: 'resend',
      apiKey: resendCreds.credentials.apiKey,
      fromEmail: resendCreds.credentials.fromEmail || process.env.RESEND_FROM_EMAIL || '',
      fromName: resendCreds.credentials.fromName || process.env.RESEND_FROM_NAME,
    };
  }

  // Try SendGrid
  const sendgridCreds = await getStoredCredentials(userId, 'sendgrid');
  if (sendgridCreds && sendgridCreds.credentials.apiKey) {
    return {
      provider: 'sendgrid',
      apiKey: sendgridCreds.credentials.apiKey,
      fromEmail: sendgridCreds.credentials.fromEmail || process.env.SENDGRID_FROM_EMAIL || '',
      fromName: sendgridCreds.credentials.fromName || process.env.SENDGRID_FROM_NAME,
    };
  }

  // Fall back to environment variables
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || '',
      fromName: process.env.RESEND_FROM_NAME,
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      provider: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
      fromName: process.env.SENDGRID_FROM_NAME,
    };
  }

  return null;
}

/**
 * Get OAuth access token for a platform
 * Convenience function for social media platforms
 */
export async function getOAuthToken(
  userId: string,
  platform: Exclude<Platform, 'resend' | 'sendgrid'>
): Promise<string | null> {
  const credentials = await getStoredCredentials(userId, platform);

  if (!credentials || credentials.credentialType !== 'oauth') {
    return null;
  }

  return credentials.credentials.accessToken || null;
}
