module.exports = {
  ci: {
    collect: {
      url: [
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/conocenos',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/oferta-educativa', 
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/servicios',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/comunidad',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/transparencia',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/contacto'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Performance metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        
        // Best practices
        'uses-https': 'error',
        'uses-http2': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        
        // SEO
        'meta-description': 'error',
        'meta-viewport': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'link-text': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-viewport': 'error',
        
        // PWA
        'service-worker': 'warn',
        'offline-start-url': 'warn',
        'is-on-https': 'error',
        'redirects-http': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};