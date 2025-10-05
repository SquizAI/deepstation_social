/**
 * Netlify Background Function - Process Video Generation Job
 * This runs in the background (up to 15 minutes) to generate videos with Veo 3
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (has full access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  try {
    const { jobId } = JSON.parse(event.body || '{}');

    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Job ID required' }),
      };
    }

    console.log(`[Netlify BG] Processing video job: ${jobId}`);

    // Get job from database
    const { data: job, error: fetchError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error('[Netlify BG] Job not found:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Job not found' }),
      };
    }

    // Update status to processing
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 10,
      })
      .eq('id', jobId);

    const startTime = Date.now();
    const config = job.config;

    try {
      // Enhance prompt with style
      const styleDescriptions = {
        cinematic: 'cinematic photography, professional color grading, shallow depth of field, film grain',
        documentary: 'documentary style, natural lighting, handheld camera movement, authentic feel',
        animation: '3D animation, smooth motion, vibrant colors, stylized rendering',
        realistic: 'photorealistic, ultra HD quality, natural lighting, detailed textures',
      };

      const style = config.style ? styleDescriptions[config.style as keyof typeof styleDescriptions] : '';
      const audioInstruction = config.withAudio
        ? `Include natural sound effects and ambient audio. ${config.audioPrompt || ''}`
        : '';

      const enhancedPrompt = `${job.prompt}. ${style}. ${audioInstruction}`.trim();

      console.log('[Netlify BG] Starting Veo 3 generation...');

      // Update progress
      await supabase
        .from('video_generation_jobs')
        .update({ progress: 30 })
        .eq('id', jobId);

      // Determine model based on speed preference
      const modelName = config.speed === 'fast' ? 'veo-3.0-fast-generate-001' : 'veo-3.0-generate-001';

      // Start video generation using correct Veo 3 API
      const startResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predictLongRunning`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': process.env.GOOGLE_AI_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{
              prompt: enhancedPrompt,
            }],
            parameters: {
              aspectRatio: config.aspectRatio || '16:9',
              resolution: config.resolution || '1080p',
            },
          }),
        }
      );

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Veo 3 API error: ${startResponse.status} - ${errorText}`);
      }

      const { name: operationName } = await startResponse.json();
      console.log('[Netlify BG] Operation started:', operationName);

      // Poll until video is ready (max 5 minutes for Veo 3)
      const maxAttempts = 60; // 5 minutes with 5s intervals
      let attempts = 0;
      let operationDone = false;
      let videoUrl = '';
      let thumbnailUrl = '';

      while (!operationDone && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        const pollResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
          {
            headers: {
              'x-goog-api-key': process.env.GOOGLE_AI_API_KEY!,
            },
          }
        );

        if (!pollResponse.ok) {
          throw new Error(`Failed to poll operation: ${pollResponse.status}`);
        }

        const operation = await pollResponse.json();
        operationDone = operation.done;
        attempts++;

        // Update progress (30% to 90% during generation)
        const progress = 30 + Math.floor((attempts / maxAttempts) * 60);
        await supabase
          .from('video_generation_jobs')
          .update({ progress })
          .eq('id', jobId);

        if (operationDone) {
          // Extract video URL from response
          const response = operation.response;
          videoUrl = response?.predictions?.[0]?.bytesBase64Encoded
            ? `data:video/mp4;base64,${response.predictions[0].bytesBase64Encoded}`
            : response?.predictions?.[0]?.videoUri || '';
          thumbnailUrl = response?.predictions?.[0]?.thumbnailUri || videoUrl;

          console.log('[Netlify BG] Operation complete, video URL:', videoUrl?.substring(0, 100));
        }
      }

      if (!operationDone) {
        throw new Error('Video generation timeout - operation did not complete in 5 minutes');
      }

      if (!videoUrl) {
        throw new Error('No video URL returned from Veo 3');
      }

      const generationTime = Date.now() - startTime;
      const cost = config.duration * 0.40; // Veo 3 pricing

      console.log('[Netlify BG] Video generated successfully!', {
        jobId,
        videoUrl: videoUrl.substring(0, 80),
        duration: config.duration,
        cost,
        generationTime,
      });

      // Update job with success
      await supabase
        .from('video_generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: config.duration,
          resolution: config.resolution,
          has_audio: config.withAudio || false,
          cost,
          generation_time_ms: generationTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Also save to ai_generations table
      await supabase
        .from('ai_generations')
        .insert({
          user_id: job.user_id,
          type: 'video',
          model: 'veo-3',
          prompt: job.prompt,
          output_url: videoUrl,
          output_data: {
            thumbnailUrl,
            duration: config.duration,
            resolution: config.resolution,
            hasAudio: config.withAudio,
          },
          config,
          cost,
          generation_time_ms: generationTime,
        });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          jobId,
          videoUrl,
        }),
      };
    } catch (error) {
      console.error('[Netlify BG] Generation error:', error);

      // Update job with error
      await supabase
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Video generation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }
  } catch (error) {
    console.error('[Netlify BG] Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
