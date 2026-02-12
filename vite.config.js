/**
 * Vite Configuration for Riksdagsmonitor
 * 
 * Static HTML/CSS site with multi-language support
 * Deployed to CloudFront with SRI hash generation
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { defineConfig } from 'vite';
import sri from 'vite-plugin-sri-gen';

export default defineConfig({
  // Base configuration
  root: '.',
  base: '/',
  
  // Server configuration for local development
  server: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    open: true
  },
  
  // Preview server (production build preview)
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Code splitting configuration
    rollupOptions: {
      input: {
        // Main language homepages
        main: './index.html',
        ar: './index_ar.html',
        da: './index_da.html',
        de: './index_de.html',
        es: './index_es.html',
        fi: './index_fi.html',
        fr: './index_fr.html',
        he: './index_he.html',
        ja: './index_ja.html',
        ko: './index_ko.html',
        nl: './index_nl.html',
        no: './index_no.html',
        sv: './index_sv.html',
        zh: './index_zh.html',
        // Additional pages
        'politician-dashboard': './politician-dashboard.html',
        'dashboard/index': './dashboard/index.html',
        'dashboard/index_sv': './dashboard/index_sv.html',
        'dashboard/index_da': './dashboard/index_da.html',
        'dashboard/index_no': './dashboard/index_no.html',
        'dashboard/index_fi': './dashboard/index_fi.html',
        'dashboard/index_de': './dashboard/index_de.html',
        'dashboard/index_fr': './dashboard/index_fr.html',
        'dashboard/index_es': './dashboard/index_es.html',
        'dashboard/index_nl': './dashboard/index_nl.html',
        'dashboard/index_ar': './dashboard/index_ar.html',
        'dashboard/index_he': './dashboard/index_he.html',
        'dashboard/index_ja': './dashboard/index_ja.html',
        'dashboard/index_ko': './dashboard/index_ko.html',
        'dashboard/index_zh': './dashboard/index_zh.html'
      },
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core visualization libraries
          'chart': ['chart.js', 'chartjs-plugin-annotation'],
          'd3': ['d3']
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // JS file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // Minification (use Vite default: esbuild)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    },
    
    // CSS options
    cssMinify: true,
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline small assets as base64
    
    // Performance budgets
    chunkSizeWarningLimit: 1000 // 1000kb warning
  },
  
  // Plugins
  plugins: [
    // Generate Subresource Integrity (SRI) hashes for security
    sri({
      algorithm: 'sha384'
    })
  ],
  
  // Optimizations
  optimizeDeps: {
    include: ['chart.js', 'chartjs-plugin-annotation', 'd3']
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  }
});
