import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'にゅうた 説明資料',
        short_name: '説明資料',
        description: '患者さん向け説明資料ビューア',
        theme_color: '#6fb82b',
        background_color: '#FBF8F2',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/nyuta-explainer/',
        scope: '/nyuta-explainer/',
        icons: [
          {
            src: 'icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        // App shell + static assets: precache so repeat loads are instant.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Firebase Storage file downloads (PDFs + thumbnails):
            // cache-first so a document opened once is instant afterwards.
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'storage-files-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firestoreへの通信はService Workerでは一切横取りしない。
          // Firestoreのリアルタイム購読(onSnapshot)は持続的なストリーミング
          // 通信を使っており、Service Workerがこれを横取りすると
          // 「保存はできるが画面にリアルタイムで反映されない」問題が起きるため。
        ],
      },
    }),
  ],
  base: '/nyuta-explainer/',
})
