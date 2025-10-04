import { NextResponse } from 'next/server'

export async function GET() {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 }
    )
  }

  // Return the API key for client-side use
  // In production, you might want to generate temporary tokens instead
  return NextResponse.json({ token: DEEPGRAM_API_KEY })
}
