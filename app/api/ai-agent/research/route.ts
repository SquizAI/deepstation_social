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

    // Use Firecrawl search to research the topic
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
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

    if (!response.ok) {
      const error = await response.text()
      console.error('Firecrawl error:', error)
      return NextResponse.json(
        { error: 'Firecrawl search failed', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract and format results
    const results = data.data?.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.markdown?.substring(0, 500) || result.description,
    }))

    return NextResponse.json({
      success: true,
      query,
      results: results || [],
      summary: results
        ?.map((r: any) => `${r.title}: ${r.content}`)
        .join('\n\n')
        .substring(0, 1000),
    })
  } catch (error: any) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: error.message || 'Research failed' },
      { status: 500 }
    )
  }
}
