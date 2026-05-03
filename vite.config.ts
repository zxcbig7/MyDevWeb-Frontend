import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":    ["react", "react-dom", "react-router-dom"],
          "vendor-antd":     ["antd", "@ant-design/icons"],
          "vendor-markdown": ["react-markdown", "rehype-highlight", "remark-gfm", "highlight.js"],
          "vendor-table":    ["@tanstack/react-table"],
          "vendor-misc":     ["axios", "swr", "react-icons"],
        },
      },
    },
  },
})
