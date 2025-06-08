// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // API 也一併轉：/api/* → http://localhost:3000/api/*
      '/api': 'http://localhost:3000',
      // 靜態檔：/static/* → http://localhost:3000/static/*
      '/static': 'http://localhost:3000'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')   // ★ 加這行
    }
  }
})
