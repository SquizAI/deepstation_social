# Logo Extraction Integration with Firecrawl

## Overview

The logo extraction feature automatically extracts company logos and brand assets from company websites using the Firecrawl API. This integration streamlines the speaker onboarding process by auto-populating brand information.

## Architecture

### Components

1. **Logo Extraction Utility** (`lib/scraping/logo-extraction.ts`)
   - Core logic for extracting logos and brand assets
   - Parses HTML, metadata, and CSS for brand information
   - Returns structured `BrandAssets` data

2. **Firecrawl API Endpoint** (`app/api/scrape/firecrawl/route.ts`)
   - Bridge between frontend and Firecrawl MCP tool
   - Handles API authentication and error handling
   - Supports GET and POST requests

3. **Logo Extraction API** (`app/api/scrape/logo/route.ts`)
   - Dedicated endpoint for logo extraction
   - Calls the utility function and returns formatted results
   - Provides `bestLogoUrl` selection logic

4. **Speaker Form Integration** (`app/dashboard/speakers/new/page.tsx`)
   - UI for inputting company website
   - "Extract Logo" button with loading states
   - Auto-populates company name, logo, and bio

5. **Database Migration** (`supabase/migrations/20251004_add_company_logo_url.sql`)
   - Adds `company_logo_url` column to speakers table
   - Stores extracted company logo URL

## Data Flow

```
User enters company website
         ↓
Click "Extract Logo" button
         ↓
POST /api/scrape/logo
         ↓
extractLogoAndBrandAssets()
         ↓
POST /api/scrape/firecrawl
         ↓
Firecrawl API (external)
         ↓
Parse HTML/metadata/CSS
         ↓
Return BrandAssets
         ↓
Auto-populate form fields
         ↓
Save to database with company_logo_url
```

## Brand Assets Extracted

The system extracts the following information:

- **Company Name**: From Open Graph title, page title, or HTML
- **Logo URL**: From img tags with "logo" class/alt text
- **Favicon URL**: From link tags or metadata
- **Open Graph Image**: Social media preview image
- **Brand Colors**: Top 5 colors from CSS (hex, rgb, hsl)
- **Description**: Meta description or Open Graph description
- **Page Title**: HTML title tag

## API Endpoints

### POST /api/scrape/logo

Extract logo and brand assets from a website.

**Request:**
```json
{
  "websiteUrl": "https://anthropic.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyName": "Anthropic",
    "logoUrl": "https://anthropic.com/logo.png",
    "faviconUrl": "https://anthropic.com/favicon.ico",
    "openGraphImage": "https://anthropic.com/og-image.jpg",
    "brandColors": ["#FF6B35", "#004E89", "#1A1A1A"],
    "description": "AI safety and research company",
    "title": "Anthropic",
    "bestLogoUrl": "https://anthropic.com/logo.png"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid URL format. Please provide a valid website URL."
}
```

### POST /api/scrape/firecrawl

Low-level Firecrawl API integration.

**Request:**
```json
{
  "url": "https://anthropic.com",
  "formats": ["markdown", "html"],
  "onlyMainContent": true
}
```

**Response:**
```json
{
  "success": true,
  "markdown": "# Anthropic\n\nAI safety...",
  "html": "<html>...",
  "metadata": {
    "title": "Anthropic",
    "description": "...",
    "ogImage": "https://...",
    "favicon": "https://..."
  }
}
```

## Usage in Speaker Form

### User Flow

1. **Enter Company Website** (optional field)
   - User inputs: `https://anthropic.com`

2. **Click "Extract Logo" Button**
   - Button shows "Extracting..." loading state
   - API call to `/api/scrape/logo`

3. **Auto-populate Fields**
   - Company name (if empty)
   - Company logo URL
   - Bio/description (if empty)

4. **Preview Extracted Logo**
   - Logo displayed in 24x24px container
   - Option to remove logo

5. **Submit Form**
   - Logo URL saved to `company_logo_url` column

### Code Example

```tsx
// State management
const [companyWebsite, setCompanyWebsite] = useState('')
const [companyLogoUrl, setCompanyLogoUrl] = useState('')
const [isExtractingLogo, setIsExtractingLogo] = useState(false)

// Extract logo function
const handleExtractLogo = async () => {
  setIsExtractingLogo(true)

  const response = await fetch('/api/scrape/logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteUrl: companyWebsite })
  })

  const result = await response.json()

  if (result.success) {
    setCompanyLogoUrl(result.data.bestLogoUrl)
    // Auto-populate other fields...
  }

  setIsExtractingLogo(false)
}

// UI Component
<Input
  value={companyWebsite}
  onChange={(e) => setCompanyWebsite(e.target.value)}
  placeholder="https://company.com"
/>
<Button onClick={handleExtractLogo} disabled={isExtractingLogo}>
  {isExtractingLogo ? 'Extracting...' : 'Extract Logo'}
</Button>
```

## Environment Setup

### Required Environment Variables

Add to `.env.local`:

```bash
# Firecrawl API Key
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

### Getting a Firecrawl API Key

1. Sign up at [firecrawl.dev](https://firecrawl.dev)
2. Navigate to API Keys section
3. Generate a new API key
4. Copy to `.env.local`

## Database Schema

### Migration: `20251004_add_company_logo_url.sql`

```sql
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

COMMENT ON COLUMN speakers.company_logo_url IS
  'Company logo URL extracted from company website using Firecrawl';
```

### Updated Speaker Type

```typescript
export interface Speaker {
  // ... other fields
  company_logo_url?: string
  // ... other fields
}
```

## Logo Selection Priority

The system selects the best logo using the following priority:

1. **Logo URL** - From `<img>` tags with "logo" in class/alt
2. **Open Graph Image** - Social media preview image
3. **Favicon URL** - Website icon

This is implemented in `getBestLogoUrl()`:

```typescript
export function getBestLogoUrl(assets: BrandAssets): string | undefined {
  if (assets.logoUrl && isImageUrl(assets.logoUrl)) {
    return assets.logoUrl
  }
  if (assets.openGraphImage && isImageUrl(assets.openGraphImage)) {
    return assets.openGraphImage
  }
  if (assets.faviconUrl) {
    return assets.faviconUrl
  }
  return undefined
}
```

## Error Handling

### Common Errors

1. **Invalid URL**
   - Error: "Invalid URL format. Please provide a valid website URL."
   - Solution: Validate URL before submission

2. **Firecrawl API Not Configured**
   - Error: "Firecrawl service not configured. Please contact administrator."
   - Solution: Set `FIRECRAWL_API_KEY` environment variable

3. **Website Timeout**
   - Error: "Failed to scrape website: timeout"
   - Solution: Increase timeout in Firecrawl request (default: 30s)

4. **No Logo Found**
   - Result: `bestLogoUrl` is undefined
   - Fallback: Use favicon or allow manual upload

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string
  message?: string
  details?: any
}
```

## Testing

### Manual Testing

Test with sample websites:

```bash
# Test Anthropic
curl -X POST http://localhost:3000/api/scrape/logo \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://anthropic.com"}'

# Test OpenAI
curl -X POST http://localhost:3000/api/scrape/logo \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://openai.com"}'
```

### Unit Tests

Run tests:

```bash
npm test lib/scraping/__tests__/logo-extraction.test.ts
```

### Integration Tests

1. Start development server: `npm run dev`
2. Navigate to `/dashboard/speakers/new`
3. Enter company website: `https://anthropic.com`
4. Click "Extract Logo"
5. Verify logo appears and fields auto-populate

## Performance Considerations

### Response Times

- **Firecrawl API**: 2-5 seconds average
- **Logo Extraction**: 3-6 seconds total
- **Timeout**: 30 seconds maximum

### Caching Strategy

Consider implementing caching for frequently requested websites:

```typescript
// Future enhancement: Redis cache
const cacheKey = `logo:${websiteUrl}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// Extract and cache
const result = await extractLogoAndBrandAssets(websiteUrl)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400) // 24h TTL
```

### Rate Limiting

Firecrawl API has rate limits:
- Free tier: 500 requests/month
- Pro tier: 10,000 requests/month

Implement client-side debouncing to prevent excessive requests.

## Future Enhancements

1. **Brand Color Extraction**
   - Use extracted colors for speaker cards
   - Generate color palette for social posts

2. **Logo Optimization**
   - Resize logos for consistent dimensions
   - Convert to WebP format
   - Store in Supabase Storage

3. **Multiple Logo Variants**
   - Extract light/dark mode logos
   - Get different sizes (favicon, full logo, icon)

4. **Company Metadata**
   - Extract employee count, industry, location
   - Pull from LinkedIn company page
   - Integrate with Clearbit/Hunter.io

5. **Batch Extraction**
   - Extract logos for multiple speakers
   - Background job processing
   - Queue-based system

## Troubleshooting

### Logo Not Appearing

1. Check browser console for errors
2. Verify Firecrawl API key is set
3. Test API endpoint directly with curl
4. Check if website blocks scraping (robots.txt)

### Wrong Logo Extracted

1. Website may have multiple logos
2. Adjust logo extraction patterns in `extractLogoFromHTML()`
3. Manually specify logo URL if needed

### Slow Response

1. Check network connection
2. Verify Firecrawl API status
3. Increase timeout in API request
4. Consider caching strategy

## Security Considerations

1. **API Key Protection**
   - Never expose `FIRECRAWL_API_KEY` to client
   - Store in environment variables only
   - Use server-side API routes

2. **URL Validation**
   - Validate URL format before scraping
   - Prevent SSRF attacks
   - Whitelist allowed domains if needed

3. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent abuse of extraction feature
   - Monitor API usage

4. **Data Sanitization**
   - Sanitize extracted HTML/CSS
   - Validate image URLs
   - Prevent XSS attacks

## Support

For issues or questions:
- File a bug report with example URL
- Include error message and browser console logs
- Check Firecrawl API status page
- Review documentation at `/docs/logo-extraction-integration.md`
