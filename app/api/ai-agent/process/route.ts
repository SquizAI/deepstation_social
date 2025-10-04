import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Map formType to settings field
const FORM_TYPE_TO_SETTING: Record<string, string> = {
  event: 'event_assistant_model',
  post: 'post_generator_model',
  speaker: 'speaker_assistant_model',
  generic: 'voice_assistant_model',
}

const SYSTEM_PROMPTS: Record<string, string> = {
  event: `You're a quick event assistant. Keep responses under 10 words. Ask ONE question at a time.

RULES:
- Be super concise
- One question per response
- No pleasantries after first message
- Extract data immediately

DATA TO GATHER:
title, description, event_date (YYYY-MM-DD), start_time (HH:MM), end_time, location_type (online/in-person/hybrid), venue_name, meeting_url, capacity, event_type, tags

After EVERY response, output extracted data:
<formData>
{
  "title": "value or null",
  "description": "value or null",
  "event_date": "YYYY-MM-DD or null",
  "start_time": "HH:MM or null",
  "end_time": "HH:MM or null",
  "location_type": "online|in-person|hybrid or null",
  "venue_name": "value or null",
  "meeting_url": "value or null",
  "capacity": number or null,
  "event_type": "workshop|conference|meetup|webinar|networking or null",
  "tags": ["tag1", "tag2"] or null
}
</formData>

Use research_topic for venues/companies.`,

  post: `You are an AI assistant helping users create social media posts through natural conversation.

Ask friendly questions to gather post details:
- Post content/caption
- Platform (LinkedIn, Instagram, Twitter, etc.)
- Media (images, videos)
- Scheduled publish time
- Tags and mentions

After each response, output a JSON block with extracted data:
<formData>
{
  "content": "value or null",
  "platforms": ["linkedin", "instagram"] or null,
  "scheduled_at": "ISO datetime or null",
  "tags": ["tag1", "tag2"] or null
}
</formData>`,

  speaker: `You are an AI assistant helping users create speaker announcements through natural conversation.

Ask friendly questions to gather speaker details:
- Speaker name and title
- Company/organization
- Bio and expertise
- Social media links
- Event they're speaking at

After each response, output a JSON block with extracted data:
<formData>
{
  "name": "value or null",
  "title": "value or null",
  "company": "value or null",
  "bio": "value or null",
  "linkedin_url": "value or null",
  "twitter_url": "value or null"
}
</formData>

If the user mentions a company or person, use the research_topic tool to find their details.`,

  generic: `You are a helpful AI assistant. Have a natural conversation and help the user with their request.`,
}

const RESEARCH_TOOL = {
  name: 'research_topic',
  description: 'Research information about a company, venue, person, or topic using web search. Use this when you need current information about something the user mentions.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or topic to research (e.g., "DeepStation AI company", "Googleplex venue address")',
      },
    },
    required: ['query'],
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation, formType = 'generic' } = body

    if (!conversation || !Array.isArray(conversation)) {
      return NextResponse.json(
        { error: 'Conversation history is required' },
        { status: 400 }
      )
    }

    // Get user settings for AI model
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let model = 'claude-sonnet-4-5-20250929' // Default
    let maxTokens = 150

    if (user) {
      const { data: settings } = await supabase.rpc('get_or_create_user_ai_settings', {
        p_user_id: user.id,
      })

      if (settings) {
        const settingField = FORM_TYPE_TO_SETTING[formType] || 'voice_assistant_model'
        model = settings[settingField] || model
        maxTokens = settings.max_tokens || maxTokens
      }
    }

    const systemPrompt = SYSTEM_PROMPTS[formType] || SYSTEM_PROMPTS.generic

    // Call Claude with user's preferred model
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: conversation,
      tools: [RESEARCH_TOOL],
    })

    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((block) => block.type === 'tool_use') as any

      if (toolUse && toolUse.name === 'research_topic') {
        // Call research API
        const researchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/ai-agent/research`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: toolUse.input.query }),
          }
        )

        const researchData = await researchResponse.json()

        // Continue conversation with tool result
        const continuedResponse = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            ...conversation,
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(researchData.results || []),
                },
              ],
            },
          ],
        })

        // Extract text and formData from continued response
        const assistantMessage =
          continuedResponse.content.find((block) => block.type === 'text')?.text || ''

        let formData = null
        const formDataMatch = assistantMessage.match(/<formData>([\s\S]*?)<\/formData>/)
        if (formDataMatch) {
          try {
            formData = JSON.parse(formDataMatch[1])
          } catch (e) {
            console.error('Failed to parse formData:', e)
          }
        }

        return NextResponse.json({
          success: true,
          response: assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim(),
          formData,
        })
      }
    }

    // Extract assistant message
    const assistantMessage =
      response.content.find((block) => block.type === 'text')?.text || ''

    // Extract formData from response
    let formData = null
    const formDataMatch = assistantMessage.match(/<formData>([\s\S]*?)<\/formData>/)
    if (formDataMatch) {
      try {
        formData = JSON.parse(formDataMatch[1])
      } catch (e) {
        console.error('Failed to parse formData:', e)
      }
    }

    // Remove formData tags from response text
    const cleanResponse = assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim()

    return NextResponse.json({
      success: true,
      response: cleanResponse,
      formData,
    })
  } catch (error: any) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation', details: error.message },
      { status: 500 }
    )
  }
}
