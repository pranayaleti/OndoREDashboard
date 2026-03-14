import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
  base: '/ondorealestateui/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@ondo/types": path.resolve(__dirname, "src/lib/api/types/ondo-types.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Preserve unchanged files for faster incremental builds
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Deterministic chunk names for better caching
        // Hash only changes when content changes, so unchanged files are preserved
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
