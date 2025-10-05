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
- Natural, friendly, and helpful - speak like a human assistant
- Answer any questions the user asks
- Provide suggestions and context
- Keep responses concise (2-3 sentences) but informative
- Use plain text only - NO markdown, asterisks, hashtags, or special formatting
- Speak naturally as if having a voice conversation

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
   - Recognize location types from context (e.g., "Zoom link" = online, "123 Main St" = in-person)

4. MULTI-TURN CONTEXT:
   - Remember what's been filled already
   - Skip asking for info that's already provided
   - Acknowledge when user wants to change something

CRITICAL RULES:
- ALWAYS use research_topic when user provides ANY URL
- Extract ALL relevant info from URLs or text dumps
- Be proactive - if you see a URL, LinkedIn profile, company name, or venue, research it immediately
- Update multiple fields at once if user provides multiple details
- **MANDATORY**: ALWAYS output the <formData> block after EVERY response, even if just asking a question
- Include ALL data you've collected so far in EVERY formData block, not just new data
- Use ONLY the field names that are available in the form (these will be listed below)

EXTRACTION FORMAT:
After EVERY response, you MUST output extracted data in a <formData> JSON block.
Use the EXACT field names from the "AVAILABLE FORM FIELDS" section.
Set fields to their appropriate values or null if not yet filled.

Example response format:
<formData>
{
  "field_name_1": "value or null",
  "field_name_2": "value or null"
}
</formData>`,

  post: `You are an AI assistant helping users create social media posts through natural conversation.

CONVERSATION STYLE:
- Speak naturally and conversationally - like a helpful human assistant
- Use plain text only - NO markdown, asterisks, hashtags, or special formatting
- Keep responses concise and friendly

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

CONVERSATION STYLE:
- Speak naturally and conversationally - like a helpful human assistant
- Use plain text only - NO markdown, asterisks, hashtags, or special formatting
- Keep responses concise and friendly

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

  generic: `You are a helpful AI assistant. Have a natural conversation and help the user with their request.

CONVERSATION STYLE:
- Speak naturally and conversationally - like a helpful human assistant
- Use plain text only - NO markdown, asterisks, hashtags, or special formatting
- Keep responses concise and friendly`,
}

const RESEARCH_TOOL = {
  name: 'research_topic',
  description: 'Research information about URLs, companies, venues, people, or topics. Can scrape and parse web pages, LinkedIn profiles, company websites, event pages, etc. Use this to extract structured data from any URL the user provides.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'URL to scrape OR search query. Examples: "https://linkedin.com/in/johndoe", "https://techconf.com/event/ai-summit", "DeepStation AI company", "Googleplex venue"',
      },
    },
    required: ['query'],
  },
}

// Clean markdown and formatting from AI response
function cleanResponseText(text: string): string {
  return text
    // Remove markdown headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown bold (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove markdown italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove markdown strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Remove markdown code blocks (```text```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`text`)
    .replace(/`(.+?)`/g, '$1')
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove markdown horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove markdown unordered lists (- item, * item, + item)
    .replace(/^[*\-+]\s+/gm, '')
    // Remove markdown ordered lists (1. item)
    .replace(/^\d+\.\s+/gm, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Clean up multiple line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation, formType = 'generic', fieldSchema = [], accumulatedData = {} } = body

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

    let systemPrompt = SYSTEM_PROMPTS[formType] || SYSTEM_PROMPTS.generic

    // If field schema is provided, append it to the system prompt
    if (fieldSchema && fieldSchema.length > 0) {
      const fieldList = fieldSchema.map((f: any) => `- ${f.name} (${f.type}): ${f.label}${f.required ? ' [REQUIRED]' : ''}`).join('\n')

      systemPrompt = `${systemPrompt}

AVAILABLE FORM FIELDS ON THIS PAGE:
The following fields are available in the current form. You MUST use these EXACT field names in your formData output:

${fieldList}

CRITICAL: Only extract data for fields that exist in the list above. Use the EXACT field names shown (e.g., "location_name" NOT "venue_name").`
    }

    // Add accumulated data context if available
    if (accumulatedData && Object.keys(accumulatedData).length > 0) {
      const filledFields = Object.entries(accumulatedData)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
        .join('\n')

      systemPrompt = `${systemPrompt}

PREVIOUSLY FILLED FIELDS:
The user has already provided the following information. Include these in your formData output:

${filledFields}

Remember: Always include ALL previously filled fields in your formData output, even if the user doesn't mention them again.`
    }

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

        // Continue conversation with tool result (using the same systemPrompt with field schema)
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

        // Clean the response text
        const rawResponse = assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim()
        const cleanedResponse = cleanResponseText(rawResponse)

        // Determine next field suggestion
        let nextField = null
        if (formData && fieldSchema && fieldSchema.length > 0) {
          const allFilledFields = { ...accumulatedData, ...formData }
          const nextRequiredField = fieldSchema.find(
            (f: any) => f.required && !allFilledFields[f.name]
          )

          if (nextRequiredField) {
            nextField = nextRequiredField.name
          } else {
            const nextOptionalField = fieldSchema.find(
              (f: any) => !f.required && !allFilledFields[f.name]
            )
            if (nextOptionalField) {
              nextField = nextOptionalField.name
            }
          }
        }

        return NextResponse.json({
          success: true,
          response: cleanedResponse,
          formData,
          nextField,
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

    // Remove formData tags and clean markdown formatting from response text
    const rawResponse = assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim()
    const cleanResponse = cleanResponseText(rawResponse)

    // Determine next field suggestion
    let nextField = null
    if (formData && fieldSchema && fieldSchema.length > 0) {
      // Find the next empty required field
      const allFilledFields = { ...accumulatedData, ...formData }
      const nextRequiredField = fieldSchema.find(
        (f: any) => f.required && !allFilledFields[f.name]
      )

      if (nextRequiredField) {
        nextField = nextRequiredField.name
      } else {
        // If all required fields are filled, suggest the next optional field
        const nextOptionalField = fieldSchema.find(
          (f: any) => !f.required && !allFilledFields[f.name]
        )
        if (nextOptionalField) {
          nextField = nextOptionalField.name
        }
      }
    }

    return NextResponse.json({
      success: true,
      response: cleanResponse,
      formData,
      nextField,
    })
  } catch (error: any) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation', details: error.message },
      { status: 500 }
    )
  }
}
