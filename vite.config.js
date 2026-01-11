import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // NO autoUpdate para evitar problemas con sesiones
      includeAssets: ['favicon.svg', 'icons/*.png'],

      manifest: {
        name: 'Mimonotributo',
        short_name: 'Mimonotributo',
        description: 'App de gestión para monotributistas y contadores. Control de facturación, alertas de recategorización y más.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F9FAFB',
        theme_color: '#7C3AED',
        lang: 'es-AR',
        scope: '/',
        categories: ['business', 'finance', 'productivity'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },

      workbox: {
        // Aumentar límite para archivos grandes (bundle principal)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

        // CRÍTICO: Excluir TODAS las rutas de Supabase del cache
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/auth/,
          /supabase/,
        ],

        // NO cachear nada de Supabase
        runtimeCaching: [
          {
            // Assets estáticos (JS, CSS, imágenes) - Cache First
            urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          },
          {
            // Google Fonts - Cache First
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              }
            }
          },
          {
            // CRÍTICO: Supabase API - SIEMPRE Network Only (NUNCA cachear)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-queue',
                options: {
                  maxRetentionTime: 24 * 60 // 24 horas
                }
              }
            }
          },
          {
            // Navegación HTML - Network First con fallback
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 día
              },
              networkTimeoutSeconds: 3
            }
          }
        ],

        // Limpiar caches viejos automáticamente
        cleanupOutdatedCaches: true,

        // NO precachear rutas de navegación para evitar problemas con auth
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Excluir archivos problemáticos del precache
        globIgnores: ['**/node_modules/**', 'sw.js', 'workbox-*.js']
      },

      // Modo desarrollo - DESACTIVADO para evitar problemas de cache con auth
      devOptions: {
        enabled: false
      }
    })
  ],

  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    target: 'es2020',
    chunkSizeWarningLimit: 500,
  },

  server: {
    host: true,
    port: 5173,
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
