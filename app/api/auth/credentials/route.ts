import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Platform } from '@/lib/types/oauth';

/**
 * Save or update user-provided API credentials for a platform
 * POST /api/auth/credentials
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform, credentials } = body as {
      platform: Platform;
      credentials: Record<string, string>;
    };

    if (!platform || !credentials) {
      return NextResponse.json(
        { error: 'Platform and credentials are required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms: Platform[] = ['linkedin', 'instagram', 'twitter', 'discord', 'resend', 'sendgrid'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Check if credentials already exist for this platform
    const { data: existing } = await supabase
      .from('oauth_tokens')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('platform', platform)
      .eq('credential_type', 'api_key')
      .maybeSingle();

    const credentialData = {
      user_id: session.user.id,
      platform,
      credential_type: 'api_key',
      credentials,
      is_active: true,
      // Set a far future expiry for API keys (they don't expire like OAuth tokens)
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('oauth_tokens')
        .update(credentialData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating credentials:', updateError);
        return NextResponse.json(
          { error: 'Failed to update credentials' },
          { status: 500 }
        );
      }
    } else {
      // Insert new credentials
      const { error: insertError } = await supabase
        .from('oauth_tokens')
        .insert(credentialData);

      if (insertError) {
        console.error('Error saving credentials:', insertError);
        return NextResponse.json(
          { error: 'Failed to save credentials' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully',
    });
  } catch (error) {
    console.error('Save credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}

/**
 * Get user-provided API credentials for a platform
 * GET /api/auth/credentials?platform=linkedin
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('credentials, metadata, created_at, updated_at')
      .eq('user_id', session.user.id)
      .eq('platform', platform)
      .eq('credential_type', 'api_key')
      .maybeSingle();

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        hasCredentials: false,
        credentials: {},
      });
    }

    // Mask sensitive values (show only last 4 characters)
    const maskedCredentials = Object.entries(data.credentials || {}).reduce(
      (acc, [key, value]) => {
        if (typeof value === 'string' && value.length > 4) {
          acc[key] = '••••' + value.slice(-4);
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      hasCredentials: true,
      credentials: maskedCredentials,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to get credentials' },
      { status: 500 }
    );
  }
}
