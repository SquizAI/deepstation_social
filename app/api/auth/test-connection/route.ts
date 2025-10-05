import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Platform } from '@/lib/types/oauth';

/**
 * Test connection for a platform using stored credentials
 * POST /api/auth/test-connection
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

    const { platform } = await request.json() as { platform: Platform };

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Get credentials for platform
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('credential_type, access_token, credentials')
      .eq('user_id', session.user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'No credentials found for this platform' },
        { status: 404 }
      );
    }

    // Test connection based on platform
    let testResult;

    try {
      switch (platform) {
        case 'linkedin':
          testResult = await testLinkedInConnection(tokenData);
          break;
        case 'instagram':
          testResult = await testInstagramConnection(tokenData);
          break;
        case 'twitter':
          testResult = await testTwitterConnection(tokenData);
          break;
        case 'discord':
          testResult = await testDiscordConnection(tokenData);
          break;
        default:
          return NextResponse.json(
            { error: 'Unsupported platform' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        platform,
        ...testResult,
      });
    } catch (testError: any) {
      console.error(`${platform} connection test failed:`, testError);
      return NextResponse.json(
        {
          success: false,
          platform,
          error: testError.message || 'Connection test failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}

async function testLinkedInConnection(tokenData: any) {
  const token = tokenData.credential_type === 'oauth'
    ? tokenData.access_token
    : tokenData.credentials?.accessToken;

  if (!token) {
    throw new Error('No access token found');
  }

  // Test LinkedIn API - Get user profile
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${error}`);
  }

  const data = await response.json();

  return {
    message: 'LinkedIn connection successful',
    accountInfo: {
      name: data.name,
      email: data.email,
    },
  };
}

async function testInstagramConnection(tokenData: any) {
  const accessToken = tokenData.credential_type === 'oauth'
    ? tokenData.access_token
    : tokenData.credentials?.accessToken;

  if (!accessToken) {
    throw new Error('No access token found');
  }

  // Test Instagram Graph API - Get user account
  const response = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Instagram API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  return {
    message: 'Instagram connection successful',
    accountInfo: {
      username: data.username,
      id: data.id,
    },
  };
}

async function testTwitterConnection(tokenData: any) {
  const bearerToken = tokenData.credential_type === 'oauth'
    ? tokenData.access_token
    : tokenData.credentials?.bearerToken;

  if (!bearerToken) {
    throw new Error('No bearer token found');
  }

  // Test Twitter API v2 - Get authenticated user
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twitter API error: ${error.detail || error.title || 'Unknown error'}`);
  }

  const data = await response.json();

  return {
    message: 'X (Twitter) connection successful',
    accountInfo: {
      username: data.data?.username,
      name: data.data?.name,
    },
  };
}

async function testDiscordConnection(tokenData: any) {
  const token = tokenData.credential_type === 'oauth'
    ? tokenData.access_token
    : tokenData.credentials?.botToken;

  // If webhook URL is provided, test that instead
  const webhookUrl = tokenData.credentials?.webhookUrl;

  if (webhookUrl) {
    // Test webhook by sending a test message
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '✅ DeepStation connection test successful!',
        embeds: [{
          title: 'Connection Test',
          description: 'Your Discord webhook is working correctly.',
          color: 0x5865F2,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord webhook error: ${error}`);
    }

    return {
      message: 'Discord webhook connection successful',
      accountInfo: {
        type: 'webhook',
        url: webhookUrl.substring(0, 50) + '...',
      },
    };
  }

  if (!token) {
    throw new Error('No token or webhook URL found');
  }

  // Test Discord bot token
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Discord API error: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();

  return {
    message: 'Discord bot connection successful',
    accountInfo: {
      username: data.username,
      id: data.id,
    },
  };
}
