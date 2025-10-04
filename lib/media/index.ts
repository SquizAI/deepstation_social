/**
 * Media Module Entry Point
 * Exports all media optimization functionality
 */

export {
  optimizeImageForPlatform,
  convertToJPEG,
  resizeImage,
  compressImage,
  validateImageForPlatform,
  optimizeForAllPlatforms,
} from './optimizer';

export type {
  ImageOptimizationOptions,
  OptimizedImage,
} from '../types/publishing';
