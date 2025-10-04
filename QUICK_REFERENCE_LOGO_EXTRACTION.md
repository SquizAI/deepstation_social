# Logo Extraction - Quick Reference

## Setup (2 minutes)

```bash
# 1. Add API key to .env.local
echo "FIRECRAWL_API_KEY=your_api_key_here" >> .env.local

# 2. Run migration
cd supabase && supabase migration up

# 3. Test it
npx tsx scripts/test-logo-extraction.ts https://anthropic.com
```

## API Usage

### Extract Logo (JavaScript/TypeScript)

```typescript
const response = await fetch('/api/scrape/logo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ websiteUrl: 'https://anthropic.com' })
})

const { success, data } = await response.json()

if (success) {
  console.log(data.bestLogoUrl)      // Best logo URL
  console.log(data.companyName)      // "Anthropic"
  console.log(data.brandColors)      // ["#FF6B35", ...]
}
```

### Extract Logo (curl)

```bash
curl -X POST http://localhost:3000/api/scrape/logo \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://anthropic.com"}'
```

## UI Integration (React/Next.js)

```tsx
import { useState } from 'react'

function LogoExtractor() {
  const [website, setWebsite] = useState('')
  const [logo, setLogo] = useState('')
  const [loading, setLoading] = useState(false)

  const extractLogo = async () => {
    setLoading(true)
    const res = await fetch('/api/scrape/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: website })
    })
    const { data } = await res.json()
    setLogo(data.bestLogoUrl)
    setLoading(false)
  }

  return (
    <>
      <input value={website} onChange={(e) => setWebsite(e.target.value)} />
      <button onClick={extractLogo} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract Logo'}
      </button>
      {logo && <img src={logo} alt="Logo" />}
    </>
  )
}
```

## File Locations

| Purpose | File Path |
|---------|-----------|
| Core Logic | `/lib/scraping/logo-extraction.ts` |
| Logo API | `/app/api/scrape/logo/route.ts` |
| Firecrawl API | `/app/api/scrape/firecrawl/route.ts` |
| Migration | `/supabase/migrations/20251004_add_company_logo_url.sql` |
| Test Script | `/scripts/test-logo-extraction.ts` |
| Full Docs | `/docs/logo-extraction-integration.md` |

## What Gets Extracted

- Company Name
- Logo URL
- Favicon
- Open Graph Image
- Brand Colors (top 5)
- Description
- Best Logo (auto-selected)

## Common Commands

```bash
# Test with script
npx tsx scripts/test-logo-extraction.ts https://anthropic.com

# Run migration
supabase migration up

# Test API endpoint
curl -X POST localhost:3000/api/scrape/logo \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl":"https://anthropic.com"}'

# Run unit tests
npm test lib/scraping/__tests__/logo-extraction.test.ts
```

## Response Format

```json
{
  "success": true,
  "data": {
    "companyName": "Anthropic",
    "logoUrl": "https://anthropic.com/logo.png",
    "faviconUrl": "https://anthropic.com/favicon.ico",
    "openGraphImage": "https://anthropic.com/og.jpg",
    "brandColors": ["#FF6B35", "#004E89"],
    "description": "AI safety company",
    "title": "Anthropic",
    "bestLogoUrl": "https://anthropic.com/logo.png"
  }
}
```

## Error Handling

```typescript
const { success, error, data } = await response.json()

if (!success) {
  console.error(error)
  // Handle error cases:
  // - "Invalid URL format"
  // - "Firecrawl service not configured"
  // - "Failed to scrape website"
}
```

## Environment Variables

```bash
# Required
FIRECRAWL_API_KEY=your_api_key_here

# Optional (defaults shown)
FIRECRAWL_TIMEOUT=30000
```

## Database Schema

```sql
-- speakers table has new column
company_logo_url TEXT
```

## Test Websites

- https://anthropic.com
- https://openai.com
- https://google.com
- https://microsoft.com

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401/403 error | Check `FIRECRAWL_API_KEY` in `.env.local` |
| Timeout | Increase timeout or check website |
| No logo found | Use favicon or manual upload |
| Wrong logo | Adjust patterns or use manual upload |

## Performance

- Response Time: 3-6 seconds
- Timeout: 30 seconds
- Rate Limit: 500/month (free tier)

## Quick Links

- Setup: `/lib/scraping/README.md`
- Full Docs: `/docs/logo-extraction-integration.md`
- Summary: `/LOGO_EXTRACTION_SUMMARY.md`
- Get API Key: https://firecrawl.dev
