/**
 * Example: Integrating Workflow Settings with Workflow Nodes
 *
 * This file demonstrates how to use the workflow settings in actual workflow nodes.
 * Copy these patterns into your workflow node implementations.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  loadWorkflowSettings,
  getAIModelConfig,
  getPlatformDefaults,
  buildAIPromptWithPreferences,
  filterProhibitedWords,
  requiresApproval,
  shouldModerateContent,
  getBrandVoice,
  getEmojiGuideline,
  getContentLengthGuideline,
} from '@/lib/workflow-settings';

/**
 * Example 1: Text Generation Node
 *
 * This node uses AI model settings, brand voice, and content preferences
 * to generate customized text content.
 */
export function TextGenerationNodeExample() {
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async (topic: string) => {
    setIsGenerating(true);

    try {
      // Get AI model configuration from settings
      const aiConfig = getAIModelConfig('text');

      // Build base prompt
      const basePrompt = `Generate a social media post about: ${topic}`;

      // Enhance prompt with user preferences (brand voice, emoji usage, length, etc.)
      const enhancedPrompt = buildAIPromptWithPreferences(basePrompt);

      // Make API call with settings-based configuration
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiConfig.model,
          prompt: enhancedPrompt,
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens,
          top_p: aiConfig.topP,
        }),
      });

      const data = await response.json();
      let text = data.text;

      // Filter prohibited words
      const filtered = filterProhibitedWords(text);
      if (filtered.violations.length > 0) {
        console.warn('Prohibited words found:', filtered.violations);
        text = filtered.clean;
      }

      // Check if moderation is required
      if (shouldModerateContent()) {
        const moderationResult = await moderateContent(text);
        if (!moderationResult.safe) {
          throw new Error('Content failed moderation check');
        }
      }

      setGeneratedText(text);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Text Generation Node</h3>
      <button
        onClick={() => generateContent('artificial intelligence')}
        disabled={isGenerating}
        className="px-4 py-2 bg-fuchsia-500 text-white rounded hover:bg-fuchsia-600"
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>
      {generatedText && (
        <div className="mt-4 p-3 bg-white/10 rounded text-white text-sm">
          {generatedText}
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Platform Selector Node
 *
 * This node uses platform defaults to pre-select posting platforms.
 */
export function PlatformSelectorNodeExample() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    // Load default platforms from settings
    const platformDefaults = getPlatformDefaults();
    setSelectedPlatforms(platformDefaults.defaultPlatforms);
  }, []);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-600' },
    { id: 'twitter', name: 'X (Twitter)', color: 'bg-sky-500' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-600' },
    { id: 'discord', name: 'Discord', color: 'bg-indigo-600' },
  ];

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Platform Selector</h3>
      <div className="space-y-2">
        {platforms.map(platform => (
          <label key={platform.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
              className="w-4 h-4"
            />
            <span className={`px-2 py-1 rounded text-white text-sm ${platform.color}`}>
              {platform.name}
            </span>
          </label>
        ))}
      </div>
      <p className="text-slate-400 text-xs mt-3">
        Defaults loaded from settings
      </p>
    </div>
  );
}

/**
 * Example 3: Publish Node with Approval Check
 *
 * This node checks if approval is required before publishing.
 */
export function PublishNodeExample() {
  const [status, setStatus] = useState<'idle' | 'pending' | 'published'>('idle');

  const handlePublish = async (content: string) => {
    // Check if approval is required
    if (requiresApproval()) {
      // Send to approval queue
      await sendToApprovalQueue(content);
      setStatus('pending');
    } else {
      // Publish immediately
      await publishImmediately(content);
      setStatus('published');
    }
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Publish Node</h3>
      <button
        onClick={() => handlePublish('Sample content')}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Publish Post
      </button>
      {status === 'pending' && (
        <div className="mt-3 text-yellow-400 text-sm">
          Sent to approval queue (approval required in settings)
        </div>
      )}
      {status === 'published' && (
        <div className="mt-3 text-green-400 text-sm">
          Published successfully!
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Settings Preview Component
 *
 * Shows current settings in a node or sidebar.
 */
export function SettingsPreviewExample() {
  const [settings, setSettings] = useState(loadWorkflowSettings());

  useEffect(() => {
    // Reload settings when they change
    const handleStorageChange = () => {
      setSettings(loadWorkflowSettings());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <h3 className="text-white font-semibold mb-3">Current Settings</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Text Model:</span>
          <span className="text-white">{settings.ai.textModel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Temperature:</span>
          <span className="text-white">{settings.ai.temperature}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Default Platforms:</span>
          <span className="text-white">{settings.platforms.defaultPlatforms.join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Approval Required:</span>
          <span className={settings.security.requireApproval ? 'text-yellow-400' : 'text-green-400'}>
            {settings.security.requireApproval ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 5: Content Guidelines Helper
 *
 * Displays active content guidelines to help users understand settings.
 */
export function ContentGuidelinesExample() {
  const brandVoice = getBrandVoice();
  const emojiGuideline = getEmojiGuideline();
  const lengthGuideline = getContentLengthGuideline();

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-fuchsia-500/30">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Content Guidelines
      </h3>
      <div className="space-y-3 text-sm">
        {brandVoice && (
          <div>
            <label className="text-slate-400 text-xs">Brand Voice:</label>
            <p className="text-white mt-1">{brandVoice}</p>
          </div>
        )}
        <div>
          <label className="text-slate-400 text-xs">Emoji Usage:</label>
          <p className="text-white mt-1">{emojiGuideline}</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs">Content Length:</label>
          <p className="text-white mt-1">{lengthGuideline}</p>
        </div>
      </div>
      <Link
        href="/dashboard/workflows/settings"
        className="mt-4 block text-fuchsia-400 hover:text-fuchsia-300 text-sm"
      >
        Edit Settings →
      </Link>
    </div>
  );
}

// Helper functions used in examples

async function moderateContent(text: string) {
  // Placeholder for content moderation API call
  return { safe: true };
}

async function sendToApprovalQueue(content: string) {
  // Placeholder for approval queue logic
  console.log('Sent to approval:', content);
}

async function publishImmediately(content: string) {
  // Placeholder for immediate publishing
  console.log('Published:', content);
}

/**
 * Example 6: Complete Workflow Node with Settings Integration
 *
 * A fully-featured workflow node that uses multiple settings.
 */
export function CompleteWorkflowNodeExample() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeNode = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Get AI configuration
      const aiConfig = getAIModelConfig('text');

      // 2. Build enhanced prompt with preferences
      const enhancedPrompt = buildAIPromptWithPreferences(input);

      // 3. Generate content
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: aiConfig.model,
          prompt: enhancedPrompt,
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens,
        }),
      });

      let content = await response.text();

      // 4. Filter prohibited words
      const filtered = filterProhibitedWords(content);
      if (filtered.violations.length > 0) {
        console.warn('Filtered words:', filtered.violations);
        content = filtered.clean;
      }

      // 5. Check moderation if enabled
      if (shouldModerateContent()) {
        const modResult = await moderateContent(content);
        if (!modResult.safe) {
          throw new Error('Content failed moderation');
        }
      }

      // 6. Check approval requirements
      if (requiresApproval()) {
        await sendToApprovalQueue(content);
        setOutput('Content sent for approval');
      } else {
        setOutput(content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-[#201033] to-[#15092b] border border-white/10 rounded-xl">
      <h3 className="text-white font-bold text-lg mb-4">AI Content Generator</h3>

      <div className="space-y-4">
        <div>
          <label className="text-white text-sm mb-2 block">Input Prompt</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your prompt..."
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white placeholder:text-slate-500"
            rows={3}
          />
        </div>

        <button
          onClick={executeNode}
          disabled={loading || !input}
          className="w-full px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {output && (
          <div>
            <label className="text-white text-sm mb-2 block">Generated Output</label>
            <div className="p-3 bg-white/5 border border-white/20 rounded text-white text-sm whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-slate-400 text-xs">
          Using settings: {getAIModelConfig('text').model} @ {getAIModelConfig('text').temperature} temp
        </p>
      </div>
    </div>
  );
}
