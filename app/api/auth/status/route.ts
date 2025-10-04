import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserConnectedPlatforms } from '@/lib/auth/oauth-tokens';

/**
 * Get OAuth connection status for all platforms
 * GET /api/auth/status
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get connected platforms
    const connectedPlatforms = await getUserConnectedPlatforms(session.user.id);

    // Build status object
    const status = {
      linkedin: connectedPlatforms.includes('linkedin'),
      instagram: connectedPlatforms.includes('instagram'),
      twitter: connectedPlatforms.includes('twitter'),
      discord: connectedPlatforms.includes('discord'),
    };

    return NextResponse.json({
      userId: session.user.id,
      connectedPlatforms: status,
      totalConnected: connectedPlatforms.length,
    });
  } catch (error) {
    console.error('OAuth status error:', error);
    return NextResponse.json(
      { error: 'Failed to get OAuth status' },
      { status: 500 }
    );
  }
}
