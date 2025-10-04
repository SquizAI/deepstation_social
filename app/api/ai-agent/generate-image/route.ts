import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { title, description, eventType } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Generate optimized image prompt using Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Create a detailed DALL-E image prompt for an event cover image.

Event Title: ${title}
${description ? `Description: ${description}` : ''}
${eventType ? `Type: ${eventType}` : ''}

Generate a professional, engaging image prompt that:
- Captures the essence of this event
- Is visually striking and modern
- Works well as a cover image
- Includes style, composition, and mood details

Return ONLY the prompt, no explanation.`
        }
      ]
    })

    const imagePrompt = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Modern tech event cover image'

    // TODO: Integrate with DALL-E or other image generation API
    // For now, return the prompt and a placeholder
    return NextResponse.json({
      success: true,
      prompt: imagePrompt,
      imageUrl: `https://via.placeholder.com/1200x630/6366f1/ffffff?text=${encodeURIComponent(title)}`,
      message: 'Image generation coming soon! Here is your optimized prompt.'
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    )
  }
}
