/**
 * Firecrawl MCP Integration API Endpoint
 *
 * This endpoint acts as a bridge between the frontend and the Firecrawl MCP tool.
 * It scrapes websites using the mcp__mcp-server-firecrawl__firecrawl_scrape tool.
 */

import { NextRequest, NextResponse } from 'next/server'

interface FirecrawlRequest {
  url: string
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[]
  onlyMainContent?: boolean
  includeTags?: string[]
  excludeTags?: string[]
  headers?: Record<string, string>
  waitFor?: number
  timeout?: number
}

interface FirecrawlResponse {
  success: boolean
  data?: {
    markdown?: string
    html?: string
    rawHtml?: string
    links?: string[]
    screenshot?: string
    metadata?: {
      title?: string
      description?: string
      language?: string
      keywords?: string
      robots?: string
      ogTitle?: string
      ogDescription?: string
      ogUrl?: string
      ogImage?: string
      ogLocaleAlternate?: string[]
      ogSiteName?: string
      sourceURL?: string
      statusCode?: number
      favicon?: string
    }
  }
  error?: string
}

/**
 * POST /api/scrape/firecrawl
 *
 * Scrape a website using Firecrawl MCP tool
 */
export async function POST(request: NextRequest) {
  try {
    const body: FirecrawlRequest = await request.json()

    // Validate request
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Call Firecrawl MCP tool
    // Note: In a real implementation, this would use the MCP SDK
    // For now, we'll use a direct fetch to the Firecrawl API
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured')
      return NextResponse.json(
        { error: 'Firecrawl service not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Make request to Firecrawl API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: body.url,
        formats: body.formats || ['markdown', 'html'],
        onlyMainContent: body.onlyMainContent ?? true,
        includeTags: body.includeTags,
        excludeTags: body.excludeTags,
        headers: body.headers,
        waitFor: body.waitFor || 0,
        timeout: body.timeout || 30000,
      }),
    })

    if (!firecrawlResponse.ok) {
      const errorData = await firecrawlResponse.json().catch(() => ({}))
      console.error('Firecrawl API error:', errorData)

      return NextResponse.json(
        {
          error: errorData.error || 'Failed to scrape website',
          details: errorData.details || firecrawlResponse.statusText,
        },
        { status: firecrawlResponse.status }
      )
    }

    const result: FirecrawlResponse = await firecrawlResponse.json()

    // Return the scraped data
    return NextResponse.json({
      success: result.success,
      markdown: result.data?.markdown,
      html: result.data?.html,
      metadata: result.data?.metadata,
      links: result.data?.links,
    })
  } catch (error) {
    console.error('Error in Firecrawl API route:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scrape/firecrawl?url=https://example.com
 *
 * Simple GET endpoint for basic scraping (for testing)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL query parameter is required' },
      { status: 400 }
    )
  }

  // Forward to POST handler
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  )
}
