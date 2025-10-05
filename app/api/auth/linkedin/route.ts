import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthorizationUrl, validatePlatformConfig } from '@/lib/auth/oauth-config';
import { storeState } from '@/lib/auth/csrf';

/**
 * LinkedIn OAuth 2.0 Initiation Endpoint
 *
 * This endpoint initiates the LinkedIn OAuth flow by:
 * 1. Validating user is authenticated
 * 2. Checking LinkedIn OAuth credentials are configured
 * 3. Generating CSRF state token
 * 4. Redirecting to LinkedIn authorization URL
 *
 * Required Environment Variables:
 * - LINKEDIN_CLIENT_ID: Your LinkedIn app's client ID
 * - LINKEDIN_CLIENT_SECRET: Your LinkedIn app's client secret
 * - NEXT_PUBLIC_APP_URL: Your application's URL (for callback)
 *
 * Scopes Requested:
 * - openid: OpenID Connect for user identity
 * - profile: Basic profile information
 * - email: User email address
 * - w_member_social: Permission to post on behalf of user
 *
 * Documentation: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
 *
 * GET /api/auth/linkedin
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[LinkedIn OAuth] Initiation request received');

    // Validate LinkedIn configuration
    if (!validatePlatformConfig('linkedin')) {
      console.error('[LinkedIn OAuth] Configuration validation failed');
      return NextResponse.json(
        {
          error: 'LinkedIn OAuth is not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in environment variables.',
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
      console.error('[LinkedIn OAuth] User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    console.log(`[LinkedIn OAuth] Initiating OAuth for user: ${session.user.id}`);

    // Generate and store CSRF state
    const state = await storeState('linkedin');
    console.log('[LinkedIn OAuth] CSRF state generated and stored');

    // Build LinkedIn authorization URL
    const authUrl = buildAuthorizationUrl('linkedin', state);

    console.log('[LinkedIn OAuth] Redirecting to LinkedIn authorization page');

    // Redirect to LinkedIn authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[LinkedIn OAuth] Initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn OAuth flow' },
      { status: 500 }
    );
  }
}
