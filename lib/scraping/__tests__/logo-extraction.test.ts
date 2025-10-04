/**
 * Logo Extraction Tests
 *
 * These tests demonstrate how to use the logo extraction functionality
 * and validate it works with real websites.
 */

import { extractLogoAndBrandAssets, getBestLogoUrl, isImageUrl } from '../logo-extraction'

describe('Logo Extraction', () => {
  // Note: These tests require the Firecrawl API to be configured
  // Set FIRECRAWL_API_KEY in your environment variables

  it('should validate image URLs correctly', () => {
    expect(isImageUrl('https://example.com/logo.png')).toBe(true)
    expect(isImageUrl('https://example.com/logo.jpg')).toBe(true)
    expect(isImageUrl('https://example.com/logo.svg')).toBe(true)
    expect(isImageUrl('https://example.com/page.html')).toBe(false)
    expect(isImageUrl('not-a-url')).toBe(false)
  })

  it('should get the best logo URL from brand assets', () => {
    const assets1 = {
      logoUrl: 'https://example.com/logo.png',
      openGraphImage: 'https://example.com/og.jpg',
      faviconUrl: 'https://example.com/favicon.ico',
    }
    expect(getBestLogoUrl(assets1)).toBe('https://example.com/logo.png')

    const assets2 = {
      openGraphImage: 'https://example.com/og.jpg',
      faviconUrl: 'https://example.com/favicon.ico',
    }
    expect(getBestLogoUrl(assets2)).toBe('https://example.com/og.jpg')

    const assets3 = {
      faviconUrl: 'https://example.com/favicon.ico',
    }
    expect(getBestLogoUrl(assets3)).toBe('https://example.com/favicon.ico')

    const assets4 = {}
    expect(getBestLogoUrl(assets4)).toBeUndefined()
  })

  // Integration test - requires Firecrawl API key
  it.skip('should extract logo from Anthropic website', async () => {
    const result = await extractLogoAndBrandAssets('https://anthropic.com')

    expect(result.error).toBeUndefined()
    expect(result.companyName).toBeTruthy()
    expect(result.logoUrl || result.openGraphImage || result.faviconUrl).toBeTruthy()
    expect(result.description).toBeTruthy()

    console.log('Extracted brand assets:', result)
  }, 30000) // 30 second timeout

  // Manual test example
  it.skip('should extract logo from OpenAI website', async () => {
    const result = await extractLogoAndBrandAssets('https://openai.com')

    expect(result.error).toBeUndefined()
    expect(result.companyName).toBeTruthy()

    console.log('Extracted brand assets:', result)
  }, 30000)
})

/**
 * Manual Testing Guide
 *
 * To test the logo extraction manually:
 *
 * 1. Set up Firecrawl API key:
 *    export FIRECRAWL_API_KEY=your_api_key_here
 *
 * 2. Run the API endpoint test:
 *    curl -X POST http://localhost:3000/api/scrape/logo \
 *      -H "Content-Type: application/json" \
 *      -d '{"websiteUrl": "https://anthropic.com"}'
 *
 * 3. Expected response:
 *    {
 *      "success": true,
 *      "data": {
 *        "companyName": "Anthropic",
 *        "logoUrl": "https://...",
 *        "description": "...",
 *        "brandColors": ["#..."],
 *        "bestLogoUrl": "https://..."
 *      }
 *    }
 *
 * 4. Test websites:
 *    - https://anthropic.com
 *    - https://openai.com
 *    - https://google.com
 *    - https://microsoft.com
 *    - https://apple.com
 */
