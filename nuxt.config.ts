export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  app: {
    head: {
      title: 'Export Studio',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' },
      ],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  dir: {
    pages: 'app/pages',
    layouts: 'app/layouts',
    assets: 'app/assets',
  },

  components: [
    { path: '~/app/components', pathPrefix: false },
  ],

  imports: {
    dirs: ['app/composables', 'app/utils'],
  },
})
