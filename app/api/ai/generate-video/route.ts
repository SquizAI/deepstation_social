import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { veo3Service } from '@/lib/ai/models/veo3';
import { enhanceVideoPrompt } from '@/lib/ai/prompt-enhancer';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for video generation

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
      resolution = '1080p',
      duration = 5,
      aspectRatio = '16:9',
      style = 'cinematic',
      withAudio = false,
      audioPrompt,
      fps = 30,
      type = 'text-to-video', // 'text-to-video', 'image-to-video', 'social-short'
      imageUrl,
      platform,
      enhancePrompt: shouldEnhance = true, // Auto-enhance by default
    } = body;

    if (!prompt && type !== 'image-to-video') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (type === 'image-to-video' && !imageUrl) {
      return NextResponse.json({ error: 'Image URL is required for image-to-video' }, { status: 400 });
    }

    const startTime = Date.now();

    // Enhance prompt before generation
    const enhancedPrompt = shouldEnhance
      ? await enhanceVideoPrompt(prompt, duration, style)
      : prompt;

    let result;

    // Generate based on type
    if (type === 'image-to-video') {
      const imagePrompt = shouldEnhance
        ? await enhanceVideoPrompt(prompt || 'Animate this image', duration, style)
        : prompt || 'Animate this image with smooth motion';

      result = await veo3Service.imageToVideo({
        imageUrl,
        prompt: imagePrompt,
        duration,
        resolution,
        motionIntensity: 'medium',
      });
    } else if (type === 'social-short' && platform) {
      result = await veo3Service.generateShortFormVideo({
        script: enhancedPrompt,
        platform,
        style,
      });
    } else {
      result = await veo3Service.generateVideo({
        prompt: enhancedPrompt,
        resolution,
        duration,
        aspectRatio,
        style,
        withAudio,
        audioPrompt,
        fps,
      });
    }

    const generationTime = Date.now() - startTime;

    // Save generation to database
    const { data: savedGeneration, error: dbError } = await supabase
      .from('ai_generations')
      .insert({
        user_id: user.id,
        type: 'video',
        model: 'veo-3',
        prompt,
        output_url: result.videoUrl,
        output_data: {
          thumbnailUrl: result.thumbnailUrl,
          duration: result.duration,
          resolution: result.resolution,
          hasAudio: result.hasAudio,
        },
        config: {
          aspectRatio,
          style,
          fps,
          withAudio,
          platform,
        },
        cost: result.cost,
        generation_time_ms: generationTime,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving video generation:', dbError);
    }

    return NextResponse.json({
      success: true,
      video: {
        url: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        resolution: result.resolution,
        hasAudio: result.hasAudio,
      },
      prompt,
      cost: result.cost,
      generationTime,
      generation: savedGeneration,
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
