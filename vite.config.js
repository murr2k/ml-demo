import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
    server: {
        port: 5173,
        open: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    tensorflow: ['@tensorflow/tfjs'],
                    lightningchart: ['@lightningchart/lcjs'],
                },
            },
        },
    },
    plugins:
        mode === 'analyze'
            ? [
                  visualizer({
                      open: true,
                      filename: 'dist/stats.html',
                      gzipSize: true,
                      brotliSize: true,
                  }),
              ]
            : [],
}))
