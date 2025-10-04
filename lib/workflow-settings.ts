/**
 * Workflow Settings Utility
 *
 * Provides functions to load and apply workflow settings globally across the app.
 * Settings are stored in localStorage and can be used as defaults for workflow nodes.
 */

export interface WorkflowSettings {
  ai: {
    textModel: string;
    imageModel: string;
    videoModel: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  execution: {
    timeout: number;
    retries: number;
    notificationEmail: string;
    concurrentLimit: number;
  };
  platforms: {
    defaultPlatforms: string[];
    visibility: string;
    autoHashtags: boolean;
    autoSchedule: boolean;
  };
  content: {
    brandVoice: string;
    prohibitedWords: string[];
    emojiUsage: string;
    contentLength: string;
  };
  security: {
    requireApproval: boolean;
    moderationLevel: string;
    dataRetention: number;
    webhookToken: string;
  };
}

export const defaultSettings: WorkflowSettings = {
  ai: {
    textModel: 'gpt-4o',
    imageModel: 'dall-e-3',
    videoModel: 'runway',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
  },
  execution: {
    timeout: 120,
    retries: 3,
    notificationEmail: '',
    concurrentLimit: 5,
  },
  platforms: {
    defaultPlatforms: ['linkedin'],
    visibility: 'public',
    autoHashtags: true,
    autoSchedule: false,
  },
  content: {
    brandVoice: '',
    prohibitedWords: [],
    emojiUsage: 'sometimes',
    contentLength: 'medium',
  },
  security: {
    requireApproval: false,
    moderationLevel: 'basic',
    dataRetention: 30,
    webhookToken: '',
  },
};

/**
 * Load workflow settings from localStorage
 */
export function loadWorkflowSettings(): WorkflowSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const saved = localStorage.getItem('workflowSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle any missing keys
      return {
        ai: { ...defaultSettings.ai, ...parsed.ai },
        execution: { ...defaultSettings.execution, ...parsed.execution },
        platforms: { ...defaultSettings.platforms, ...parsed.platforms },
        content: { ...defaultSettings.content, ...parsed.content },
        security: { ...defaultSettings.security, ...parsed.security },
      };
    }
  } catch (e) {
    console.error('Failed to load workflow settings:', e);
  }

  return defaultSettings;
}

/**
 * Save workflow settings to localStorage
 */
export function saveWorkflowSettings(settings: WorkflowSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('workflowSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save workflow settings:', e);
    throw e;
  }
}

/**
 * Get AI model configuration for a specific type
 */
export function getAIModelConfig(type: 'text' | 'image' | 'video') {
  const settings = loadWorkflowSettings();

  switch (type) {
    case 'text':
      return {
        model: settings.ai.textModel,
        temperature: settings.ai.temperature,
        maxTokens: settings.ai.maxTokens,
        topP: settings.ai.topP,
      };
    case 'image':
      return {
        model: settings.ai.imageModel,
      };
    case 'video':
      return {
        model: settings.ai.videoModel,
      };
  }
}

/**
 * Get execution configuration
 */
export function getExecutionConfig() {
  const settings = loadWorkflowSettings();
  return settings.execution;
}

/**
 * Get platform defaults
 */
export function getPlatformDefaults() {
  const settings = loadWorkflowSettings();
  return settings.platforms;
}

/**
 * Get content preferences
 */
export function getContentPreferences() {
  const settings = loadWorkflowSettings();
  return settings.content;
}

/**
 * Get security settings
 */
export function getSecuritySettings() {
  const settings = loadWorkflowSettings();
  return settings.security;
}

/**
 * Check if content should be moderated
 */
export function shouldModerateContent(): boolean {
  const settings = loadWorkflowSettings();
  return settings.security.moderationLevel !== 'none';
}

/**
 * Check if approval is required before posting
 */
export function requiresApproval(): boolean {
  const settings = loadWorkflowSettings();
  return settings.security.requireApproval;
}

/**
 * Get brand voice guidelines
 */
export function getBrandVoice(): string {
  const settings = loadWorkflowSettings();
  return settings.content.brandVoice;
}

/**
 * Check if a word is prohibited
 */
export function isWordProhibited(word: string): boolean {
  const settings = loadWorkflowSettings();
  const lowerWord = word.toLowerCase();
  return settings.content.prohibitedWords.some(
    prohibited => lowerWord.includes(prohibited.toLowerCase())
  );
}

/**
 * Filter prohibited words from text
 */
export function filterProhibitedWords(text: string): { clean: string; violations: string[] } {
  const settings = loadWorkflowSettings();
  let clean = text;
  const violations: string[] = [];

  settings.content.prohibitedWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(clean)) {
      violations.push(word);
      clean = clean.replace(regex, '***');
    }
  });

  return { clean, violations };
}

/**
 * Apply emoji usage preference to text
 */
export function getEmojiGuideline(): string {
  const settings = loadWorkflowSettings();

  switch (settings.content.emojiUsage) {
    case 'never':
      return 'Do not use any emojis in the content.';
    case 'rarely':
      return 'Use emojis sparingly, only when highly relevant.';
    case 'sometimes':
      return 'Use emojis occasionally to enhance the message.';
    case 'often':
      return 'Use emojis frequently to make content engaging.';
    case 'always':
      return 'Use emojis liberally throughout the content.';
    default:
      return 'Use emojis occasionally to enhance the message.';
  }
}

/**
 * Get content length guideline
 */
export function getContentLengthGuideline(): string {
  const settings = loadWorkflowSettings();

  switch (settings.content.contentLength) {
    case 'short':
      return 'Keep content brief and concise (1-2 sentences).';
    case 'medium':
      return 'Provide moderate detail (3-5 sentences).';
    case 'long':
      return 'Create detailed, comprehensive content (6+ sentences).';
    default:
      return 'Provide moderate detail (3-5 sentences).';
  }
}

/**
 * Build AI prompt with user preferences
 */
export function buildAIPromptWithPreferences(basePrompt: string): string {
  const settings = loadWorkflowSettings();

  let enhancedPrompt = basePrompt;

  if (settings.content.brandVoice) {
    enhancedPrompt += `\n\nBrand Voice: ${settings.content.brandVoice}`;
  }

  enhancedPrompt += `\n\n${getEmojiGuideline()}`;
  enhancedPrompt += `\n${getContentLengthGuideline()}`;

  if (settings.content.prohibitedWords.length > 0) {
    enhancedPrompt += `\n\nAvoid using these words: ${settings.content.prohibitedWords.join(', ')}`;
  }

  return enhancedPrompt;
}
