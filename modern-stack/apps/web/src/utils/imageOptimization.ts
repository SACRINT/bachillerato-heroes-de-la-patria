/**
 * Image optimization utilities
 */

// Supported image formats in order of preference
export const SUPPORTED_FORMATS = ['avif', 'webp', 'jpeg', 'png'] as const;
export type ImageFormat = typeof SUPPORTED_FORMATS[number];

// Standard breakpoints for responsive images
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Quality settings for different use cases
export const QUALITY_PRESETS = {
  thumbnail: 60,
  low: 70,
  medium: 80,
  high: 85,
  lossless: 100,
} as const;

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number | keyof typeof QUALITY_PRESETS;
  format?: ImageFormat;
  sizes?: string;
  densities?: number[];
  aspectRatio?: string | number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

/**
 * Generate responsive image widths based on a base width
 */
export function generateResponsiveWidths(baseWidth: number, steps = 5): number[] {
  const widths: number[] = [];
  const stepSize = baseWidth / steps;
  
  for (let i = 1; i <= steps; i++) {
    widths.push(Math.round(stepSize * i));
  }
  
  // Add some common breakpoint widths
  const breakpointWidths = Object.values(BREAKPOINTS).filter(w => w <= baseWidth * 1.5);
  
  // Combine and deduplicate
  const allWidths = [...new Set([...widths, ...breakpointWidths])].sort((a, b) => a - b);
  
  return allWidths;
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(options: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
}): string {
  const {
    mobile = '100vw',
    tablet = '75vw',
    desktop = '50vw',
    default = '33vw'
  } = options;
  
  return [
    `(max-width: ${BREAKPOINTS.sm}px) ${mobile}`,
    `(max-width: ${BREAKPOINTS.lg}px) ${tablet}`,
    `(max-width: ${BREAKPOINTS.xl}px) ${desktop}`,
    default
  ].join(', ');
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(): ImageFormat {
  if (typeof window === 'undefined') return 'webp';
  
  // Check for AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const avifSupport = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    if (avifSupport) return 'avif';
  } catch (e) {
    // AVIF not supported
  }
  
  // Check for WebP support
  try {
    const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    if (webpSupport) return 'webp';
  } catch (e) {
    // WebP not supported
  }
  
  return 'jpeg';
}

/**
 * Calculate image dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  aspectRatio?: string | number
): { width: number; height: number } {
  if (aspectRatio) {
    const ratio = typeof aspectRatio === 'string' 
      ? parseFloat(aspectRatio.split('/')[0]) / parseFloat(aspectRatio.split('/')[1])
      : aspectRatio;
    
    if (targetWidth) {
      return { width: targetWidth, height: Math.round(targetWidth / ratio) };
    }
    if (targetHeight) {
      return { width: Math.round(targetHeight * ratio), height: targetHeight };
    }
  }
  
  const originalRatio = originalWidth / originalHeight;
  
  if (targetWidth && targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  
  if (targetWidth) {
    return { width: targetWidth, height: Math.round(targetWidth / originalRatio) };
  }
  
  if (targetHeight) {
    return { width: Math.round(targetHeight * originalRatio), height: targetHeight };
  }
  
  return { width: originalWidth, height: originalHeight };
}

/**
 * Generate image URL with optimization parameters
 */
export function generateOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 'medium',
    format = 'webp'
  } = options;
  
  // If it's an external URL, return as-is (CDN should handle optimization)
  if (src.startsWith('http') || src.startsWith('//')) {
    return src;
  }
  
  // For local images, construct optimization parameters
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  
  const qualityValue = typeof quality === 'number' ? quality : QUALITY_PRESETS[quality];
  params.set('q', qualityValue.toString());
  params.set('f', format);
  
  return `${src}?${params.toString()}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = generateOptimizedImageUrl(src, options);
  
  if (options.sizes) {
    link.setAttribute('imagesizes', options.sizes);
  }
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        
        if (srcset) {
          img.srcset = srcset;
          img.removeAttribute('data-srcset');
        }
        
        img.classList.remove('lazy');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px 0px'
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Image loading error handler
 */
export function handleImageError(img: HTMLImageElement, fallbackSrc?: string): void {
  img.onerror = () => {
    if (fallbackSrc && img.src !== fallbackSrc) {
      img.src = fallbackSrc;
    } else {
      // Hide broken image or show placeholder
      img.style.display = 'none';
      
      // Create placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder';
      placeholder.innerHTML = '📷';
      placeholder.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f3f4f6;
        color: #9ca3af;
        font-size: 2rem;
        width: ${img.width || 300}px;
        height: ${img.height || 200}px;
        border-radius: 0.5rem;
      `;
      
      img.parentNode?.insertBefore(placeholder, img);
    }
  };
}

/**
 * Initialize image optimization features
 */
export function initImageOptimization(): void {
  if (typeof window === 'undefined') return;
  
  document.addEventListener('DOMContentLoaded', () => {
    // Setup lazy loading
    setupLazyLoading();
    
    // Setup error handling for all images
    document.querySelectorAll('img').forEach(img => {
      handleImageError(img);
    });
    
    // Preload critical images (those marked with priority)
    document.querySelectorAll('img[data-priority="true"]').forEach(img => {
      const htmlImg = img as HTMLImageElement;
      preloadImage(htmlImg.src, {
        width: htmlImg.width || undefined,
        height: htmlImg.height || undefined,
        priority: true
      });
    });
  });
}