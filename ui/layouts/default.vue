<template>
  <div
    class="relative flex justify-center w-full h-screen bg-white dark:bg-black"
  >
    <div class="relative z-50 w-full">
      <slot />

      <footer
        class="relative border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm"
      >
        <div class="px-6 py-10 mx-auto max-w-7xl">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div class="space-y-4">
              <div class="flex items-center space-x-3">
                <div
                  class="flex items-center justify-center w-10 h-10 bg-black border border-gray-300 dark:bg-white rounded-xl dark:border-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5 text-white dark:text-black"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <h3
                  class="text-xl text-gray-900 font-handwriting dark:text-white"
                >
                  Timelord
                </h3>
              </div>
              <p
                class="text-sm text-neutral-600 dark:text-gray-300 font-handwriting"
              >
                Orchestrate your CRONs easily
              </p>
            </div>

            <div class="space-y-4">
              <h4
                class="text-lg text-gray-900 font-handwriting dark:text-white"
              >
                Quick Links
              </h4>
              <div class="space-y-2">
                <NuxtLink
                  to="/"
                  class="block text-sm text-gray-400 transition-colors duration-200 dark:text-gray-300 hover:text-white dark:hover:text-white font-handwriting"
                >
                  Dashboard
                </NuxtLink>
                <NuxtLink
                  to="/agents"
                  class="block text-sm text-gray-400 transition-colors duration-200 dark:text-gray-300 hover:text-white dark:hover:text-white font-handwriting"
                >
                  Agents
                </NuxtLink>
                <NuxtLink
                  to="/git-config"
                  class="block text-sm text-gray-400 transition-colors duration-200 dark:text-gray-300 hover:text-white dark:hover:text-white font-handwriting"
                >
                  Git Config
                </NuxtLink>
                <NuxtLink
                  to="/secrets"
                  class="block text-sm text-gray-400 transition-colors duration-200 dark:text-gray-300 hover:text-white dark:hover:text-white font-handwriting"
                >
                  Secrets
                </NuxtLink>
              </div>
            </div>

            <div class="space-y-4">
              <h4
                class="text-lg text-gray-900 font-handwriting dark:text-white"
              >
                System Info
              </h4>

              <div
                class="space-y-2 text-sm text-neutral-600 dark:text-gray-300 font-handwriting"
              >
                <div v-if="nickname" class="flex items-center space-x-2">
                  <span>👤</span>
                  <span>{{ nickname }}</span>
                </div>

                <div
                  v-if="backendData?.buildCommitSha"
                  class="flex items-center space-x-2"
                >
                  <span>🔧</span>
                  <span>API: {{ backendData.buildCommitSha }}</span>
                </div>

                <div
                  v-if="config?.public?.commit"
                  class="flex items-center space-x-2"
                >
                  <span>🎨</span>
                  <span>UI: {{ config.public.commit.slice(0, 6) }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4
                class="text-lg text-gray-900 font-handwriting dark:text-white"
              >
                Actions
              </h4>
              <div class="space-y-3">
                <button
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-all duration-200 border border-gray-300 font-handwriting dark:text-gray-200 bg-gray-50 dark:bg-gray-800/80 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/80"
                  @click="toggleTheme"
                >
                  <span v-if="$colorMode.preference === 'light'" class="mr-2"
                    >🌙</span
                  >
                  <span v-if="$colorMode.preference === 'dark'" class="mr-2"
                    >🌞</span
                  >
                  <span v-if="$colorMode.preference === 'system'" class="mr-2"
                    >💻</span
                  >
                  <span v-if="$colorMode.preference === 'light'"
                    >Dark Mode</span
                  >
                  <span v-if="$colorMode.preference === 'dark'"
                    >Light Mode</span
                  >
                  <span v-if="$colorMode.preference === 'system'"
                    >System Mode</span
                  >
                </button>

                <button
                  v-if="nickname"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 transition-all duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-300 dark:bg-gray-800/40 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/60"
                  @click="logout"
                >
                  <span class="mr-2">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div
            class="flex flex-col items-center justify-between pt-6 mt-8 space-y-4 border-t border-gray-200 border-dashed dark:border-gray-800 lg:flex-row lg:space-y-0"
          >
            <div
              class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="font-handwriting">Made with ♥️</span>
            </div>

            <div class="flex items-center space-x-4">
              <div
                class="flex items-center justify-center w-8 h-8 bg-gray-200 border border-gray-300 rounded-lg dark:bg-gray-800/40 dark:border-gray-600"
              >
                <div
                  class="w-2 h-2 bg-gray-600 rounded-full dark:bg-gray-300 animate-pulse"
                ></div>
              </div>
              <span
                class="text-sm text-neutral-600 dark:text-gray-300 font-handwriting"
              >
                System online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { format } from "timeago.js";

type Store = {
  nickname: string | undefined;
  config: {
    public: {
      apiEndpoint: string;
      commit: string;
      buildDate: string;
    };
  };
  backendData: {
    buildCommitSha: string;
    buildDate: string;
  };
};

export default {
  data(): Store {
    return {
      nickname: "",
      config: {
        public: {
          apiEndpoint: "",
          commit: "",
          buildDate: "",
        },
      },
      backendData: {
        buildCommitSha: "",
        buildDate: "",
      },
    };
  },
  async mounted() {
    this.config = useRuntimeConfig();
    this.getBackendVersion();

    this.nickname = document.cookie
      .split(";")
      ?.filter(name => name.includes("timelord-nickname"))
      ?.at(0)
      ?.split("=")
      ?.at(1);
  },
  methods: {
    format,
    toggleTheme() {
      if (this.$colorMode.preference == "dark") {
        this.$colorMode.preference = "light";
      } else if (this.$colorMode.preference == "light") {
        this.$colorMode.preference = "system";
      } else {
        this.$colorMode.preference = "dark";
      }
    },
    logout() {
      window.location.href = `${this.config.public.apiEndpoint}/logout`;
    },
    async getBackendVersion() {
      this.backendData = await fetch(
        `${this.config.public.apiEndpoint}/version`,
        {},
      ).then(res => res.json());
    },
  },
};
</script>
