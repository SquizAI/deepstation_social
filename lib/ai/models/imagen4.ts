/**
 * Imagen 4 - Google's Latest Image Generation Model
 * October 2025 - Best quality text-to-image generation
 * Pricing: $0.04 per image
 */

export interface Imagen4Options {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  numberOfImages?: number; // 1-8
  outputFormat?: 'jpeg' | 'png' | 'webp';
  safetySettings?: 'strict' | 'moderate' | 'permissive';
  seed?: number; // For reproducible results
  stylePreset?: 'photorealistic' | 'artistic' | 'digital-art' | 'anime' | 'none';
}

export interface Imagen4Result {
  images: Array<{
    url: string;
    base64?: string;
    width: number;
    height: number;
    seed: number;
  }>;
  prompt: string;
  revisedPrompt?: string;
  cost: number;
  generationTime: number;
  safetyRatings: {
    adult: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    violence: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  };
}

export interface Imagen4EditOptions {
  imageUrl: string;
  mask?: string; // Base64 mask for inpainting
  prompt: string;
  editMode?: 'inpaint' | 'outpaint' | 'product-image' | 'edit';
}

/**
 * Imagen 4 Service
 * Google's best image generation model with improved text rendering
 */
export class Imagen4Service {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';
  }

  /**
   * Generate images from text prompt
   * Best for: Social media graphics, marketing materials, product mockups
   */
  async generateImage(options: Imagen4Options): Promise<Imagen4Result> {
    const startTime = Date.now();
    const numberOfImages = options.numberOfImages || 1;

    if (numberOfImages < 1 || numberOfImages > 8) {
      throw new Error('numberOfImages must be between 1 and 8');
    }

    // Calculate dimensions based on aspect ratio
    const dimensions = this.getDimensions(options.aspectRatio || '1:1');

    try {
      // Call Google Imagen 4 API
      const response = await fetch(
        `${this.baseUrl}/models/imagen-004:predict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            instances: [
              {
                prompt: options.prompt,
                negative_prompt: options.negativePrompt,
                aspect_ratio: options.aspectRatio,
                number_of_images: numberOfImages,
                safety_filter_level: options.safetySettings || 'moderate',
                person_generation: 'allow_adult',
                seed: options.seed,
                style_preset: options.stylePreset,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Imagen 4 API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;
      const cost = numberOfImages * 0.04;

      return {
        images: data.predictions.map((pred: any, index: number) => ({
          url: pred.image_url || pred.bytesBase64AsImage,
          base64: pred.bytesBase64AsImage,
          width: dimensions.width,
          height: dimensions.height,
          seed: pred.seed || options.seed || Math.floor(Math.random() * 1000000),
        })),
        prompt: options.prompt,
        revisedPrompt: data.predictions[0]?.revised_prompt,
        cost,
        generationTime,
        safetyRatings: {
          adult: data.predictions[0]?.safety_ratings?.adult || 'VERY_UNLIKELY',
          violence: data.predictions[0]?.safety_ratings?.violence || 'VERY_UNLIKELY',
        },
      };
    } catch (error) {
      console.error('Imagen 4 generation error:', error);
      throw error;
    }
  }

  /**
   * Edit existing image with AI
   * Best for: Product photography, background changes, object removal
   */
  async editImage(options: Imagen4EditOptions): Promise<Imagen4Result> {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${this.baseUrl}/models/imagen-004:edit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            instances: [
              {
                image_url: options.imageUrl,
                mask: options.mask,
                prompt: options.prompt,
                edit_mode: options.editMode || 'edit',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Imagen 4 edit error: ${response.statusText}`);
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        images: data.predictions.map((pred: any) => ({
          url: pred.image_url,
          base64: pred.bytesBase64AsImage,
          width: pred.width || 1024,
          height: pred.height || 1024,
          seed: pred.seed || 0,
        })),
        prompt: options.prompt,
        cost: 0.04,
        generationTime,
        safetyRatings: {
          adult: 'VERY_UNLIKELY',
          violence: 'VERY_UNLIKELY',
        },
      };
    } catch (error) {
      console.error('Imagen 4 edit error:', error);
      throw error;
    }
  }

  /**
   * Generate social media graphics
   * Optimized presets for different platforms
   */
  async generateSocialGraphic(options: {
    platform: 'linkedin' | 'instagram-post' | 'instagram-story' | 'x' | 'facebook';
    prompt: string;
    style?: string;
  }): Promise<Imagen4Result> {
    const platformSpecs = {
      'linkedin': { aspectRatio: '1200:627' as const, description: 'Professional networking' },
      'instagram-post': { aspectRatio: '1:1' as const, description: 'Square Instagram post' },
      'instagram-story': { aspectRatio: '9:16' as const, description: 'Vertical Instagram story' },
      'x': { aspectRatio: '16:9' as const, description: 'Twitter/X post' },
      'facebook': { aspectRatio: '1200:630' as const, description: 'Facebook post' },
    };

    const spec = platformSpecs[options.platform];

    // Map custom aspect ratios to supported ones
    const aspectRatioMap: Record<string, '1:1' | '16:9' | '9:16' | '4:3' | '3:4'> = {
      '1200:627': '16:9',
      '1200:630': '16:9',
      '1:1': '1:1',
      '9:16': '9:16',
      '16:9': '16:9',
    };

    const enhancedPrompt = `${options.prompt}.
    Professional ${spec.description} graphic.
    ${options.style || 'Modern, clean, eye-catching design.'}
    High quality, vibrant colors, social media optimized.`;

    return this.generateImage({
      prompt: enhancedPrompt,
      aspectRatio: aspectRatioMap[spec.aspectRatio],
      numberOfImages: 1,
      stylePreset: 'digital-art',
      safetySettings: 'moderate',
    });
  }

  /**
   * Generate product mockup
   * Perfect for e-commerce and product launches
   */
  async generateProductMockup(options: {
    productDescription: string;
    background?: 'white' | 'gradient' | 'lifestyle' | 'studio';
    angle?: 'front' | 'side' | 'top' | 'angled';
  }): Promise<Imagen4Result> {
    const backgrounds = {
      white: 'clean white background with soft shadows',
      gradient: 'modern gradient background with professional lighting',
      lifestyle: 'lifestyle scene with natural context',
      studio: 'professional studio setup with dramatic lighting',
    };

    const angles = {
      front: 'straight-on front view',
      side: 'side profile view',
      top: 'top-down view',
      angled: '3/4 angle view',
    };

    const prompt = `Professional product photography of ${options.productDescription}.
    ${angles[options.angle || 'angled']}.
    ${backgrounds[options.background || 'white']}.
    High-resolution commercial product photo, professional lighting, 4K quality.`;

    return this.generateImage({
      prompt,
      aspectRatio: '1:1',
      numberOfImages: 1,
      stylePreset: 'photorealistic',
      safetySettings: 'permissive',
    });
  }

  /**
   * Batch generate variations
   * Generate multiple versions with different styles
   */
  async generateVariations(
    prompt: string,
    numberOfVariations: number = 4
  ): Promise<Imagen4Result> {
    return this.generateImage({
      prompt,
      aspectRatio: '1:1',
      numberOfImages: Math.min(numberOfVariations, 8),
      stylePreset: 'none',
    });
  }

  /**
   * Get image dimensions for aspect ratio
   */
  private getDimensions(aspectRatio: string): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '4:3': { width: 1152, height: 896 },
      '3:4': { width: 896, height: 1152 },
    };

    return ratios[aspectRatio] || ratios['1:1'];
  }

  /**
   * Estimate generation time based on complexity
   */
  estimateGenerationTime(numberOfImages: number): number {
    return numberOfImages * 6000; // ~6 seconds per image
  }
}

// Export singleton instance
export const imagen4Service = new Imagen4Service();
