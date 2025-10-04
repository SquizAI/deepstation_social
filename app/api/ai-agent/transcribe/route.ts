import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe with Deepgram Nova-3
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-3',
        smart_format: true,
        punctuate: true,
        language: 'en',
      }
    )

    if (error) {
      console.error('Deepgram transcription error:', error)
      return NextResponse.json(
        { error: 'Transcription failed', details: error },
        { status: 500 }
      )
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || ''

    return NextResponse.json({
      success: true,
      transcript,
    })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    )
  }
}
