<template>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
    @click="viewResult"
  >
    <div class="flex items-center col-span-2">
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
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
        </div>
        <span
          class="font-medium text-gray-900 truncate transition-colors duration-200 font-handwriting dark:text-gray-100 group-hover:text-black dark:group-hover:text-white"
          >{{ gitConfig.name }}</span
        >
      </div>
    </div>

    <div class="flex items-center col-span-1">
      <span
        :class="
          gitConfig.enabled
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            : 'bg-gray-200 text-gray-900 dark:bg-gray-700/30 dark:text-gray-400 border-gray-400 dark:border-gray-500'
        "
        class="inline-flex items-center px-3 py-1 text-xs font-medium border-2 rounded-full font-handwriting"
      >
        {{ gitConfig.enabled ? "Active" : "Disabled" }}
      </span>
    </div>

    <div class="flex items-center col-span-4">
      <span
        class="font-mono text-sm text-gray-700 truncate transition-colors duration-200 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
        >{{ gitConfig.sshUrl }}</span
      >
    </div>

    <div class="flex items-center col-span-2">
      <span
        class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
        >{{ gitConfig.folderNameInGitRepository || "/" }}</span
      >
    </div>

    <div class="flex items-center col-span-2">
      <div
        v-tippy="{ content: gitConfig.pullAt }"
        class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        {{ gitConfig.pullAt ? format(gitConfig.pullAt) : "Never" }}
      </div>
    </div>

    <div class="flex items-center justify-end col-span-1">
      <button
        :class="
          gitConfig.enabled
            ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/30 border-gray-300 dark:border-gray-600'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/30 border-gray-300 dark:border-gray-600'
        "
        class="flex items-center justify-center w-10 h-10 transition-all duration-200 border-2 rounded-xl hover:scale-110"
        :title="gitConfig.enabled ? 'Disable repository' : 'Enable repository'"
        @click.stop="toggleEnabled"
      >
        <svg
          v-if="gitConfig.enabled"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

import { format } from "timeago.js";

import type { GitConfig } from "../../server/prisma/generated/prisma";

const emit = defineEmits(["view-result"]);

const props = defineProps({
  gitConfig: {
    type: Object as PropType<GitConfig>,
    required: true,
  },
});

const viewResult = () => {
  emit("view-result", props.gitConfig.id);
};

const toggleEnabled = () => {
  console.log("Toggle enabled for:", props.gitConfig.name);
};
</script>

<style scoped>
.row {
  @apply dark:bg-primary-dark dark:text-primary-light px-4 py-2 text-gray-600;
}
</style>
