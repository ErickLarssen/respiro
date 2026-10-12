import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const FUNDO = '#06080C' // --bg-0 do tema escuro (o principal)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA (docs/07-roadmap.md, Etapa 5): manifest + service worker.
    VitePWA({
      // Versão nova publicada → o service worker se atualiza sozinho na próxima abertura.
      // Os dados ficam no IndexedDB, então recarregar não perde nada.
      registerType: 'autoUpdate',
      // Os ícones já entram pelo globPatterns abaixo; sem isto, entrariam duas vezes.
      includeManifestIcons: false,
      manifest: {
        name: 'Respiro',
        short_name: 'Respiro',
        description: 'Seu plano do mês: quanto ainda dá para gastar e quanto guardar.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone', // abre como app, sem a barra do navegador
        orientation: 'portrait',
        theme_color: FUNDO,
        background_color: FUNDO,
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tudo o que o app precisa para abrir sem internet. Só woff2 (todo navegador
        // atual lê), e sem as letras cirílicas e vietnamitas, que o app não usa.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*', '**/*symbols*'],
        cleanupOutdatedCaches: true,
        // Qualquer endereço (/gastos, /plano?mes=2026-11...) abre o index.html do cache.
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    // As regras de negócio (src/domain) são funções puras: não precisam de navegador.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
