import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { validateState, getPKCEVerifier, cleanupOAuthCookies } from '@/lib/auth/csrf';
import { exchangeCodeForToken, getTokenExpirationDate } from '@/lib/auth/oauth-config';
import { storeOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * OAuth Callback Handler
 * Handles callbacks from all social platforms (LinkedIn, Instagram, Twitter, Discord)
 * and Supabase Auth (for primary authentication)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code) {
    console.error('No authorization code provided');
    return NextResponse.redirect(
      new URL('/login?error=No authorization code provided', request.url)
    );
  }

  try {
    const supabase = await createClient();

    // Check if this is a social platform OAuth callback (has state parameter)
    if (state) {
      // Validate state and get platform
      const platform = await validateState(state);

      if (!platform) {
        console.error('Invalid state parameter - possible CSRF attack');
        await cleanupOAuthCookies();
        return NextResponse.redirect(
          new URL('/dashboard?error=Invalid authentication request', request.url)
        );
      }

      console.log(`Processing OAuth callback for platform: ${platform}`);

      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error('No active session found');
        return NextResponse.redirect(
          new URL('/login?error=Please log in first before connecting social accounts', request.url)
        );
      }

      try {
        // Get PKCE verifier if this is Twitter
        let codeVerifier: string | undefined;
        if (platform === 'twitter') {
          const verifier = await getPKCEVerifier(platform);
          if (!verifier) {
            console.error('Missing PKCE verifier for Twitter OAuth');
            return NextResponse.redirect(
              new URL('/dashboard?error=Twitter authentication failed', request.url)
            );
          }
          codeVerifier = verifier;
        }

        // Exchange code for token
        const tokenResponse = await exchangeCodeForToken(platform, code, codeVerifier);

        // Calculate expiration date with platform-specific handling
        const expiresAt = getTokenExpirationDate(platform, tokenResponse.expires_in);

        // Store the OAuth token
        await storeOAuthToken(session.user.id, platform, {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
        });

        console.log(`Successfully connected ${platform} for user ${session.user.id}`);

        // Clean up any remaining OAuth cookies
        await cleanupOAuthCookies();

        // Redirect to dashboard with success message
        return NextResponse.redirect(
          new URL(`/dashboard?success=${platform} connected successfully`, request.url)
        );
      } catch (tokenError) {
        console.error(`Error processing ${platform} OAuth:`, tokenError);
        await cleanupOAuthCookies();
        return NextResponse.redirect(
          new URL(`/dashboard?error=Failed to connect ${platform}`, request.url)
        );
      }
    }

    // No state parameter - this is Supabase Auth callback (primary authentication)
    try {
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error('Error exchanging code for session:', sessionError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, request.url)
        );
      }

      if (data.session) {
        console.log(`User authenticated successfully: ${data.session.user.id}`);
        // Successfully authenticated, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', request.url)
      );
    }
  } catch (error) {
    console.error('Callback error:', error);
    await cleanupOAuthCookies();
    return NextResponse.redirect(
      new URL('/login?error=Authentication failed', request.url)
    );
  }

  // If we get here, something went wrong
  return NextResponse.redirect(new URL('/login', request.url));
}
