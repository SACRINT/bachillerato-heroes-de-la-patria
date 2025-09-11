import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import compress from 'astro-compress';
import { getCdnUrl } from '../../config/cdn.config.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://sacrint.github.io',
  base: '/03-BachilleratoHeroesWeb',
  
  output: 'hybrid', // Permite páginas estáticas + dinámicas
  adapter: node({
    mode: 'standalone'
  }),

  integrations: [
    tailwind({
      applyBaseStyles: false, // Usaremos nuestros estilos base custom
    }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/conocenos',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/oferta-educativa',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/servicios',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/comunidad',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/calendario',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/descargas',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/transparencia',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/normatividad',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/convocatorias',
        'https://sacrint.github.io/03-BachilleratoHeroesWeb/contacto'
      ],
    }),
    partytown({
      config: {
        forward: ['gtag', 'dataLayer.push'],
      },
    }),
    compress({
      CSS: {
        csso: {
          comments: false,
        },
      },
      HTML: {
        removeComments: true,
        collapseWhitespace: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      },
      Image: {
        jpeg: { quality: 85 },
        png: { quality: 85 },
        webp: { quality: 85 },
        avif: { quality: 85 },
      },
      JavaScript: {
        terser: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      },
      SVG: {
        svgo: {
          plugins: [
            {
              name: 'removeViewBox',
              active: false,
            },
          ],
        },
      },
    }),
  ],

  // Optimización de imágenes con CDN
  image: {
    domains: [
      'sacrint.github.io', 
      'images.unsplash.com', 
      'via.placeholder.com',
      'cdn.heroespatria.edu.mx',
      'heroespatria.edu.mx'
    ],
    formats: ['avif', 'webp', 'jpeg'],
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689, // 16384 x 16384
      },
    },
  },

  // Configuración de CDN para assets
  ...(process.env.NODE_ENV === 'production' && {
    assetsPrefix: getCdnUrl()
  }),

  // Configuración de Vite para optimizaciones
  vite: {
    resolve: {
      alias: {
        '@heroes-patria/ui': new URL('./../../packages/ui/src', import.meta.url).pathname,
        '@heroes-patria/config': new URL('./../../packages/config/src', import.meta.url).pathname,
        '@heroes-patria/types': new URL('./../../packages/types/src', import.meta.url).pathname,
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['astro'],
            'ui-components': ['@heroes-patria/ui'],
            'config': ['@heroes-patria/config'],
            'framework': ['astro/runtime/client/idle.js', 'astro/runtime/client/load.js'],
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (extType === 'css') {
              return `assets/styles/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      },
      cssCodeSplit: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
    },
    optimizeDeps: {
      include: [
        'astro > kleur', 
        'astro > yargs-parser', 
        '@heroes-patria/ui', 
        '@heroes-patria/config', 
        '@heroes-patria/types'
      ]
    },
    css: {
      devSourcemap: false,
    },
  },

  // Configuraciones de desarrollo
  server: {
    port: 4321,
    host: true
  },

  // Configuraciones de build
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
    split: true,
  },

  // Configuraciones de SEO y performance
  compressHTML: true,
  scopedStyleStrategy: 'class',

  // Configuraciones experimentales para mejor performance
  experimental: {
    assets: true,
    viewTransitions: true,
    contentCollectionCache: true,
  },

  // Markdown configuration
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      langs: [],
      wrap: true
    }
  },

  // Prefetch configuration
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});