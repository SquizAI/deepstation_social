/**
 * Supabase Edge Function: Process Scheduled Posts
 * Runs as a cron job to process scheduled posts and publish them to social media platforms
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RRule, rrulestr } from 'https://esm.sh/rrule@2.8.1';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Platform publishing functions (imported from unified publisher concept)
interface PublishRequest {
  platform: string;
  content: string;
  images?: string[];
  accessToken: string;
  platformUserId?: string;
  webhookUrl?: string;
}

interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  errorCode?: string;
}

serve(async (req) => {
  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🚀 Starting scheduled post processing...');

  try {
    // Get posts due now (with 1-minute buffer for timing precision)
    const now = new Date();
    const buffer = new Date(now.getTime() + 60000); // +1 minute

    const { data: posts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', buffer.toISOString())
      .limit(50); // Process max 50 posts per run

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled posts: ${fetchError.message}`);
    }

    console.log(`📋 Found ${posts?.length || 0} posts to process`);

    const results = [];

    // Process each scheduled post
    for (const post of posts || []) {
      try {
        console.log(`📝 Processing post ${post.id}`);

        // Update status to queued
        await supabase
          .from('scheduled_posts')
          .update({ status: 'queued', updated_at: new Date().toISOString() })
          .eq('id', post.id);

        // Process platforms
        const platformResults = await processPost(supabase, post);

        // Check if all platforms succeeded
        const allSuccess = platformResults.every((r: PublishResult) => r.success);
        const anySuccess = platformResults.some((r: PublishResult) => r.success);

        // Update post status
        await supabase
          .from('scheduled_posts')
          .update({
            status: allSuccess ? 'published' : anySuccess ? 'partial' : 'failed',
            published_at: anySuccess ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({
          postId: post.id,
          status: allSuccess ? 'success' : anySuccess ? 'partial' : 'failed',
          platforms: platformResults,
        });

        console.log(`✅ Completed post ${post.id}`);
      } catch (err: any) {
        console.error(`❌ Failed to process post ${post.id}:`, err);

        // Handle failure with retry logic
        await handleFailedPost(supabase, post, err.message);

        results.push({
          postId: post.id,
          status: 'error',
          error: err.message,
        });
      }
    }

    // Process recurring posts
    console.log('🔄 Processing recurring posts...');
    await processRecurringPosts(supabase);

    // Cleanup old completed jobs
    console.log('🧹 Cleaning up old jobs...');
    await cleanupOldJobs(supabase);

    const duration = Date.now() - startTime;
    console.log(`✨ Processing complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        duration,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('💥 Scheduler error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Process a single post across all platforms
 */
async function processPost(supabase: any, post: any): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  // Get user's OAuth tokens for all platforms
  const { data: tokens } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('is_active', true)
    .in('platform', post.platforms);

  if (!tokens || tokens.length === 0) {
    throw new Error('No active OAuth tokens found for user');
  }

  // Process each platform
  for (const platform of post.platforms) {
    try {
      // Get platform-specific content
      const platformContent = post.content[platform];
      if (!platformContent) {
        results.push({
          success: false,
          platform,
          error: `No content provided for ${platform}`,
          errorCode: 'NO_CONTENT',
        });
        continue;
      }

      // Get token for platform (except Discord)
      let token = null;
      if (platform !== 'discord') {
        token = tokens.find((t: any) => t.platform === platform);
        if (!token) {
          results.push({
            success: false,
            platform,
            error: `No OAuth token found for ${platform}`,
            errorCode: 'NO_TOKEN',
          });
          continue;
        }
      }

      // Get webhook URL for Discord
      let webhookUrl = '';
      if (platform === 'discord') {
        webhookUrl = post.metadata?.webhookUrls?.[platform] || '';
        if (!webhookUrl) {
          results.push({
            success: false,
            platform,
            error: 'Discord webhook URL not found',
            errorCode: 'NO_WEBHOOK',
          });
          continue;
        }
      }

      // Publish to platform
      console.log(`🚀 Publishing to ${platform}...`);

      const result = await publishToPlatform({
        platform,
        content: platformContent,
        images: post.images || [],
        accessToken: token?.access_token || '',
        platformUserId: token?.platform_user_id || '',
        webhookUrl,
      });

      // Store result in database
      await supabase.from('post_results').insert({
        post_id: post.id,
        user_id: post.user_id,
        platform,
        platform_post_id: result.postId,
        post_url: result.postUrl,
        status: result.success ? 'success' : 'failed',
        error_message: result.error,
        posted_at: result.success ? new Date().toISOString() : null,
        metadata: {
          errorCode: result.errorCode,
        },
      });

      results.push(result);

      if (result.success) {
        console.log(`✅ Published to ${platform}: ${result.postUrl}`);
      } else {
        console.error(`❌ Failed to publish to ${platform}: ${result.error}`);
      }
    } catch (err: any) {
      console.error(`❌ Error publishing to ${platform}:`, err);

      results.push({
        success: false,
        platform,
        error: err.message,
        errorCode: 'PUBLISH_ERROR',
      });

      // Store error result
      await supabase.from('post_results').insert({
        post_id: post.id,
        user_id: post.user_id,
        platform,
        status: 'failed',
        error_message: err.message,
      });
    }
  }

  return results;
}

/**
 * Handle failed post with retry logic
 */
async function handleFailedPost(
  supabase: any,
  post: any,
  errorMessage: string
): Promise<void> {
  const retryCount = post.retry_count + 1;
  const maxRetries = post.max_retries || 3;

  if (retryCount < maxRetries) {
    // Calculate exponential backoff delay
    const delay = Math.pow(2, retryCount) * 60 * 1000; // 2^n minutes in ms
    const retryTime = new Date(Date.now() + delay);

    await supabase
      .from('scheduled_posts')
      .update({
        status: 'scheduled',
        retry_count: retryCount,
        scheduled_for: retryTime.toISOString(),
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    console.log(
      `🔄 Scheduled retry ${retryCount}/${maxRetries} for post ${post.id} at ${retryTime.toISOString()}`
    );
  } else {
    // Max retries exceeded
    await supabase
      .from('scheduled_posts')
      .update({
        status: 'failed',
        retry_count: retryCount,
        last_error: `Max retries exceeded: ${errorMessage}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    console.error(
      `❌ Post ${post.id} failed after ${maxRetries} retries: ${errorMessage}`
    );
  }
}

/**
 * Process recurring posts
 */
async function processRecurringPosts(supabase: any): Promise<void> {
  const now = new Date();

  // Get recurring posts due for next occurrence
  const { data: recurring } = await supabase
    .from('recurring_posts')
    .select('*, scheduled_posts(*)')
    .eq('is_active', true)
    .lte('next_occurrence', now.toISOString());

  for (const recurrence of recurring || []) {
    try {
      const parentPost = recurrence.scheduled_posts;

      console.log(`🔄 Creating occurrence for recurring post ${recurrence.id}`);

      // Create new scheduled post from template
      const { data: newPost } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: parentPost.user_id,
          title: parentPost.title,
          content: parentPost.content,
          images: parentPost.images,
          platforms: parentPost.platforms,
          metadata: parentPost.metadata,
          scheduled_for: recurrence.next_occurrence,
          timezone: recurrence.timezone,
          status: 'scheduled',
        })
        .select()
        .single();

      if (!newPost) {
        throw new Error('Failed to create recurring post occurrence');
      }

      // Calculate next occurrence using RRULE
      const rule = rrulestr(recurrence.recurrence_rule);
      const nextOccurrence = rule.after(new Date(recurrence.next_occurrence), true);

      if (nextOccurrence) {
        // Update recurring post with next occurrence
        await supabase
          .from('recurring_posts')
          .update({
            next_occurrence: nextOccurrence.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', recurrence.id);

        console.log(
          `✅ Next occurrence scheduled for ${nextOccurrence.toISOString()}`
        );
      } else {
        // No more occurrences, deactivate
        await supabase
          .from('recurring_posts')
          .update({
            is_active: false,
            next_occurrence: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recurrence.id);

        console.log(`🏁 Recurring post ${recurrence.id} completed (no more occurrences)`);
      }
    } catch (err: any) {
      console.error(
        `❌ Failed to process recurring post ${recurrence.id}:`,
        err
      );
    }
  }
}

/**
 * Clean up old completed jobs (>24 hours old)
 */
async function cleanupOldJobs(supabase: any): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    // Archive old completed posts
    const { error: archiveError } = await supabase
      .from('scheduled_posts')
      .update({ status: 'archived' })
      .eq('status', 'published')
      .lt('published_at', cutoff.toISOString());

    if (archiveError) {
      console.error('Error archiving old posts:', archiveError);
    } else {
      console.log('✅ Archived old completed posts');
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

/**
 * Publish to platform (placeholder - integrate with actual publishing code)
 */
async function publishToPlatform(
  request: PublishRequest
): Promise<PublishResult> {
  const { platform, content, images, accessToken, webhookUrl } = request;

  // In production, this would call the actual platform APIs
  // For now, simulate the publishing

  try {
    switch (platform) {
      case 'linkedin':
        return await publishToLinkedIn(content, images || [], accessToken);

      case 'instagram':
        return await publishToInstagram(content, images || [], accessToken);

      case 'twitter':
        return await publishToTwitter(content, images || [], accessToken);

      case 'discord':
        return await publishToDiscord(content, images || [], webhookUrl || '');

      default:
        return {
          success: false,
          platform,
          error: `Unsupported platform: ${platform}`,
          errorCode: 'UNSUPPORTED_PLATFORM',
        };
    }
  } catch (error: any) {
    return {
      success: false,
      platform,
      error: error.message,
      errorCode: 'PUBLISH_ERROR',
    };
  }
}

// Platform-specific publishing functions (placeholders)
async function publishToLinkedIn(
  content: string,
  images: string[],
  accessToken: string
): Promise<PublishResult> {
  // TODO: Implement actual LinkedIn publishing
  console.log('Publishing to LinkedIn...');

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    platform: 'linkedin',
    postId: 'linkedin_' + Date.now(),
    postUrl: 'https://www.linkedin.com/feed/update/mock-post-id',
  };
}

async function publishToInstagram(
  content: string,
  images: string[],
  accessToken: string
): Promise<PublishResult> {
  // TODO: Implement actual Instagram publishing
  console.log('Publishing to Instagram...');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    platform: 'instagram',
    postId: 'instagram_' + Date.now(),
    postUrl: 'https://www.instagram.com/p/mock-post-id',
  };
}

async function publishToTwitter(
  content: string,
  images: string[],
  accessToken: string
): Promise<PublishResult> {
  // TODO: Implement actual Twitter publishing
  console.log('Publishing to Twitter...');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    platform: 'twitter',
    postId: 'twitter_' + Date.now(),
    postUrl: 'https://twitter.com/user/status/mock-post-id',
  };
}

async function publishToDiscord(
  content: string,
  images: string[],
  webhookUrl: string
): Promise<PublishResult> {
  // TODO: Implement actual Discord webhook posting
  console.log('Publishing to Discord...');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    platform: 'discord',
    postId: 'discord_' + Date.now(),
    postUrl: webhookUrl,
  };
}
