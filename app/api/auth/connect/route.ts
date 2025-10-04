import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  Platform,
  buildAuthorizationUrl,
  validatePlatformConfig,
  generatePKCEChallenge,
} from '@/lib/auth/oauth-config';
import { storeState, storePKCEVerifier } from '@/lib/auth/csrf';

/**
 * Initiate OAuth flow for social platform connection
 * GET /api/auth/connect?platform=linkedin|instagram|twitter|discord
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') as Platform | null;

    // Validate platform parameter
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    if (!['linkedin', 'instagram', 'twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: linkedin, instagram, twitter, or discord' },
        { status: 400 }
      );
    }

    // Validate platform configuration
    if (!validatePlatformConfig(platform)) {
      // Redirect back to accounts page with error message
      const errorUrl = new URL('/dashboard/accounts', request.url);
      errorUrl.searchParams.set('error', `${platform} is not configured yet. OAuth credentials are missing.`);
      return NextResponse.redirect(errorUrl);
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    // Generate and store CSRF state
    const state = await storeState(platform);

    // Generate PKCE challenge for Twitter
    let pkce: { codeVerifier: string; codeChallenge: string } | undefined;
    if (platform === 'twitter') {
      pkce = generatePKCEChallenge();
      await storePKCEVerifier(platform, pkce.codeVerifier);
    }

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(platform, state, pkce);

    console.log(`Initiating OAuth flow for ${platform} - User: ${session.user.id}`);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
