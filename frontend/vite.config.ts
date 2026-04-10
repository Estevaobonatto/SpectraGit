import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      // Proxy Git Smart HTTP requests (clone/push) to the backend.
      // Matches paths like /owner/repo.git/...
      '^/[^/]+/[^/]+\\.git': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
