'use client';

/**
 * Inline AI Image Generator for Post Creation
 * Embedded directly in post editor - no need to navigate away
 * Auto-detects platform and optimizes images accordingly
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InlineImageGeneratorProps {
  platform: 'linkedin' | 'instagram' | 'twitter' | 'discord';
  postContent?: string; // Auto-generate based on post content
  onImageGenerated: (imageUrl: string, imageData: string) => void;
  onClose: () => void;
}

// Platform-specific image specs
const PLATFORM_SPECS = {
  linkedin: {
    aspectRatio: '1:1' as const,
    optimizedFor: 'Professional feed posts',
    width: 1200,
    height: 1200,
  },
  instagram: {
    aspectRatio: '1:1' as const,
    optimizedFor: 'Instagram feed',
    width: 1080,
    height: 1080,
  },
  twitter: {
    aspectRatio: '16:9' as const,
    optimizedFor: 'Twitter timeline',
    width: 1200,
    height: 675,
  },
  discord: {
    aspectRatio: '16:9' as const,
    optimizedFor: 'Discord embed',
    width: 1280,
    height: 720,
  },
};

export function InlineImageGenerator({
  platform,
  postContent,
  onImageGenerated,
  onClose,
}: InlineImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [useAutoPrompt, setUseAutoPrompt] = useState(true);
  const [model, setModel] = useState<'imagen-4' | 'gemini-2.5-flash-image'>('gemini-2.5-flash-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const platformSpec = PLATFORM_SPECS[platform];

  // Auto-generate prompt from post content
  const generatePromptFromContent = async () => {
    if (!postContent) return '';

    setIsGenerating(true);
    try {
      // Use GPT-5 to create image prompt from post content
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          platform,
          purpose: 'social-media-image',
        }),
      });

      const data = await response.json();
      setPrompt(data.prompt);
      return data.prompt;
    } catch (err) {
      console.error('Failed to generate prompt:', err);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    const finalPrompt = useAutoPrompt && postContent
      ? await generatePromptFromContent()
      : prompt;

    if (!finalPrompt.trim()) {
      setError('Please enter a prompt or enable auto-generation');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedImage(null);

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          model,
          aspectRatio: platformSpec.aspectRatio,
          platform,
          numberOfImages: 1,
          stylePreset: platform === 'linkedin' ? 'professional' : 'digital-art',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.images[0].url;
      setGeneratedImage(imageUrl);

      // Fetch image as base64 for inline use
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onImageGenerated(imageUrl, base64data);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Generate Image for {platform}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Optimized for {platformSpec.optimizedFor} • {platformSpec.aspectRatio}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Auto-generate toggle */}
        {postContent && (
          <div className="mb-4 p-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useAutoPrompt}
                onChange={(e) => setUseAutoPrompt(e.target.checked)}
                className="w-4 h-4 accent-fuchsia-500"
              />
              <div>
                <p className="text-white font-medium">Auto-generate from post content</p>
                <p className="text-xs text-slate-400">AI will create the perfect image prompt from your post</p>
              </div>
            </label>
          </div>
        )}

        {/* Manual prompt input */}
        {!useAutoPrompt && (
          <div className="mb-4">
            <Label className="text-slate-300 mb-2 block">Image Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Model selection */}
        <div className="mb-4">
          <Label className="text-slate-300 mb-2 block">AI Model</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModel('gemini-2.5-flash-image')}
              className={`px-4 py-3 rounded-lg border transition-all text-left ${
                model === 'gemini-2.5-flash-image'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white'
                  : 'bg-white/5 border-white/20 text-slate-300 hover:border-white/40'
              }`}
            >
              <div className="font-medium">Gemini Flash</div>
              <div className="text-xs text-slate-400">Faster • $0.02</div>
            </button>
            <button
              onClick={() => setModel('imagen-4')}
              className={`px-4 py-3 rounded-lg border transition-all text-left ${
                model === 'imagen-4'
                  ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white'
                  : 'bg-white/5 border-white/20 text-slate-300 hover:border-white/40'
              }`}
            >
              <div className="font-medium">Imagen 4</div>
              <div className="text-xs text-slate-400">Best Quality • $0.04</div>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Generated image preview */}
        {generatedImage && (
          <div className="mb-4 border border-white/10 rounded-lg overflow-hidden">
            <img src={generatedImage} alt="Generated" className="w-full h-auto" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={generateImage}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : generatedImage ? (
              'Regenerate'
            ) : (
              'Generate Image'
            )}
          </Button>
          {generatedImage && (
            <Button
              onClick={onClose}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Use This Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
