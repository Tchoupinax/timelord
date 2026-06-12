<template>
  <div>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
    :class="expanded ? 'bg-gray-50 dark:bg-gray-800/30' : ''"
    @click="emit('select')"
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

  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="expanded"
      class="px-6 py-5 border-t border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
    >
      <div class="flex items-start gap-10">
        <div>
          <p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase font-handwriting dark:text-gray-400">
            Latest Commit SHA
          </p>
          <code
            v-if="gitConfig.lastCommitSha"
            class="px-2 py-1 font-mono text-sm text-gray-800 bg-gray-100 border border-gray-200 dark:bg-gray-700/60 dark:border-gray-600 dark:text-gray-200 rounded-lg"
            :title="gitConfig.lastCommitSha"
          >{{ gitConfig.lastCommitSha.slice(0, 12) }}</code>
          <span v-else class="text-sm text-gray-400 font-handwriting dark:text-gray-500">—</span>
        </div>

        <div class="flex-1">
          <p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase font-handwriting dark:text-gray-400">
            Latest Commit Message
          </p>
          <p
            v-if="gitConfig.lastCommitMessage"
            class="text-sm text-gray-800 font-handwriting dark:text-gray-200"
          >{{ gitConfig.lastCommitMessage }}</p>
          <span v-else class="text-sm text-gray-400 font-handwriting dark:text-gray-500">No commit synced yet</span>
        </div>
      </div>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";
import type { PropType } from "vue";

import type { GitConfig } from "../../server/prisma/generated/prisma";

const emit = defineEmits(["view-result", "select"]);

const props = defineProps({
  gitConfig: {
    type: Object as PropType<GitConfig>,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
});

const toggleEnabled = () => {
  console.log("Toggle enabled for:", props.gitConfig.name);
};
</script>

<style scoped>
.row {
  @apply dark:bg-primary-dark dark:text-primary-light px-4 py-2 text-neutral-600;
}
</style>
