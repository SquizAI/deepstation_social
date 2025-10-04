/**
 * Newsletter Topic Scraper API Endpoint
 * GET /api/scrape/topics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchTopics,
  getIndustryTrends,
  sortTopicsByRelevance,
  deduplicateTopics,
  type NewsArticle,
  type TopicSearchOptions,
} from '@/lib/scraping/newsletter-topics';
import { articleToPostContent } from '@/lib/scraping/data-wrangler';
import { createClient } from '@/lib/supabase/server';
import type { Platform } from '@/lib/types/oauth';

interface TopicSearchResponse {
  success: boolean;
  topics?: NewsArticle[];
  posts?: any[];
  error?: string;
  metadata?: {
    query: string;
    resultsCount: number;
    scrapedAt: string;
  };
  savedToDatabase?: boolean;
}

/**
 * GET endpoint to search for newsletter topics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const keyword = searchParams.get('keyword') || searchParams.get('q');
    const industry = searchParams.get('industry') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const generatePosts = searchParams.get('generatePosts') === 'true';
    const saveToDatabase = searchParams.get('saveToDatabase') === 'true';
    const platformsParam = searchParams.get('platforms');
    const platforms: Platform[] = platformsParam
      ? (platformsParam.split(',') as Platform[])
      : ['linkedin', 'twitter'];

    // Validate keyword
    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: 'keyword or q parameter is required',
        },
        { status: 400 }
      );
    }

    // Search for topics using Firecrawl
    const searchOptions: TopicSearchOptions = {
      keyword,
      industry,
      limit,
    };

    // Note: This requires Firecrawl MCP to be available
    // For now, we'll use a mock implementation that should be replaced
    // with actual MCP calls when available
    const result = await searchTopicsWithFirecrawl(searchOptions);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Post-process topics
    let topics = result.topics;
    topics = deduplicateTopics(topics);
    topics = sortTopicsByRelevance(topics);

    // Generate platform-specific posts if requested
    let posts: any[] = [];
    if (generatePosts && topics.length > 0) {
      posts = topics.flatMap((article) =>
        articleToPostContent(article, platforms)
      );
    }

    // Save to database if requested
    let savedToDatabase = false;
    if (saveToDatabase && topics.length > 0) {
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

        await saveNewsletterTopics(topics, user.id, keyword);
        savedToDatabase = true;
      } catch (error) {
        console.error('Failed to save to database:', error);
        // Don't fail the request
      }
    }

    const response: TopicSearchResponse = {
      success: true,
      topics,
      ...(generatePosts && { posts }),
      metadata: result.metadata,
      ...(saveToDatabase && { savedToDatabase }),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Topic search error:', error);

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
 * POST endpoint to search with more complex options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      industry,
      sources,
      limit = 10,
      dateRange,
      generatePosts = false,
      platforms = ['linkedin', 'twitter'],
      saveToDatabase = false,
    } = body;

    // Validate keyword
    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: 'keyword is required',
        },
        { status: 400 }
      );
    }

    // Search for topics
    const searchOptions: TopicSearchOptions = {
      keyword,
      industry,
      sources,
      limit,
      dateRange,
    };

    const result = await searchTopicsWithFirecrawl(searchOptions);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Post-process topics
    let topics = result.topics;
    topics = deduplicateTopics(topics);
    topics = sortTopicsByRelevance(topics);

    // Generate posts if requested
    let posts: any[] = [];
    if (generatePosts && topics.length > 0) {
      posts = topics.flatMap((article) =>
        articleToPostContent(article, platforms as Platform[])
      );
    }

    // Save to database if requested
    let savedToDatabase = false;
    if (saveToDatabase && topics.length > 0) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await saveNewsletterTopics(topics, user.id, keyword);
        savedToDatabase = true;
      }
    }

    const response: TopicSearchResponse = {
      success: true,
      topics,
      ...(generatePosts && { posts }),
      metadata: result.metadata,
      ...(saveToDatabase && { savedToDatabase }),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Topic search error:', error);

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
 * Search topics using Firecrawl MCP
 * This is a wrapper that uses MCP when available, otherwise falls back to mock data
 */
async function searchTopicsWithFirecrawl(
  options: TopicSearchOptions
): Promise<{
  success: boolean;
  topics: NewsArticle[];
  error?: string;
  metadata?: any;
}> {
  try {
    // TODO: Replace this with actual Firecrawl MCP call
    // For now, return mock data to allow testing
    console.warn(
      'Firecrawl MCP not yet integrated. Using mock data for topic search.'
    );

    // Mock implementation - replace with actual Firecrawl MCP call:
    // const firecrawlResults = await mcp.callTool('mcp__mcp-server-firecrawl__firecrawl_search', {
    //   query: options.keyword,
    //   limit: options.limit,
    // });

    const mockTopics: NewsArticle[] = generateMockTopics(options);

    return {
      success: true,
      topics: mockTopics,
      metadata: {
        query: options.keyword,
        resultsCount: mockTopics.length,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      topics: [],
      error: error.message || 'Failed to search topics',
    };
  }
}

/**
 * Generate mock topics for testing
 * TODO: Remove this when Firecrawl MCP is integrated
 */
function generateMockTopics(options: TopicSearchOptions): NewsArticle[] {
  const { keyword, limit = 10 } = options;

  return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    id: `mock-article-${i}`,
    title: `${keyword} - Article ${i + 1}: Latest Developments`,
    summary: `This is a mock article about ${keyword}. It contains interesting insights and trending information about the topic.`,
    url: `https://example.com/article-${i + 1}`,
    source: 'example.com',
    publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    author: `Author ${i + 1}`,
    imageUrl: `https://via.placeholder.com/800x600?text=Article+${i + 1}`,
    tags: [keyword, 'trending', 'news'],
    relevanceScore: 1 - i * 0.1,
  }));
}

/**
 * Save newsletter topics to database
 */
async function saveNewsletterTopics(
  topics: NewsArticle[],
  userId: string,
  searchQuery: string
): Promise<void> {
  const supabase = await createClient();

  const records = topics.map((topic) => ({
    user_id: userId,
    article_id: topic.id,
    title: topic.title,
    summary: topic.summary,
    url: topic.url,
    source: topic.source,
    published_at: topic.publishedAt,
    author: topic.author,
    image_url: topic.imageUrl,
    tags: topic.tags,
    relevance_score: topic.relevanceScore,
    search_query: searchQuery,
    scraped_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('newsletter_topics').insert(records);

  if (error) {
    throw new Error(`Failed to save topics: ${error.message}`);
  }
}
