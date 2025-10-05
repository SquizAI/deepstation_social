import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { validateState, getPKCEVerifier, cleanupOAuthCookies } from '@/lib/auth/csrf';
import { exchangeCodeForToken, getTokenExpirationDate } from '@/lib/auth/oauth-config';
import { storeOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * Twitter (X) OAuth 2.0 Callback Handler with PKCE
 *
 * Flow:
 * 1. User authorizes Twitter access
 * 2. Twitter redirects to this endpoint with authorization code
 * 3. Retrieve PKCE code verifier from secure cookie
 * 4. Exchange code + verifier for access token and refresh token
 * 5. Store encrypted tokens in database
 * 6. Redirect user back to dashboard
 *
 * Twitter OAuth 2.0 requires PKCE (Proof Key for Code Exchange) for security.
 *
 * Documentation: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
 *
 * GET /api/auth/twitter/callback?code={auth_code}&state={csrf_state}
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[Twitter OAuth] Callback received');

  // Handle OAuth errors from Twitter
  if (error) {
    console.error('[Twitter OAuth] Error:', error, errorDescription);
    await cleanupOAuthCookies();

    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/social-accounts?error=${encodeURIComponent(`Twitter: ${errorMessage}`)}`,
        request.url
      )
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('[Twitter OAuth] No authorization code provided');
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Twitter authorization failed: No code provided',
        request.url
      )
    );
  }

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.error('[Twitter OAuth] No state parameter provided');
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Invalid authentication request',
        request.url
      )
    );
  }

  try {
    // Validate state and ensure it's for Twitter
    const platform = await validateState(state);

    if (!platform || platform !== 'twitter') {
      console.error('[Twitter OAuth] Invalid state or platform mismatch');
      await cleanupOAuthCookies();
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-accounts?error=Invalid authentication request',
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
      console.error('[Twitter OAuth] No active session found');
      return NextResponse.redirect(
        new URL(
          '/login?error=Please log in first before connecting Twitter',
          request.url
        )
      );
    }

    console.log(`[Twitter OAuth] Processing for user: ${session.user.id}`);

    // Get PKCE code verifier from cookie (required for Twitter OAuth 2.0)
    const codeVerifier = await getPKCEVerifier('twitter');

    if (!codeVerifier) {
      console.error('[Twitter OAuth] Missing PKCE code verifier');
      await cleanupOAuthCookies();
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-accounts?error=Twitter authentication failed: Missing PKCE verifier',
          request.url
        )
      );
    }

    console.log('[Twitter OAuth] PKCE verifier retrieved successfully');

    try {
      // Exchange authorization code + PKCE verifier for access token
      const tokenResponse = await exchangeCodeForToken('twitter', code, codeVerifier);

      console.log('[Twitter OAuth] Token exchange successful');
      console.log(`[Twitter OAuth] Token expires in: ${tokenResponse.expires_in} seconds (${Math.floor(tokenResponse.expires_in / 3600)} hours)`);

      // Calculate expiration date (2 hours for Twitter)
      const expiresAt = getTokenExpirationDate('twitter', tokenResponse.expires_in);

      // Twitter tokens are short-lived (2 hours) but have refresh tokens
      if (!tokenResponse.refresh_token) {
        console.warn('[Twitter OAuth] No refresh token provided - token will expire without renewal');
      }

      // Store the encrypted OAuth token
      await storeOAuthToken(session.user.id, 'twitter', {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      });

      console.log(`[Twitter OAuth] Successfully connected Twitter for user ${session.user.id}`);

      // Clean up OAuth cookies
      await cleanupOAuthCookies();

      // Redirect to settings page with success message
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-accounts?success=Twitter connected successfully',
          request.url
        )
      );
    } catch (tokenError) {
      console.error('[Twitter OAuth] Token exchange error:', tokenError);
      await cleanupOAuthCookies();

      const errorMsg = tokenError instanceof Error ? tokenError.message : 'Unknown error';
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/social-accounts?error=${encodeURIComponent(`Failed to connect Twitter: ${errorMsg}`)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('[Twitter OAuth] Unexpected error:', error);
    await cleanupOAuthCookies();

    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Twitter authentication failed',
        request.url
      )
    );
  }
}
