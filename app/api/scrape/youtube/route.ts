/**
 * YouTube Content Extraction API Endpoint
 * POST /api/scrape/youtube
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractYouTubeMetadata,
  extractYouTubeMetadataBatch,
  isValidYouTubeUrl,
  type YouTubeMetadata,
  type YouTubeExtractionResult,
} from '@/lib/scraping/youtube-extractor';
import { youtubeToPostContent } from '@/lib/scraping/data-wrangler';
import { createClient } from '@/lib/supabase/server';
import type { Platform } from '@/lib/types/oauth';

interface YouTubeExtractRequest {
  url?: string;
  urls?: string[];
  includeTranscript?: boolean;
  generatePosts?: boolean;
  platforms?: Platform[];
  saveToDatabase?: boolean;
}

interface YouTubeExtractResponse {
  success: boolean;
  data?: YouTubeMetadata | YouTubeMetadata[];
  posts?: any[];
  error?: string;
  savedToDatabase?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as YouTubeExtractRequest;
    const {
      url,
      urls,
      includeTranscript = false,
      generatePosts = false,
      platforms = ['linkedin', 'twitter'],
      saveToDatabase = false,
    } = body;

    // Validate input
    if (!url && !urls) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either url or urls is required',
        },
        { status: 400 }
      );
    }

    // Validate URLs
    if (url && !isValidYouTubeUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL',
        },
        { status: 400 }
      );
    }

    let result: YouTubeExtractionResult | YouTubeExtractionResult[];
    let metadata: YouTubeMetadata | YouTubeMetadata[] | undefined;

    // Extract metadata
    if (url) {
      // Single URL extraction
      result = await extractYouTubeMetadata(url, { includeTranscript });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        );
      }

      metadata = result.data;
    } else if (urls) {
      // Batch extraction
      const results = await extractYouTubeMetadataBatch(urls, { includeTranscript });

      // Filter successful results
      const successful = results.filter((r) => r.success && r.data);
      metadata = successful.map((r) => r.data!);

      if (successful.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to extract any videos',
          },
          { status: 400 }
        );
      }

      result = results;
    }

    // Generate platform-specific posts if requested
    let posts: any[] = [];
    if (generatePosts && metadata) {
      if (Array.isArray(metadata)) {
        // Batch post generation
        posts = metadata.flatMap((meta) =>
          youtubeToPostContent(meta, platforms)
        );
      } else {
        // Single post generation
        posts = youtubeToPostContent(metadata, platforms);
      }
    }

    // Save to database if requested
    let savedToDatabase = false;
    if (saveToDatabase && metadata) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json(
            {
              success: false,
              error: 'Authentication required to save to database',
            },
            { status: 401 }
          );
        }

        await saveYouTubeExtraction(
          Array.isArray(metadata) ? metadata : [metadata],
          user.id
        );
        savedToDatabase = true;
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Don't fail the request, just log the error
      }
    }

    const response: YouTubeExtractResponse = {
      success: true,
      data: metadata,
      ...(generatePosts && { posts }),
      ...(saveToDatabase && { savedToDatabase }),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('YouTube extraction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Save YouTube extraction to database
 */
async function saveYouTubeExtraction(
  metadata: YouTubeMetadata[],
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const records = metadata.map((meta) => ({
    user_id: userId,
    video_id: meta.videoId,
    url: meta.url,
    title: meta.title,
    description: meta.description,
    channel_name: meta.channelName,
    channel_id: meta.channelId,
    thumbnail_url: meta.thumbnails.high,
    duration: meta.duration,
    view_count: meta.viewCount,
    published_at: meta.publishedAt,
    transcript: meta.transcript,
    metadata: {
      thumbnails: meta.thumbnails,
    },
    scraped_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('youtube_extractions').insert(records);

  if (error) {
    throw new Error(`Failed to save to database: ${error.message}`);
  }
}

/**
 * GET endpoint to retrieve saved YouTube extractions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('youtube_extractions')
      .select('*')
      .eq('user_id', user.id)
      .order('scraped_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit,
        offset,
        count: data?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Failed to retrieve YouTube extractions:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
