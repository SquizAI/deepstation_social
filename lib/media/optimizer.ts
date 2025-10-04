/**
 * Media Optimization Service
 * Handles platform-specific image optimization, format conversion, and uploads
 */

import { createClient } from '@/lib/supabase/client';
import {
  ImageOptimizationOptions,
  OptimizedImage,
  Platform,
  PLATFORM_CONFIGS,
} from '@/lib/types/publishing';

/**
 * Optimize image for specific platform
 */
export async function optimizeImageForPlatform(
  imageFile: File,
  platform: Platform,
  userId: string
): Promise<OptimizedImage> {
  const config = PLATFORM_CONFIGS[platform];

  // Get platform-specific requirements
  const options: ImageOptimizationOptions = {
    platform,
    maxWidth: getPlatformMaxWidth(platform),
    maxHeight: getPlatformMaxHeight(platform),
    quality: 85,
    format: platform === 'instagram' ? 'jpeg' : undefined,
  };

  // Load image
  const img = await loadImage(imageFile);

  // Check if optimization is needed
  const needsResize = img.width > (options.maxWidth || Infinity) ||
    img.height > (options.maxHeight || Infinity);

  const needsConversion = options.format &&
    !imageFile.type.includes(options.format);

  const needsCompression = imageFile.size > config.maxImageSize;

  if (!needsResize && !needsConversion && !needsCompression) {
    // Upload original file if no optimization needed
    const url = await uploadToStorage(imageFile, userId, platform);
    return {
      url,
      width: img.width,
      height: img.height,
      format: imageFile.type.split('/')[1],
      size: imageFile.size,
    };
  }

  // Optimize image
  const optimized = await processImage(
    img,
    imageFile,
    options
  );

  // Upload optimized image
  const url = await uploadToStorage(optimized.blob, userId, platform);

  return {
    url,
    width: optimized.width,
    height: optimized.height,
    format: optimized.format,
    size: optimized.size,
  };
}

/**
 * Convert PNG to JPEG (required for Instagram)
 */
export async function convertToJPEG(
  imageFile: File
): Promise<File> {
  const img = await loadImage(imageFile);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill white background (for transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image
  ctx.drawImage(img, 0, 0);

  // Convert to JPEG blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert to JPEG'));
      },
      'image/jpeg',
      0.85
    );
  });

  return new File([blob], imageFile.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  });
}

/**
 * Resize image to fit within max dimensions
 */
export async function resizeImage(
  imageFile: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  const img = await loadImage(imageFile);

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // Create canvas with new dimensions
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  const mimeType = imageFile.type || 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to resize image'));
      },
      mimeType,
      0.85
    );
  });

  return new File([blob], imageFile.name, { type: mimeType });
}

/**
 * Compress image to reduce file size
 */
export async function compressImage(
  imageFile: File,
  maxSizeBytes: number,
  quality: number = 0.85
): Promise<File> {
  const img = await loadImage(imageFile);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0);

  // Try different quality levels until size is acceptable
  let currentQuality = quality;
  let blob: Blob | null = null;

  while (currentQuality > 0.1) {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        currentQuality
      );
    });

    if (blob.size <= maxSizeBytes) {
      break;
    }

    currentQuality -= 0.1;
  }

  if (!blob) {
    throw new Error('Failed to compress image');
  }

  return new File([blob], imageFile.name, { type: 'image/jpeg' });
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToStorage(
  file: File | Blob,
  userId: string,
  platform: Platform
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const extension = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${userId}/${platform}/${timestamp}-${randomStr}.${extension}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Load image from File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process image with optimization options
 */
async function processImage(
  img: HTMLImageElement,
  originalFile: File,
  options: ImageOptimizationOptions
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  // Calculate new dimensions
  let width = img.width;
  let height = img.height;

  if (options.maxWidth && width > options.maxWidth) {
    height = Math.floor(height * (options.maxWidth / width));
    width = options.maxWidth;
  }

  if (options.maxHeight && height > options.maxHeight) {
    width = Math.floor(width * (options.maxHeight / height));
    height = options.maxHeight;
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // For JPEG conversion, fill white background
  if (options.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  const format = options.format || 'jpeg';
  const mimeType = `image/${format}`;
  const quality = options.quality || 0.85;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to process image'));
      },
      mimeType,
      quality
    );
  });

  return {
    blob,
    width,
    height,
    format,
    size: blob.size,
  };
}

/**
 * Get platform-specific max width
 */
function getPlatformMaxWidth(platform: Platform): number {
  switch (platform) {
    case 'linkedin':
      return 1200;
    case 'instagram':
      return 1080;
    case 'twitter':
      return 1200;
    case 'discord':
      return 1920;
    default:
      return 1200;
  }
}

/**
 * Get platform-specific max height
 */
function getPlatformMaxHeight(platform: Platform): number {
  switch (platform) {
    case 'linkedin':
      return 1200;
    case 'instagram':
      return 1350;
    case 'twitter':
      return 675;
    case 'discord':
      return 1080;
    default:
      return 1200;
  }
}

/**
 * Validate image meets platform requirements
 */
export function validateImageForPlatform(
  file: File,
  platform: Platform
): { valid: boolean; error?: string } {
  const config = PLATFORM_CONFIGS[platform];

  // Check file size
  if (file.size > config.maxImageSize) {
    return {
      valid: false,
      error: `Image exceeds ${Math.floor(config.maxImageSize / 1024 / 1024)}MB size limit`,
    };
  }

  // Check format
  const fileType = file.type.split('/')[1]?.toLowerCase();
  const isValidFormat = config.imageFormats.some(
    (format) => fileType === format || fileType === format.replace('jpg', 'jpeg')
  );

  if (!isValidFormat) {
    return {
      valid: false,
      error: `Invalid image format. Supported formats: ${config.imageFormats.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get optimized images for all platforms
 */
export async function optimizeForAllPlatforms(
  imageFile: File,
  userId: string,
  platforms: Platform[]
): Promise<Record<Platform, OptimizedImage>> {
  const results: Record<string, OptimizedImage> = {};

  for (const platform of platforms) {
    try {
      const optimized = await optimizeImageForPlatform(
        imageFile,
        platform,
        userId
      );
      results[platform] = optimized;
    } catch (error) {
      console.error(`Failed to optimize for ${platform}:`, error);
    }
  }

  return results as Record<Platform, OptimizedImage>;
}
