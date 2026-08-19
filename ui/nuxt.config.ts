// https://github.com/nuxt/ui/issues/809
import { createRequire } from "node:module";
const _require = createRequire(import.meta.url);
const defaultColors = _require("tailwindcss/colors.js");
delete defaultColors.lightBlue;
delete defaultColors.warmGray;
delete defaultColors.trueGray;
delete defaultColors.coolGray;
delete defaultColors.blueGray;

// https://nuxt.com/docs/api/configuration/nuxt-config
const remoteApi = process.env.TIMELORD_REMOTE_API;
const remoteApiOrigin = remoteApi ? new URL(remoteApi).origin : undefined;

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-11-01",
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/color-mode",
    "nuxt3-notifications",
    "@nuxtjs/tailwindcss",
  ],
  devtools: { enabled: true },
  sourcemap: true,
  devServer: {
    port: 3000,
  },
  vite: {
    server: remoteApiOrigin
      ? {
          proxy: {
            "/api": {
              target: remoteApiOrigin,
              changeOrigin: true,
              secure: true,
              cookieDomainRewrite: "localhost",
            },
          },
        }
      : undefined,
  },
  runtimeConfig: {
    public: {
      apiEndpoint: remoteApi
        ? "/api"
        : process.env.API_URL
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
