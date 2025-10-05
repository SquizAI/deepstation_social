import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthorizationUrl, validatePlatformConfig } from '@/lib/auth/oauth-config';
import { storeState } from '@/lib/auth/csrf';

/**
 * Discord OAuth 2.0 Initiation Endpoint
 *
 * This endpoint initiates the Discord OAuth flow by:
 * 1. Validating user is authenticated
 * 2. Checking Discord OAuth credentials are configured
 * 3. Generating CSRF state token
 * 4. Redirecting to Discord authorization URL
 *
 * Required Environment Variables:
 * - DISCORD_CLIENT_ID: Your Discord app's client ID
 * - DISCORD_CLIENT_SECRET: Your Discord app's client secret
 * - NEXT_PUBLIC_APP_URL: Your application's URL (for callback)
 *
 * Scopes Requested:
 * - identify: Basic user information
 * - guilds: Access to user's guilds (servers)
 * - webhook.incoming: Permission to create incoming webhooks
 *
 * Important Notes:
 * - Discord tokens typically don't expire
 * - Posting is done via webhooks (simpler than other platforms)
 * - No rate limits for webhook posting
 * - Can post to multiple servers and channels
 * - Webhooks can be created per channel
 *
 * Documentation: https://discord.com/developers/docs/topics/oauth2
 *
 * GET /api/auth/discord
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Discord OAuth] Initiation request received');

    // Validate Discord configuration
    if (!validatePlatformConfig('discord')) {
      console.error('[Discord OAuth] Configuration validation failed');
      return NextResponse.json(
        {
          error: 'Discord OAuth is not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in environment variables.',
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
      console.error('[Discord OAuth] User not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    console.log(`[Discord OAuth] Initiating OAuth for user: ${session.user.id}`);

    // Generate and store CSRF state
    const state = await storeState('discord');
    console.log('[Discord OAuth] CSRF state generated and stored');

    // Build Discord authorization URL
    const authUrl = buildAuthorizationUrl('discord', state);

    console.log('[Discord OAuth] Redirecting to Discord authorization page');

    // Redirect to Discord authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Discord OAuth] Initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Discord OAuth flow' },
      { status: 500 }
    );
  }
}
