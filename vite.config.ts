import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    }
  },
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999', // Default Netlify dev server port
        changeOrigin: true,
      },
    },
  },
})
