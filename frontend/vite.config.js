import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
    allowedHosts: ['christisking.info', '10.0.0.16', '10.0.0.16:5137', '10.0.0.16:3173', 'api.christisking.info']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js'
  }
})
