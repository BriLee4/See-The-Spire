export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxthub/core'],
  css: ['../assets/main.css'],
  runtimeConfig: {
    public: {
      assetBaseUrl: 'https://pub-37dfff96d33a45bab92a56e934ec779b.r2.dev'
    }
  }
})