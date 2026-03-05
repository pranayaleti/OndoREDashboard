import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
