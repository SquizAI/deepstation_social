import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      )
    }

    // Check if query is a URL
    const isURL = query.match(/^https?:\/\//) || query.includes('linkedin.com') || query.includes('www.')

    let data: any

    if (isURL) {
      // Direct URL scraping for better data extraction
      console.log('Scraping URL:', query)
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url: query,
          formats: ['markdown', 'html'],
        }),
      })

      if (!scrapeResponse.ok) {
        const error = await scrapeResponse.text()
        console.error('Firecrawl scrape error:', error)
        return NextResponse.json(
          { error: 'URL scraping failed', details: error },
          { status: scrapeResponse.status }
        )
      }

      const scrapeData = await scrapeResponse.json()

      // Format scraped data into results structure
      data = {
        data: [{
          title: scrapeData.data?.metadata?.title || 'Scraped Page',
          url: query,
          markdown: scrapeData.data?.markdown || scrapeData.data?.html || '',
          description: scrapeData.data?.metadata?.description || '',
        }]
      }
    } else {
      // Use search for general queries
      console.log('Searching for:', query)
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          limit: 3,
          scrapeOptions: {
            formats: ['markdown'],
          },
        }),
      })

      if (!searchResponse.ok) {
        const error = await searchResponse.text()
        console.error('Firecrawl search error:', error)
        return NextResponse.json(
          { error: 'Search failed', details: error },
          { status: searchResponse.status }
        )
      }

      data = await searchResponse.json()
    }

    // Extract and format results with more content for URLs
    const results = data.data?.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: isURL
        ? result.markdown?.substring(0, 2000) || result.description // More content for direct URLs
        : result.markdown?.substring(0, 500) || result.description,
    }))

    return NextResponse.json({
      success: true,
      query,
      isURL,
      results: results || [],
      summary: results
        ?.map((r: any) => `${r.title}: ${r.content}`)
        .join('\n\n')
        .substring(0, isURL ? 3000 : 1000), // More content for URLs
    })
  } catch (error: any) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: error.message || 'Research failed' },
      { status: 500 }
    )
  }
}
