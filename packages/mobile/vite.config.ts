// // vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { fileURLToPath } from 'url'
// import { dirname, resolve } from 'path'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': resolve(__dirname, './src'),
//     },
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
// })

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      minify: false,
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*'],
      devOptions: {
        enabled: true, // Attiva PWA anche in sviluppo
      },
      manifest: {
        name: 'Gym App',
        short_name: 'GymApp',
        description: 'La tua app per il fitness!',
        start_url: '/',
        display: 'standalone',
        theme_color: '#000000',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        sourcemap: true,
      }
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://gym-backend-production-7b12.up.railway.app', // URL del tuo backend su Railway
        changeOrigin: true, // Impostato su true per evitare problemi con i CORS
        secure: false, // Se usi HTTP su backend, metti false
        rewrite: (path) => path.replace(/^\/api/, '') // Rimuove /api dalla richiesta
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
