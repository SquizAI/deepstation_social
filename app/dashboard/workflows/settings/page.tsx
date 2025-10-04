'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface WorkflowSettings {
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

const defaultSettings: WorkflowSettings = {
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

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <div className="bg-gradient-to-r from-[#201033] to-[#15092b] border border-white/10 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-white font-bold text-lg">{title}</h2>
        {description && (
          <p className="text-slate-400 text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  tooltip?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, tooltip, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <label className="text-white font-medium text-sm">{label}</label>
          {tooltip && (
            <div className="group relative">
              <svg className="h-4 w-4 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {description && (
          <p className="text-slate-400 text-xs mt-1">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

export default function WorkflowSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<WorkflowSettings>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('workflowSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Warn before leaving with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateSettings = (updates: Partial<WorkflowSettings>) => {
    setSettings({ ...settings, ...updates });
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('workflowSettings', JSON.stringify(settings));
      setHasUnsavedChanges(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const resetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'workflow-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setSettings(imported);
            setHasUnsavedChanges(true);
          } catch (err) {
            alert('Invalid settings file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = settings.platforms.defaultPlatforms.includes(platform)
      ? settings.platforms.defaultPlatforms.filter(p => p !== platform)
      : [...settings.platforms.defaultPlatforms, platform];

    updateSettings({
      platforms: { ...settings.platforms, defaultPlatforms: newPlatforms }
    });
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/workflows')}
                className="text-slate-400 hover:text-white p-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <h1 className="text-4xl font-bold text-white">Workflow Settings</h1>
            </div>
            <p className="text-slate-400 ml-14">
              Configure global defaults for all workflows
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={exportSettings}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </Button>
            <Button
              variant="outline"
              onClick={importSettings}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </Button>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/50 text-green-300 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Settings saved successfully!
          </div>
        )}

        {/* Settings Content */}
        <div className="max-w-5xl space-y-6">
          {/* AI Model Defaults */}
          <SettingsCard
            title="AI Model Defaults"
            description="Configure default AI models for content generation"
          >
            <SettingRow
              label="Text Generation Model"
              description="Used for all text generation nodes"
              tooltip="Choose the AI model for generating post content, captions, and text"
            >
              <select
                value={settings.ai.textModel}
                onChange={(e) => updateSettings({
                  ai: { ...settings.ai, textModel: e.target.value }
                })}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[200px]"
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</option>
                <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="llama-3.1">Llama 3.1</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Image Generation Model"
              description="Used for all image generation nodes"
              tooltip="Choose the AI model for creating images and visual content"
            >
              <select
                value={settings.ai.imageModel}
                onChange={(e) => updateSettings({
                  ai: { ...settings.ai, imageModel: e.target.value }
                })}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[200px]"
              >
                <option value="dall-e-3">DALL-E 3 (OpenAI)</option>
                <option value="dall-e-2">DALL-E 2 (OpenAI)</option>
                <option value="stable-diffusion-xl">Stable Diffusion XL</option>
                <option value="midjourney">Midjourney</option>
                <option value="flux">Flux</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Video Generation Model"
              description="Used for all video generation nodes"
              tooltip="Choose the AI model for creating video content"
            >
              <select
                value={settings.ai.videoModel}
                onChange={(e) => updateSettings({
                  ai: { ...settings.ai, videoModel: e.target.value }
                })}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[200px]"
              >
                <option value="runway">Runway Gen-3</option>
                <option value="pika">Pika 1.5</option>
                <option value="luma">Luma Dream Machine</option>
                <option value="sora">Sora (OpenAI)</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Temperature"
              description={`Controls randomness (${settings.ai.temperature})`}
              tooltip="Higher values (e.g., 0.8) make output more random, lower values (e.g., 0.2) make it more focused"
            >
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.ai.temperature}
                  onChange={(e) => updateSettings({
                    ai: { ...settings.ai, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-32"
                />
                <span className="text-white text-sm w-8">{settings.ai.temperature}</span>
              </div>
            </SettingRow>

            <SettingRow
              label="Max Tokens"
              description="Maximum length of generated text"
              tooltip="Higher values allow longer responses but cost more"
            >
              <Input
                type="number"
                min="100"
                max="8000"
                value={settings.ai.maxTokens}
                onChange={(e) => updateSettings({
                  ai: { ...settings.ai, maxTokens: parseInt(e.target.value) }
                })}
                className="w-32 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>

            <SettingRow
              label="Top P"
              description={`Nucleus sampling (${settings.ai.topP})`}
              tooltip="Controls diversity. 1.0 considers all tokens, lower values make output more focused"
            >
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ai.topP}
                  onChange={(e) => updateSettings({
                    ai: { ...settings.ai, topP: parseFloat(e.target.value) }
                  })}
                  className="w-32"
                />
                <span className="text-white text-sm w-8">{settings.ai.topP}</span>
              </div>
            </SettingRow>
          </SettingsCard>

          {/* Workflow Execution Settings */}
          <SettingsCard
            title="Workflow Execution"
            description="Configure how workflows run and handle errors"
          >
            <SettingRow
              label="Default Timeout"
              description="Maximum execution time in seconds"
              tooltip="Workflows will automatically stop after this duration"
            >
              <Input
                type="number"
                min="30"
                max="600"
                value={settings.execution.timeout}
                onChange={(e) => updateSettings({
                  execution: { ...settings.execution, timeout: parseInt(e.target.value) }
                })}
                className="w-32 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>

            <SettingRow
              label="Retry Attempts"
              description="Number of retries on failure"
              tooltip="How many times to retry failed operations before giving up"
            >
              <Input
                type="number"
                min="0"
                max="10"
                value={settings.execution.retries}
                onChange={(e) => updateSettings({
                  execution: { ...settings.execution, retries: parseInt(e.target.value) }
                })}
                className="w-32 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>

            <SettingRow
              label="Notification Email"
              description="Receive alerts on workflow failures"
              tooltip="Email address to receive error notifications"
            >
              <Input
                type="email"
                placeholder="you@example.com"
                value={settings.execution.notificationEmail}
                onChange={(e) => updateSettings({
                  execution: { ...settings.execution, notificationEmail: e.target.value }
                })}
                className="w-64 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>

            <SettingRow
              label="Concurrent Execution Limit"
              description="Max workflows running simultaneously"
              tooltip="Prevents system overload by limiting parallel executions"
            >
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.execution.concurrentLimit}
                onChange={(e) => updateSettings({
                  execution: { ...settings.execution, concurrentLimit: parseInt(e.target.value) }
                })}
                className="w-32 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>
          </SettingsCard>

          {/* Platform Defaults */}
          <SettingsCard
            title="Platform Defaults"
            description="Configure default posting behavior across platforms"
          >
            <SettingRow
              label="Default Platforms"
              description="Platforms selected by default for new posts"
              tooltip="Choose which platforms to enable by default"
            >
              <div className="flex gap-3">
                <Checkbox
                  checked={settings.platforms.defaultPlatforms.includes('linkedin')}
                  onChange={() => togglePlatform('linkedin')}
                  className="bg-white/5 border-white/20"
                  label=""
                />
                <label className="text-white text-sm cursor-pointer" onClick={() => togglePlatform('linkedin')}>LinkedIn</label>

                <Checkbox
                  checked={settings.platforms.defaultPlatforms.includes('twitter')}
                  onChange={() => togglePlatform('twitter')}
                  className="bg-white/5 border-white/20 ml-4"
                  label=""
                />
                <label className="text-white text-sm cursor-pointer" onClick={() => togglePlatform('twitter')}>X</label>

                <Checkbox
                  checked={settings.platforms.defaultPlatforms.includes('instagram')}
                  onChange={() => togglePlatform('instagram')}
                  className="bg-white/5 border-white/20 ml-4"
                  label=""
                />
                <label className="text-white text-sm cursor-pointer" onClick={() => togglePlatform('instagram')}>Instagram</label>

                <Checkbox
                  checked={settings.platforms.defaultPlatforms.includes('discord')}
                  onChange={() => togglePlatform('discord')}
                  className="bg-white/5 border-white/20 ml-4"
                  label=""
                />
                <label className="text-white text-sm cursor-pointer" onClick={() => togglePlatform('discord')}>Discord</label>
              </div>
            </SettingRow>

            <SettingRow
              label="Default Post Visibility"
              description="Public or private posts by default"
              tooltip="Choose default visibility for new posts"
            >
              <select
                value={settings.platforms.visibility}
                onChange={(e) => updateSettings({
                  platforms: { ...settings.platforms, visibility: e.target.value }
                })}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[150px]"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="connections">Connections Only</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Auto-add Hashtags"
              description="Automatically suggest relevant hashtags"
              tooltip="AI will suggest hashtags based on content"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.platforms.autoHashtags}
                  onChange={(e) => updateSettings({
                    platforms: { ...settings.platforms, autoHashtags: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fuchsia-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
              </label>
            </SettingRow>

            <SettingRow
              label="Auto-schedule Optimal Times"
              description="Let AI pick the best posting times"
              tooltip="AI analyzes engagement patterns to suggest optimal posting times"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.platforms.autoSchedule}
                  onChange={(e) => updateSettings({
                    platforms: { ...settings.platforms, autoSchedule: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fuchsia-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
              </label>
            </SettingRow>
          </SettingsCard>

          {/* Content Preferences */}
          <SettingsCard
            title="Content Preferences"
            description="Define your brand voice and content guidelines"
          >
            <div className="space-y-4">
              <div>
                <label className="text-white font-medium text-sm mb-2 block">Brand Voice Guidelines</label>
                <Textarea
                  value={settings.content.brandVoice}
                  onChange={(e) => updateSettings({
                    content: { ...settings.content, brandVoice: e.target.value }
                  })}
                  placeholder="Describe your brand's tone, style, and voice. E.g., 'Professional but friendly, tech-savvy, innovative...'"
                  rows={4}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                />
              </div>

              <SettingRow
                label="Preferred Emoji Usage"
                description="How often to include emojis in content"
                tooltip="Control emoji frequency in generated content"
              >
                <select
                  value={settings.content.emojiUsage}
                  onChange={(e) => updateSettings({
                    content: { ...settings.content, emojiUsage: e.target.value }
                  })}
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[150px]"
                >
                  <option value="never">Never</option>
                  <option value="rarely">Rarely</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="often">Often</option>
                  <option value="always">Always</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Preferred Content Length"
                description="Default length for generated content"
                tooltip="Choose the default length preference for posts"
              >
                <select
                  value={settings.content.contentLength}
                  onChange={(e) => updateSettings({
                    content: { ...settings.content, contentLength: e.target.value }
                  })}
                  className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[150px]"
                >
                  <option value="short">Short (1-2 sentences)</option>
                  <option value="medium">Medium (3-5 sentences)</option>
                  <option value="long">Long (6+ sentences)</option>
                </select>
              </SettingRow>

              <div>
                <label className="text-white font-medium text-sm mb-2 block">Prohibited Words/Phrases</label>
                <p className="text-slate-400 text-xs mb-2">Comma-separated list of words to avoid</p>
                <Input
                  value={settings.content.prohibitedWords.join(', ')}
                  onChange={(e) => updateSettings({
                    content: { ...settings.content, prohibitedWords: e.target.value.split(',').map(w => w.trim()).filter(w => w) }
                  })}
                  placeholder="e.g., spam, clickbait, guaranteed"
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </SettingsCard>

          {/* Security & Privacy */}
          <SettingsCard
            title="Security & Privacy"
            description="Configure security and data handling preferences"
          >
            <SettingRow
              label="Require Approval Before Posting"
              description="Manual review before publishing"
              tooltip="All posts will require manual approval before going live"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireApproval}
                  onChange={(e) => updateSettings({
                    security: { ...settings.security, requireApproval: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fuchsia-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
              </label>
            </SettingRow>

            <SettingRow
              label="Content Moderation Level"
              description="AI-powered content filtering"
              tooltip="Check content for inappropriate or sensitive material"
            >
              <select
                value={settings.security.moderationLevel}
                onChange={(e) => updateSettings({
                  security: { ...settings.security, moderationLevel: e.target.value }
                })}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white min-w-[150px]"
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="strict">Strict</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Data Retention Period"
              description="Days to keep workflow execution logs"
              tooltip="Older logs will be automatically deleted"
            >
              <Input
                type="number"
                min="1"
                max="365"
                value={settings.security.dataRetention}
                onChange={(e) => updateSettings({
                  security: { ...settings.security, dataRetention: parseInt(e.target.value) }
                })}
                className="w-32 bg-white/5 border-white/20 text-white"
              />
            </SettingRow>

            <div>
              <label className="text-white font-medium text-sm mb-2 block">Webhook Security Token</label>
              <p className="text-slate-400 text-xs mb-2">Optional token for webhook authentication</p>
              <Input
                type="password"
                value={settings.security.webhookToken}
                onChange={(e) => updateSettings({
                  security: { ...settings.security, webhookToken: e.target.value }
                })}
                placeholder="Enter security token"
                className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
              />
            </div>
          </SettingsCard>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0513]/95 backdrop-blur-sm border-t border-white/10 p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {hasUnsavedChanges && (
                <span className="text-yellow-400 text-sm flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetDefaults}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isSaving || !hasUnsavedChanges}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
