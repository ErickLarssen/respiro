import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os ícones do PWA a partir de public/icons/icone.svg (rode: npm run icones).
// Saída em public/icons/: pwa-64x64, pwa-192x192, pwa-512x512, maskable-icon-512x512,
// apple-touch-icon-180x180 (.png) e favicon.ico.
//
// O desenho já respeita a margem de segurança da versão maskable (o anel cabe no
// círculo central de 80%), então não precisa de recuo extra: só pintamos os cantos
// arredondados com o fundo do app (--bg-0).
const FUNDO = '#06080C'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: FUNDO } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: FUNDO } },
  },
  images: ['public/icons/icone.svg'],
})
