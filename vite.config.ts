import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // As regras de negócio (src/domain) são funções puras: não precisam de navegador.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
