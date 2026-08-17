<template>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/30"
  >
    <div class="flex items-center col-span-3">
      <div class="flex items-center space-x-3">
        <div
          class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-800/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 text-gray-700 dark:text-gray-300"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
        </div>
        <div class="flex items-center space-x-2">
          <div class="min-w-0">
            <span class="font-medium text-gray-900 truncate dark:text-white block">{{
              job.title
            }}</span>
            <span
              v-if="job.statusComment"
              v-tippy="{ content: job.statusComment }"
              class="text-xs text-red-600 dark:text-red-300 truncate block cursor-help"
            >
              {{ job.statusComment }}
            </span>
          </div>
          <div class="flex items-center">
            <div
              v-if="job.statusCode === 0 || !job.statusCode"
              class="w-2 h-2 bg-gray-700 rounded-full dark:bg-gray-300"
              title="Success"
            ></div>
            <div
              v-else-if="job.statusCode > 0"
              v-tippy="{
                content:
                  job.statusComment ?? `Exited with code ${job.statusCode}`,
              }"
              class="w-2 h-2 bg-gray-400 rounded-full cursor-pointer dark:bg-gray-500"
              title="Failed"
            ></div>
            <div
              v-else
              v-tippy="{ content: `Job in progress` }"
              class="w-2 h-2 bg-gray-400 rounded-full cursor-pointer dark:bg-gray-500 animate-pulse"
              title="Running"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="items-center hidden col-span-2 xl:flex">
      <span class="text-sm text-neutral-600 dark:text-gray-400">{{
        job.hostname
      }}</span>
    </div>

    <div class="flex items-center col-span-2">
      <div
        v-tippy="{ content: job.createdAt }"
        class="text-sm text-neutral-600 dark:text-gray-400"
      >
        {{ format(job.createdAt) }}
      </div>
    </div>

    <div class="items-center hidden col-span-2 xl:flex">
      <span class="font-mono text-sm text-neutral-600 dark:text-gray-400">{{
        job.cron
      }}</span>
    </div>

    <div class="items-center hidden col-span-2 space-x-2 xl:flex">
      <button
        class="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
        @click="viewResult"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 mr-1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
        View
      </button>

      <button
        v-if="job.statusCode === -1"
        class="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="stopping || Boolean(job.cancelRequestedAt)"
        :title="job.cancelRequestedAt ? 'Stopping...' : 'Stop running job'"
        @click="stopJob(job.id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 mr-1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
          />
        </svg>
        {{ job.cancelRequestedAt ? "Stopping..." : "Stop" }}
      </button>

      <button
        class="flex items-center justify-center w-8 h-8 text-gray-700 transition-colors duration-200 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/20"
        title="Requeue job"
        @click="putJobInQueue(job.title)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>

    <div class="flex items-center col-span-1">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-neutral-600 dark:text-gray-400">{{
          job.logsCount
        }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 text-gray-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";

const { notify } = useNotification();

const emit = defineEmits(["view-result"]);
const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
});

const stopping = ref(false);

const viewResult = () => {
  emit("view-result", props.job.id);
};

const putJobInQueue = async (title: string) => {
  const config = useRuntimeConfig();
  const url = `${config.public.apiEndpoint}/jobs/queue`;

  fetch(url, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  })
    .then(() => {
      notify({ title: "Job added in the queue", type: "success", text: title });
    })
    .catch(() => {
      notify({
        title: "Error to add job to the queue",
        type: "error",
        text: title,
      });
    });
};

const stopJob = async (jobId: string) => {
  const config = useRuntimeConfig();
  stopping.value = true;

  try {
    const response = await fetch(
      `${config.public.apiEndpoint}/jobs/${jobId}/cancel`,
      {
        credentials: "include",
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to stop job (${response.status})`);
    }

    notify({
      title: "Stop requested",
      type: "success",
      text: "The agent will stop this job shortly",
    });
  } catch {
    notify({
      title: "Failed to stop job",
      type: "error",
    });
  } finally {
    stopping.value = false;
  }
};
</script>

<style scoped>
.row {
  @apply table-cell dark:bg-primary-dark dark:text-primary-light px-4 py-2 text-neutral-600 items-center;
}
.hidden-row {
  @apply hidden px-4 py-2 text-neutral-600 xl:table-cell dark:bg-primary-dark dark:text-primary-light;
}
</style>
