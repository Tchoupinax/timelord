// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-11-01",
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/color-mode",
    "@nuxtjs/tailwindcss",
    "nuxt3-notifications",
  ],
  devtools: { enabled: true },
  sourcemap: true,
  devServer: {
    port: 3000,
  },
  runtimeConfig: {
    public: {
      apiEndpoint: process.env.API_URL
        ? process.env.API_URL
        : "http://localhost:9988",
      buildDate: new Date().toISOString(),
      commit: process.env.CI_COMMIT_SHA,
    },
  },
  colorMode: {
    classPrefix: "",
    classSuffix: "-mode",
    componentName: "ColorScheme",
    fallback: "light",
    globalName: "__NUXT_COLOR_MODE__",
    preference: "system",
    storage: "localStorage",
    storageKey: "nuxt-color-mode",
  },
});
