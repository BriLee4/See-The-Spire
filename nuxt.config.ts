export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', "nitro-cloudflare-dev"],
  css: ['../assets/main.css'],

  runtimeConfig: {
    public: {
      assetBaseUrl: 'https://pub-37dfff96d33a45bab92a56e934ec779b.r2.dev'
    }
  },
  typescript: {
    tsConfig: {
      include: ['../worker-configuration.d.ts']
    }
  },
  
  nitro: {
    preset: "cloudflare_module",
    experimental:{
      database: true
    },
    database:{
      myDatabase: {
        connector: "cloudflare-d1",
        options: {
          bindingName: "DB"
        }
      }
    },

    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
      typescript: {
      tsConfig: {
        compilerOptions:{
        types: ['@cloudflare/workers-types']
        },
        include: ['../worker-configuration.d.ts']
      }
    }
  }
})