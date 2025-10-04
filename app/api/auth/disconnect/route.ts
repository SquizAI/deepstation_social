import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Platform } from '@/lib/auth/oauth-config';
import { deleteOAuthToken } from '@/lib/auth/oauth-tokens';

/**
 * Disconnect a social platform
 * DELETE /api/auth/disconnect?platform=linkedin|instagram|twitter|discord
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') as Platform | null;

    // Validate platform parameter
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    if (!['linkedin', 'instagram', 'twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: linkedin, instagram, twitter, or discord' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
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

    // Delete OAuth token
    const success = await deleteOAuthToken(session.user.id, platform);

    if (!success) {
      return NextResponse.json(
        { error: `Failed to disconnect ${platform}` },
        { status: 500 }
      );
    }

    console.log(`Disconnected ${platform} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: `${platform} disconnected successfully`,
    });
  } catch (error) {
    console.error('OAuth disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
