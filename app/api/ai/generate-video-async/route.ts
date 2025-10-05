import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 10; // Fast response, just create job

/**
 * Create async video generation job
 * Returns immediately with job ID, actual generation happens in background
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Video Async] Creating video generation job');
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
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Create job record
    const { data: job, error: dbError } = await supabase
      .from('video_generation_jobs')
      .insert({
        user_id: user.id,
        prompt,
        config: {
          resolution,
          duration,
          aspectRatio,
          style,
          withAudio,
          audioPrompt,
          fps,
        },
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (dbError || !job) {
      console.error('[Video Async] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create video generation job' },
        { status: 500 }
      );
    }

    console.log('[Video Async] Job created:', job.id);

    // Trigger background processing via Netlify function
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3055';

      await fetch(`${baseUrl}/.netlify/functions/process-video-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch (err) {
      console.warn('[Video Async] Failed to trigger background job:', err);
      // Don't fail the request, job will be picked up by cron
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'pending',
      estimatedTime: duration * 4, // 4 seconds per second of video
    });
  } catch (error) {
    console.error('[Video Async] ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to create video generation job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
