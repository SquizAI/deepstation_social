# DeepStation Scraping Module Documentation

Comprehensive content extraction and topic scraping functionality for social media content generation.

## Overview

The scraping module provides three main capabilities:

1. **YouTube Content Extraction** - Extract video metadata, thumbnails, and transcripts
2. **Newsletter Topic Scraping** - Find trending topics from news sources using Firecrawl MCP
3. **Data Wrangling** - Transform scraped content into platform-ready social media posts

## Features

### YouTube Extractor

- Extract metadata from YouTube URLs (any format: watch, shorts, embed)
- Fetch video title, description, channel info, thumbnails
- Support for batch extraction (multiple videos at once)
- Optional transcript extraction
- No API key required for basic metadata (uses oEmbed)

### Newsletter Topics

- Search for trending topics by keyword and industry
- Support for industry-specific news sources (tech, AI, blockchain, business, marketing)
- Relevance scoring and sorting
- Deduplication and date filtering
- Integration with Firecrawl MCP for web scraping

### Data Wrangler

- Transform YouTube videos into platform-specific posts
- Transform news articles into engaging social media content
- Extract key points, quotes, and statistics from long content
- Platform-specific formatting (character limits, hashtags, emojis)
- Automatic hashtag generation
- Content summarization

## File Structure

```
lib/scraping/
├── youtube-extractor.ts      # YouTube metadata extraction
├── newsletter-topics.ts      # News article scraping
├── data-wrangler.ts          # Content transformation
├── index.ts                  # Module exports
└── README.md                 # Logo extraction docs

app/api/scrape/
├── youtube/
│   └── route.ts              # YouTube extraction API
└── topics/
    └── route.ts              # Topic search API

lib/types/
└── scraping.ts               # Type definitions

supabase/migrations/
└── 005_scraping_tables.sql   # Database schema
```

## API Endpoints

### YouTube Extraction

**POST `/api/scrape/youtube`**

Extract YouTube video metadata.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "includeTranscript": false,
  "generatePosts": true,
  "platforms": ["linkedin", "twitter"],
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "VIDEO_ID",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "title": "Video Title",
    "description": "Video description...",
    "channelName": "Channel Name",
    "thumbnails": {
      "default": "https://...",
      "medium": "https://...",
      "high": "https://..."
    },
    "duration": "10:45",
    "viewCount": 123456
  },
  "posts": [
    {
      "platform": "linkedin",
      "content": "New video from Channel Name:\n\n\"Video Title\"\n\nWatch here: https://...",
      "hashtags": ["Video", "Tech"],
      "images": ["https://...thumbnail.jpg"]
    }
  ],
  "savedToDatabase": true
}
```

**Batch Extraction:**
```json
{
  "urls": [
    "https://www.youtube.com/watch?v=VIDEO_1",
    "https://www.youtube.com/watch?v=VIDEO_2"
  ],
  "generatePosts": true
}
```

**GET `/api/scrape/youtube`**

Retrieve saved YouTube extractions.

**Query Parameters:**
- `limit` - Number of results (default: 10)
- `offset` - Pagination offset (default: 0)

### Newsletter Topics

**GET `/api/scrape/topics`**

Search for newsletter topics.

**Query Parameters:**
- `keyword` or `q` - Search keyword (required)
- `industry` - Industry filter (tech, ai, blockchain, business, marketing)
- `limit` - Number of results (default: 10)
- `generatePosts` - Generate platform-ready posts (true/false)
- `platforms` - Comma-separated list (e.g., "linkedin,twitter")
- `saveToDatabase` - Save to database (true/false)

**Example:**
```
GET /api/scrape/topics?keyword=artificial+intelligence&industry=ai&limit=10&generatePosts=true&platforms=linkedin,twitter
```

**Response:**
```json
{
  "success": true,
  "topics": [
    {
      "id": "article-abc123",
      "title": "Latest AI Breakthrough",
      "summary": "Article summary...",
      "url": "https://techcrunch.com/...",
      "source": "techcrunch.com",
      "publishedAt": "2025-10-04T10:00:00Z",
      "imageUrl": "https://...",
      "tags": ["AI", "Tech"],
      "relevanceScore": 0.95
    }
  ],
  "posts": [
    {
      "platform": "linkedin",
      "content": "Interesting read:\n\nLatest AI Breakthrough\n\nArticle summary...",
      "hashtags": ["AI", "Tech"],
      "images": ["https://..."]
    }
  ],
  "metadata": {
    "query": "artificial intelligence ai",
    "resultsCount": 10,
    "scrapedAt": "2025-10-04T15:30:00Z"
  }
}
```

**POST `/api/scrape/topics`**

Advanced topic search with complex options.

**Request Body:**
```json
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

## Usage Examples

### Extract YouTube Video

```typescript
import { extractYouTubeMetadata } from '@/lib/scraping';

const result = await extractYouTubeMetadata(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  { includeTranscript: true }
);

if (result.success) {
  console.log('Title:', result.data.title);
  console.log('Channel:', result.data.channelName);
  console.log('Thumbnail:', result.data.thumbnails.high);
  console.log('Duration:', result.data.duration);
}
```

### Batch Extract Videos

```typescript
import { extractYouTubeMetadataBatch } from '@/lib/scraping';

const urls = [
  'https://www.youtube.com/watch?v=VIDEO_1',
  'https://www.youtube.com/watch?v=VIDEO_2',
  'https://www.youtube.com/watch?v=VIDEO_3'
];

const results = await extractYouTubeMetadataBatch(urls, {
  includeTranscript: false,
  concurrency: 3 // Process 3 videos at a time
});

results.forEach(result => {
  if (result.success) {
    console.log('Extracted:', result.data.title);
  }
});
```

### Transform Content to Posts

```typescript
import { youtubeToPostContent, articleToPostContent } from '@/lib/scraping';

// Transform YouTube video
const youtubePosts = youtubeToPostContent(
  videoMetadata,
  ['linkedin', 'twitter'],
  {
    includeLink: true,
    hashtags: ['AI', 'Tech', 'Innovation']
  }
);

// Transform news article
const articlePosts = articleToPostContent(
  newsArticle,
  ['linkedin', 'twitter'],
  {
    angle: 'This is a game-changer for the industry',
    hashtags: ['News', 'Tech']
  }
);
```

### Extract Key Points

```typescript
import { extractKeyPoints } from '@/lib/scraping';

const extraction = extractKeyPoints(longArticleContent, {
  maxPoints: 5,
  minLength: 20
});

console.log('Summary:', extraction.summary);
console.log('Key Points:', extraction.keyPoints);
console.log('Quotes:', extraction.quotes);
console.log('Statistics:', extraction.statistics);
```

## Database Schema

### youtube_extractions

```sql
CREATE TABLE youtube_extractions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT NOT NULL,
  channel_id TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  view_count INTEGER,
  published_at TIMESTAMPTZ,
  transcript TEXT,
  metadata JSONB DEFAULT '{}',
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, video_id)
);
```

### newsletter_topics

```sql
CREATE TABLE newsletter_topics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  author TEXT,
  image_url TEXT,
  tags TEXT[],
  relevance_score DECIMAL(3, 2),
  search_query TEXT,
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, article_id)
);
```

### scraped_content_usage

```sql
CREATE TABLE scraped_content_usage (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'youtube' or 'article'
  content_id UUID NOT NULL,
  post_id UUID REFERENCES scheduled_posts(id),
  used_at TIMESTAMPTZ NOT NULL
);
```

## Platform-Specific Formatting

### Twitter
- Max 240 characters (leaving room for links)
- Max 3 hashtags
- No images (video preview auto-embeds)
- Link appended at end

### LinkedIn
- Professional tone
- Max 3000 characters
- Up to 5 hashtags
- Includes video thumbnail image
- Link included in body

### Instagram
- Emoji-enhanced content
- Max 2200 characters
- Up to 30 hashtags
- High-quality thumbnail image
- "Link in bio" call-to-action

### Discord
- Casual/conversational tone
- Rich embed support
- No character limit
- Images and links embedded
- No hashtags

## Industry-Specific Sources

- **tech**: TechCrunch, The Verge, Wired, Ars Technica, Engadget
- **ai**: VentureBeat AI, TechCrunch AI, AI News
- **blockchain**: CoinDesk, Cointelegraph, Decrypt, The Block
- **business**: Forbes, Business Insider, Bloomberg, CNBC
- **marketing**: Marketing Dive, Adweek, Search Engine Journal

## Error Codes

### YouTube Errors
- `INVALID_URL` - Invalid YouTube URL format
- `VIDEO_NOT_FOUND` - Video doesn't exist or is deleted
- `PRIVATE_VIDEO` - Video is private
- `TRANSCRIPT_UNAVAILABLE` - Transcript not available
- `API_ERROR` - API request failed
- `RATE_LIMIT` - Rate limit exceeded
- `NETWORK_ERROR` - Network request failed

### Topic Search Errors
- `INVALID_QUERY` - Missing or invalid search query
- `NO_RESULTS` - No topics found
- `RATE_LIMIT` - Rate limit exceeded
- `API_ERROR` - Firecrawl API error
- `NETWORK_ERROR` - Network request failed

## Firecrawl MCP Integration

The newsletter topic scraper is designed to use the Firecrawl MCP tool:

```typescript
// Replace mock implementation in app/api/scrape/topics/route.ts
const results = await mcp.callTool('mcp__mcp-server-firecrawl__firecrawl_search', {
  query: 'artificial intelligence news',
  limit: 10
});
```

## Database Helper Functions

```sql
-- Get recent YouTube extractions
SELECT * FROM get_recent_youtube_extractions('user_id', 10);

-- Get trending topics
SELECT * FROM get_trending_topics('user_id', 10, 0.5);

-- Search topics by keyword
SELECT * FROM search_newsletter_topics('user_id', 'AI', 10);

-- Cleanup old content (older than 90 days)
SELECT cleanup_old_scraped_content(90);
```

## Best Practices

1. **Save to database** - Enable `saveToDatabase: true` to reuse content
2. **Batch processing** - Use batch endpoints when extracting multiple items
3. **Generate posts** - Enable `generatePosts: true` to get platform-ready content
4. **Cleanup old data** - Run `cleanup_old_scraped_content()` periodically
5. **Monitor relevance** - Filter topics by `relevanceScore >= 0.5`
6. **Use industry sources** - Specify industry for better topic quality

## Testing

Run the migration:
```bash
supabase migration up
```

Test YouTube extraction:
```bash
curl -X POST http://localhost:3055/api/scrape/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "generatePosts": true,
    "platforms": ["linkedin", "twitter"]
  }'
```

Test topic search:
```bash
curl "http://localhost:3055/api/scrape/topics?keyword=AI&industry=tech&limit=5&generatePosts=true"
```

## Rate Limiting

- YouTube extraction uses oEmbed (no API key, but still rate limited)
- Batch extraction processes 3 videos at a time with 1-second delays
- Firecrawl MCP has its own rate limits (check Firecrawl documentation)

## Future Enhancements

- [ ] YouTube transcript extraction (requires YouTube Data API v3)
- [ ] Firecrawl MCP integration (replace mock data)
- [ ] AI-powered summarization using OpenAI/Claude
- [ ] Sentiment analysis for topics
- [ ] Automatic post scheduling from scraped content
- [ ] RSS feed integration
- [ ] Twitter thread generation from long articles
- [ ] Video clip extraction from YouTube videos

## Related Documentation

- [Social Media Integration System](./social-media-integration-system.md)
- [OAuth Implementation](./oauth-implementation.md)
- [Logo Extraction](../lib/scraping/README.md)
