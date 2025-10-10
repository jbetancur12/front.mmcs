import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
    tsconfigPaths(),
    visualizer({
      open: false, // No abrir automáticamente durante build
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true
    }),
    sentryVitePlugin({
      org: 'metromedics',
      project: 'javascript-react'
    })
  ],

  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },

  // Asegurar que el servidor de desarrollo funcione correctamente
  server: {
    port: 3000,
    open: true
  }
})
