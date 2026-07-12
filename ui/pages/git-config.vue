<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <header
      class="px-6 py-10 border-b border-gray-200 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm dark:border-gray-800"
    >
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <div
              class="relative flex items-center justify-center bg-black border border-gray-300 w-14 h-14 dark:bg-white rounded-2xl dark:border-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 text-white dark:text-black"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
            </div>
            <h1
              class="relative text-3xl text-gray-900 font-handwriting dark:text-white"
            >
              Git Configuration
            </h1>
          </div>

          <nav class="flex items-center space-x-2">
            <NuxtLink
              to="/"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              Dashboard
            </NuxtLink>

            <NavLinkActivity />
            <NavLinkAgents />

            <NuxtLink
              to="/git-config"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
              Git Config
            </NuxtLink>

            <NuxtLink
              to="/secrets"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              Secrets
            </NuxtLink>

            <NuxtLink
              to="/settings"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 3.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 3.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-3.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-3.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              Settings
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="px-6 py-8 mx-auto max-w-7xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            class="flex items-center px-6 py-3 text-lg text-white transition-all duration-200 transform bg-black border border-gray-300 shadow-lg dark:bg-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600 font-handwriting"
            @click="showModal = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5 mr-2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Git Repository
          </button>

          <button
            type="button"
            class="flex items-center px-6 py-3 text-lg text-gray-700 transition-colors duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700/80 disabled:pointer-events-none disabled:opacity-70"
            :disabled="forceRefreshing"
            :aria-busy="forceRefreshing"
            @click="forceRefreshGitconfigs()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
              :class="[
                'w-5 h-5 mr-2 shrink-0',
                forceRefreshing
                  ? 'animate-[spin_2s_linear_infinite] motion-reduce:animate-none'
                  : '',
              ]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Force pull repositories
          </button>
        </div>
      </div>

      <div
        class="relative overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-900 rounded-3xl dark:border-gray-700"
      >
        <div
          class="p-6 border-b border-gray-200 border-dashed dark:border-gray-700"
        >
          <h2 class="text-2xl text-gray-900 font-handwriting dark:text-white">
            Repository Management
          </h2>
        </div>
        <GitTable :git-configs="gitConfigs" @updated="handleGitConfigUpdated" />
      </div>
    </main>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      tabindex="0"
      @click.self="showModal = false"
      @keydown.escape="showModal = false"
    >
      <div
        class="relative w-full max-w-md p-6 mx-4 bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 rounded-3xl dark:border-gray-700"
      >
        <div
          class="flex items-center justify-between pb-4 border-b border-gray-200 border-dashed dark:border-gray-700"
        >
          <h2 class="text-2xl text-gray-900 font-handwriting dark:text-white">
            Add Git Repository
          </h2>
          <button
            class="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:text-neutral-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
            @click="showModal = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form class="mt-6" @submit.prevent="handleAddGit">
          <div class="mb-4">
            <label
              for="name"
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              Repository Name
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="w-full px-4 py-3 text-gray-900 transition-colors duration-200 border border-gray-300 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white font-handwriting"
              placeholder="Enter repository name"
              required
            />
          </div>

          <div class="mb-4">
            <label
              for="sshUrl"
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              SSH URL
            </label>
            <input
              id="sshUrl"
              v-model="sshUrl"
              type="url"
              class="w-full px-4 py-3 text-gray-900 transition-colors duration-200 border border-gray-300 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white font-handwriting"
              placeholder="git@github.com:user/repo.git"
              required
            />
          </div>

          <div class="mb-6">
            <label
              for="sshPrivateKey"
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              SSH Private Key
            </label>
            <textarea
              id="sshPrivateKey"
              v-model="sshPrivateKey"
              rows="6"
              class="w-full px-4 py-3 font-mono text-sm text-gray-900 transition-colors duration-200 border border-gray-300 resize-none dark:text-gray-100 bg-gray-50 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              required
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 transition-colors duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700/80"
              @click="showModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-white transition-all duration-200 transform bg-black border border-gray-300 shadow-lg font-handwriting dark:text-black dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600"
            >
              Add Repository
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRuntimeConfig } from "#app";

import { ref } from "vue";

import type { GitConfig } from "../../server/prisma/generated/prisma";

const gitConfigs = ref<Array<GitConfig>>([]);
const forceRefreshing = ref(false);
const showModal = ref(false);
const name = ref("");
const sshUrl = ref("");
const sshPrivateKey = ref("");
const config = useRuntimeConfig();

const { data: gitConfigsData } = await useFetch(
  `${config.public.apiEndpoint}/git-configs`,
  {
    credentials: "include",
  },
);
// @ts-expect-error
gitConfigs.value = gitConfigsData.value;

const listGitConfigs = async (url: string) => {
  try {
    const response = await fetch(url, { credentials: "include" });
    gitConfigs.value = await response.json();
  } catch {
    gitConfigs.value = [];
  }
};

const handleGitConfigUpdated = (updated: GitConfig) => {
  const index = gitConfigs.value.findIndex(config => config.id === updated.id);
  if (index !== -1) {
    gitConfigs.value[index] = updated;
  }
};

const addGitRepository = async (
  url: string,
  payload: { name: string; sshUrl: string; sshPrivateKey: string },
) => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding Git repository:", error);
  }
};

const FORCE_REFRESH_MIN_SPIN_MS = 3000;

const forceRefreshGitconfigs = async () => {
  forceRefreshing.value = true;
  const startedAt = Date.now();
  try {
    const response = await fetch(
      `${config.public.apiEndpoint}/git-configs/refresh`,
      {
        credentials: "include",
        method: "POST",
      },
    );
    const data = await response.json().catch(() => undefined);
    if (response.ok) {
      await listGitConfigs(`${config.public.apiEndpoint}/git-configs`);
    }
    return data;
  } catch (error) {
    console.error("Error refreshing Git configs:", error);
  } finally {
    const elapsed = Date.now() - startedAt;
    if (elapsed < FORCE_REFRESH_MIN_SPIN_MS) {
      await new Promise(r =>
        setTimeout(r, FORCE_REFRESH_MIN_SPIN_MS - elapsed),
      );
    }
    forceRefreshing.value = false;
  }
};

const handleAddGit = async () => {
  await addGitRepository(`${config.public.apiEndpoint}/git-configs`, {
    name: name.value,
    sshUrl: sshUrl.value,
    sshPrivateKey: sshPrivateKey.value,
  });

  name.value = "";
  sshUrl.value = "";
  sshPrivateKey.value = "";
  showModal.value = false;

  await listGitConfigs(`${config.public.apiEndpoint}/git-configs`);
};
</script>
