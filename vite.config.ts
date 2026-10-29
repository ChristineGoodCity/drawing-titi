import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/drawing-titi/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        gallery: 'gallery/index.html',
      },
    },
  },
})
