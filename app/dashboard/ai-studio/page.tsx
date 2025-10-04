'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
  seed?: number;
}

interface GeneratedVideo {
  url: string;
  thumbnailUrl: string;
  duration: number;
  resolution: string;
  hasAudio: boolean;
}

type MediaType = 'image' | 'video';

export default function AIStudioPage() {
  const [mediaType, setMediaType] = useState<MediaType>('image');

  // Image generation state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<'imagen-4' | 'gemini-2.5-flash-image'>('imagen-4');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [platform, setPlatform] = useState<string>('');
  const [stylePreset, setStylePreset] = useState<string>('digital-art');

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('1080p');
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoStyle, setVideoStyle] = useState<'cinematic' | 'documentary' | 'animation' | 'realistic'>('cinematic');
  const [withAudio, setWithAudio] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState<number>(0);
  const [generationTime, setGenerationTime] = useState<number>(0);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedImages([]);

      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          model,
          aspectRatio,
          numberOfImages,
          platform: platform || undefined,
          stylePreset,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImages(data.images || []);
      setCost(data.cost || 0);
      setGenerationTime(data.generationTime || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedVideo(null);

      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          resolution: videoResolution,
          duration: videoDuration,
          aspectRatio: videoAspectRatio,
          style: videoStyle,
          withAudio,
          fps: 30,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate video');
      }

      const data = await response.json();
      setGeneratedVideo(data.video);
      setCost(data.cost || 0);
      setGenerationTime(data.generationTime || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#201033] via-[#15092b] to-[#0a0513] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-[float_25s_ease-in-out_infinite_reverse]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Studio</h1>
          <p className="text-slate-400">
            Generate stunning images and videos with Google's latest AI models
          </p>
        </div>

        {/* Media Type Tabs */}
        <div className="mb-6 flex gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2">
          <button
            onClick={() => setMediaType('image')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              mediaType === 'image'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Images</span>
            </div>
          </button>
          <button
            onClick={() => setMediaType('video')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              mediaType === 'video'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-lg shadow-fuchsia-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Videos</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Controls */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">
              {mediaType === 'image' ? 'Generate Images' : 'Generate Videos'}
            </h2>

            {mediaType === 'image' ? (
              <>
                {/* Image Generation Controls */}
                <div>
                  <Label className="text-slate-300 mb-2 block">Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    rows={4}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Negative Prompt (Optional)</Label>
                  <Input
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid in the image..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">AI Model</Label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as 'imagen-4' | 'gemini-2.5-flash-image')}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="imagen-4">Imagen 4 - Best Quality ($0.04/image)</option>
                    <option value="gemini-2.5-flash-image">Gemini 2.5 Flash - Faster ($0.02/image)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Aspect Ratio</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          aspectRatio === ratio
                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                            : 'bg-white/5 border-white/20 text-slate-300 hover:border-white/40'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {model === 'imagen-4' && (
                  <div>
                    <Label className="text-slate-300 mb-2 block">Style Preset</Label>
                    <select
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="photorealistic">Photorealistic</option>
                      <option value="artistic">Artistic</option>
                      <option value="digital-art">Digital Art</option>
                      <option value="anime">Anime</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                )}

                <div>
                  <Label className="text-slate-300 mb-2 block">Platform Preset (Optional)</Label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="">None</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram-post">Instagram Post</option>
                    <option value="instagram-story">Instagram Story</option>
                    <option value="x">X/Twitter</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Number of Images: {numberOfImages}</Label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={numberOfImages}
                    onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Generate Images
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Video Generation Controls */}
                <div className={isGenerating ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Prompt</Label>
                    <Textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Describe the video you want to generate..."
                      rows={4}
                      disabled={isGenerating}
                      className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 mb-2 block">Resolution</Label>
                    <select
                      value={videoResolution}
                      onChange={(e) => setVideoResolution(e.target.value as '720p' | '1080p')}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                    >
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2 block">Duration: {videoDuration}s</Label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Aspect Ratio</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setVideoAspectRatio(ratio)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          videoAspectRatio === ratio
                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                            : 'bg-white/5 border-white/20 text-slate-300 hover:border-white/40'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Video Style</Label>
                  <select
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="documentary">Documentary</option>
                    <option value="animation">Animation</option>
                    <option value="realistic">Realistic</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={withAudio}
                    onChange={(e) => setWithAudio(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5"
                  />
                  <Label className="text-slate-300">Generate with audio</Label>
                </div>

                  <Button
                    onClick={generateVideo}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Generate Video
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-slate-400 text-center">
                    Cost: ${(videoDuration * 0.40).toFixed(2)} • Est. time: {Math.ceil(videoDuration * 4)}s
                    <span className="ml-2 text-fuchsia-400">(with audio)</span>
                  </div>
                </div>
              </>
            )}

            {/* Cost & Time Info */}
            {cost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Cost: ${cost.toFixed(4)}</span>
                <span className="text-slate-400">
                  Time: {(generationTime / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Generated Media Output */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              {mediaType === 'image' ? 'Generated Images' : 'Generated Video'}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 mb-6">
                {error}
              </div>
            )}

            {mediaType === 'image' ? (
              <>
                {/* Images Grid */}
                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {generatedImages.map((image, index) => (
                      <div
                        key={index}
                        className="border border-white/10 rounded-xl overflow-hidden bg-white/5"
                      >
                        <img
                          src={image.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <div className="p-3 text-xs text-slate-400">
                          {image.width} × {image.height}
                          {image.seed && ` • Seed: ${image.seed}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!isGenerating && generatedImages.length === 0 && !error && (
                  <div className="text-center py-12">
                    <svg
                      className="h-16 w-16 mx-auto text-slate-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-slate-400">
                      Generated images will appear here
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Video Loading State */}
                {isGenerating && (
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 p-12">
                    <div className="flex flex-col items-center justify-center">
                      {/* Spinning Video Icon */}
                      <div className="relative mb-6">
                        <svg
                          className="h-20 w-20 text-fuchsia-500 animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <svg className="absolute top-0 left-0 h-20 w-20 animate-spin text-fuchsia-500/30" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Generating Your Video...
                      </h3>
                      <p className="text-slate-400 text-center mb-4">
                        This may take up to 2 minutes. Please be patient while Veo 3 creates your video.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-ping"></div>
                        <span>Processing with Google Veo 3...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Output */}
                {!isGenerating && generatedVideo && (
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                    <video
                      src={generatedVideo.url}
                      poster={generatedVideo.thumbnailUrl}
                      controls
                      className="w-full h-auto"
                    />
                    <div className="p-3 text-xs text-slate-400">
                      {generatedVideo.resolution} • {generatedVideo.duration}s
                      {generatedVideo.hasAudio && ' • With Audio'}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isGenerating && !generatedVideo && !error && (
                  <div className="text-center py-12">
                    <svg
                      className="h-16 w-16 mx-auto text-slate-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-slate-400">
                      Generated video will appear here
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Example Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mediaType === 'image' ? (
              [
                'A futuristic cityscape at sunset with flying cars and neon lights',
                'Professional product photo of a sleek smartwatch on a marble surface',
                'Abstract geometric pattern in vibrant purple and cyan colors',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-left p-4 bg-white/5 border border-white/10 rounded-lg hover:border-fuchsia-500/50 transition-all text-sm text-slate-300"
                >
                  {example}
                </button>
              ))
            ) : (
              [
                'A drone flying over a futuristic city with neon lights at night',
                'Time-lapse of a blooming flower with soft bokeh background',
                'Product showcase: smartphone rotating with dynamic lighting',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setVideoPrompt(example)}
                  className="text-left p-4 bg-white/5 border border-white/10 rounded-lg hover:border-fuchsia-500/50 transition-all text-sm text-slate-300"
                >
                  {example}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
