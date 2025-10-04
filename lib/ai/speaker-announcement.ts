import OpenAI from 'openai'
import type {
  GenerateAnnouncementParams,
  AnnouncementGenerationResult,
  SpeakerForm,
  Speaker
} from '@/lib/types/speakers'
import { PLATFORM_LIMITS } from '@/lib/types/posts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper function to format speaker data consistently
function normalizeSpeakerData(data: SpeakerForm | Speaker): SpeakerForm {
  // If it's already a SpeakerForm, return as is
  if ('fullName' in data) {
    return data
  }

  // Convert Speaker (database format) to SpeakerForm
  return {
    fullName: data.full_name,
    title: data.title,
    company: data.company,
    bio: data.bio,
    profilePhoto: data.profile_photo_url,
    linkedin: data.linkedin,
    twitter: data.twitter,
    instagram: data.instagram,
    website: data.website,
    presentationTitle: data.presentation_title,
    presentationDescription: data.presentation_description,
    presentationType: data.presentation_type,
    expertise: data.expertise,
    eventDate: new Date(data.event_date),
    eventLocation: data.event_location,
    highlights: data.highlights,
    previousCompanies: data.previous_companies
  }
}

// Get first name from full name
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0]
}

// Format date for announcements
function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Build platform-specific prompts
function buildPrompt(
  speakerData: SpeakerForm,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord',
  eventLink?: string
): string {
  const firstName = getFirstName(speakerData.fullName)
  const formattedDate = formatEventDate(speakerData.eventDate)

  const baseContext = `You are a social media content specialist for DeepStation, a global AI education community with 3,000+ members across Miami and Brazil. We're an official OpenAI Academy Launch Partner focused on AI innovation and community learning.

Speaker Information:
- Name: ${speakerData.fullName}
- Title: ${speakerData.title}
- Company: ${speakerData.company}
- Bio: ${speakerData.bio}
- Presentation Title: "${speakerData.presentationTitle}"
- Presentation Description: ${speakerData.presentationDescription}
- Presentation Type: ${speakerData.presentationType}
- Expertise Areas: ${speakerData.expertise.join(', ')}
- Event Date: ${formattedDate}
- Location: ${speakerData.eventLocation}
${speakerData.highlights && speakerData.highlights.length > 0 ? `- Notable Highlights: ${speakerData.highlights.join(', ')}` : ''}
${speakerData.previousCompanies && speakerData.previousCompanies.length > 0 ? `- Previous Companies: ${speakerData.previousCompanies.join(', ')}` : ''}

DeepStation Stats to Include:
- 3,000+ Community Members
- 70+ Events Hosted
- 100+ Expert Speakers
- 2 Global Chapters (Miami & Brazil)
- Official OpenAI Academy Launch Partner`

  const platformInstructions = {
    linkedin: `Generate a professional LinkedIn announcement post.

Requirements:
1. Professional and business-focused tone
2. Optimal length: 1,200-1,500 characters (max 3,000)
3. Start with an engaging hook (use appropriate emoji)
4. Highlight speaker's credentials and expertise
5. Explain what attendees will learn and the business value
6. Include DeepStation community stats
7. Include 3-5 relevant professional hashtags (#AI #MachineLearning #DeepStation, etc.)
8. Include clear call-to-action
9. Use line breaks for readability
${eventLink ? `10. Include event registration link: ${eventLink}` : ''}

Format: Professional announcement that drives registrations while maintaining credibility.`,

    twitter: `Generate an engaging Twitter/X thread (3-4 tweets).

Requirements:
1. Tweet 1: Announcement hook with key details (within 280 chars)
   - Speaker name and title
   - Topic
   - Date
   - Include relevant emoji
2. Tweet 2: What attendees will learn (within 280 chars)
   - Brief presentation description
   - Target audience value
3. Tweet 3: Speaker credentials (within 280 chars)
   - Bio snippet or key achievement
   - Why they're qualified
4. Tweet 4: Community info and CTA (within 280 chars)
   - DeepStation stats
   - Registration link
   - Relevant hashtags

Format: Each tweet on a new line, prefixed with "Tweet 1:", "Tweet 2:", etc.
Use concise, punchy language. Include 2-3 hashtags per tweet max.`,

    instagram: `Generate an engaging Instagram caption.

Requirements:
1. Visual and engaging language with strategic emoji usage
2. Optimal length: 1,500-2,000 characters (max 2,200)
3. Start with eye-catching hook (🎤 SPEAKER ANNOUNCEMENT 🎤)
4. Use bullet points for key information (with emojis)
5. Include speaker bio and what attendees will learn
6. Highlight notable achievements
7. Include event details with emojis (📅 date, 📍 location)
8. Add "Link in bio to register!" call-to-action
9. Include DeepStation community stats at the end
10. Add 20-25 relevant hashtags at the very end (separate from main text with ---)
11. Use line breaks for visual appeal and scannability

Format: Instagram-optimized with strong visual elements and comprehensive hashtags.`,

    discord: `Generate a Discord server announcement.

Requirements:
1. Community-focused and detailed
2. Use Discord markdown formatting
3. Start with @everyone mention and announcement header
4. Include comprehensive session details in bullet format
5. Full speaker bio and background
6. What members will learn from the session
7. Include all relevant links (registration, speaker social profiles)
8. Encouraging and enthusiastic tone
9. End with motivational closing

Format: Use **bold**, *italic*, and bullet points. Create clear sections with headers.
Include direct clickable links. Maximum 4,000 characters.`
  }

  return `${baseContext}

${platformInstructions[platform]}

Brand Voice Guidelines:
- Educational and inspiring - Focus on AI innovation and learning opportunities
- Community-driven - Emphasize connection, collaboration, and shared growth
- Professional yet accessible - Expert content in approachable language
- Global perspective - Highlight our international community

Generate the ${platform} announcement now. Return ONLY the announcement text, no additional commentary or explanations.`
}

// Validate content length against platform limits
function validateLength(content: string, platform: keyof typeof PLATFORM_LIMITS): boolean {
  return content.length <= PLATFORM_LIMITS[platform]
}

// Generate announcement for a single platform with retry logic
async function generatePlatformAnnouncement(
  params: GenerateAnnouncementParams,
  retryCount = 0
): Promise<AnnouncementGenerationResult> {
  const { speakerData, platform, eventLink } = params
  const normalizedData = normalizeSpeakerData(speakerData)
  const maxRetries = 2

  try {
    const prompt = buildPrompt(normalizedData, platform, eventLink)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-3.5-turbo' for faster/cheaper generation
      messages: [
        {
          role: 'system',
          content:
            'You are an expert social media content creator specializing in tech community announcements. You understand platform-specific best practices and create engaging, professional content that drives engagement and registrations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const content = response.choices[0]?.message?.content?.trim() || ''

    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    const withinLimit = validateLength(content, platform)

    // If content is over limit and we haven't exhausted retries, try again with shorter prompt
    if (!withinLimit && retryCount < maxRetries) {
      console.log(
        `Content for ${platform} exceeded limit (${content.length}/${PLATFORM_LIMITS[platform]}). Retrying... (${retryCount + 1}/${maxRetries})`
      )

      // Add instruction to be more concise
      const shorterParams = {
        ...params,
        speakerData: normalizedData
      }

      return generatePlatformAnnouncement(shorterParams, retryCount + 1)
    }

    return {
      content,
      platform,
      characterCount: content.length,
      withinLimit
    }
  } catch (error) {
    console.error(`Error generating ${platform} announcement:`, error)

    // If we have retries left, try again
    if (retryCount < maxRetries) {
      console.log(`Retrying ${platform} generation... (${retryCount + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
      return generatePlatformAnnouncement(params, retryCount + 1)
    }

    throw new Error(`Failed to generate ${platform} announcement: ${error}`)
  }
}

// Generate announcements for all platforms
export async function generateSpeakerAnnouncement(
  speakerData: SpeakerForm | Speaker,
  eventLink?: string,
  platforms: Array<'linkedin' | 'twitter' | 'instagram' | 'discord'> = [
    'linkedin',
    'twitter',
    'instagram',
    'discord'
  ]
): Promise<Record<string, AnnouncementGenerationResult>> {
  const results: Record<string, AnnouncementGenerationResult> = {}

  // Generate all platforms in parallel for speed
  const promises = platforms.map((platform) =>
    generatePlatformAnnouncement({
      speakerData,
      platform,
      eventLink
    })
  )

  const generatedContent = await Promise.allSettled(promises)

  generatedContent.forEach((result, index) => {
    const platform = platforms[index]
    if (result.status === 'fulfilled') {
      results[platform] = result.value
    } else {
      console.error(`Failed to generate ${platform} announcement:`, result.reason)
      // Provide a fallback error message
      results[platform] = {
        content: `Error generating ${platform} announcement. Please try again or edit manually.`,
        platform,
        characterCount: 0,
        withinLimit: false
      }
    }
  })

  return results
}

// Regenerate a single platform announcement
export async function regeneratePlatformAnnouncement(
  speakerData: SpeakerForm | Speaker,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'discord',
  eventLink?: string
): Promise<AnnouncementGenerationResult> {
  return generatePlatformAnnouncement({
    speakerData,
    platform,
    eventLink
  })
}

// Helper to check if OpenAI API is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
