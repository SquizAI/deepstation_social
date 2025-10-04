/**
 * Logo and Brand Asset Extraction using Firecrawl
 *
 * This module extracts company logos, brand colors, and metadata from company websites
 * using the Firecrawl MCP tool for web scraping.
 */

export interface BrandAssets {
  companyName?: string
  logoUrl?: string
  faviconUrl?: string
  openGraphImage?: string
  brandColors?: string[]
  description?: string
  title?: string
  error?: string
}

interface FirecrawlMetadata {
  title?: string
  description?: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  favicon?: string
  [key: string]: any
}

interface FirecrawlScrapedData {
  markdown?: string
  html?: string
  metadata?: FirecrawlMetadata
  links?: string[]
}

/**
 * Extract brand colors from CSS content
 * Looks for color values in various formats (hex, rgb, hsl)
 */
function extractColorsFromCSS(cssContent: string): string[] {
  const colors = new Set<string>()

  // Match hex colors (#RGB or #RRGGBB)
  const hexMatches = cssContent.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)
  if (hexMatches) {
    hexMatches.forEach(color => colors.add(color.toUpperCase()))
  }

  // Match rgb/rgba colors
  const rgbMatches = cssContent.match(/rgba?\([^)]+\)/g)
  if (rgbMatches) {
    rgbMatches.slice(0, 5).forEach(color => colors.add(color))
  }

  // Return top 5 most common colors
  return Array.from(colors).slice(0, 5)
}

/**
 * Extract logo URL from HTML content
 * Looks for common logo patterns in img tags and links
 */
function extractLogoFromHTML(html: string, baseUrl: string): string | undefined {
  // Common logo selectors
  const logoPatterns = [
    /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ]

  for (const pattern of logoPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      // Convert relative URLs to absolute
      try {
        const url = new URL(match[1], baseUrl)
        return url.href
      } catch {
        // If URL parsing fails, skip this match
        continue
      }
    }
  }

  return undefined
}

/**
 * Extract company name from metadata or HTML
 */
function extractCompanyName(metadata?: FirecrawlMetadata, html?: string): string | undefined {
  // Try Open Graph title first
  if (metadata?.ogTitle) {
    return metadata.ogTitle.split('|')[0].split('-')[0].trim()
  }

  // Try regular title
  if (metadata?.title) {
    return metadata.title.split('|')[0].split('-')[0].trim()
  }

  // Try to extract from HTML title tag
  if (html) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].split('|')[0].split('-')[0].trim()
    }
  }

  return undefined
}

/**
 * Main function to extract logo and brand assets from a company URL
 *
 * @param websiteUrl - The company website URL to scrape
 * @returns BrandAssets object with extracted data
 */
export async function extractLogoAndBrandAssets(websiteUrl: string): Promise<BrandAssets> {
  try {
    // Validate URL
    let normalizedUrl: string
    try {
      const url = new URL(websiteUrl)
      normalizedUrl = url.href
    } catch {
      // Try adding https:// if no protocol
      try {
        const url = new URL(`https://${websiteUrl}`)
        normalizedUrl = url.href
      } catch {
        return {
          error: 'Invalid URL format. Please provide a valid website URL.'
        }
      }
    }

    // Call Firecrawl MCP tool to scrape the website
    // Note: This uses the MCP server integration
    const response = await fetch('/api/scrape/firecrawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: normalizedUrl,
        formats: ['markdown', 'html'],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to scrape website: ${response.statusText}`)
    }

    const data: FirecrawlScrapedData = await response.json()

    // Extract brand assets from scraped data
    const brandAssets: BrandAssets = {
      companyName: extractCompanyName(data.metadata, data.html),
      title: data.metadata?.title,
      description: data.metadata?.description || data.metadata?.ogDescription,
      openGraphImage: data.metadata?.ogImage,
      faviconUrl: data.metadata?.favicon,
    }

    // Extract logo from HTML if available
    if (data.html) {
      const logoUrl = extractLogoFromHTML(data.html, normalizedUrl)
      if (logoUrl) {
        brandAssets.logoUrl = logoUrl
      }
    }

    // If no logo found but we have Open Graph image, use that
    if (!brandAssets.logoUrl && brandAssets.openGraphImage) {
      brandAssets.logoUrl = brandAssets.openGraphImage
    }

    // If still no logo, try favicon
    if (!brandAssets.logoUrl && brandAssets.faviconUrl) {
      brandAssets.logoUrl = brandAssets.faviconUrl
    }

    // Extract brand colors from HTML/CSS if available
    if (data.html) {
      brandAssets.brandColors = extractColorsFromCSS(data.html)
    }

    return brandAssets
  } catch (error) {
    console.error('Error extracting brand assets:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to extract brand assets'
    }
  }
}

/**
 * Utility function to validate if a URL is an image
 */
export function isImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(pathname)
  } catch {
    return false
  }
}

/**
 * Utility function to get the best logo URL from brand assets
 */
export function getBestLogoUrl(assets: BrandAssets): string | undefined {
  // Priority: logoUrl > openGraphImage > faviconUrl
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
