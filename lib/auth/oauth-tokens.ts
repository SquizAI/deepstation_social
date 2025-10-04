import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from './encryption';
import { Platform, refreshAccessToken, getTokenExpirationDate } from './oauth-config';

export interface OAuthToken {
  id: string;
  user_id: string;
  platform: Platform;
  provider_user_id?: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  providerUserId?: string;
}

/**
 * Store OAuth token in database with encryption
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @param tokenData - Token information to store
 * @returns Stored token record
 */
export async function storeOAuthToken(
  userId: string,
  platform: Platform,
  tokenData: TokenData
): Promise<OAuthToken> {
  const supabase = await createClient();

  try {
    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken
      ? encrypt(tokenData.refreshToken)
      : null;

    const { data, error } = await supabase
      .from('oauth_tokens')
      .upsert(
        {
          user_id: userId,
          platform,
          provider_user_id: tokenData.providerUserId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          expires_at: tokenData.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,platform',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error storing OAuth token:', error);
      throw new Error(`Failed to store OAuth token: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from token storage');
    }

    return data as OAuthToken;
  } catch (error) {
    console.error('Store OAuth token error:', error);
    throw error;
  }
}

/**
 * Get OAuth token from database and decrypt it
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @returns Decrypted token data or null if not found
 */
export async function getOAuthToken(
  userId: string,
  platform: Platform
): Promise<TokenData | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No token found
        return null;
      }
      console.error('Error getting OAuth token:', error);
      throw new Error(`Failed to get OAuth token: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const token = data as OAuthToken;

    // Decrypt tokens
    const accessToken = decrypt(token.access_token);
    const refreshToken = token.refresh_token ? decrypt(token.refresh_token) : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(token.expires_at),
      providerUserId: token.provider_user_id,
    };
  } catch (error) {
    console.error('Get OAuth token error:', error);
    throw error;
  }
}

/**
 * Check if token is expired or about to expire
 * @param expiresAt - Token expiration date
 * @returns true if token is expired or will expire within 5 minutes
 */
export function checkTokenExpiration(expiresAt: Date): boolean {
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

  return expiresAt.getTime() - now.getTime() < bufferTime;
}

/**
 * Refresh OAuth token if expired
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @returns Updated token data or null if refresh failed
 */
export async function refreshOAuthToken(
  userId: string,
  platform: Platform
): Promise<TokenData | null> {
  try {
    // Get current token
    const currentToken = await getOAuthToken(userId, platform);

    if (!currentToken) {
      console.error(`No token found for user ${userId} on ${platform}`);
      return null;
    }

    if (!currentToken.refreshToken) {
      console.error(`No refresh token available for ${platform}`);
      return null;
    }

    // Check if token needs refreshing
    if (!checkTokenExpiration(currentToken.expiresAt)) {
      // Token is still valid, return current token
      return currentToken;
    }

    console.log(`Refreshing token for ${platform}...`);

    // Refresh the token
    const tokenResponse = await refreshAccessToken(
      platform,
      currentToken.refreshToken
    );

    // Calculate new expiration date
    const expiresAt = getTokenExpirationDate(platform, tokenResponse.expires_in);

    // Store updated token
    const newTokenData: TokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || currentToken.refreshToken,
      expiresAt,
      providerUserId: currentToken.providerUserId,
    };

    await storeOAuthToken(userId, platform, newTokenData);

    console.log(`Token refreshed successfully for ${platform}`);

    return newTokenData;
  } catch (error) {
    console.error(`Failed to refresh token for ${platform}:`, error);
    return null;
  }
}

/**
 * Get OAuth token and refresh if needed
 * This is the main function to use when you need a valid access token
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @returns Valid token data or null if unavailable
 */
export async function getValidOAuthToken(
  userId: string,
  platform: Platform
): Promise<TokenData | null> {
  try {
    const token = await getOAuthToken(userId, platform);

    if (!token) {
      return null;
    }

    // Check if token needs refreshing
    if (checkTokenExpiration(token.expiresAt)) {
      console.log(`Token expired for ${platform}, attempting refresh...`);
      return await refreshOAuthToken(userId, platform);
    }

    return token;
  } catch (error) {
    console.error('Get valid OAuth token error:', error);
    return null;
  }
}

/**
 * Delete OAuth token from database
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @returns true if deletion was successful
 */
export async function deleteOAuthToken(
  userId: string,
  platform: Platform
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('Error deleting OAuth token:', error);
      throw new Error(`Failed to delete OAuth token: ${error.message}`);
    }

    console.log(`Token deleted successfully for ${platform}`);
    return true;
  } catch (error) {
    console.error('Delete OAuth token error:', error);
    return false;
  }
}

/**
 * Get all OAuth tokens for a user
 * @param userId - The user's ID
 * @returns Array of platform names with active tokens
 */
export async function getUserConnectedPlatforms(userId: string): Promise<Platform[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('platform')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting connected platforms:', error);
      throw new Error(`Failed to get connected platforms: ${error.message}`);
    }

    return (data || []).map((row) => row.platform as Platform);
  } catch (error) {
    console.error('Get connected platforms error:', error);
    return [];
  }
}

/**
 * Check if user has connected a specific platform
 * @param userId - The user's ID
 * @param platform - The social media platform
 * @returns true if platform is connected
 */
export async function isPlatformConnected(
  userId: string,
  platform: Platform
): Promise<boolean> {
  const token = await getOAuthToken(userId, platform);
  return token !== null;
}
