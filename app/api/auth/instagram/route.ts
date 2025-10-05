import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthorizationUrl, validatePlatformConfig } from '@/lib/auth/oauth-config';
import { storeState } from '@/lib/auth/csrf';

/**
 * Instagram OAuth 2.0 Initiation Endpoint (via Facebook Graph API)
 *
 * This endpoint initiates the Instagram OAuth flow by:
 * 1. Validating user is authenticated
 * 2. Checking Instagram/Facebook OAuth credentials are configured
 * 3. Generating CSRF state token
 * 4. Redirecting to Instagram authorization URL
 *
 * Required Environment Variables:
 * - FACEBOOK_APP_ID: Your Facebook app's ID (used for Instagram)
 * - FACEBOOK_APP_SECRET: Your Facebook app's secret
 * - NEXT_PUBLIC_APP_URL: Your application's URL (for callback)
 *
 * Scopes Requested:
 * - instagram_business_basic: Basic account information
 * - instagram_business_content_publish: Permission to publish content
 * - pages_read_engagement: Read Page engagement data
 *
 * Important Notes:
 * - Requires Instagram Business or Creator account
 * - Account must be linked to a Facebook Page
 * - Rate limit: 100 posts per 24 hours
 * - Uses container-based publishing (create container, then publish)
 * - Access tokens valid for 60 days
 *
 * Documentation: https://developers.facebook.com/docs/instagram-api/overview
 *
 * GET /api/auth/instagram
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Instagram OAuth] Initiation request received');

    // Validate Instagram/Facebook configuration
    if (!validatePlatformConfig('instagram')) {
      console.error('[Instagram OAuth] Configuration validation failed');
      return NextResponse.json(
        {
          error: 'Instagram OAuth is not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.',
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
      console.error('[Instagram OAuth] User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    console.log(`[Instagram OAuth] Initiating OAuth for user: ${session.user.id}`);

    // Generate and store CSRF state
    const state = await storeState('instagram');
    console.log('[Instagram OAuth] CSRF state generated and stored');

    // Build Instagram authorization URL
    const authUrl = buildAuthorizationUrl('instagram', state);

    console.log('[Instagram OAuth] Redirecting to Instagram authorization page');
    console.log('[Instagram OAuth] Note: Business or Creator account required');

    // Redirect to Instagram authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Instagram OAuth] Initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram OAuth flow' },
      { status: 500 }
    );
  }
}
