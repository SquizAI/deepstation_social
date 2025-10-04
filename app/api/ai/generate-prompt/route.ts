import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Auto-generate image prompts from post content
 * Uses GPT-5 to create platform-optimized image prompts
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, platform, purpose } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Platform-specific prompt engineering
    const platformGuidance = {
      linkedin: 'Professional, business-oriented, corporate-friendly imagery. Focus on professionalism, expertise, and industry relevance.',
      instagram: 'Eye-catching, vibrant, aesthetically pleasing imagery. Focus on visual appeal, trendy aesthetics, and engagement.',
      twitter: 'News-worthy, attention-grabbing, concise visual storytelling. Focus on immediacy and impact.',
      discord: 'Community-focused, casual, relatable imagery. Focus on authenticity and conversation starters.',
    };

    const systemPrompt = `You are an expert at creating image generation prompts for social media.
Your task is to analyze post content and create a perfect image prompt that will generate an engaging visual.

Platform: ${platform}
Platform guidance: ${platformGuidance[platform as keyof typeof platformGuidance] || 'General social media'}
Purpose: ${purpose || 'social-media-image'}

Rules:
1. Create a vivid, detailed image description
2. Include style, mood, lighting, and composition details
3. Make it platform-appropriate
4. Keep it concise but descriptive (2-3 sentences max)
5. Focus on what will be visually engaging for ${platform}
6. Avoid text in images (hard to generate accurately)
7. Specify "professional photograph" or "digital illustration" style

Output ONLY the image prompt, nothing else.`;

    const userPrompt = `Create an image prompt for this ${platform} post:\n\n${content}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const generatedPrompt = completion.choices[0].message.content?.trim() || '';

    // Log the generation
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      type: 'prompt',
      model: 'gpt-4o',
      prompt: userPrompt,
      output: generatedPrompt,
      cost: 0.0001, // Minimal cost for prompt generation
      metadata: { platform, purpose },
    });

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
