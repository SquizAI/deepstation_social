/**
 * Claude Agent SDK Integration for DeepStation Workflows
 *
 * This module integrates the @anthropic-ai/claude-agent-sdk into the workflow
 * execution engine, allowing workflows to invoke specialized AI agents.
 */

import Anthropic from '@anthropic-ai/sdk';

// Agent definitions that can be invoked from workflows
export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Result from agent execution
export interface AgentExecutionResult {
  success: boolean;
  output: any;
  cost: number;
  tokens: {
    input: number;
    output: number;
  };
  model: string;
  error?: string;
}

// Available agents in DeepStation
export const DEEPSTATION_AGENTS: Record<string, AgentDefinition> = {
  'content-optimizer': {
    name: 'content-optimizer',
    description: 'AI-powered content optimization for social media platforms',
    systemPrompt: `You are a social media content optimization expert.

Your role:
- Generate platform-specific content variations (LinkedIn, Instagram, X, Discord)
- Optimize tone, length, hashtags, and emojis per platform
- Create engaging CTAs
- Maintain brand consistency

Platform guidelines:
- LinkedIn: Professional (1,200-1,500 chars), 3-5 hashtags, minimal emojis
- Instagram: Visual-first (138-150 chars), 11-15 hashtags, emojis encouraged
- X/Twitter: Concise (71-100 chars), 1-2 hashtags, strategic emojis
- Discord: Community-focused, no hashtags, emojis for personality

Always output valid JSON when requested.`,
    tools: [],
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.7,
    maxTokens: 2000,
  },

  'image-workflow-agent': {
    name: 'image-workflow-agent',
    description: 'Autonomous image generation and optimization workflow',
    systemPrompt: `You are an AI image generation specialist for social media.

Your responsibilities:
1. Analyze post content to understand theme and tone
2. Generate optimal image prompts for AI image generation
3. Select appropriate model (Imagen 4 vs Gemini Flash) based on platform and budget
4. Recommend platform-specific optimizations

Platform image specs:
- LinkedIn: 1200x1200, professional aesthetic, JPEG
- Instagram: 1080x1080, vibrant colors, JPEG only
- X/Twitter: 1200x675, news-worthy, JPEG
- Discord: 1280x720, casual, PNG or JPEG

Cost awareness:
- Imagen 4: $0.04/image (best quality)
- Gemini Flash: $0.02/image (fast, good quality)

Always prioritize user engagement and platform best practices.`,
    tools: [],
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.8,
    maxTokens: 1500,
  },

  'video-content-agent': {
    name: 'video-content-agent',
    description: 'AI video generation specialist using Veo 3',
    systemPrompt: `You are a video content generation expert specializing in Veo 3.

Your role:
- Analyze content and recommend video concepts
- Generate detailed video prompts for Veo 3
- Optimize for platform requirements (TikTok, Reels, Shorts)
- Balance duration vs cost ($0.35/second)

Platform presets:
- TikTok: 8 seconds, 9:16, 1080p
- Instagram Reels: 7 seconds, 9:16, 1080p
- YouTube Shorts: 8 seconds, 9:16, 1080p
- Discord: 5 seconds, 16:9, 720p

Video prompt best practices:
- Specify camera movement (pan, zoom, static)
- Detail scene composition and lighting
- Include action and timing
- Mention audio needs (music, voiceover, ambient)

Always consider budget constraints and engagement potential.`,
    tools: [],
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.9,
    maxTokens: 1500,
  },

  'analytics-agent': {
    name: 'analytics-agent',
    description: 'Post performance analysis and optimization recommendations',
    systemPrompt: `You are a social media analytics and optimization specialist.

Your expertise:
- Analyze post performance metrics
- Identify engagement patterns
- Recommend optimal posting times
- Suggest A/B testing strategies
- Provide actionable insights

Key metrics to analyze:
- Engagement rate (likes, comments, shares)
- Reach and impressions
- Click-through rate (CTR)
- Audience demographics
- Best performing content types

Your recommendations should be:
- Data-driven
- Platform-specific
- Actionable
- Cost-aware

Always provide concrete next steps for improvement.`,
    tools: [],
    model: 'claude-sonnet-4-5-20250929',
    temperature: 0.5,
    maxTokens: 2000,
  },
};

/**
 * Claude Agent Integration Class
 * Manages agent execution within workflows
 */
export class ClaudeAgentIntegration {
  private anthropic: Anthropic;
  private readonly defaultModel = 'claude-sonnet-4-5-20250929';

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute an agent with given inputs
   */
  async executeAgent(
    agentName: string,
    operation: string,
    inputs: Record<string, any>
  ): Promise<AgentExecutionResult> {
    const agent = DEEPSTATION_AGENTS[agentName];

    if (!agent) {
      return {
        success: false,
        output: null,
        cost: 0,
        tokens: { input: 0, output: 0 },
        model: '',
        error: `Agent "${agentName}" not found`,
      };
    }

    try {
      // Build the user prompt based on operation and inputs
      const userPrompt = this.buildPrompt(agentName, operation, inputs);

      // Execute with Claude
      const response = await this.anthropic.messages.create({
        model: agent.model || this.defaultModel,
        max_tokens: agent.maxTokens || 2000,
        temperature: agent.temperature || 0.7,
        system: agent.systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Calculate cost
      const cost = this.calculateCost(
        response.usage.input_tokens,
        response.usage.output_tokens,
        agent.model || this.defaultModel
      );

      // Extract output
      const output = this.extractOutput(response.content);

      return {
        success: true,
        output,
        cost,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        model: agent.model || this.defaultModel,
      };
    } catch (error) {
      console.error(`Agent execution error (${agentName}):`, error);

      return {
        success: false,
        output: null,
        cost: 0,
        tokens: { input: 0, output: 0 },
        model: agent.model || this.defaultModel,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build prompt for specific agent operation
   */
  private buildPrompt(
    agentName: string,
    operation: string,
    inputs: Record<string, any>
  ): string {
    switch (agentName) {
      case 'content-optimizer':
        return this.buildContentOptimizerPrompt(operation, inputs);

      case 'image-workflow-agent':
        return this.buildImageWorkflowPrompt(operation, inputs);

      case 'video-content-agent':
        return this.buildVideoContentPrompt(operation, inputs);

      case 'analytics-agent':
        return this.buildAnalyticsPrompt(operation, inputs);

      default:
        return JSON.stringify(inputs);
    }
  }

  /**
   * Content Optimizer prompt builder
   */
  private buildContentOptimizerPrompt(
    operation: string,
    inputs: Record<string, any>
  ): string {
    switch (operation) {
      case 'generate-variations':
        return `Generate platform-specific variations of this content.

Base content: ${inputs.baseContent}

Target platforms: ${inputs.platforms?.join(', ') || 'all'}
Include hashtags: ${inputs.includeHashtags !== false}
Tone preference: ${inputs.tone || 'auto-detect'}

Output as JSON:
{
  "linkedin": "...",
  "instagram": "...",
  "twitter": "...",
  "discord": "..."
}`;

      case 'optimize-single':
        return `Optimize this content for ${inputs.platform}:

Content: ${inputs.content}

Requirements:
- Platform: ${inputs.platform}
- Include hashtags: ${inputs.includeHashtags !== false}
- Tone: ${inputs.tone || 'platform-appropriate'}

Output the optimized content only.`;

      case 'generate-image-prompt':
        return `Create an AI image generation prompt for this ${inputs.platform} post:

Post content: ${inputs.postContent}

Requirements:
- Platform: ${inputs.platform}
- Style: ${inputs.style || 'platform-appropriate'}
- Output ONLY the image prompt, nothing else.`;

      default:
        return `Operation: ${operation}\n\nInputs: ${JSON.stringify(inputs, null, 2)}`;
    }
  }

  /**
   * Image Workflow prompt builder
   */
  private buildImageWorkflowPrompt(
    operation: string,
    inputs: Record<string, any>
  ): string {
    switch (operation) {
      case 'auto-generate':
        return `Autonomous image generation workflow for this post:

Post content: ${inputs.postContent}
Platform: ${inputs.platform}
Budget: $${inputs.budget || 0.04}
Quality threshold: ${inputs.qualityThreshold || 8}/10

Execute the 6-phase pipeline:
1. Analyze content
2. Generate optimal prompt
3. Select best model (Imagen 4 or Gemini Flash)
4. Recommend generation parameters
5. Suggest platform optimizations
6. Define quality validation criteria

Output as JSON:
{
  "analysis": { "theme": "...", "tone": "...", "complexity": "..." },
  "prompt": "detailed image prompt...",
  "selectedModel": "imagen-4" or "gemini-2.5-flash-image",
  "aspectRatio": "1:1" or "16:9",
  "optimizations": ["..."],
  "qualityCriteria": ["..."]
}`;

      case 'analyze-image':
        return `Analyze this image for quality and relevance:

Image URL: ${inputs.imageUrl}
Post content: ${inputs.postContent}
Platform: ${inputs.platform}

Evaluate:
1. Relevance to post (0-10)
2. Visual appeal (0-10)
3. Platform appropriateness (0-10)
4. Technical quality (0-10)

Output as JSON:
{
  "scores": { "relevance": 0-10, "appeal": 0-10, "appropriate": 0-10, "quality": 0-10 },
  "overallScore": 0-10,
  "shouldRegenerate": true/false,
  "improvements": ["..."]
}`;

      default:
        return `Operation: ${operation}\n\nInputs: ${JSON.stringify(inputs, null, 2)}`;
    }
  }

  /**
   * Video Content prompt builder
   */
  private buildVideoContentPrompt(
    operation: string,
    inputs: Record<string, any>
  ): string {
    switch (operation) {
      case 'generate-video-prompt':
        return `Create a Veo 3 video generation prompt for ${inputs.platform}:

Post content: ${inputs.postContent}
Duration: ${inputs.duration || 8} seconds
Budget: $${(inputs.duration || 8) * 0.35}

Platform preset: ${inputs.platform}
Resolution: ${inputs.resolution || '1080p'}

Generate detailed video prompt including:
- Scene description
- Camera movement
- Lighting and mood
- Action/motion details
- Audio requirements

Output ONLY the video prompt.`;

      case 'analyze-video-concept':
        return `Analyze this video concept and provide recommendations:

Concept: ${inputs.concept}
Platform: ${inputs.platform}
Max duration: ${inputs.maxDuration || 8} seconds
Budget: $${inputs.budget || 2.8}

Evaluate feasibility and provide:
1. Suitability score (0-10)
2. Estimated cost
3. Recommended duration
4. Platform optimization tips
5. Alternative concepts if score < 7

Output as JSON.`;

      default:
        return `Operation: ${operation}\n\nInputs: ${JSON.stringify(inputs, null, 2)}`;
    }
  }

  /**
   * Analytics prompt builder
   */
  private buildAnalyticsPrompt(
    operation: string,
    inputs: Record<string, any>
  ): string {
    switch (operation) {
      case 'analyze-performance':
        return `Analyze post performance and provide insights:

Post data: ${JSON.stringify(inputs.postData, null, 2)}

Platform: ${inputs.platform}
Time period: ${inputs.period || 'last 7 days'}

Provide:
1. Performance summary
2. Key insights
3. Engagement patterns
4. Optimization recommendations
5. Suggested A/B tests

Output as JSON.`;

      case 'recommend-posting-time':
        return `Recommend optimal posting times:

Historical data: ${JSON.stringify(inputs.historicalData, null, 2)}

Platform: ${inputs.platform}
Target audience: ${inputs.audience || 'auto-detect'}

Provide top 3 posting times with confidence scores.

Output as JSON.`;

      default:
        return `Operation: ${operation}\n\nInputs: ${JSON.stringify(inputs, null, 2)}`;
    }
  }

  /**
   * Extract output from Claude response
   */
  private extractOutput(content: any[]): any {
    const textContent = content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Try to parse as JSON
    try {
      return JSON.parse(textContent);
    } catch {
      // Return as plain text if not JSON
      return textContent;
    }
  }

  /**
   * Calculate cost based on Claude pricing
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    // Claude Sonnet 4.5 pricing (as of 2025)
    // $0.003 per 1K input tokens
    // $0.015 per 1K output tokens

    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;

    return inputCost + outputCost;
  }

  /**
   * Get list of available agents
   */
  getAvailableAgents(): AgentDefinition[] {
    return Object.values(DEEPSTATION_AGENTS);
  }

  /**
   * Get specific agent definition
   */
  getAgent(name: string): AgentDefinition | undefined {
    return DEEPSTATION_AGENTS[name];
  }
}
