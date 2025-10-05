import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { validateState, cleanupOAuthCookies } from '@/lib/auth/csrf';
import { exchangeCodeForToken, getTokenExpirationDate } from '@/lib/auth/oauth-config';
import { storeOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * LinkedIn OAuth 2.0 Callback Handler
 *
 * Flow:
 * 1. User authorizes LinkedIn access
 * 2. LinkedIn redirects to this endpoint with authorization code
 * 3. Exchange code for access token and refresh token
 * 4. Store encrypted tokens in database
 * 5. Redirect user back to dashboard
 *
 * Documentation: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
 *
 * GET /api/auth/linkedin/callback?code={auth_code}&state={csrf_state}
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[LinkedIn OAuth] Callback received');

  // Handle OAuth errors from LinkedIn
  if (error) {
    console.error('[LinkedIn OAuth] Error:', error, errorDescription);
    await cleanupOAuthCookies();

    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/social-credentials?error=${encodeURIComponent(`LinkedIn: ${errorMessage}`)}`,
        request.url
      )
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('[LinkedIn OAuth] No authorization code provided');
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=LinkedIn authorization failed: No code provided',
        request.url
      )
    );
  }

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.error('[LinkedIn OAuth] No state parameter provided');
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=Invalid authentication request',
        request.url
      )
    );
  }

  try {
    // Validate state and ensure it's for LinkedIn
    const platform = await validateState(state);

    if (!platform || platform !== 'linkedin') {
      console.error('[LinkedIn OAuth] Invalid state or platform mismatch');
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
      console.error('[LinkedIn OAuth] No active session found');
      return NextResponse.redirect(
        new URL(
          '/login?error=Please log in first before connecting LinkedIn',
          request.url
        )
      );
    }

    console.log(`[LinkedIn OAuth] Processing for user: ${session.user.id}`);

    try {
      // Exchange authorization code for access token
      const tokenResponse = await exchangeCodeForToken('linkedin', code);

      console.log('[LinkedIn OAuth] Token exchange successful');
      console.log(`[LinkedIn OAuth] Token expires in: ${tokenResponse.expires_in} seconds (${Math.floor(tokenResponse.expires_in / 86400)} days)`);

      // Calculate expiration date (60 days for LinkedIn)
      const expiresAt = getTokenExpirationDate('linkedin', tokenResponse.expires_in);

      // Store the encrypted OAuth token
      await storeOAuthToken(session.user.id, 'linkedin', {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      });

      console.log(`[LinkedIn OAuth] Successfully connected LinkedIn for user ${session.user.id}`);

      // Clean up OAuth cookies
      await cleanupOAuthCookies();

      // Redirect to settings page with success message
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-credentials?success=LinkedIn connected successfully',
          request.url
        )
      );
    } catch (tokenError) {
      console.error('[LinkedIn OAuth] Token exchange error:', tokenError);
      await cleanupOAuthCookies();

      const errorMsg = tokenError instanceof Error ? tokenError.message : 'Unknown error';
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/social-credentials?error=${encodeURIComponent(`Failed to connect LinkedIn: ${errorMsg}`)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('[LinkedIn OAuth] Unexpected error:', error);
    await cleanupOAuthCookies();

    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-credentials?error=LinkedIn authentication failed',
        request.url
      )
    );
  }
}
