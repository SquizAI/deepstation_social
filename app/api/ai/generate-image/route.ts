import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { imagen4Service } from '@/lib/ai/models/imagen4';
import { geminiImageService } from '@/lib/ai/models/gemini-image';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for image generation

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      model = 'imagen-4', // 'imagen-4' or 'gemini-2.5-flash-image'
      aspectRatio = '1:1',
      numberOfImages = 1,
      negativePrompt,
      stylePreset,
      platform, // For social media presets
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let result;
    let aiModel = model;

    // Generate based on selected model
    if (model === 'imagen-4') {
      if (platform) {
        // Use social media preset
        result = await imagen4Service.generateSocialGraphic({
          platform,
          prompt,
          style: stylePreset,
        });
      } else {
        result = await imagen4Service.generateImage({
          prompt,
          negativePrompt,
          aspectRatio,
          numberOfImages,
          stylePreset,
        });
      }
    } else if (model === 'gemini-2.5-flash-image') {
      result = await geminiImageService.generateImage({
        prompt,
        aspectRatio,
        numberOfImages,
      });
    } else {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    // Save generation to database
    const generationRecords = result.images.map((img) => ({
      user_id: user.id,
      type: 'image',
      model: aiModel,
      prompt,
      negative_prompt: negativePrompt,
      output_url: img.url,
      output_data: {
        width: img.width,
        height: img.height,
        seed: img.seed,
        base64: img.base64,
      },
      config: {
        aspectRatio,
        stylePreset,
        platform,
      },
      cost: result.cost / result.images.length,
      generation_time_ms: result.generationTime,
      safety_ratings: result.safetyRatings || {},
    }));

    const { data: savedGenerations, error: dbError } = await supabase
      .from('ai_generations')
      .insert(generationRecords)
      .select();

    if (dbError) {
      console.error('Error saving generation:', dbError);
      // Don't fail the request if DB save fails
    }

    return NextResponse.json({
      success: true,
      images: result.images,
      prompt: result.prompt,
      revisedPrompt: result.revisedPrompt,
      cost: result.cost,
      generationTime: result.generationTime,
      generations: savedGenerations,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
