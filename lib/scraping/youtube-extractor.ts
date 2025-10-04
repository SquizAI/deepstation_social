/**
 * YouTube Content Extractor
 * Extracts video metadata, transcripts, and thumbnails from YouTube URLs
 */

export interface YouTubeMetadata {
  videoId: string;
  url: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
  duration: string;
  viewCount?: number;
  publishedAt?: string;
  transcript?: string;
}

export interface YouTubeExtractionResult {
  success: boolean;
  data?: YouTubeMetadata;
  error?: string;
  errorCode?: YouTubeErrorCode;
}

export type YouTubeErrorCode =
  | 'INVALID_URL'
  | 'VIDEO_NOT_FOUND'
  | 'PRIVATE_VIDEO'
  | 'TRANSCRIPT_UNAVAILABLE'
  | 'API_ERROR'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR';

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's already a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

/**
 * Extract video metadata using YouTube oEmbed API (no API key required)
 */
async function fetchOEmbedData(videoId: string): Promise<Partial<YouTubeMetadata>> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('VIDEO_NOT_FOUND');
      }
      throw new Error('API_ERROR');
    }

    const data = await response.json();

    return {
      title: data.title || '',
      channelName: data.author_name || '',
      thumbnails: {
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      },
    };
  } catch (error: any) {
    if (error.message === 'VIDEO_NOT_FOUND') {
      throw error;
    }
    throw new Error('API_ERROR');
  }
}

/**
 * Scrape additional metadata from YouTube page HTML
 */
async function scrapeVideoPage(videoId: string): Promise<Partial<YouTubeMetadata>> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('NETWORK_ERROR');
    }

    const html = await response.text();

    // Extract data from initial player response
    const scriptMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
    if (!scriptMatch) {
      return {};
    }

    const playerData = JSON.parse(scriptMatch[1]);
    const videoDetails = playerData.videoDetails || {};

    return {
      description: videoDetails.shortDescription || '',
      duration: formatDuration(videoDetails.lengthSeconds),
      viewCount: parseInt(videoDetails.viewCount) || undefined,
      channelId: videoDetails.channelId || '',
    };
  } catch (error) {
    console.error('Error scraping video page:', error);
    return {};
  }
}

/**
 * Attempt to fetch video transcript
 * Note: This requires additional parsing or a third-party service
 */
async function fetchTranscript(videoId: string): Promise<string | undefined> {
  // Transcript extraction is complex and may require:
  // 1. Parsing YouTube's caption tracks
  // 2. Using YouTube Data API v3 with captions.download
  // 3. Third-party services like youtube-transcript-api

  // For now, return undefined and let the user know transcripts need API setup
  return undefined;
}

/**
 * Format duration from seconds to readable format
 */
function formatDuration(seconds: string | number): string {
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Main function to extract YouTube video metadata
 */
export async function extractYouTubeMetadata(
  url: string,
  options: {
    includeTranscript?: boolean;
  } = {}
): Promise<YouTubeExtractionResult> {
  try {
    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL',
        errorCode: 'INVALID_URL',
      };
    }

    // Fetch metadata from multiple sources
    const [oembedData, pageData] = await Promise.all([
      fetchOEmbedData(videoId).catch(() => ({})),
      scrapeVideoPage(videoId).catch(() => ({})),
    ]);

    // Optionally fetch transcript
    let transcript: string | undefined;
    if (options.includeTranscript) {
      transcript = await fetchTranscript(videoId).catch(() => undefined);
    }

    // Combine all data
    const metadata: YouTubeMetadata = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: oembedData.title || 'Unknown Title',
      description: pageData.description || '',
      channelName: oembedData.channelName || 'Unknown Channel',
      channelId: pageData.channelId || '',
      thumbnails: oembedData.thumbnails || {
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      },
      duration: pageData.duration || '0:00',
      viewCount: pageData.viewCount,
      publishedAt: undefined, // Requires API
      transcript,
    };

    return {
      success: true,
      data: metadata,
    };
  } catch (error: any) {
    console.error('YouTube extraction error:', error);

    // Map error to error code
    let errorCode: YouTubeErrorCode = 'API_ERROR';
    if (error.message === 'VIDEO_NOT_FOUND') {
      errorCode = 'VIDEO_NOT_FOUND';
    } else if (error.message === 'NETWORK_ERROR') {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      error: error.message || 'Failed to extract YouTube metadata',
      errorCode,
    };
  }
}

/**
 * Extract metadata from multiple YouTube URLs in batch
 */
export async function extractYouTubeMetadataBatch(
  urls: string[],
  options: {
    includeTranscript?: boolean;
    concurrency?: number;
  } = {}
): Promise<YouTubeExtractionResult[]> {
  const concurrency = options.concurrency || 3;
  const results: YouTubeExtractionResult[] = [];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => extractYouTubeMetadata(url, options))
    );
    results.push(...batchResults);

    // Add delay between batches
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Generate thumbnail URL for a video ID
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
