/**
 * Multi-AI Provider Abstraction for DeepStation
 * Supports OpenAI, Google Gemini, and Anthropic Claude
 */

import OpenAI from 'openai';

export type AIProvider = 'openai' | 'gemini' | 'anthropic';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIGenerationOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * OpenAI Provider
 */
async function generateWithOpenAI(
  messages: AIMessage[],
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const model = options.model || 'gpt-4o';

  const completion = await openai.chat.completions.create({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2000,
  });

  return {
    content: completion.choices[0].message.content || '',
    provider: 'openai',
    model,
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    },
  };
}

/**
 * Google Gemini Provider
 */
async function generateWithGemini(
  messages: AIMessage[],
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const model = options.model || 'gemini-2.0-flash-exp';
  const apiKey = process.env.GEMINI_API_KEY;

  // Build the prompt from messages
  const prompt = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2000,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    content,
    provider: 'gemini',
    model,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Anthropic Claude Provider
 */
async function generateWithAnthropic(
  messages: AIMessage[],
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Extract system message if present
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content || options.systemPrompt,
      messages: conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
  }

  const content = data.content?.[0]?.text || '';

  return {
    content,
    provider: 'anthropic',
    model,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

/**
 * Main AI generation function that routes to the appropriate provider
 */
export async function generateAIContent(
  prompt: string,
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const messages: AIMessage[] = [];

  if (options.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  // Determine provider (default to OpenAI if available, then Gemini, then Anthropic)
  let provider = options.provider;

  if (!provider) {
    if (process.env.OPENAI_API_KEY) {
      provider = 'openai';
    } else if (process.env.GEMINI_API_KEY) {
      provider = 'gemini';
    } else if (process.env.ANTHROPIC_API_KEY) {
      provider = 'anthropic';
    } else {
      throw new Error('No AI provider API key found in environment variables');
    }
  }

  // Route to appropriate provider
  switch (provider) {
    case 'openai':
      return generateWithOpenAI(messages, options);
    case 'gemini':
      return generateWithGemini(messages, options);
    case 'anthropic':
      return generateWithAnthropic(messages, options);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Generate content with automatic fallback to other providers
 */
export async function generateAIContentWithFallback(
  prompt: string,
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const providers: AIProvider[] = ['openai', 'gemini', 'anthropic'];
  const errors: Record<string, Error> = {};

  for (const provider of providers) {
    try {
      return await generateAIContent(prompt, { ...options, provider });
    } catch (error) {
      errors[provider] = error as Error;
      console.warn(`Provider ${provider} failed:`, error);
      // Continue to next provider
    }
  }

  // All providers failed
  throw new Error(
    `All AI providers failed:\n${Object.entries(errors)
      .map(([p, e]) => `${p}: ${e.message}`)
      .join('\n')}`
  );
}

/**
 * Get the best available AI provider based on environment variables
 */
export function getBestAvailableProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'gemini':
      return !!process.env.GEMINI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

/**
 * Get model recommendations for each provider
 */
export const RECOMMENDED_MODELS = {
  openai: {
    fast: 'gpt-4o-mini',
    balanced: 'gpt-4o',
    powerful: 'gpt-4o',
  },
  gemini: {
    fast: 'gemini-1.5-flash',
    balanced: 'gemini-2.0-flash-exp',
    powerful: 'gemini-2.0-flash-thinking-exp-01-21',
  },
  anthropic: {
    fast: 'claude-3-5-haiku-20241022',
    balanced: 'claude-3-5-sonnet-20241022',
    powerful: 'claude-3-7-sonnet-20250219',
  },
} as const;
