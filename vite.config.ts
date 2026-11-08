import fs from 'node:fs'
import path from 'node:path'
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
  },
  server: {
    host: '0.0.0.0'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false
  },
  plugins: [
    react(),
    nodePolyfills(),
    tsconfigPaths(),
    // PWA instalable: guarda la app (no los datos de la API) para que abra rápido y sobreviva a un corte de señal.
    // Los chunks pesados y de uso raro (editor, PDF, Excel) no se precargan: se guardan solo si se visitan.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Metromedics',
        short_name: 'Metromedics',
        description:
          'Plataforma de Metromedics: servicios de calibración, mantenimiento y laboratorio',
        lang: 'es',
        start_url: '/calibration-services',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#00BFA5',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Mis servicios de calibración',
            url: '/calibration-services',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}', 'icons/*.png'],
        globIgnores: [
          '**/{monaco,pdf-renderer,react-pdf-viewer,excel-populate,excel-utils,minio,victory-vendor,recharts-vendor}-*.js',
          // Módulos de uso de escritorio: se guardan solo si se visitan (runtimeCaching), no pesan en la instalación
          '**/{pdf.worker.min,LaboratoryMonitor,Modules,Iot,quill-custom,index.es,ModernCustomer,ReleaseCertificates,PermissionMatrix,RolesPermissions,CalibrationChamberView,EquipmentSalesWorkspacePage}-*.js',
          '**/{Lms,Maintenance,Purchase}*-*.js',
          'version.json',
          'ayuda/**',
          'videos/**'
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/version\.json/, /^\/api\//],
        runtimeCaching: [
          {
            // Lo que no se precarga (chunks perezosos) se guarda al usarse; el hash del nombre evita servir versiones viejas
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /^\/assets\/.*\.(js|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 24 * 3600 }
            }
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /^\/images\//.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 3600 }
            }
          }
        ]
      }
    }),
    {
      name: 'version-json',
      closeBundle() {
        const version = { timestamp: Date.now() }
        const distDir = path.resolve(__dirname, 'dist')
        if (!fs.existsSync(distDir)) return
        fs.writeFileSync(
          path.join(distDir, 'version.json'),
          JSON.stringify(version)
        )
      }
    }
  ],

  build: {
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('minio')) return 'minio'
          if (
            id.includes('@react-pdf/') ||
            id.includes('@react-pdf/renderer') ||
            id.includes('react-pdf-tailwind')
          ) {
            return 'pdf-renderer'
          }
          if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
            return 'react-pdf-viewer'
          }
          if (id.includes('xlsx-populate')) return 'excel-populate'
          if (id.includes('/xlsx/') || id.includes('\\xlsx\\'))
            return 'excel-utils'
          if (
            id.includes('monaco-editor') ||
            id.includes('@monaco-editor/react')
          )
            return 'monaco'
          if (id.includes('recharts')) return 'recharts-vendor'
          if (id.includes('victory')) return 'victory-vendor'
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            id.includes('/react/')
          )
            return 'react-vendor'
        }
      }
    }
  }
})
