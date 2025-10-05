import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { validateState, cleanupOAuthCookies } from '@/lib/auth/csrf';
import { exchangeCodeForToken, getTokenExpirationDate } from '@/lib/auth/oauth-config';
import { storeOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * Instagram OAuth 2.0 Callback Handler (via Facebook Graph API)
 *
 * Flow:
 * 1. User authorizes Instagram access (via Facebook Login)
 * 2. Facebook redirects to this endpoint with authorization code
 * 3. Exchange code for access token
 * 4. Store encrypted tokens in database
 * 5. Redirect user back to dashboard
 *
 * Important Notes:
 * - Instagram requires a Business or Creator account
 * - Uses Facebook Graph API for authentication
 * - Rate limit: 100 posts per 24 hours
 * - Posts are created via container-based publishing
 *
 * Documentation: https://developers.facebook.com/docs/instagram-api/overview
 *
 * GET /api/auth/instagram/callback?code={auth_code}&state={csrf_state}
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[Instagram OAuth] Callback received');

  // Handle OAuth errors from Instagram/Facebook
  if (error) {
    console.error('[Instagram OAuth] Error:', error, errorDescription);
    await cleanupOAuthCookies();

    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/social-credentials?error=${encodeURIComponent(`Instagram: ${errorMessage}`)}`,
        request.url
      )
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('[Instagram OAuth] No authorization code provided');
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=Instagram authorization failed: No code provided',
        request.url
      )
    );
  }

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.error('[Instagram OAuth] No state parameter provided');
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=Invalid authentication request',
        request.url
      )
    );
  }

  try {
    // Validate state and ensure it's for Instagram
    const platform = await validateState(state);

    if (!platform || platform !== 'instagram') {
      console.error('[Instagram OAuth] Invalid state or platform mismatch');
      await cleanupOAuthCookies();
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-credentials?error=Invalid authentication request',
          request.url
        )
      );
    }

    // Get current user session
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('[Instagram OAuth] No active session found');
      return NextResponse.redirect(
        new URL(
          '/login?error=Please log in first before connecting Instagram',
          request.url
        )
      );
    }

    console.log(`[Instagram OAuth] Processing for user: ${session.user.id}`);

    try {
      // Exchange authorization code for access token
      const tokenResponse = await exchangeCodeForToken('instagram', code);

      console.log('[Instagram OAuth] Token exchange successful');
      console.log(`[Instagram OAuth] Token expires in: ${tokenResponse.expires_in} seconds (${Math.floor(tokenResponse.expires_in / 86400)} days)`);

      // Calculate expiration date (60 days for Instagram)
      const expiresAt = getTokenExpirationDate('instagram', tokenResponse.expires_in);

      // Note: Instagram tokens from Facebook Graph API may not include refresh tokens
      // Long-lived tokens (60 days) can be extended before expiry
      if (!tokenResponse.refresh_token) {
        console.warn('[Instagram OAuth] No refresh token provided - using long-lived access token');
      }

      // Store the encrypted OAuth token
      await storeOAuthToken(session.user.id, 'instagram', {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      });

      console.log(`[Instagram OAuth] Successfully connected Instagram for user ${session.user.id}`);

      // Clean up OAuth cookies
      await cleanupOAuthCookies();

      // Redirect to settings page with success message
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-credentials?success=Instagram connected successfully. Note: Business account required for posting.',
          request.url
        )
      );
    } catch (tokenError) {
      console.error('[Instagram OAuth] Token exchange error:', tokenError);
      await cleanupOAuthCookies();

      const errorMsg = tokenError instanceof Error ? tokenError.message : 'Unknown error';

      // Check for common Instagram-specific errors
      let userFriendlyError = `Failed to connect Instagram: ${errorMsg}`;
      if (errorMsg.includes('business') || errorMsg.includes('creator')) {
        userFriendlyError = 'Instagram requires a Business or Creator account. Please convert your account and try again.';
      }

      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/social-credentials?error=${encodeURIComponent(userFriendlyError)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('[Instagram OAuth] Unexpected error:', error);
    await cleanupOAuthCookies();

    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=Instagram authentication failed',
        request.url
      )
    );
  }
}
