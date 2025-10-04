/**
 * Speaker Announcement Workflow
 * Easily customizable AI workflow for generating speaker announcements
 */

import { generateAIContentWithFallback, AIGenerationOptions } from '../providers';
import type { SpeakerFormData } from '@/lib/types/speakers';
import type { Platform } from '@/lib/types/oauth';

/**
 * Workflow Configuration
 * Edit these to customize the speaker announcement generation behavior
 */
export const WORKFLOW_CONFIG = {
  // AI Provider Settings
  provider: undefined as 'openai' | 'gemini' | 'anthropic' | undefined, // undefined = auto-select
  temperature: 0.7,
  maxTokens: 2000,

  // Brand Voice
  brandVoice: {
    tone: 'professional yet approachable',
    values: ['innovation', 'community', 'education', 'AI advancement'],
    community: {
      size: '3,000+ members',
      events: '70+ events',
      speakers: '100+ speakers',
      chapters: ['Miami', 'Brazil'],
      partnership: 'Official OpenAI Academy Launch Partner',
    },
  },

  // Platform-Specific Settings
  platforms: {
    linkedin: {
      characterLimit: 3000,
      targetLength: [1200, 1500], // Min-max range
      style: 'professional',
      includeHashtags: true,
      hashtagCount: [3, 5],
    },
    twitter: {
      characterLimit: 280,
      targetLength: [250, 280],
      style: 'engaging',
      includeHashtags: true,
      hashtagCount: [2, 3],
      threadSupport: true,
    },
    instagram: {
      characterLimit: 2200,
      targetLength: [1500, 2000],
      style: 'visual-friendly',
      includeHashtags: true,
      hashtagCount: [15, 25],
      includeEmojis: true,
    },
    discord: {
      characterLimit: 4000,
      targetLength: [800, 1200],
      style: 'community-focused',
      includeHashtags: false,
      markdown: true,
    },
  },
};

/**
 * Generate Platform-Specific Prompt
 * Edit these prompts to customize the content generation
 */
function generatePlatformPrompt(
  speaker: SpeakerFormData,
  platform: Platform
): string {
  const config = WORKFLOW_CONFIG.platforms[platform];
  const brand = WORKFLOW_CONFIG.brandVoice;

  const baseContext = `
DeepStation Community:
- ${brand.community.size} members
- ${brand.community.events} held
- ${brand.community.speakers} featured
- Chapters: ${brand.community.chapters.join(', ')}
- ${brand.community.partnership}

Speaker Details:
- Name: ${speaker.fullName}
- Title: ${speaker.title}
- Company: ${speaker.company}
- Bio: ${speaker.bio}
- Presentation: "${speaker.presentationTitle}"
- Description: ${speaker.presentationDescription}
- Type: ${speaker.presentationType}
- Expertise: ${speaker.expertise.join(', ')}
- Event Date: ${speaker.eventDate.toLocaleDateString()}
- Location: ${speaker.eventLocation}
${speaker.notableHighlights ? `- Notable: ${speaker.notableHighlights}` : ''}
${speaker.previousCompanies ? `- Previous: ${speaker.previousCompanies}` : ''}
  `.trim();

  const platformInstructions: Record<Platform, string> = {
    linkedin: `
Create a professional LinkedIn post announcing this speaker.

Requirements:
- Length: ${config.targetLength[0]}-${config.targetLength[1]} characters
- Tone: ${brand.tone}, business-focused
- Include: Speaker credentials, presentation value, event details
- ${config.includeHashtags ? `Hashtags: ${config.hashtagCount[0]}-${config.hashtagCount[1]} relevant tags` : ''}
- Call-to-action: Encourage registration/attendance
- Format: Professional paragraph structure

Focus on:
1. Speaker's impressive background
2. Value of their presentation
3. DeepStation community benefits
4. Event logistics
    `,

    twitter: `
Create an engaging Twitter/X announcement for this speaker.

Requirements:
- ${config.threadSupport ? 'Create a 3-4 tweet thread' : 'Single tweet'}
- Length: ${config.targetLength[0]}-${config.targetLength[1]} characters per tweet
- Tone: ${brand.tone}, exciting and concise
- ${config.includeHashtags ? `Hashtags: ${config.hashtagCount[0]}-${config.hashtagCount[1]} tags` : ''}
- Hook: Grab attention in first tweet
- Call-to-action: Clear next steps

Thread structure:
1. Hook + Speaker announcement
2. Presentation details + value
3. Event info + registration
4. Community context (optional)
    `,

    instagram: `
Create a visually-oriented Instagram caption for this speaker.

Requirements:
- Length: ${config.targetLength[0]}-${config.targetLength[1]} characters
- Tone: ${brand.tone}, visual and inspiring
- ${config.includeEmojis ? 'Include relevant emojis' : ''}
- ${config.includeHashtags ? `Hashtags: ${config.hashtagCount[0]}-${config.hashtagCount[1]} tags at the end` : ''}
- Structure: Hook, story, call-to-action
- Readability: Line breaks for easy reading

Focus on:
1. Attention-grabbing opening
2. Speaker's journey/achievements
3. Presentation excitement
4. Community invitation
    `,

    discord: `
Create a community-focused Discord announcement for this speaker.

Requirements:
- Length: ${config.targetLength[0]}-${config.targetLength[1]} characters
- Tone: ${brand.tone}, community-driven
- ${config.markdown ? 'Use Discord markdown (**, *, >, etc.)' : ''}
- Include: @everyone or @here mention
- Format: Clear sections with headers
- Call-to-action: Encourage participation

Structure:
1. Announcement header
2. Speaker introduction
3. Presentation details
4. Event logistics
5. Community benefits
    `,
  };

  return `${baseContext}\n\n${platformInstructions[platform]}`;
}

/**
 * Generate speaker announcement for a specific platform
 */
export async function generateSpeakerAnnouncementForPlatform(
  speaker: SpeakerFormData,
  platform: Platform,
  options: AIGenerationOptions = {}
): Promise<string> {
  const prompt = generatePlatformPrompt(speaker, platform);

  const response = await generateAIContentWithFallback(prompt, {
    provider: WORKFLOW_CONFIG.provider,
    temperature: WORKFLOW_CONFIG.temperature,
    maxTokens: WORKFLOW_CONFIG.maxTokens,
    systemPrompt: `You are a professional social media content creator for DeepStation, an AI community.
Create engaging, authentic announcements that highlight speakers and encourage participation.
Follow the platform-specific guidelines precisely and maintain the brand voice: ${WORKFLOW_CONFIG.brandVoice.tone}.`,
    ...options,
  });

  return response.content.trim();
}

/**
 * Generate announcements for all platforms
 */
export async function generateAllSpeakerAnnouncements(
  speaker: SpeakerFormData,
  options: AIGenerationOptions = {}
): Promise<Record<Platform, string>> {
  const platforms: Platform[] = ['linkedin', 'twitter', 'instagram', 'discord'];

  // Generate in parallel for speed
  const results = await Promise.all(
    platforms.map(async (platform) => {
      try {
        const content = await generateSpeakerAnnouncementForPlatform(speaker, platform, options);
        return { platform, content, error: null };
      } catch (error) {
        console.error(`Failed to generate ${platform} announcement:`, error);
        return { platform, content: '', error: error as Error };
      }
    })
  );

  // Convert to record
  const announcements: Record<string, string> = {};
  results.forEach(({ platform, content }) => {
    announcements[platform] = content;
  });

  return announcements as Record<Platform, string>;
}

/**
 * Validate generated content against platform requirements
 */
export function validateAnnouncementContent(
  content: string,
  platform: Platform
): { valid: boolean; errors: string[] } {
  const config = WORKFLOW_CONFIG.platforms[platform];
  const errors: string[] = [];

  // Check character limit
  if (content.length > config.characterLimit) {
    errors.push(
      `Content exceeds ${platform} character limit (${content.length}/${config.characterLimit})`
    );
  }

  // Check minimum length
  if (content.length < config.targetLength[0]) {
    errors.push(
      `Content below recommended minimum length (${content.length}/${config.targetLength[0]})`
    );
  }

  // Platform-specific validation
  if (platform === 'twitter' && config.threadSupport) {
    const tweets = content.split('\n\n').filter((t) => t.trim());
    const oversizedTweets = tweets.filter((t) => t.length > 280);
    if (oversizedTweets.length > 0) {
      errors.push(`${oversizedTweets.length} tweets exceed 280 characters`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Easy workflow customization interface
 */
export interface WorkflowCustomization {
  brandVoice?: Partial<typeof WORKFLOW_CONFIG.brandVoice>;
  platformSettings?: Partial<typeof WORKFLOW_CONFIG.platforms>;
  aiProvider?: 'openai' | 'gemini' | 'anthropic';
  temperature?: number;
}

/**
 * Update workflow configuration at runtime
 */
export function customizeWorkflow(customization: WorkflowCustomization): void {
  if (customization.brandVoice) {
    Object.assign(WORKFLOW_CONFIG.brandVoice, customization.brandVoice);
  }
  if (customization.platformSettings) {
    Object.assign(WORKFLOW_CONFIG.platforms, customization.platformSettings);
  }
  if (customization.aiProvider) {
    WORKFLOW_CONFIG.provider = customization.aiProvider;
  }
  if (customization.temperature !== undefined) {
    WORKFLOW_CONFIG.temperature = customization.temperature;
  }
}
