/**
 * Newsletter Topic Scraper
 * Scrapes trending topics from news sources using Firecrawl MCP
 */

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
  tags?: string[];
  relevanceScore?: number;
}

export interface TopicSearchOptions {
  keyword: string;
  industry?: string;
  sources?: string[];
  limit?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface TopicSearchResult {
  success: boolean;
  topics: NewsArticle[];
  error?: string;
  errorCode?: TopicErrorCode;
  metadata?: {
    query: string;
    resultsCount: number;
    scrapedAt: string;
  };
}

export type TopicErrorCode =
  | 'INVALID_QUERY'
  | 'NO_RESULTS'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'NETWORK_ERROR';

/**
 * Default news sources for topic scraping
 */
const DEFAULT_SOURCES = [
  'techcrunch.com',
  'venturebeat.com',
  'theverge.com',
  'wired.com',
  'arstechnica.com',
];

/**
 * Industry-specific source mappings
 */
const INDUSTRY_SOURCES: Record<string, string[]> = {
  tech: [
    'techcrunch.com',
    'theverge.com',
    'wired.com',
    'arstechnica.com',
    'engadget.com',
  ],
  ai: [
    'venturebeat.com/ai',
    'techcrunch.com/artificial-intelligence',
    'artificialintelligence-news.com',
  ],
  blockchain: [
    'coindesk.com',
    'cointelegraph.com',
    'decrypt.co',
    'theblock.co',
  ],
  business: [
    'forbes.com',
    'businessinsider.com',
    'bloomberg.com',
    'cnbc.com',
  ],
  marketing: [
    'marketingdive.com',
    'adweek.com',
    'searchenginejournal.com',
  ],
};

/**
 * Search for topics using Firecrawl MCP
 * Note: This uses the mcp__mcp-server-firecrawl__firecrawl_search tool
 */
export async function searchTopics(
  options: TopicSearchOptions
): Promise<TopicSearchResult> {
  try {
    const { keyword, industry, sources, limit = 10 } = options;

    // Validate inputs
    if (!keyword || keyword.trim().length === 0) {
      return {
        success: false,
        topics: [],
        error: 'Keyword is required',
        errorCode: 'INVALID_QUERY',
      };
    }

    // Build search query
    const searchQuery = buildSearchQuery(keyword, industry);
    const targetSources = sources || INDUSTRY_SOURCES[industry || 'tech'] || DEFAULT_SOURCES;

    // Note: Firecrawl MCP search would be called here
    // Since we don't have direct access to MCP from this module,
    // we provide a wrapper that should be called from the API route
    const firecrawlResults = await callFirecrawlSearch(searchQuery, targetSources, limit);

    // Transform Firecrawl results to NewsArticle format
    const topics = transformFirecrawlResults(firecrawlResults);

    return {
      success: true,
      topics,
      metadata: {
        query: searchQuery,
        resultsCount: topics.length,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Topic search error:', error);

    let errorCode: TopicErrorCode = 'API_ERROR';
    if (error.message?.includes('rate limit')) {
      errorCode = 'RATE_LIMIT';
    } else if (error.message?.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      success: false,
      topics: [],
      error: error.message || 'Failed to search topics',
      errorCode,
    };
  }
}

/**
 * Build search query from keyword and industry
 */
function buildSearchQuery(keyword: string, industry?: string): string {
  const cleanKeyword = keyword.trim();

  if (industry) {
    return `${cleanKeyword} ${industry}`;
  }

  return cleanKeyword;
}

/**
 * Call Firecrawl search (placeholder - actual implementation in API route)
 * This function should be overridden when called from the API route with MCP access
 */
async function callFirecrawlSearch(
  query: string,
  sources: string[],
  limit: number
): Promise<any[]> {
  // This is a placeholder implementation
  // The actual API route will override this with the MCP tool call
  throw new Error(
    'Firecrawl search must be called from API route with MCP access'
  );
}

/**
 * Transform Firecrawl results to NewsArticle format
 */
function transformFirecrawlResults(results: any[]): NewsArticle[] {
  return results.map((result, index) => ({
    id: generateArticleId(result.url || `article-${index}`),
    title: result.title || result.heading || 'Untitled',
    summary: result.description || result.excerpt || extractSummary(result.content),
    url: result.url || '',
    source: extractDomain(result.url || ''),
    publishedAt: result.publishedDate || result.date || undefined,
    author: result.author || undefined,
    imageUrl: result.image || result.thumbnail || undefined,
    tags: result.tags || [],
    relevanceScore: calculateRelevance(result),
  }));
}

/**
 * Extract summary from content
 */
function extractSummary(content: string, maxLength: number = 200): string {
  if (!content) return '';

  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Truncate to maxLength
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Generate unique article ID
 */
function generateArticleId(url: string): string {
  // Create a simple hash from the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `article-${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate relevance score based on result metadata
 */
function calculateRelevance(result: any): number {
  let score = 0.5; // Base score

  // Boost for recent articles
  if (result.publishedDate) {
    const daysOld = daysSincePublished(result.publishedDate);
    if (daysOld < 1) score += 0.3;
    else if (daysOld < 7) score += 0.2;
    else if (daysOld < 30) score += 0.1;
  }

  // Boost for articles with images
  if (result.image || result.thumbnail) {
    score += 0.1;
  }

  // Boost for articles with authors
  if (result.author) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

/**
 * Calculate days since article was published
 */
function daysSincePublished(publishedDate: string): number {
  try {
    const published = new Date(publishedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - published.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999; // Very old if date parsing fails
  }
}

/**
 * Scrape trending topics from a specific source
 */
export async function scrapeTrendingFromSource(
  source: string,
  limit: number = 10
): Promise<TopicSearchResult> {
  try {
    // Use Firecrawl to scrape the source homepage
    const results = await callFirecrawlSearch('trending latest news', [source], limit);
    const topics = transformFirecrawlResults(results);

    return {
      success: true,
      topics,
      metadata: {
        query: `Trending from ${source}`,
        resultsCount: topics.length,
        scrapedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      topics: [],
      error: error.message || 'Failed to scrape trending topics',
      errorCode: 'API_ERROR',
    };
  }
}

/**
 * Get industry-specific trending topics
 */
export async function getIndustryTrends(
  industry: string,
  limit: number = 10
): Promise<TopicSearchResult> {
  const sources = INDUSTRY_SOURCES[industry.toLowerCase()] || DEFAULT_SOURCES;

  return searchTopics({
    keyword: 'latest news trending',
    industry,
    sources,
    limit,
  });
}

/**
 * Filter topics by date range
 */
export function filterTopicsByDate(
  topics: NewsArticle[],
  dateRange: { from?: string; to?: string }
): NewsArticle[] {
  return topics.filter((topic) => {
    if (!topic.publishedAt) return true;

    const publishedDate = new Date(topic.publishedAt);

    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      if (publishedDate < fromDate) return false;
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      if (publishedDate > toDate) return false;
    }

    return true;
  });
}

/**
 * Sort topics by relevance score
 */
export function sortTopicsByRelevance(topics: NewsArticle[]): NewsArticle[] {
  return [...topics].sort((a, b) => {
    const scoreA = a.relevanceScore || 0;
    const scoreB = b.relevanceScore || 0;
    return scoreB - scoreA;
  });
}

/**
 * Deduplicate topics by URL
 */
export function deduplicateTopics(topics: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    if (seen.has(topic.url)) return false;
    seen.add(topic.url);
    return true;
  });
}
