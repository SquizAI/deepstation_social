/**
 * Data Wrangling Utilities
 * Transform scraped content into post-ready formats for social media
 */

import type { YouTubeMetadata } from './youtube-extractor';
import type { NewsArticle } from './newsletter-topics';
import type { Platform } from '../types/oauth';

export interface PostReadyContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  callToAction?: string;
  images?: string[];
}

export interface SummarizationOptions {
  maxLength?: number;
  style?: 'concise' | 'detailed' | 'bullet-points';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface ContentExtractionResult {
  keyPoints: string[];
  summary: string;
  quotes: string[];
  statistics: string[];
}

/**
 * Transform YouTube metadata into platform-specific posts
 */
export function youtubeToPostContent(
  metadata: YouTubeMetadata,
  platforms: Platform[],
  options: {
    includeLink?: boolean;
    customMessage?: string;
    hashtags?: string[];
  } = {}
): PostReadyContent[] {
  const { includeLink = true, customMessage, hashtags = [] } = options;

  // Extract key information
  const videoUrl = metadata.url;
  const title = metadata.title;
  const channel = metadata.channelName;
  const description = cleanText(metadata.description);

  // Generate base content
  const baseMessage = customMessage || generateYouTubeMessage(title, channel);

  // Auto-generate hashtags if not provided
  const finalHashtags = hashtags.length > 0 ? hashtags : generateHashtags(title);

  // Create platform-specific versions
  return platforms.map((platform) => {
    let content = baseMessage;
    const images = [metadata.thumbnails.high];

    switch (platform) {
      case 'twitter':
        // Twitter: Short and punchy with link
        content = truncateForPlatform(content, 240); // Leave room for link
        if (includeLink) {
          content += `\n\n${videoUrl}`;
        }
        return {
          platform,
          content,
          hashtags: finalHashtags.slice(0, 3), // Max 3 hashtags for Twitter
          images: [], // Twitter embeds video preview
        };

      case 'linkedin':
        // LinkedIn: Professional with context
        content = `${content}\n\nWatch here: ${videoUrl}`;
        if (description) {
          const summary = extractSummary(description, 150);
          content = `${content}\n\n${summary}`;
        }
        return {
          platform,
          content,
          hashtags: finalHashtags.slice(0, 5),
          images,
        };

      case 'instagram':
        // Instagram: Visual with emojis
        content = addEmojis(content);
        content = truncateForPlatform(content, 2000);
        return {
          platform,
          content,
          hashtags: finalHashtags,
          images,
          callToAction: 'Link in bio',
        };

      case 'discord':
        // Discord: Rich with embed
        content = `${content}\n\n${videoUrl}`;
        return {
          platform,
          content,
          hashtags: [],
          images,
        };

      default:
        return {
          platform,
          content,
          hashtags: finalHashtags,
          images,
        };
    }
  });
}

/**
 * Transform news article into platform-specific posts
 */
export function articleToPostContent(
  article: NewsArticle,
  platforms: Platform[],
  options: {
    angle?: string;
    customMessage?: string;
    hashtags?: string[];
  } = {}
): PostReadyContent[] {
  const { angle, customMessage, hashtags = [] } = options;

  // Generate message
  const baseMessage = customMessage || generateArticleMessage(article, angle);

  // Auto-generate hashtags
  const finalHashtags = hashtags.length > 0
    ? hashtags
    : [...(article.tags || []), ...generateHashtags(article.title)].slice(0, 10);

  // Create platform-specific versions
  return platforms.map((platform) => {
    let content = baseMessage;
    const images = article.imageUrl ? [article.imageUrl] : [];

    switch (platform) {
      case 'twitter':
        // Twitter thread if content is long
        content = truncateForPlatform(content, 240);
        content += `\n\nRead more: ${article.url}`;
        return {
          platform,
          content,
          hashtags: finalHashtags.slice(0, 3),
          images,
        };

      case 'linkedin':
        // LinkedIn: Professional with insights
        content = `${content}\n\n${article.summary}\n\nSource: ${article.url}`;
        return {
          platform,
          content,
          hashtags: finalHashtags.slice(0, 5),
          images,
        };

      case 'instagram':
        // Instagram: Visual storytelling
        content = addEmojis(content);
        content = truncateForPlatform(content, 2000);
        return {
          platform,
          content,
          hashtags: finalHashtags,
          images,
          callToAction: 'Link in bio',
        };

      case 'discord':
        // Discord: Conversational
        content = `${content}\n\n${article.summary}\n\n${article.url}`;
        return {
          platform,
          content,
          hashtags: [],
          images,
        };

      default:
        return {
          platform,
          content,
          hashtags: finalHashtags,
          images,
        };
    }
  });
}

/**
 * Generate engaging message for YouTube video
 */
function generateYouTubeMessage(title: string, channel: string): string {
  return `New video from ${channel}:\n\n"${title}"`;
}

/**
 * Generate engaging message for news article
 */
function generateArticleMessage(article: NewsArticle, angle?: string): string {
  if (angle) {
    return `${angle}\n\n${article.title}`;
  }

  const hooks = [
    'Interesting read:',
    'Worth checking out:',
    'Latest insights:',
    'Trending now:',
  ];

  const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
  return `${randomHook}\n\n${article.title}`;
}

/**
 * Extract key points from long content
 */
export function extractKeyPoints(
  content: string,
  options: {
    maxPoints?: number;
    minLength?: number;
  } = {}
): ContentExtractionResult {
  const { maxPoints = 5, minLength = 20 } = options;

  const cleanContent = cleanText(content);

  // Split into sentences
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= minLength);

  // Extract key points (sentences with important keywords)
  const importantKeywords = [
    'important',
    'key',
    'critical',
    'significant',
    'essential',
    'major',
    'breakthrough',
    'innovative',
  ];

  const keyPoints = sentences
    .filter((sentence) => {
      const lower = sentence.toLowerCase();
      return importantKeywords.some((keyword) => lower.includes(keyword));
    })
    .slice(0, maxPoints);

  // Extract quotes (text in quotation marks)
  const quotes = extractQuotes(cleanContent);

  // Extract statistics (numbers with context)
  const statistics = extractStatistics(cleanContent);

  // Generate summary
  const summary = sentences.slice(0, 3).join('. ');

  return {
    keyPoints: keyPoints.length > 0 ? keyPoints : sentences.slice(0, maxPoints),
    summary,
    quotes,
    statistics,
  };
}

/**
 * Extract quotes from text
 */
function extractQuotes(text: string): string[] {
  const quotePattern = /"([^"]+)"/g;
  const quotes: string[] = [];
  let match;

  while ((match = quotePattern.exec(text)) !== null) {
    quotes.push(match[1]);
  }

  return quotes;
}

/**
 * Extract statistics from text
 */
function extractStatistics(text: string): string[] {
  const statPattern = /\d+(?:,\d{3})*(?:\.\d+)?(?:%|K|M|B)?/g;
  const matches = text.match(statPattern) || [];

  // Get context around numbers
  const statistics = matches
    .map((num) => {
      const index = text.indexOf(num);
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + num.length + 30);
      return text.substring(start, end).trim();
    })
    .slice(0, 5);

  return statistics;
}

/**
 * Clean and format text
 */
export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();
}

/**
 * Truncate text for platform character limits
 */
function truncateForPlatform(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Generate hashtags from text
 */
function generateHashtags(text: string): string[] {
  // Extract potential hashtag words (capitalized words, tech terms)
  const words = text.split(/\s+/);
  const hashtags = new Set<string>();

  const techKeywords = [
    'AI',
    'ML',
    'Tech',
    'Innovation',
    'Startup',
    'Web3',
    'Blockchain',
    'Cloud',
    'Data',
    'Analytics',
    'Digital',
  ];

  // Add tech keywords found in text
  techKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      hashtags.add(keyword.replace(/\s+/g, ''));
    }
  });

  // Add capitalized words
  words
    .filter((word) => /^[A-Z][a-z]+/.test(word) && word.length > 3)
    .slice(0, 5)
    .forEach((word) => hashtags.add(word));

  return Array.from(hashtags);
}

/**
 * Add relevant emojis to content
 */
function addEmojis(content: string): string {
  const emojiMap: Record<string, string> = {
    video: '🎥',
    new: '✨',
    launch: '🚀',
    tech: '💻',
    ai: '🤖',
    data: '📊',
    news: '📰',
    trending: '🔥',
    important: '⚡',
  };

  let result = content;

  Object.entries(emojiMap).forEach(([keyword, emoji]) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(result) && !result.includes(emoji)) {
      result = `${emoji} ${result}`;
    }
  });

  return result;
}

/**
 * Extract summary from long text
 */
export function extractSummary(text: string, maxLength: number = 200): string {
  const clean = cleanText(text);

  if (clean.length <= maxLength) return clean;

  // Get first few sentences
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let summary = '';
  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) break;
    summary += sentence + '. ';
  }

  return summary.trim() || clean.substring(0, maxLength) + '...';
}

/**
 * Create bullet point list from key points
 */
export function formatAsBulletPoints(points: string[]): string {
  return points.map((point) => `• ${point}`).join('\n');
}

/**
 * Summarize content with AI-friendly prompt structure
 */
export function createSummarizationPrompt(
  content: string,
  options: SummarizationOptions = {}
): string {
  const { maxLength = 200, style = 'concise', includeHashtags = false } = options;

  const styleInstructions = {
    concise: 'Write a concise, engaging summary',
    detailed: 'Write a detailed, informative summary',
    'bullet-points': 'Write a summary as bullet points',
  };

  let prompt = `${styleInstructions[style]} of the following content in ${maxLength} characters or less:\n\n${content}`;

  if (includeHashtags) {
    prompt += '\n\nInclude relevant hashtags at the end.';
  }

  return prompt;
}

/**
 * Batch process multiple items
 */
export function batchTransformContent<T>(
  items: T[],
  transformer: (item: T) => PostReadyContent[],
  options: {
    concurrency?: number;
  } = {}
): PostReadyContent[] {
  const { concurrency = 5 } = options;
  const results: PostReadyContent[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = batch.flatMap(transformer);
    results.push(...batchResults);
  }

  return results;
}
