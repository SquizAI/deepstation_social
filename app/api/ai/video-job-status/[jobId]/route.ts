import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Check status of video generation job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    // Get job status
    const { data: job, error: dbError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Ensure user owns this job
      .single();

    if (dbError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        videoUrl: job.video_url,
        thumbnailUrl: job.thumbnail_url,
        duration: job.duration,
        resolution: job.resolution,
        hasAudio: job.has_audio,
        errorMessage: job.error_message,
        cost: job.cost,
        generationTime: job.generation_time_ms,
        createdAt: job.created_at,
        completedAt: job.completed_at,
      },
    });
  } catch (error) {
    console.error('[Video Job Status] ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
