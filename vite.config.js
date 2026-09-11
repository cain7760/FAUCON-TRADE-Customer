import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', equityDraft: 'equity-draft.html', equityVariants: 'equity-variants.html' },
    },
  },
})
