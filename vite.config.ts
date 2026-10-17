import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Gestión de Cursos',
        short_name: 'Cursos',
        description: 'Administración de cursos, estudiantes, inscripciones y pagos',
        lang: 'es-PE',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0b0d12',
        theme_color: '#4f46e5',
        categories: ['education', 'business', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Nuevo pago', url: '/pagos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Nueva inscripción', url: '/inscripciones', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Las librerías de exportación (Excel/PDF) se cachean al primer uso, no en la instalación
        globIgnores: ['**/exceljs*.js', '**/jspdf*.js', '**/html2canvas*.js', '**/purify*.js', '**/index.es-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Lecturas REST de Supabase: red primero, caché como respaldo offline
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'assets-diferidos', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'imagenes', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query', 'zustand'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: { port: 5173 },
});
