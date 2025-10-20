// import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
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
    chunkSizeWarningLimit: 2000
  }
})
