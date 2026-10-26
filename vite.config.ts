import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Relative base keeps the build portable on any GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
