import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    includeAssets: ['icon.svg', 'icons/*.png'],
    manifest: {
      id: './', name: 'Fly Washington Passport Program', short_name: 'Fly Washington',
      description: 'Explore airports and keep a local passport of your visits.',
      start_url: './', scope: './', display: 'standalone', theme_color: '#245c48', background_color: '#f5f6f1',
      icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      // Public OSM tiles must never be prefetched or placed in an offline cache.
      runtimeCaching: [],
      cleanupOutdatedCaches: true,
    },
  })],
});
