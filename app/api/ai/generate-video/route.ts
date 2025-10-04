import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { veo3Service } from '@/lib/ai/models/veo3';
import { enhanceVideoPrompt } from '@/lib/ai/prompt-enhancer';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation (Veo 3 can take 2+ minutes)

export async function POST(request: NextRequest) {
  try {
    console.log('[Video Gen] Starting video generation request');
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Video Gen] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Video Gen] User authenticated:', user.id);

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

    console.log('[Video Gen] Request params:', { prompt, duration, resolution, withAudio, shouldEnhance });

    const startTime = Date.now();

    // Enhance prompt before generation
    console.log('[Video Gen] Enhancing prompt...');
    const enhancedPrompt = shouldEnhance
      ? await enhanceVideoPrompt(prompt, duration, style)
      : prompt;
    console.log('[Video Gen] Prompt enhanced:', enhancedPrompt.substring(0, 100));

    let result;

    // Generate based on type
    console.log('[Video Gen] Starting video generation with Veo 3...');
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

    console.log('[Video Gen] Video generated successfully!', {
      videoUrl: result.videoUrl.substring(0, 80),
      duration: result.duration,
      cost: result.cost,
      generationTime,
    });

    // Save generation to database
    console.log('[Video Gen] Saving to database...');
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
    console.error('[Video Gen] ERROR:', error);
    console.error('[Video Gen] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
