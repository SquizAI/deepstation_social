# Scraping Module Quick Start Guide

## Overview

DeepStation now includes comprehensive content scraping functionality:
- **YouTube Content Extraction** - Extract video metadata and generate posts
- **Newsletter Topic Scraping** - Find trending topics from news sources
- **Data Wrangling** - Transform content into platform-ready posts

## Quick Setup

### 1. Run Database Migration

```bash
cd /Users/mattysquarzoni/Documents/Documents\ -\ \ MacBook\ Skynet/Deepstation
supabase migration up
```

This creates three tables:
- `youtube_extractions` - Stores YouTube video metadata
- `newsletter_topics` - Stores scraped news articles
- `scraped_content_usage` - Tracks content usage in posts

### 2. Test YouTube Extraction

```bash
curl -X POST http://localhost:3055/api/scrape/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "generatePosts": true,
    "platforms": ["linkedin", "twitter"],
    "saveToDatabase": true
  }'
```

### 3. Test Topic Search

```bash
curl "http://localhost:3055/api/scrape/topics?keyword=artificial%20intelligence&industry=ai&limit=5&generatePosts=true"
```

## API Endpoints

### YouTube Extraction

**POST `/api/scrape/youtube`**

```typescript
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",     // Single video
  // OR
  "urls": ["https://youtube.com/...", "..."],            // Batch extraction

  "includeTranscript": false,                            // Extract transcript (if available)
  "generatePosts": true,                                 // Generate platform-ready posts
  "platforms": ["linkedin", "twitter"],                  // Target platforms
  "saveToDatabase": true                                 // Save to Supabase
}
```

**GET `/api/scrape/youtube?limit=10&offset=0`** - Retrieve saved extractions

### Newsletter Topics

**GET `/api/scrape/topics`**

Query parameters:
- `keyword` or `q` - Search keyword (required)
- `industry` - tech, ai, blockchain, business, marketing
- `limit` - Number of results (default: 10)
- `generatePosts` - Generate posts (true/false)
- `platforms` - Comma-separated list
- `saveToDatabase` - Save to database (true/false)

**POST `/api/scrape/topics`** - Advanced search with complex options

```typescript
{
  "keyword": "blockchain",
  "industry": "blockchain",
  "sources": ["coindesk.com", "cointelegraph.com"],
  "limit": 10,
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-12-31"
  },
  "generatePosts": true,
  "platforms": ["linkedin", "twitter"],
  "saveToDatabase": true
}
```

## Usage in Code

### Extract YouTube Video

```typescript
import { extractYouTubeMetadata } from '@/lib/scraping';

const result = await extractYouTubeMetadata(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  { includeTranscript: false }
);

if (result.success) {
  console.log('Title:', result.data.title);
  console.log('Channel:', result.data.channelName);
  console.log('Thumbnail:', result.data.thumbnails.high);
}
```

### Search Topics

```typescript
import { searchTopics } from '@/lib/scraping';

const result = await searchTopics({
  keyword: 'artificial intelligence',
  industry: 'ai',
  limit: 10
});

if (result.success) {
  result.topics.forEach(topic => {
    console.log(topic.title, '-', topic.relevanceScore);
  });
}
```

### Transform to Posts

```typescript
import { youtubeToPostContent, articleToPostContent } from '@/lib/scraping';

// YouTube video to posts
const youtubePosts = youtubeToPostContent(
  videoMetadata,
  ['linkedin', 'twitter'],
  { hashtags: ['AI', 'Tech'] }
);

// News article to posts
const articlePosts = articleToPostContent(
  newsArticle,
  ['linkedin', 'twitter'],
  { angle: 'Game-changer for the industry' }
);
```

## Platform-Specific Formatting

Content is automatically formatted for each platform:

| Platform  | Char Limit | Hashtags | Features                        |
|-----------|------------|----------|---------------------------------|
| Twitter   | 240        | 3 max    | Link appended, no images        |
| LinkedIn  | 3000       | 5 max    | Professional, thumbnail included|
| Instagram | 2200       | 30 max   | Emoji-enhanced, "link in bio"   |
| Discord   | No limit   | None     | Rich embeds, casual tone        |

## Industry-Specific Sources

Newsletter scraper targets industry-specific news sources:

- **tech**: TechCrunch, The Verge, Wired, Ars Technica
- **ai**: VentureBeat AI, TechCrunch AI, AI News
- **blockchain**: CoinDesk, Cointelegraph, Decrypt, The Block
- **business**: Forbes, Business Insider, Bloomberg, CNBC
- **marketing**: Marketing Dive, Adweek, Search Engine Journal

## Database Helper Functions

```sql
-- Get recent YouTube extractions
SELECT * FROM get_recent_youtube_extractions('user_id', 10);

-- Get trending topics (min relevance: 0.5)
SELECT * FROM get_trending_topics('user_id', 10, 0.5);

-- Search topics by keyword
SELECT * FROM search_newsletter_topics('user_id', 'AI', 10);

-- Cleanup old content (older than 90 days)
SELECT cleanup_old_scraped_content(90);
```

## Error Codes

### YouTube Errors
- `INVALID_URL` - Invalid YouTube URL format
- `VIDEO_NOT_FOUND` - Video doesn't exist or is deleted
- `TRANSCRIPT_UNAVAILABLE` - Transcript not available
- `API_ERROR` - API request failed
- `RATE_LIMIT` - Rate limit exceeded

### Topic Search Errors
- `INVALID_QUERY` - Missing or invalid search query
- `NO_RESULTS` - No topics found
- `RATE_LIMIT` - Firecrawl rate limit exceeded
- `API_ERROR` - Firecrawl API error

## Key Features

### YouTube Extractor
- Works with any YouTube URL format (watch, shorts, embed, video ID)
- No API key required (uses oEmbed)
- Batch extraction with rate limit protection
- Extracts: title, description, channel, thumbnails, duration, views
- Database storage with deduplication

### Newsletter Topics
- Search by keyword and industry
- Relevance scoring (0.0 to 1.0)
- Automatic deduplication
- Date range filtering
- Designed for Firecrawl MCP integration

### Data Wrangler
- Platform-specific formatting
- Automatic hashtag generation
- Extract key points from long content
- Content cleaning and summarization
- Emoji enhancement for Instagram

## Important Notes

1. **Firecrawl MCP Integration**: Currently uses mock data. Replace in `app/api/scrape/topics/route.ts` with actual MCP calls when available.

2. **YouTube Transcripts**: Placeholder implementation. Requires YouTube Data API v3 for full transcript extraction.

3. **Rate Limits**:
   - YouTube oEmbed has rate limits (no specific quota documented)
   - Batch extraction processes 3 videos at a time with 1s delays
   - Firecrawl has its own rate limits (check documentation)

4. **Database Cleanup**: Run `cleanup_old_scraped_content(90)` periodically to remove old data.

## Next Steps

1. **Integrate Firecrawl MCP** - Replace mock data in topic scraper
2. **Add YouTube API** - Enable transcript extraction
3. **Create Frontend UI** - Build scraping interface
4. **AI Summarization** - Integrate OpenAI/Claude for content generation
5. **Automation** - Schedule automatic topic scraping

## File Locations

- Core Library: `lib/scraping/`
- API Routes: `app/api/scrape/`
- Database Migration: `supabase/migrations/005_scraping_tables.sql`
- Types: `lib/types/scraping.ts`
- Documentation: `docs/scraping-module.md`

## Full Documentation

For complete API documentation, usage examples, and advanced features, see:
`/Users/mattysquarzoni/Documents/Documents -  MacBook Skynet/Deepstation/docs/scraping-module.md`

## Support

For issues or questions:
- Check the API response for specific error codes
- Review migration file: `supabase/migrations/005_scraping_tables.sql`
- Check TypeScript types: `lib/types/scraping.ts`
- See full docs: `docs/scraping-module.md`
