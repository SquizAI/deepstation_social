/**
 * AI Prompt Enhancement Service
 * Uses GPT-4 to enhance and optimize prompts before generation
 * Ensures better quality outputs from image/video generation models
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PromptEnhancementOptions {
  type: 'image' | 'video';
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'discord';
  style?: string;
  duration?: number; // for video
  aspectRatio?: string;
}

export async function enhancePrompt(
  userPrompt: string,
  options: PromptEnhancementOptions
): Promise<string> {
  const { type, platform, style, duration, aspectRatio } = options;

  const systemPrompt = `You are an expert prompt engineer for ${type} generation AI models.
Your task is to take a user's simple prompt and enhance it into a highly detailed, technical prompt that will produce stunning ${type}s.

${type === 'video' ? 'This is for Google Veo 3, which generates 8-second videos with native audio.' : 'This is for Google Imagen 4/Gemini, which generates high-quality images.'}

Platform: ${platform || 'general'}
Style: ${style || 'professional'}
${aspectRatio ? `Aspect Ratio: ${aspectRatio}` : ''}
${duration ? `Duration: ${duration} seconds` : ''}

Enhancement Rules:
1. Add specific visual details (lighting, composition, camera angles, colors)
2. Include technical photography/cinematography terms
3. Specify mood and atmosphere
4. Add relevant style descriptors
5. ${type === 'video' ? 'Include camera movement and pacing details' : 'Specify artistic medium and technique'}
6. Make it platform-appropriate for ${platform || 'social media'}
7. Keep it concise but rich in detail (max 3-4 sentences)
8. NEVER mention text or words in the ${type} (AI can't generate accurate text)

${type === 'video' ? 'For video, include: camera movement, pacing, transitions, and audio atmosphere' : 'For images, include: composition rules (rule of thirds, golden ratio), depth of field, artistic style'}

Output ONLY the enhanced prompt, nothing else. No explanations or meta-commentary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Enhance this ${type} prompt: "${userPrompt}"` },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const enhancedPrompt = completion.choices[0].message.content?.trim() || userPrompt;

    console.log('Prompt enhanced:', {
      original: userPrompt,
      enhanced: enhancedPrompt,
      type,
      platform,
    });

    return enhancedPrompt;
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    // Fallback to original prompt if enhancement fails
    return userPrompt;
  }
}

/**
 * Quick enhancement for video prompts
 */
export async function enhanceVideoPrompt(
  prompt: string,
  duration: number = 5,
  style: string = 'cinematic'
): Promise<string> {
  return enhancePrompt(prompt, {
    type: 'video',
    duration,
    style,
  });
}

/**
 * Quick enhancement for image prompts
 */
export async function enhanceImagePrompt(
  prompt: string,
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'discord',
  aspectRatio: string = '16:9'
): Promise<string> {
  return enhancePrompt(prompt, {
    type: 'image',
    platform,
    aspectRatio,
  });
}
