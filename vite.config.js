import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'RuleWeaver - 规则怪谈创作辅助',
        short_name: 'RuleWeaver',
        description: '离线优先的规则怪谈创作辅助工具',
        theme_color: '#1a1a2e',
        background_color: '#16213e',
        display: 'standalone',
        icons: [
          {
            src: './icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.moonshot\.cn\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ]
})
