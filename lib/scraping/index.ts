/**
 * Scraping Module Exports
 * Central export point for all scraping functionality
 */

// YouTube Extractor
export {
  extractYouTubeMetadata,
  extractYouTubeMetadataBatch,
  extractVideoId,
  isValidYouTubeUrl,
  getYouTubeThumbnail,
  type YouTubeMetadata,
  type YouTubeExtractionResult,
  type YouTubeErrorCode,
} from './youtube-extractor';

// Newsletter Topics
export {
  searchTopics,
  scrapeTrendingFromSource,
  getIndustryTrends,
  filterTopicsByDate,
  sortTopicsByRelevance,
  deduplicateTopics,
  type NewsArticle,
  type TopicSearchOptions,
  type TopicSearchResult,
  type TopicErrorCode,
} from './newsletter-topics';

// Data Wrangler
export {
  youtubeToPostContent,
  articleToPostContent,
  extractKeyPoints,
  cleanText,
  extractSummary,
  formatAsBulletPoints,
  createSummarizationPrompt,
  batchTransformContent,
  type PostReadyContent,
  type SummarizationOptions,
  type ContentExtractionResult,
} from './data-wrangler';
