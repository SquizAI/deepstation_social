/**
 * Logo Extraction API Endpoint
 *
 * POST /api/scrape/logo
 * Extracts logo and brand assets from a company website URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractLogoAndBrandAssets, getBestLogoUrl } from '@/lib/scraping/logo-extraction'

interface LogoExtractionRequest {
  websiteUrl: string
}

interface LogoExtractionResponse {
  success: boolean
  data?: {
    companyName?: string
    logoUrl?: string
    faviconUrl?: string
    openGraphImage?: string
    brandColors?: string[]
    description?: string
    title?: string
    bestLogoUrl?: string
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LogoExtractionRequest = await request.json()

    // Validate request
    if (!body.websiteUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'websiteUrl is required',
        },
        { status: 400 }
      )
    }

    // Extract logo and brand assets
    const brandAssets = await extractLogoAndBrandAssets(body.websiteUrl)

    // Check if extraction failed
    if (brandAssets.error) {
      return NextResponse.json(
        {
          success: false,
          error: brandAssets.error,
        },
        { status: 400 }
      )
    }

    // Get the best logo URL from available options
    const bestLogoUrl = getBestLogoUrl(brandAssets)

    // Return successful response
    const response: LogoExtractionResponse = {
      success: true,
      data: {
        ...brandAssets,
        bestLogoUrl,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in logo extraction API:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract logo and brand assets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scrape/logo?url=https://example.com
 *
 * GET endpoint for logo extraction (for testing)
 */
export async function GET(request: NextRequest) {
  const websiteUrl = request.nextUrl.searchParams.get('url')

  if (!websiteUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'url query parameter is required',
      },
      { status: 400 }
    )
  }

  // Forward to POST handler
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ websiteUrl }),
    })
  )
}
