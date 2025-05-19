import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), tsconfigPaths(), visualizer({
    open: true, // Abre automáticamente el reporte en el navegador
    filename: 'stats.html', // Nombre del archivo de reporte
    gzipSize: true, // Opcional: muestra el tamaño gzip
    brotliSize: true // Opcional: muestra el tamaño brotli
  }), sentryVitePlugin({
    org: "metromedics",
    project: "javascript-react"
  })],

  build: {
    sourcemap: true
  }
})