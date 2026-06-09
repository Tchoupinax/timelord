<template>
  <div class="overflow-hidden">
    <div
      class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 border-dashed bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700"
    >
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Name
        </h3>
      </div>
      <div class="col-span-1">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Status
        </h3>
      </div>
      <div class="col-span-4">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Repository URL
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Folder
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Last Pulled
        </h3>
      </div>
      <div class="col-span-1">
        <h3
          class="text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200"
        >
          Actions
        </h3>
      </div>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-700/60">
      <GitRow
        v-for="gitConfig in gitConfigs"
        :key="gitConfig.name"
        :git-config="gitConfig"
        :expanded="expandedConfigId === gitConfig.id"
        @select="toggleExpanded(gitConfig.id)"
        @view-result="showResult"
      />
    </div>

    <div
      v-if="gitConfigs?.length === 0"
      class="flex flex-col items-center justify-center px-6 py-16"
    >
      <div
        class="flex items-center justify-center w-20 h-20 mb-6 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-800/40 dark:border-gray-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-10 h-10 text-gray-500 dark:text-gray-300"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
          />
        </svg>
      </div>
      <h3
        class="mb-3 text-xl font-medium text-gray-900 font-handwriting dark:text-gray-50"
      >
        No repositories found
      </h3>
      <p
        class="max-w-sm text-center text-neutral-600 dark:text-gray-300 font-handwriting"
      >
        Get started by adding your first Git repository to begin managing your
        code.
      </p>
    </div>

    <JobResultModal
      v-if="selectedResult"
      :job-id="selectedResult"
      @close="selectedResult = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { ref } from "vue";

import type { GitConfig } from "../../server/prisma/generated/prisma";

defineProps({
  gitConfigs: {
    type: Array as PropType<Array<GitConfig>>,
    required: true,
  },
});

const selectedResult = ref(null);
const expandedConfigId = ref<string | null>(null);

// @ts-expect-error
const showResult = result => {
  selectedResult.value = result;
};

const toggleExpanded = (id: string) => {
  expandedConfigId.value = expandedConfigId.value === id ? null : id;
};
</script>
