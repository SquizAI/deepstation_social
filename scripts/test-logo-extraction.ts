#!/usr/bin/env tsx
/**
 * Test Script for Logo Extraction
 *
 * This script tests the logo extraction functionality with real websites.
 * Run with: npx tsx scripts/test-logo-extraction.ts
 */

import { extractLogoAndBrandAssets, getBestLogoUrl } from '../lib/scraping/logo-extraction'

const testWebsites = [
  'https://anthropic.com',
  'https://openai.com',
  'https://google.com',
  'https://microsoft.com',
  'https://apple.com',
]

async function testLogoExtraction(websiteUrl: string) {
  console.log(`\n🔍 Testing: ${websiteUrl}`)
  console.log('─'.repeat(60))

  try {
    const startTime = Date.now()
    const result = await extractLogoAndBrandAssets(websiteUrl)
    const duration = Date.now() - startTime

    if (result.error) {
      console.log('❌ Error:', result.error)
      return
    }

    const bestLogo = getBestLogoUrl(result)

    console.log('✅ Success')
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log('\n📊 Extracted Data:')
    console.log(`  Company Name: ${result.companyName || 'N/A'}`)
    console.log(`  Title: ${result.title || 'N/A'}`)
    console.log(`  Description: ${result.description?.substring(0, 100)}${result.description && result.description.length > 100 ? '...' : ''}`)
    console.log(`  Logo URL: ${result.logoUrl || 'N/A'}`)
    console.log(`  Favicon: ${result.faviconUrl || 'N/A'}`)
    console.log(`  OG Image: ${result.openGraphImage || 'N/A'}`)
    console.log(`  Best Logo: ${bestLogo || 'N/A'}`)
    console.log(`  Brand Colors: ${result.brandColors?.join(', ') || 'N/A'}`)
  } catch (error) {
    console.log('❌ Exception:', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function main() {
  console.log('🚀 Logo Extraction Test Suite')
  console.log('═'.repeat(60))

  // Check if Firecrawl API key is configured
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('\n⚠️  Warning: FIRECRAWL_API_KEY not set in environment')
    console.log('Please add it to .env.local or run:')
    console.log('export FIRECRAWL_API_KEY=your_api_key_here\n')
    process.exit(1)
  }

  // Test single website (pass as argument)
  const customUrl = process.argv[2]
  if (customUrl) {
    await testLogoExtraction(customUrl)
    return
  }

  // Test all websites
  for (const url of testWebsites) {
    await testLogoExtraction(url)
  }

  console.log('\n✨ All tests completed!')
}

main().catch(console.error)
