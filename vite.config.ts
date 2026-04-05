// import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [
    react(),
    nodePolyfills(),
    tsconfigPaths()
    // sentryVitePlugin({
    //   org: 'metromedics',
    //   project: 'javascript-react'
    // })
  ],

  // server: {
  //   proxy: {
  //     '/lms': {
  //       target: 'http://localhost:5050',
  //       changeOrigin: true
  //     },
  //     '/api': {
  //       target: 'http://localhost:5050',
  //       changeOrigin: true
  //     }
  //   }
  // },

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
            id.includes('@react-pdf/renderer') ||
            id.includes('react-pdf-tailwind')
          ) {
            return 'pdf-renderer'
          }
          if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
            return 'react-pdf-viewer'
          }
          if (id.includes('xlsx-populate') || id.includes('/xlsx/')) return 'excel'
          if (id.includes('monaco-editor') || id.includes('@monaco-editor/react')) return 'monaco'
          if (id.includes('recharts') || id.includes('victory')) return 'charts'
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
        }
      }
    }
  }
})
