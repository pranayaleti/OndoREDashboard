import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite plugin to remove console statements in production builds.
 * Keeps console statements in development for debugging, but strips them
 * from production bundles to reduce noise and prevent accidental logging
 * of sensitive information.
 */
const stripConsolePlugin = {
  name: 'strip-console',
  apply: 'build',
  transform(code: string) {
    // Remove console.log, console.warn, console.error, console.info statements
    // Handles: console.log(...), console.log(...);, etc.
    return code.replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '');
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), stripConsolePlugin],
  base: '/ondorealestateui/',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  resolve: {
    alias: {
      "@": "/src",
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
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
