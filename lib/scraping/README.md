# Logo Extraction Module

Automatically extract company logos and brand assets from websites using Firecrawl.

## Quick Start

### 1. Install Dependencies

No additional dependencies needed - uses existing Next.js setup.

### 2. Configure Firecrawl API Key

Add to `.env.local`:

```bash
FIRECRAWL_API_KEY=your_api_key_here
```

Get your API key from [firecrawl.dev](https://firecrawl.dev)

### 3. Run Database Migration

```bash
supabase migration up
```

This adds the `company_logo_url` column to the speakers table.

### 4. Test the Integration

```bash
# Test with a single website
npx tsx scripts/test-logo-extraction.ts https://anthropic.com

# Test with multiple websites
npx tsx scripts/test-logo-extraction.ts
```

## API Usage

### Extract Logo from Website

```typescript
import { extractLogoAndBrandAssets, getBestLogoUrl } from '@/lib/scraping/logo-extraction'

const result = await extractLogoAndBrandAssets('https://anthropic.com')

if (!result.error) {
  console.log('Company Name:', result.companyName)
  console.log('Best Logo URL:', getBestLogoUrl(result))
  console.log('Brand Colors:', result.brandColors)
}
```

### Use in API Route

```typescript
// app/api/scrape/logo/route.ts
import { extractLogoAndBrandAssets } from '@/lib/scraping/logo-extraction'

export async function POST(request: Request) {
  const { websiteUrl } = await request.json()
  const brandAssets = await extractLogoAndBrandAssets(websiteUrl)

  return Response.json({
    success: !brandAssets.error,
    data: brandAssets
  })
}
```

### Use in Frontend

```typescript
const handleExtractLogo = async () => {
  const response = await fetch('/api/scrape/logo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ websiteUrl: companyWebsite })
  })

  const result = await response.json()

  if (result.success) {
    setLogoUrl(result.data.bestLogoUrl)
  }
}
```

## What Gets Extracted

- **Company Name**: From page title or Open Graph metadata
- **Logo URL**: From `<img>` tags with "logo" class/alt text
- **Favicon**: Website icon
- **Open Graph Image**: Social media preview image
- **Brand Colors**: Top 5 colors from CSS (hex, rgb, hsl)
- **Description**: Meta description or OG description

## Files Created

```
lib/scraping/
├── logo-extraction.ts          # Core extraction logic
├── __tests__/
│   └── logo-extraction.test.ts # Unit tests
└── README.md                    # This file

app/api/scrape/
├── firecrawl/
│   └── route.ts                 # Firecrawl API integration
└── logo/
    └── route.ts                 # Logo extraction endpoint

supabase/migrations/
└── 20251004_add_company_logo_url.sql  # Database migration

scripts/
└── test-logo-extraction.ts     # Test script

docs/
└── logo-extraction-integration.md  # Full documentation
```

## Integration in Speaker Form

The speaker form (`app/dashboard/speakers/new/page.tsx`) now includes:

1. **Company Website Input**: Optional field to enter company URL
2. **Extract Logo Button**: Triggers logo extraction
3. **Logo Preview**: Shows extracted logo with option to remove
4. **Auto-populate**: Fills company name and bio if empty

## API Endpoints

### POST /api/scrape/logo

Extract logo from website.

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
    "logoUrl": "https://...",
    "bestLogoUrl": "https://...",
    "brandColors": ["#..."]
  }
}
```

### POST /api/scrape/firecrawl

Low-level Firecrawl API access.

**Request:**
```json
{
  "url": "https://anthropic.com",
  "formats": ["markdown", "html"]
}
```

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `FIRECRAWL_API_KEY not configured` | Add API key to `.env.local` |
| `Invalid URL format` | Ensure URL includes `https://` |
| `Failed to scrape website` | Check website allows scraping |
| `No logo found` | Use favicon or manual upload |

## Testing

```bash
# Run unit tests
npm test lib/scraping/__tests__/logo-extraction.test.ts

# Test with curl
curl -X POST http://localhost:3000/api/scrape/logo \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://anthropic.com"}'

# Test with script
npx tsx scripts/test-logo-extraction.ts https://openai.com
```

## Performance

- **Average Response Time**: 3-6 seconds
- **Timeout**: 30 seconds
- **Rate Limit**: 500 requests/month (free tier)

## Security

- API key stored server-side only
- URL validation prevents SSRF attacks
- Sanitized HTML/CSS output
- Per-user rate limiting recommended

## Troubleshooting

**Logo not appearing?**
1. Check browser console for errors
2. Verify Firecrawl API key is set
3. Test endpoint directly with curl
4. Check if website blocks scraping

**Wrong logo extracted?**
1. Website may have multiple logos
2. Adjust extraction patterns in code
3. Manually specify logo URL

**Slow response?**
1. Check network connection
2. Increase timeout setting
3. Consider caching strategy

## Future Enhancements

- [ ] Brand color usage in speaker cards
- [ ] Logo optimization and resizing
- [ ] Light/dark mode logo variants
- [ ] Batch extraction for multiple speakers
- [ ] Company metadata extraction
- [ ] Redis caching layer

## Documentation

Full documentation: `/docs/logo-extraction-integration.md`

## Support

For issues or questions, file a bug report with:
- Example URL that failed
- Error message and console logs
- Expected vs actual behavior
