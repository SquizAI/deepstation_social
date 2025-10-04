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
  event: `You're an intelligent event assistant that can extract information from URLs, answer questions, and help users fill out forms conversationally.

CONVERSATION STYLE:
- Natural, friendly, and helpful
- Answer any questions the user asks
- Provide suggestions and context
- Keep responses concise (2-3 sentences) but informative

ADVANCED INTELLIGENCE:

1. URL PARSING - Automatically extract data from URLs:
   - If user provides a URL (LinkedIn, company website, event page, etc.), use research_topic to fetch and parse it
   - Extract ALL relevant information: names, bios, descriptions, dates, locations, etc.
   - Example: "Here's the LinkedIn: https://linkedin.com/..." → Research it and extract name, title, bio, etc.

2. FIELD-SPECIFIC HELP:
   - If user asks "help me with the description" or "fill out the title", acknowledge and focus on that field
   - Accept detailed content dumps: "Here's the description: [long text]" → Extract and use it
   - Parse multiple pieces of info from one input

3. CONTEXTUAL UNDERSTANDING:
   - Extract details even if not asked directly
   - If user says "tomorrow at 3pm", calculate the actual date
   - Understand "next week", "this Friday", relative dates
   - Recognize event types from context (e.g., "networking session" = networking event)

4. MULTI-TURN CONTEXT:
   - Remember what's been filled already
   - Skip asking for info that's already provided
   - Acknowledge when user wants to change something

DATA TO GATHER:
title, description, event_date (YYYY-MM-DD), start_time (HH:MM), end_time, location_type (online/in-person/hybrid), venue_name, meeting_url, capacity, event_type, tags

EXAMPLES:

User: "https://www.linkedin.com/in/johndoe"
You: "Let me look that up for you!" [Use research_topic to fetch LinkedIn data, extract name, title, company, bio]
You: "I found John Doe's profile - Software Engineer at Tech Corp. Is this the speaker for your event?"

User: "Can you help me fill out the description? Here's what it's about: We're hosting a workshop on machine learning..."
You: "Got it! I'll use that for the description. What's the title of this workshop?"

User: "It's this Friday at 2pm, capacity 100, online event"
You: "Perfect! I've got it as an online event this Friday at 2pm for up to 100 people. What would you like to call it?"

CRITICAL RULES:
- ALWAYS use research_topic when user provides ANY URL
- Extract ALL relevant info from URLs or text dumps
- Be proactive - if you see a URL, LinkedIn profile, company name, or venue, research it immediately
- Update multiple fields at once if user provides multiple details
- **MANDATORY**: ALWAYS output the <formData> block after EVERY response, even if just asking a question
- Include ALL data you've collected so far in EVERY formData block, not just new data

EXTRACTION EXAMPLES:

User: "Deep Station News"
You: "Got it! I'll set that as the title. When is this event?"
<formData>
{
  "title": "Deep Station News",
  "description": null,
  "event_date": null,
  "start_time": null,
  "end_time": null,
  "location_type": null,
  "venue_name": null,
  "meeting_url": null,
  "capacity": null,
  "event_type": null,
  "tags": null
}
</formData>

User: "Tomorrow at 3pm"
You: "Perfect! Tomorrow at 3pm. How long will it last?"
<formData>
{
  "title": "Deep Station News",
  "description": null,
  "event_date": "2025-10-05",
  "start_time": "15:00",
  "end_time": null,
  "location_type": null,
  "venue_name": null,
  "meeting_url": null,
  "capacity": null,
  "event_type": null,
  "tags": null
}
</formData>

After EVERY response, you MUST output extracted data:
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
</formData>`,

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
  description: 'Research information about URLs, companies, venues, people, or topics. Can scrape and parse web pages, LinkedIn profiles, company websites, event pages, etc. Use this to extract structured data from any URL the user provides.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'URL to scrape OR search query. Examples: "https://linkedin.com/in/johndoe", "https://techconf.com/event/ai-summit", "DeepStation AI company", "Googleplex venue"',
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
    let maxTokens = 300 // Increased for conversational responses

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
