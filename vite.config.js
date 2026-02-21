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
        // Sitemaps
        'sitemap': './sitemap.html',
        'sitemap_sv': './sitemap_sv.html',
        'sitemap_da': './sitemap_da.html',
        'sitemap_no': './sitemap_no.html',
        'sitemap_fi': './sitemap_fi.html',
        'sitemap_de': './sitemap_de.html',
        'sitemap_fr': './sitemap_fr.html',
        'sitemap_es': './sitemap_es.html',
        'sitemap_nl': './sitemap_nl.html',
        'sitemap_ar': './sitemap_ar.html',
        'sitemap_he': './sitemap_he.html',
        'sitemap_ja': './sitemap_ja.html',
        'sitemap_ko': './sitemap_ko.html',
        'sitemap_zh': './sitemap_zh.html',
        // Additional pages
        'politician-dashboard': './politician-dashboard.html',
        // Dashboard pages
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
        'dashboard/index_zh': './dashboard/index_zh.html',
        // News index pages
        'news/index': './news/index.html',
        'news/index_sv': './news/index_sv.html',
        'news/index_da': './news/index_da.html',
        'news/index_no': './news/index_no.html',
        'news/index_fi': './news/index_fi.html',
        'news/index_de': './news/index_de.html',
        'news/index_fr': './news/index_fr.html',
        'news/index_es': './news/index_es.html',
        'news/index_nl': './news/index_nl.html',
        'news/index_ar': './news/index_ar.html',
        'news/index_he': './news/index_he.html',
        'news/index_ja': './news/index_ja.html',
        'news/index_ko': './news/index_ko.html',
        'news/index_zh': './news/index_zh.html',
        // News article pages (81 files)
        'news/2026-02-10-biodiversity-citizenship-en': './news/2026-02-10-biodiversity-citizenship-en.html',
        'news/2026-02-10-biodiversity-citizenship-sv': './news/2026-02-10-biodiversity-citizenship-sv.html',
        'news/2026-02-10-pm-eu-summit-en': './news/2026-02-10-pm-eu-summit-en.html',
        'news/2026-02-10-pm-eu-summit-sv': './news/2026-02-10-pm-eu-summit-sv.html',
        'news/2026-02-10-week-ahead-feb-10-17-en': './news/2026-02-10-week-ahead-feb-10-17-en.html',
        'news/2026-02-10-week-ahead-feb-10-17-sv': './news/2026-02-10-week-ahead-feb-10-17-sv.html',
        'news/2026-02-13-evening-analysis-ar': './news/2026-02-13-evening-analysis-ar.html',
        'news/2026-02-13-evening-analysis-da': './news/2026-02-13-evening-analysis-da.html',
        'news/2026-02-13-evening-analysis-de': './news/2026-02-13-evening-analysis-de.html',
        'news/2026-02-13-evening-analysis-en': './news/2026-02-13-evening-analysis-en.html',
        'news/2026-02-13-evening-analysis-es': './news/2026-02-13-evening-analysis-es.html',
        'news/2026-02-13-evening-analysis-fi': './news/2026-02-13-evening-analysis-fi.html',
        'news/2026-02-13-evening-analysis-fr': './news/2026-02-13-evening-analysis-fr.html',
        'news/2026-02-13-evening-analysis-he': './news/2026-02-13-evening-analysis-he.html',
        'news/2026-02-13-evening-analysis-ja': './news/2026-02-13-evening-analysis-ja.html',
        'news/2026-02-13-evening-analysis-ko': './news/2026-02-13-evening-analysis-ko.html',
        'news/2026-02-13-evening-analysis-nl': './news/2026-02-13-evening-analysis-nl.html',
        'news/2026-02-13-evening-analysis-no': './news/2026-02-13-evening-analysis-no.html',
        'news/2026-02-13-evening-analysis-sv': './news/2026-02-13-evening-analysis-sv.html',
        'news/2026-02-13-evening-analysis-zh': './news/2026-02-13-evening-analysis-zh.html',
        'news/2026-02-14-committee-reports-ar': './news/2026-02-14-committee-reports-ar.html',
        'news/2026-02-14-committee-reports-da': './news/2026-02-14-committee-reports-da.html',
        'news/2026-02-14-committee-reports-de': './news/2026-02-14-committee-reports-de.html',
        'news/2026-02-14-committee-reports-en': './news/2026-02-14-committee-reports-en.html',
        'news/2026-02-14-committee-reports-es': './news/2026-02-14-committee-reports-es.html',
        'news/2026-02-14-committee-reports-fi': './news/2026-02-14-committee-reports-fi.html',
        'news/2026-02-14-committee-reports-fiscal-welfare-en': './news/2026-02-14-committee-reports-fiscal-welfare-en.html',
        'news/2026-02-14-committee-reports-fiscal-welfare-sv': './news/2026-02-14-committee-reports-fiscal-welfare-sv.html',
        'news/2026-02-14-committee-reports-fr': './news/2026-02-14-committee-reports-fr.html',
        'news/2026-02-14-committee-reports-he': './news/2026-02-14-committee-reports-he.html',
        'news/2026-02-14-committee-reports-ja': './news/2026-02-14-committee-reports-ja.html',
        'news/2026-02-14-committee-reports-ko': './news/2026-02-14-committee-reports-ko.html',
        'news/2026-02-14-committee-reports-nl': './news/2026-02-14-committee-reports-nl.html',
        'news/2026-02-14-committee-reports-no': './news/2026-02-14-committee-reports-no.html',
        'news/2026-02-14-committee-reports-sv': './news/2026-02-14-committee-reports-sv.html',
        'news/2026-02-14-committee-reports-zh': './news/2026-02-14-committee-reports-zh.html',
        'news/2026-02-14-government-propositions-ar': './news/2026-02-14-government-propositions-ar.html',
        'news/2026-02-14-government-propositions-da': './news/2026-02-14-government-propositions-da.html',
        'news/2026-02-14-government-propositions-de': './news/2026-02-14-government-propositions-de.html',
        'news/2026-02-14-government-propositions-en': './news/2026-02-14-government-propositions-en.html',
        'news/2026-02-14-government-propositions-es': './news/2026-02-14-government-propositions-es.html',
        'news/2026-02-14-government-propositions-fi': './news/2026-02-14-government-propositions-fi.html',
        'news/2026-02-14-government-propositions-fr': './news/2026-02-14-government-propositions-fr.html',
        'news/2026-02-14-government-propositions-he': './news/2026-02-14-government-propositions-he.html',
        'news/2026-02-14-government-propositions-ja': './news/2026-02-14-government-propositions-ja.html',
        'news/2026-02-14-government-propositions-ko': './news/2026-02-14-government-propositions-ko.html',
        'news/2026-02-14-government-propositions-nl': './news/2026-02-14-government-propositions-nl.html',
        'news/2026-02-14-government-propositions-no': './news/2026-02-14-government-propositions-no.html',
        'news/2026-02-14-government-propositions-sv': './news/2026-02-14-government-propositions-sv.html',
        'news/2026-02-14-government-propositions-zh': './news/2026-02-14-government-propositions-zh.html',
        'news/2026-02-14-opposition-motions-ar': './news/2026-02-14-opposition-motions-ar.html',
        'news/2026-02-14-opposition-motions-da': './news/2026-02-14-opposition-motions-da.html',
        'news/2026-02-14-opposition-motions-de': './news/2026-02-14-opposition-motions-de.html',
        'news/2026-02-14-opposition-motions-en': './news/2026-02-14-opposition-motions-en.html',
        'news/2026-02-14-opposition-motions-es': './news/2026-02-14-opposition-motions-es.html',
        'news/2026-02-14-opposition-motions-fi': './news/2026-02-14-opposition-motions-fi.html',
        'news/2026-02-14-opposition-motions-fr': './news/2026-02-14-opposition-motions-fr.html',
        'news/2026-02-14-opposition-motions-he': './news/2026-02-14-opposition-motions-he.html',
        'news/2026-02-14-opposition-motions-ja': './news/2026-02-14-opposition-motions-ja.html',
        'news/2026-02-14-opposition-motions-ko': './news/2026-02-14-opposition-motions-ko.html',
        'news/2026-02-14-opposition-motions-nl': './news/2026-02-14-opposition-motions-nl.html',
        'news/2026-02-14-opposition-motions-no': './news/2026-02-14-opposition-motions-no.html',
        'news/2026-02-14-opposition-motions-sv': './news/2026-02-14-opposition-motions-sv.html',
        'news/2026-02-14-opposition-motions-zh': './news/2026-02-14-opposition-motions-zh.html',
        'news/2026-02-14-week-ahead-feb-14-20-en': './news/2026-02-14-week-ahead-feb-14-20-en.html',
        'news/2026-02-14-week-ahead-feb-14-20-sv': './news/2026-02-14-week-ahead-feb-14-20-sv.html',
        'news/2026-02-14-week-ahead-feb-15-21-da': './news/2026-02-14-week-ahead-feb-15-21-da.html',
        'news/2026-02-14-week-ahead-feb-15-21-en': './news/2026-02-14-week-ahead-feb-15-21-en.html',
        'news/2026-02-14-week-ahead-feb-15-21-fi': './news/2026-02-14-week-ahead-feb-15-21-fi.html',
        'news/2026-02-14-week-ahead-feb-15-21-no': './news/2026-02-14-week-ahead-feb-15-21-no.html',
        'news/2026-02-14-week-ahead-feb-15-21-sv': './news/2026-02-14-week-ahead-feb-15-21-sv.html',
        'news/2026-02-committee-reports-en': './news/2026-02-committee-reports-en.html',
        'news/2026-02-committee-reports-sv': './news/2026-02-committee-reports-sv.html',
        'news/2026-02-government-propositions-en': './news/2026-02-government-propositions-en.html',
        'news/2026-02-government-propositions-sv': './news/2026-02-government-propositions-sv.html',
        'news/2026-02-opposition-motions-en': './news/2026-02-opposition-motions-en.html',
        'news/2026-02-opposition-motions-sv': './news/2026-02-opposition-motions-sv.html',
        'news/2026-02-parliament-agenda-en': './news/2026-02-parliament-agenda-en.html',
        'news/2026-02-parliament-agenda-sv': './news/2026-02-parliament-agenda-sv.html',
        'news/2026-02-week-ahead-en': './news/2026-02-week-ahead-en.html',
        'news/2026-02-week-ahead-sv': './news/2026-02-week-ahead-sv.html',
        'news/2026-02-16-opposition-interpellations-offensive-en': './news/2026-02-16-opposition-interpellations-offensive-en.html',
        'news/2026-02-16-opposition-interpellations-offensive-sv': './news/2026-02-16-opposition-interpellations-offensive-sv.html',
        'news/2026-02-16-opposition-interpellations-offensive-da': './news/2026-02-16-opposition-interpellations-offensive-da.html',
        'news/2026-02-16-opposition-interpellations-offensive-no': './news/2026-02-16-opposition-interpellations-offensive-no.html',
        'news/2026-02-16-opposition-interpellations-offensive-fi': './news/2026-02-16-opposition-interpellations-offensive-fi.html',
        'news/2026-02-16-opposition-interpellations-offensive-de': './news/2026-02-16-opposition-interpellations-offensive-de.html',
        'news/2026-02-16-opposition-interpellations-offensive-fr': './news/2026-02-16-opposition-interpellations-offensive-fr.html',
        'news/2026-02-16-opposition-interpellations-offensive-es': './news/2026-02-16-opposition-interpellations-offensive-es.html',
        'news/2026-02-16-opposition-interpellations-offensive-nl': './news/2026-02-16-opposition-interpellations-offensive-nl.html',
        'news/2026-02-16-opposition-interpellations-offensive-ar': './news/2026-02-16-opposition-interpellations-offensive-ar.html',
        'news/2026-02-16-opposition-interpellations-offensive-he': './news/2026-02-16-opposition-interpellations-offensive-he.html',
        'news/2026-02-16-opposition-interpellations-offensive-ja': './news/2026-02-16-opposition-interpellations-offensive-ja.html',
        'news/2026-02-16-opposition-interpellations-offensive-ko': './news/2026-02-16-opposition-interpellations-offensive-ko.html',
        'news/2026-02-16-opposition-interpellations-offensive-zh': './news/2026-02-16-opposition-interpellations-offensive-zh.html'
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
    // Skip external Google Fonts — they don't support CORS for SRI verification
    sri({
      algorithm: 'sha384',
      skipResources: [
        'https://fonts.googleapis.com/*',
        'https://fonts.gstatic.com/*'
      ]
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
