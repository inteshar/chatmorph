import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ChatMorph',
        short_name: 'ChatMorph',
        description: 'Connect with top AI models and explore endless possibilities. Ask, share, or chat with AI personalities tailored to your needs.',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        background_color: '#000000',
        theme_color: '#4A4A4A',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
      },
    }),
  ],
});
