import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildAuthorizationUrl,
  validatePlatformConfig,
  generatePKCEChallenge,
} from '@/lib/auth/oauth-config';
import { storeState, storePKCEVerifier } from '@/lib/auth/csrf';

/**
 * Twitter (X) OAuth 2.0 Initiation Endpoint with PKCE
 *
 * This endpoint initiates the Twitter OAuth flow by:
 * 1. Validating user is authenticated
 * 2. Checking Twitter OAuth credentials are configured
 * 3. Generating PKCE challenge (required for Twitter OAuth 2.0)
 * 4. Generating CSRF state token
 * 5. Redirecting to Twitter authorization URL
 *
 * Required Environment Variables:
 * - TWITTER_CLIENT_ID: Your Twitter app's client ID
 * - TWITTER_CLIENT_SECRET: Your Twitter app's client secret
 * - NEXT_PUBLIC_APP_URL: Your application's URL (for callback)
 *
 * Scopes Requested:
 * - tweet.read: Read tweets
 * - tweet.write: Post tweets
 * - users.read: Read user profile
 * - offline.access: Get refresh token for token renewal
 *
 * Important Notes:
 * - Twitter OAuth 2.0 requires PKCE (Proof Key for Code Exchange)
 * - Free tier: 500 posts per month (2025 limits)
 * - Access tokens expire after 2 hours but can be refreshed
 *
 * Documentation: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 *
 * GET /api/auth/twitter
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Twitter OAuth] Initiation request received');

    // Validate Twitter configuration
    if (!validatePlatformConfig('twitter')) {
      console.error('[Twitter OAuth] Configuration validation failed');
      return NextResponse.json(
        {
          error: 'Twitter OAuth is not configured. Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in environment variables.',
        },
        { status: 500 }
      );
    }

    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('[Twitter OAuth] User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    console.log(`[Twitter OAuth] Initiating OAuth for user: ${session.user.id}`);

    // Generate and store CSRF state
    const state = await storeState('twitter');
    console.log('[Twitter OAuth] CSRF state generated and stored');

    // Generate PKCE challenge (required for Twitter OAuth 2.0)
    const pkce = generatePKCEChallenge();
    await storePKCEVerifier('twitter', pkce.codeVerifier);
    console.log('[Twitter OAuth] PKCE challenge generated and code verifier stored');

    // Build Twitter authorization URL with PKCE
    const authUrl = buildAuthorizationUrl('twitter', state, pkce);

    console.log('[Twitter OAuth] Redirecting to Twitter authorization page');

    // Redirect to Twitter authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Twitter OAuth] Initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Twitter OAuth flow' },
      { status: 500 }
    );
  }
}
