<template>
  <div class="divide-y divide-gray-200 dark:divide-gray-700">
    <div
      v-for="item in activities"
      :key="item.id"
      class="flex items-center gap-3 px-4 py-2 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/30"
    >
      <div
        class="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 text-sm"
        :class="iconClass(item.type)"
      >
        <span>{{ icon(item.type) }}</span>
      </div>

      <div class="flex items-center justify-between flex-1 min-w-0 gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm leading-tight truncate text-gray-900 dark:text-white">
            <span class="font-medium">{{ item.title }}</span>
            <span class="text-neutral-500 dark:text-gray-400">
              · {{ item.message }}
            </span>
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <time
            v-tippy="{ content: item.timestamp }"
            class="min-w-[5.5rem] text-right text-xs whitespace-nowrap text-neutral-500 dark:text-gray-400"
          >
            {{ format(item.timestamp) }}
          </time>
          <span class="inline-flex w-10 shrink-0 justify-center">
            <button
              v-if="canViewLogs(item)"
              class="text-xs font-medium text-gray-600 transition-colors duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              @click="$emit('view-logs', item.jobId!)"
            >
              Logs
            </button>
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="activities.length === 0"
      class="flex flex-col items-center justify-center py-12 px-6"
    >
      <p class="text-gray-500 dark:text-gray-400 font-handwriting">
        No activity yet.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";

import type { ActivityItem } from "~/types/external-activity";

defineEmits<{ "view-logs": [jobId: string] }>();

defineProps<{
  activities: ActivityItem[];
}>();

const canViewLogs = (item: ActivityItem) =>
  Boolean(item.jobId) &&
  item.type !== "job_started" &&
  item.type !== "job_queued";

const icon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "job_running":
      return "▶";
    case "job_succeeded":
      return "✓";
    case "job_failed":
      return "✕";
    case "job_started":
      return "◷";
    case "job_queued":
      return "⏳";
  }
};

const iconClass = (type: ActivityItem["type"]) => {
  switch (type) {
    case "job_running":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
    case "job_succeeded":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    case "job_failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "job_started":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    case "job_queued":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  }
};
</script>
