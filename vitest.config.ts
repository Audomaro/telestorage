import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    passWithNoTests: true,
    exclude: ['node_modules', 'e2e'],
    server: {
      deps: {
        inline: ['@mui/material', '@emotion/react', '@emotion/styled', 'react-transition-group']
      }
    }
  }
})
