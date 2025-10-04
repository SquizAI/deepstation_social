import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an AI assistant helping users create events through natural conversation. Your role is to:

1. Ask conversational questions to gather event details
2. Extract structured data from the conversation
3. Use the research_topic tool when users mention venues, speakers, or topics you should know more about
4. Fill in form fields as you learn information

Required fields to collect:
- title: Event title
- event_date: Date in YYYY-MM-DD format
- start_time: Start time in HH:MM (24-hour) format
- end_time: End time in HH:MM (24-hour) format
- location_type: "online", "in-person", or "hybrid"

Optional fields:
- description: Full description
- short_description: Brief summary
- venue_name, venue_address (for in-person)
- meeting_url, virtual_platform (for online)
- capacity: Number of attendees
- event_type: workshop, conference, meetup, webinar, course, networking, other
- tags: Array of tags
- ticket_types: Array of {name, description, price, quantity}

Be conversational and helpful. Ask one or two questions at a time. When you have enough information, let the user know and offer to create the event.

IMPORTANT: After each response, output a JSON block with extracted data in this exact format:
<formData>
{
  "title": "value or null",
  "event_date": "YYYY-MM-DD or null",
  "start_time": "HH:MM or null",
  ...other fields...
}
</formData>`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: [
        {
          name: 'research_topic',
          description: 'Research information about a topic, venue, speaker, or event type using web search',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
            },
            required: ['query'],
          },
        },
      ],
    })

    // Extract the message and form data
    let assistantMessage = ''
    let formData = null

    for (const block of response.content) {
      if (block.type === 'text') {
        assistantMessage += block.text

        // Extract formData if present
        const formDataMatch = block.text.match(/<formData>([\s\S]*?)<\/formData>/)
        if (formDataMatch) {
          try {
            formData = JSON.parse(formDataMatch[1])
            // Remove the formData block from the message
            assistantMessage = assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim()
          } catch (e) {
            console.error('Failed to parse formData:', e)
          }
        }
      } else if (block.type === 'tool_use' && block.name === 'research_topic') {
        // Handle tool use
        const toolInput = block.input as any
        const researchResponse = await fetch(`${request.url.replace('/chat', '/research')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: toolInput.query }),
        })

        const researchData = await researchResponse.json()

        // Continue conversation with tool result
        const followUp = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [
            ...messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(researchData),
                },
              ],
            },
          ],
        })

        // Extract follow-up message
        for (const followUpBlock of followUp.content) {
          if (followUpBlock.type === 'text') {
            assistantMessage += followUpBlock.text

            const formDataMatch = followUpBlock.text.match(/<formData>([\s\S]*?)<\/formData>/)
            if (formDataMatch) {
              try {
                formData = JSON.parse(formDataMatch[1])
                assistantMessage = assistantMessage.replace(/<formData>[\s\S]*?<\/formData>/, '').trim()
              } catch (e) {
                console.error('Failed to parse formData:', e)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      formData,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    )
  }
}
