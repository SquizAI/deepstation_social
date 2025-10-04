/**
 * Scraping Type Definitions
 * Type definitions for YouTube extraction and newsletter topic scraping
 */

// Re-export types from scraping modules
export type {
  YouTubeMetadata,
  YouTubeExtractionResult,
  YouTubeErrorCode,
} from '../scraping/youtube-extractor';

export type {
  NewsArticle,
  TopicSearchOptions,
  TopicSearchResult,
  TopicErrorCode,
} from '../scraping/newsletter-topics';

export type {
  PostReadyContent,
  SummarizationOptions,
  ContentExtractionResult,
} from '../scraping/data-wrangler';

/**
 * Database record for YouTube extraction
 */
export interface YouTubeExtractionRecord {
  id: string;
  user_id: string;
  video_id: string;
  url: string;
  title: string;
  description?: string;
  channel_name: string;
  channel_id?: string;
  thumbnail_url?: string;
  duration?: string;
  view_count?: number;
  published_at?: string;
  transcript?: string;
  metadata?: Record<string, any>;
  scraped_at: string;
  created_at: string;
}

/**
 * Database record for newsletter topic
 */
export interface NewsletterTopicRecord {
  id: string;
  user_id: string;
  article_id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  published_at?: string;
  author?: string;
  image_url?: string;
  tags?: string[];
  relevance_score?: number;
  search_query?: string;
  scraped_at: string;
  created_at: string;
}

/**
 * Database record for scraped content usage
 */
export interface ScrapedContentUsageRecord {
  id: string;
  user_id: string;
  content_type: 'youtube' | 'article';
  content_id: string;
  post_id?: string;
  used_at: string;
}

/**
 * Options for scraping content
 */
export interface ScrapingOptions {
  saveToDatabase?: boolean;
  generatePosts?: boolean;
  platforms?: string[];
  includeTranscript?: boolean;
}

/**
 * Scraping statistics
 */
export interface ScrapingStats {
  totalYouTubeExtractions: number;
  totalNewsletterTopics: number;
  recentExtractions: number;
  mostUsedSources: Array<{
    source: string;
    count: number;
  }>;
  averageRelevanceScore: number;
}
