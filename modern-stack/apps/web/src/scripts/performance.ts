/**
 * Performance optimization scripts
 */

// Critical CSS inlining
export function inlineCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  // Function to extract and inline critical CSS
  const criticalStyles = document.createElement('style');
  criticalStyles.textContent = `
    /* Critical CSS - Above the fold styles */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Header styles */
    header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(229, 231, 235, 0.2);
    }
    
    /* Hero section critical styles */
    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    /* Loading states */
    .loading {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .loaded {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Skeleton loaders */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  
  document.head.appendChild(criticalStyles);
}

// Resource hints
export function addResourceHints(): void {
  if (typeof document === 'undefined') return;

  const hints = [
    // DNS prefetch for external domains
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
    { rel: 'dns-prefetch', href: 'https://cdnjs.cloudflare.com' },
    
    // Preconnect for critical external resources
    { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: '' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    
    // Preload critical fonts
    { 
      rel: 'preload', 
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      as: 'style'
    }
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.entries(hint).forEach(([key, value]) => {
      link.setAttribute(key, value as string);
    });
    document.head.appendChild(link);
  });
}

// Service Worker registration
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);
        
        // Update service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, notify user
                showUpdateNotification();
              }
            });
          }
        });
      } catch (registrationError) {
        console.log('SW registration failed: ', registrationError);
      }
    });
  }
}

// Show update notification
function showUpdateNotification(): void {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <p>Nueva versión disponible</p>
      <button onclick="window.location.reload()" class="update-btn">Actualizar</button>
      <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">×</button>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1f2937;
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 9999;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

// Performance monitoring
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Web Vitals tracking
  function trackWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1];
        console.log('LCP:', lcp.startTime);
        // Send to analytics
        gtag?.('event', 'web_vitals', {
          event_category: 'performance',
          event_label: 'LCP',
          value: Math.round(lcp.startTime)
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
          gtag?.('event', 'web_vitals', {
            event_category: 'performance',
            event_label: 'FID',
            value: Math.round(entry.processingStart - entry.startTime)
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (clsValue > 0) {
          console.log('CLS:', clsValue);
          gtag?.('event', 'web_vitals', {
            event_category: 'performance',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000)
          });
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Navigation timing
  function trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            dns_time: navigation.domainLookupEnd - navigation.domainLookupStart,
            connection_time: navigation.connectEnd - navigation.connectStart,
            request_time: navigation.responseStart - navigation.requestStart,
            response_time: navigation.responseEnd - navigation.responseStart,
            dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load_time: navigation.loadEventEnd - navigation.loadEventStart,
            total_time: navigation.loadEventEnd - navigation.navigationStart
          };
          
          console.log('Navigation Metrics:', metrics);
          
          // Send to analytics
          Object.entries(metrics).forEach(([key, value]) => {
            gtag?.('event', 'navigation_timing', {
              event_category: 'performance',
              event_label: key,
              value: Math.round(value)
            });
          });
        }
      }, 1000);
    });
  }

  trackWebVitals();
  trackNavigationTiming();
}

// Lazy loading setup
export function setupLazyLoading(): void {
  if (typeof window === 'undefined') return;

  // Intersection Observer for lazy loading
  const lazyImageObserver = new IntersectionObserver((entries) => {
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
        lazyImageObserver.unobserve(img);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px 0px'
  });

  // Observe lazy images
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[data-src], img.lazy').forEach(img => {
      lazyImageObserver.observe(img);
    });
  });
}

// Font loading optimization
export function optimizeFontLoading(): void {
  if (typeof document === 'undefined') return;

  // Use font-display: swap for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Inter';
      font-display: swap;
      src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
    }
  `;
  document.head.appendChild(style);
}

// Preload critical resources
export function preloadCriticalResources(): void {
  if (typeof document === 'undefined') return;

  const criticalResources = [
    { href: '/assets/css/critical.css', as: 'style' },
    { href: '/assets/js/main.js', as: 'script' },
    { href: '/images/hero-bg.webp', as: 'image' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    document.head.appendChild(link);
  });
}

// Initialize all performance optimizations
export function initPerformanceOptimizations(): void {
  // Critical CSS inlining (runs immediately)
  inlineCriticalCSS();
  
  // Add resource hints
  addResourceHints();
  
  // Register service worker
  registerServiceWorker();
  
  // Initialize performance monitoring
  initPerformanceMonitoring();
  
  // Setup lazy loading
  setupLazyLoading();
  
  // Optimize font loading
  optimizeFontLoading();
  
  // Preload critical resources
  preloadCriticalResources();
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
  } else {
    initPerformanceOptimizations();
  }
}

// Global types for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export {};