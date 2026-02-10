/**
 * Vite Configuration for Riksdagsmonitor
 * 
 * Static HTML/CSS site with Chart.js and D3.js bundling
 * Deployed to CloudFront (no external CDN dependencies)
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { defineConfig } from 'vite';
import { ViteSRI } from 'vite-plugin-sri';

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
        zh: './index_zh.html'
      },
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core visualization libraries
          'chart': ['chart.js', 'chartjs-plugin-annotation'],
          'd3': ['d3'],
          
          // Dashboard modules
          'dashboards': [
            './js/party-dashboard.js',
            './js/anomaly-detection-dashboard.js',
            './js/seasonal-patterns-dashboard.js',
            './js/pre-election-dashboard.js',
            './js/politician-dashboard.js',
            './js/ministry-dashboard.js',
            './js/election-cycle-dashboard.js'
          ]
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
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
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
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
    ViteSRI({
      algorithms: ['sha384']
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
