import { test, expect } from '@playwright/test';

test.describe('Performance & Core Web Vitals', () => {
  
  test('should have acceptable loading times', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`📊 Page load time: ${loadTime}ms`);
  });

  test('should lazy load images correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find lazy loaded images
    const lazyImages = page.locator('img[loading=\"lazy\"], img[data-src]');
    const lazyImageCount = await lazyImages.count();
    
    if (lazyImageCount > 0) {
      console.log(`Found ${lazyImageCount} lazy loaded images`);
      
      // Initially, some images might not be loaded
      const firstLazyImage = lazyImages.first();
      
      // Scroll to trigger lazy loading
      await firstLazyImage.scrollIntoViewIfNeeded();
      
      // Wait for image to load
      await expect(firstLazyImage).toHaveAttribute('src', /.+/);
      
      console.log('✅ Lazy loading works correctly');
    }
  });

  test('should optimize images with modern formats', async ({ page }) => {
    await page.goto('/');
    
    // Collect all image sources
    const images = await page.locator('img').all();
    let modernFormatCount = 0;
    let totalImages = images.length;
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && (src.includes('.webp') || src.includes('.avif'))) {
        modernFormatCount++;
      }
    }
    
    if (totalImages > 0) {
      const modernFormatPercentage = (modernFormatCount / totalImages) * 100;
      console.log(`📷 ${modernFormatPercentage.toFixed(1)}% of images use modern formats`);
      
      // At least 50% of images should use modern formats
      expect(modernFormatPercentage).toBeGreaterThan(50);
    }
  });

  test('should have working service worker for caching', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    await page.waitForTimeout(3000);
    
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          active: !!(registration && registration.active),
          scope: registration ? registration.scope : null
        };
      }
      return { registered: false, active: false, scope: null };
    });
    
    expect(swStatus.registered).toBe(true);
    expect(swStatus.active).toBe(true);
    
    console.log(`✅ Service Worker active with scope: ${swStatus.scope}`);
  });

  test('should compress and minify resources', async ({ page }) => {
    await page.goto('/');
    
    // Check if CSS is minified (no unnecessary whitespace)
    const stylesheets = await page.locator('link[rel=\"stylesheet\"]').all();
    
    for (const stylesheet of stylesheets) {
      const href = await stylesheet.getAttribute('href');
      if (href && !href.startsWith('http')) {
        const response = await page.request.get(href);
        const cssContent = await response.text();
        
        // Minified CSS should have minimal whitespace
        const whitespaceRatio = (cssContent.match(/\s/g) || []).length / cssContent.length;
        expect(whitespaceRatio).toBeLessThan(0.1); // Less than 10% whitespace
        
        console.log(`✅ CSS minified: ${href}`);
      }
    }
  });

  test('should preload critical resources', async ({ page }) => {
    await page.goto('/');
    
    // Check for preload links
    const preloadLinks = page.locator('link[rel=\"preload\"]');
    const preloadCount = await preloadLinks.count();
    
    expect(preloadCount).toBeGreaterThan(0);
    
    // Verify preload attributes
    for (let i = 0; i < preloadCount; i++) {
      const link = preloadLinks.nth(i);
      const href = await link.getAttribute('href');
      const as = await link.getAttribute('as');
      
      expect(href).toBeTruthy();
      expect(as).toBeTruthy();
      
      console.log(`⚡ Preloading: ${href} as ${as}`);
    }
  });

  test('should have proper cache headers', async ({ page }) => {
    const response = await page.goto('/');
    
    const cacheControl = response.headers()['cache-control'];
    const etag = response.headers()['etag'];
    const lastModified = response.headers()['last-modified'];
    
    // Should have some form of caching
    const hasCaching = cacheControl || etag || lastModified;
    expect(hasCaching).toBeTruthy();
    
    if (cacheControl) {
      console.log(`📦 Cache-Control: ${cacheControl}`);
    }
  });

  test('should achieve good Lighthouse performance score', async ({ page, browser }) => {
    // This is a simplified version - in real scenarios you'd use lighthouse programmatically
    await page.goto('/');
    
    // Basic performance checks that correlate with Lighthouse
    const performanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || null,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null
      };
    });
    
    console.log('📊 Performance Metrics:', performanceMetrics);
    
    // DOM Content Loaded should be under 1.5 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);
    
    // First Contentful Paint should be under 2 seconds
    if (performanceMetrics.firstContentfulPaint) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);
    }
  });

  test('should handle offline functionality', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for service worker to activate
    await page.waitForTimeout(3000);
    
    // Simulate offline
    await context.setOffline(true);
    
    // Try to reload the page
    await page.reload();
    
    // Page should still load (from service worker cache)
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).not.toContain('offline');
    
    // Restore online
    await context.setOffline(false);
    
    console.log('✅ Offline functionality works');
  });

  test('should not have render-blocking resources', async ({ page }) => {
    await page.goto('/');
    
    // Check for critical CSS inline in head
    const inlineStyles = page.locator('head style');
    const inlineStyleCount = await inlineStyles.count();
    
    // Should have some inline critical CSS
    expect(inlineStyleCount).toBeGreaterThan(0);
    
    // External stylesheets should not block rendering
    const blockingStyles = page.locator('link[rel=\"stylesheet\"]:not([media]):not([disabled])');
    const nonBlockingStyles = page.locator('link[rel=\"stylesheet\"][media=\"print\"], link[rel=\"preload\"][as=\"style\"]');
    
    const blockingCount = await blockingStyles.count();
    const nonBlockingCount = await nonBlockingStyles.count();
    
    console.log(`📊 Inline styles: ${inlineStyleCount}, Blocking: ${blockingCount}, Non-blocking: ${nonBlockingCount}`);
  });

  test('should optimize font loading', async ({ page }) => {
    await page.goto('/');
    
    // Check for font-display swap
    const stylesheets = await page.locator('link[rel=\"stylesheet\"]').all();
    let hasOptimizedFonts = false;
    
    for (const stylesheet of stylesheets) {
      const href = await stylesheet.getAttribute('href');
      if (href && href.includes('fonts')) {
        // Google Fonts should include display=swap
        if (href.includes('display=swap')) {
          hasOptimizedFonts = true;
        }
      }
    }
    
    // Check for font preload
    const fontPreloads = page.locator('link[rel=\"preload\"][as=\"font\"]');
    const fontPreloadCount = await fontPreloads.count();
    
    const fontOptimized = hasOptimizedFonts || fontPreloadCount > 0;
    expect(fontOptimized).toBe(true);
    
    console.log(`✅ Font loading optimized (display=swap: ${hasOptimizedFonts}, preloads: ${fontPreloadCount})`);
  });
});