import crypto from 'crypto';

export type Platform = 'linkedin' | 'instagram' | 'twitter' | 'discord';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Get OAuth configuration for a specific platform
 */
export function getOAuthConfig(platform: Platform): OAuthConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/auth/callback`;

  switch (platform) {
    case 'linkedin':
      return {
        clientId: process.env.LINKEDIN_CLIENT_ID!,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
        authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['openid', 'profile', 'email', 'w_member_social'],
        redirectUri,
      };

    case 'instagram':
      return {
        clientId: process.env.FACEBOOK_APP_ID!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        authorizationUrl: 'https://www.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        scopes: [
          'instagram_business_basic',
          'instagram_business_content_publish',
          'pages_read_engagement',
        ],
        redirectUri,
      };

    case 'twitter':
      return {
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        redirectUri,
      };

    case 'discord':
      return {
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        authorizationUrl: 'https://discord.com/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scopes: ['identify', 'guilds', 'webhook.incoming'],
        redirectUri,
      };

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate PKCE challenge for OAuth 2.0 with PKCE (required for Twitter)
 * @returns Object containing codeVerifier and codeChallenge
 */
export function generatePKCEChallenge(): PKCEChallenge {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');

  // Create SHA256 hash of the verifier
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();

  // Base64 URL encode the hash to create the challenge
  const codeChallenge = hash.toString('base64url');

  return {
    codeVerifier,
    codeChallenge,
  };
}

/**
 * Build authorization URL for OAuth flow
 * @param platform - The social media platform
 * @param state - CSRF protection state parameter
 * @param pkce - Optional PKCE challenge (required for Twitter)
 * @returns Complete authorization URL
 */
export function buildAuthorizationUrl(
  platform: Platform,
  state: string,
  pkce?: PKCEChallenge
): string {
  const config = getOAuthConfig(platform);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
    scope: config.scopes.join(' '),
  });

  // Add PKCE parameters for Twitter
  if (platform === 'twitter' && pkce) {
    params.append('code_challenge', pkce.codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param platform - The social media platform
 * @param code - Authorization code from callback
 * @param codeVerifier - PKCE code verifier (required for Twitter)
 * @returns Token response from the platform
 */
export async function exchangeCodeForToken(
  platform: Platform,
  code: string,
  codeVerifier?: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}> {
  const config = getOAuthConfig(platform);

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  // Add PKCE code_verifier for Twitter
  if (platform === 'twitter' && codeVerifier) {
    params.append('code_verifier', codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Token exchange failed for ${platform}:`, error);
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Refresh an expired access token
 * @param platform - The social media platform
 * @param refreshToken - The refresh token
 * @returns New token response
 */
export async function refreshAccessToken(
  platform: Platform,
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}> {
  const config = getOAuthConfig(platform);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Token refresh failed for ${platform}:`, error);
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Validate platform configuration
 * @param platform - The social media platform
 * @returns true if configuration is valid
 */
export function validatePlatformConfig(platform: Platform): boolean {
  try {
    const config = getOAuthConfig(platform);

    if (!config.clientId || !config.clientSecret) {
      console.error(`Missing credentials for ${platform}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Invalid configuration for ${platform}:`, error);
    return false;
  }
}

/**
 * Get token expiration time in milliseconds
 * @param platform - The social media platform
 * @param expiresIn - Expires in seconds from token response
 * @returns Date object for token expiration
 */
export function getTokenExpirationDate(platform: Platform, expiresIn: number): Date {
  // Add a 5-minute buffer to refresh tokens before they actually expire
  const bufferSeconds = 300;
  const expirationSeconds = expiresIn - bufferSeconds;

  return new Date(Date.now() + expirationSeconds * 1000);
}
