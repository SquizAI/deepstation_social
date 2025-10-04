import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Platform } from '@/lib/types/oauth';

export interface PlatformAccountData {
  platform: Platform;
  isConnected: boolean;
  providerUserId?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isExpired?: boolean;
  daysUntilExpiration?: number;
}

/**
 * Get detailed OAuth account information for all platforms
 * GET /api/auth/accounts
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all OAuth tokens for user
    const { data: tokens, error } = await supabase
      .from('oauth_tokens')
      .select('platform, provider_user_id, expires_at, created_at, updated_at')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching OAuth tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch account data' },
        { status: 500 }
      );
    }

    // Create a map of platform data
    const platformMap = new Map<Platform, any>();

    if (tokens) {
      tokens.forEach((token) => {
        platformMap.set(token.platform as Platform, token);
      });
    }

    // Build response for all platforms
    const platforms: Platform[] = ['linkedin', 'instagram', 'twitter', 'discord'];
    const accounts: PlatformAccountData[] = platforms.map((platform) => {
      const tokenData = platformMap.get(platform);

      if (!tokenData) {
        return {
          platform,
          isConnected: false,
        };
      }

      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const isExpired = expiresAt < now;
      const daysUntilExpiration = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        platform,
        isConnected: true,
        providerUserId: tokenData.provider_user_id,
        expiresAt: tokenData.expires_at,
        createdAt: tokenData.created_at,
        updatedAt: tokenData.updated_at,
        isExpired,
        daysUntilExpiration,
      };
    });

    return NextResponse.json({
      userId: session.user.id,
      accounts,
    });
  } catch (error) {
    console.error('OAuth accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to get account information' },
      { status: 500 }
    );
  }
}
