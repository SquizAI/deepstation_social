/**
 * Pre-built Workflow Templates for DeepStation
 * Ready-to-use workflows leveraging Claude agents for common automation tasks
 */

import { WorkflowDefinition } from './execution-engine';

/**
 * Template 1: Auto Image Generation Workflow
 *
 * Automatically generates platform-optimized images for social media posts.
 * Uses the image-workflow-agent to handle the full pipeline from content
 * analysis to final image generation.
 *
 * Inputs:
 * - postContent: The text content of the social media post
 * - platform: Target platform (linkedin, instagram, twitter, discord)
 * - budget: Max cost per image (default: 0.04)
 *
 * Outputs:
 * - imageUrl: Generated image URL
 * - cost: Total cost
 * - model: AI model used
 */
export const AUTO_IMAGE_GENERATION_WORKFLOW: WorkflowDefinition = {
  id: 'auto-image-generation',
  name: 'Auto Image Generation',
  maxCostPerRun: 0.10,
  timeoutSeconds: 120,
  retryOnFailure: true,
  maxRetries: 2,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'analyze_content' }],
    },
    {
      id: '2',
      nodeKey: 'analyze_content',
      nodeType: 'claude-agent',
      config: {
        agentName: 'image-workflow-agent',
        operation: 'auto-generate',
        postContent: '{{trigger.postContent}}',
        platform: '{{trigger.platform}}',
        budget: '{{trigger.budget}}',
        qualityThreshold: 8,
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [{ nodeKey: 'generate_image' }],
    },
    {
      id: '3',
      nodeKey: 'generate_image',
      nodeType: 'ai',
      config: {
        aiType: 'image-generation',
        model: '{{analyze_content.selectedModel}}',
        prompt: '{{analyze_content.prompt}}',
        aspectRatio: '{{analyze_content.aspectRatio}}',
        platform: '{{trigger.platform}}',
      },
      inputs: [{ nodeKey: 'analyze_content' }],
      outputs: [{ nodeKey: 'validate_quality' }],
    },
    {
      id: '4',
      nodeKey: 'validate_quality',
      nodeType: 'claude-agent',
      config: {
        agentName: 'image-workflow-agent',
        operation: 'analyze-image',
        imageUrl: '{{generate_image.output.images.0.url}}',
        postContent: '{{trigger.postContent}}',
        platform: '{{trigger.platform}}',
      },
      inputs: [{ nodeKey: 'generate_image' }],
      outputs: [],
    },
  ],
};

/**
 * Template 2: Multi-Platform Content Optimization
 *
 * Takes base content and generates optimized variations for all platforms.
 * Perfect for creating consistent multi-platform posts from a single draft.
 *
 * Inputs:
 * - baseContent: Original post content
 * - platforms: Array of platforms to optimize for
 * - includeHashtags: Whether to generate hashtags (default: true)
 * - tone: Preferred tone (auto-detect, professional, casual, creative)
 *
 * Outputs:
 * - variations: Object with optimized content per platform
 */
export const MULTI_PLATFORM_OPTIMIZATION_WORKFLOW: WorkflowDefinition = {
  id: 'multi-platform-optimization',
  name: 'Multi-Platform Content Optimization',
  maxCostPerRun: 0.05,
  timeoutSeconds: 60,
  retryOnFailure: true,
  maxRetries: 2,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'optimize_content' }],
    },
    {
      id: '2',
      nodeKey: 'optimize_content',
      nodeType: 'claude-agent',
      config: {
        agentName: 'content-optimizer',
        operation: 'generate-variations',
        baseContent: '{{trigger.baseContent}}',
        platforms: '{{trigger.platforms}}',
        includeHashtags: '{{trigger.includeHashtags}}',
        tone: '{{trigger.tone}}',
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [],
    },
  ],
};

/**
 * Template 3: Complete Content Creation Pipeline
 *
 * End-to-end pipeline that generates optimized content AND matching images
 * for all selected platforms. Most comprehensive automation workflow.
 *
 * Inputs:
 * - baseIdea: Core concept or topic
 * - platforms: Target platforms
 * - generateImages: Whether to generate images (default: true)
 *
 * Outputs:
 * - content: Platform-optimized content variations
 * - images: Generated images per platform
 * - totalCost: Total cost of the pipeline
 */
export const COMPLETE_CONTENT_PIPELINE_WORKFLOW: WorkflowDefinition = {
  id: 'complete-content-pipeline',
  name: 'Complete Content Creation Pipeline',
  maxCostPerRun: 0.50,
  timeoutSeconds: 300,
  retryOnFailure: true,
  maxRetries: 1,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'generate_base_content' }],
    },
    {
      id: '2',
      nodeKey: 'generate_base_content',
      nodeType: 'ai',
      config: {
        aiType: 'text-generation',
        model: 'claude-4.5-sonnet',
        prompt: `Create engaging social media content based on this idea:

{{trigger.baseIdea}}

Requirements:
- Professional and engaging tone
- 150-200 words
- Include key value proposition
- Platform-agnostic (will be optimized later)

Output ONLY the content.`,
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [{ nodeKey: 'optimize_for_platforms' }],
    },
    {
      id: '3',
      nodeKey: 'optimize_for_platforms',
      nodeType: 'claude-agent',
      config: {
        agentName: 'content-optimizer',
        operation: 'generate-variations',
        baseContent: '{{generate_base_content.output}}',
        platforms: '{{trigger.platforms}}',
        includeHashtags: true,
      },
      inputs: [{ nodeKey: 'generate_base_content' }],
      outputs: [{ nodeKey: 'check_generate_images' }],
    },
    {
      id: '4',
      nodeKey: 'check_generate_images',
      nodeType: 'condition',
      config: {
        condition: 'data.trigger.generateImages !== false',
      },
      inputs: [{ nodeKey: 'optimize_for_platforms' }],
      outputs: [{ nodeKey: 'generate_linkedin_image' }],
    },
    {
      id: '5',
      nodeKey: 'generate_linkedin_image',
      nodeType: 'claude-agent',
      config: {
        agentName: 'image-workflow-agent',
        operation: 'auto-generate',
        postContent: '{{optimize_for_platforms.linkedin}}',
        platform: 'linkedin',
        budget: 0.04,
      },
      inputs: [{ nodeKey: 'check_generate_images' }],
      outputs: [],
    },
    {
      id: '6',
      nodeKey: 'generate_instagram_image',
      nodeType: 'claude-agent',
      config: {
        agentName: 'image-workflow-agent',
        operation: 'auto-generate',
        postContent: '{{optimize_for_platforms.instagram}}',
        platform: 'instagram',
        budget: 0.04,
      },
      inputs: [{ nodeKey: 'check_generate_images' }],
      outputs: [],
    },
    {
      id: '7',
      nodeKey: 'generate_twitter_image',
      nodeType: 'claude-agent',
      config: {
        agentName: 'image-workflow-agent',
        operation: 'auto-generate',
        postContent: '{{optimize_for_platforms.twitter}}',
        platform: 'twitter',
        budget: 0.04,
      },
      inputs: [{ nodeKey: 'check_generate_images' }],
      outputs: [],
    },
  ],
};

/**
 * Template 4: Video Content Creation
 *
 * Generates short-form video content using Veo 3 for platforms like
 * TikTok, Instagram Reels, and YouTube Shorts.
 *
 * Inputs:
 * - concept: Video concept or topic
 * - platform: Target platform (tiktok, instagram-reels, youtube-shorts, discord)
 * - duration: Desired duration in seconds (1-8)
 *
 * Outputs:
 * - videoUrl: Generated video URL
 * - cost: Total generation cost
 */
export const VIDEO_CONTENT_CREATION_WORKFLOW: WorkflowDefinition = {
  id: 'video-content-creation',
  name: 'Video Content Creation',
  maxCostPerRun: 5.00, // Video is expensive
  timeoutSeconds: 180,
  retryOnFailure: false, // Videos cost too much to retry
  maxRetries: 0,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'analyze_concept' }],
    },
    {
      id: '2',
      nodeKey: 'analyze_concept',
      nodeType: 'claude-agent',
      config: {
        agentName: 'video-content-agent',
        operation: 'generate-video-prompt',
        postContent: '{{trigger.concept}}',
        platform: '{{trigger.platform}}',
        duration: '{{trigger.duration}}',
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [{ nodeKey: 'generate_video' }],
    },
    {
      id: '3',
      nodeKey: 'generate_video',
      nodeType: 'ai',
      config: {
        aiType: 'video-generation',
        prompt: '{{analyze_concept}}',
        duration: '{{trigger.duration}}',
        platform: '{{trigger.platform}}',
      },
      inputs: [{ nodeKey: 'analyze_concept' }],
      outputs: [],
    },
  ],
};

/**
 * Template 5: Post Performance Analysis
 *
 * Analyzes historical post performance and generates actionable insights
 * and recommendations for improving engagement.
 *
 * Inputs:
 * - postId: ID of the post to analyze
 * - platform: Platform the post was published on
 *
 * Outputs:
 * - insights: Performance insights and patterns
 * - recommendations: Actionable recommendations
 * - optimalTimes: Best posting times for future content
 */
export const POST_ANALYSIS_WORKFLOW: WorkflowDefinition = {
  id: 'post-analysis',
  name: 'Post Performance Analysis',
  maxCostPerRun: 0.03,
  timeoutSeconds: 60,
  retryOnFailure: true,
  maxRetries: 2,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'fetch_post_data' }],
    },
    {
      id: '2',
      nodeKey: 'fetch_post_data',
      nodeType: 'action',
      config: {
        actionType: 'webhook',
        url: '/api/analytics/post/{{trigger.postId}}',
        method: 'GET',
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [{ nodeKey: 'analyze_performance' }],
    },
    {
      id: '3',
      nodeKey: 'analyze_performance',
      nodeType: 'claude-agent',
      config: {
        agentName: 'analytics-agent',
        operation: 'analyze-performance',
        postData: '{{fetch_post_data}}',
        platform: '{{trigger.platform}}',
      },
      inputs: [{ nodeKey: 'fetch_post_data' }],
      outputs: [],
    },
  ],
};

/**
 * Template 6: Scheduled Content Publishing
 *
 * Complete workflow for scheduling posts across platforms with
 * auto-optimized content and images.
 *
 * Inputs:
 * - content: Post content
 * - platforms: Target platforms
 * - scheduledTime: ISO datetime string
 *
 * Outputs:
 * - scheduledPosts: Array of scheduled post IDs
 */
export const SCHEDULED_PUBLISHING_WORKFLOW: WorkflowDefinition = {
  id: 'scheduled-publishing',
  name: 'Scheduled Content Publishing',
  maxCostPerRun: 0.30,
  timeoutSeconds: 180,
  retryOnFailure: true,
  maxRetries: 2,
  nodes: [
    {
      id: '1',
      nodeKey: 'trigger',
      nodeType: 'trigger',
      config: {
        triggerType: 'manual',
      },
      inputs: [],
      outputs: [{ nodeKey: 'optimize_content' }],
    },
    {
      id: '2',
      nodeKey: 'optimize_content',
      nodeType: 'claude-agent',
      config: {
        agentName: 'content-optimizer',
        operation: 'generate-variations',
        baseContent: '{{trigger.content}}',
        platforms: '{{trigger.platforms}}',
        includeHashtags: true,
      },
      inputs: [{ nodeKey: 'trigger' }],
      outputs: [{ nodeKey: 'generate_images' }],
    },
    {
      id: '3',
      nodeKey: 'generate_images',
      nodeType: 'transform',
      config: {
        transformType: 'map',
        template: {
          platform: '{{item}}',
          content: '{{optimize_content[item]}}',
        },
      },
      inputs: [{ nodeKey: 'optimize_content' }],
      outputs: [{ nodeKey: 'schedule_posts' }],
    },
    {
      id: '4',
      nodeKey: 'schedule_posts',
      nodeType: 'action',
      config: {
        actionType: 'webhook',
        url: '/api/posts/schedule',
        method: 'POST',
      },
      inputs: [{ nodeKey: 'generate_images' }],
      outputs: [],
    },
  ],
};

/**
 * All available workflow templates
 */
export const WORKFLOW_TEMPLATES = {
  'auto-image-generation': AUTO_IMAGE_GENERATION_WORKFLOW,
  'multi-platform-optimization': MULTI_PLATFORM_OPTIMIZATION_WORKFLOW,
  'complete-content-pipeline': COMPLETE_CONTENT_PIPELINE_WORKFLOW,
  'video-content-creation': VIDEO_CONTENT_CREATION_WORKFLOW,
  'post-analysis': POST_ANALYSIS_WORKFLOW,
  'scheduled-publishing': SCHEDULED_PUBLISHING_WORKFLOW,
};

/**
 * Get a workflow template by ID
 */
export function getWorkflowTemplate(templateId: string): WorkflowDefinition | undefined {
  return WORKFLOW_TEMPLATES[templateId as keyof typeof WORKFLOW_TEMPLATES];
}

/**
 * Get all workflow template metadata
 */
export function getAllTemplates() {
  return Object.entries(WORKFLOW_TEMPLATES).map(([id, workflow]) => ({
    id,
    name: workflow.name,
    maxCost: workflow.maxCostPerRun,
    timeout: workflow.timeoutSeconds,
    nodeCount: workflow.nodes.length,
  }));
}
