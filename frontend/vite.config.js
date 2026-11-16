import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// vite-plugin-pwa triggers Rollup's native binary which fails on some
// local Node versions. The PWA manifest and service worker are instead
// shipped manually via public/ and referenced in index.html.
export default defineConfig({
  plugins: [react()],
})
