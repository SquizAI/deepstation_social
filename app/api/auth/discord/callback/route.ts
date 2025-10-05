import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';
import { validateState, cleanupOAuthCookies } from '@/lib/auth/csrf';
import { exchangeCodeForToken, getTokenExpirationDate } from '@/lib/auth/oauth-config';
import { storeOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * Discord OAuth 2.0 Callback Handler
 *
 * Flow:
 * 1. User authorizes Discord access
 * 2. Discord redirects to this endpoint with authorization code
 * 3. Exchange code for access token
 * 4. Store encrypted tokens in database
 * 5. Redirect user back to dashboard
 *
 * Important Notes:
 * - Discord tokens do not expire
 * - Posting is done via webhooks (simpler than other platforms)
 * - No rate limits for webhook posting
 * - Can post to multiple servers/channels
 *
 * Documentation: https://discord.com/developers/docs/topics/oauth2
 *
 * GET /api/auth/discord/callback?code={auth_code}&state={csrf_state}
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[Discord OAuth] Callback received');

  // Handle OAuth errors from Discord
  if (error) {
    console.error('[Discord OAuth] Error:', error, errorDescription);
    await cleanupOAuthCookies();

    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/social-accounts?error=${encodeURIComponent(`Discord: ${errorMessage}`)}`,
        request.url
      )
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('[Discord OAuth] No authorization code provided');
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Discord authorization failed: No code provided',
        request.url
      )
    );
  }

  // Validate state parameter (CSRF protection)
  if (!state) {
    console.error('[Discord OAuth] No state parameter provided');
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Invalid authentication request',
        request.url
      )
    );
  }

  try {
    // Validate state and ensure it's for Discord
    const platform = await validateState(state);

    if (!platform || platform !== 'discord') {
      console.error('[Discord OAuth] Invalid state or platform mismatch');
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
      console.error('[Discord OAuth] No active session found');
      return NextResponse.redirect(
        new URL(
          '/login?error=Please log in first before connecting Discord',
          request.url
        )
      );
    }

    console.log(`[Discord OAuth] Processing for user: ${session.user.id}`);

    try {
      // Exchange authorization code for access token
      const tokenResponse = await exchangeCodeForToken('discord', code);

      console.log('[Discord OAuth] Token exchange successful');

      // Discord tokens typically don't expire, but we set a far future date
      // If expires_in is provided, use it; otherwise set to 10 years
      const expiresInSeconds = tokenResponse.expires_in || 315360000; // 10 years
      console.log(`[Discord OAuth] Token expires in: ${expiresInSeconds} seconds`);

      const expiresAt = getTokenExpirationDate('discord', expiresInSeconds);

      // Discord may provide a refresh token
      if (!tokenResponse.refresh_token) {
        console.log('[Discord OAuth] No refresh token provided - token is likely non-expiring');
      }

      // Store the encrypted OAuth token
      await storeOAuthToken(session.user.id, 'discord', {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      });

      console.log(`[Discord OAuth] Successfully connected Discord for user ${session.user.id}`);

      // Clean up OAuth cookies
      await cleanupOAuthCookies();

      // Redirect to settings page with success message
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/social-accounts?success=Discord connected successfully. You can now post via webhooks.',
          request.url
        )
      );
    } catch (tokenError) {
      console.error('[Discord OAuth] Token exchange error:', tokenError);
      await cleanupOAuthCookies();

      const errorMsg = tokenError instanceof Error ? tokenError.message : 'Unknown error';
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/social-accounts?error=${encodeURIComponent(`Failed to connect Discord: ${errorMsg}`)}`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('[Discord OAuth] Unexpected error:', error);
    await cleanupOAuthCookies();

    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/social-accounts?error=Discord authentication failed',
        request.url
      )
    );
  }
}
