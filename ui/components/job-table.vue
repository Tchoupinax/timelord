<template>
  <div class="overflow-hidden">
    <div
      class="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600"
    >
      <div class="col-span-3">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Title
        </h3>
      </div>
      <div class="col-span-2 hidden xl:block">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Hostname
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Created
        </h3>
      </div>
      <div class="col-span-2 hidden xl:block">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Schedule
        </h3>
      </div>
      <div class="col-span-2 hidden xl:block">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Actions
        </h3>
      </div>
      <div class="col-span-1">
        <h3
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
        >
          Logs
        </h3>
      </div>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-600">
      <JobRow
        v-for="job in jobs"
        :key="job.id"
        :job="job"
        @view-result="showResult"
      />
    </div>

    <div
      v-if="jobs.length === 0"
      class="flex flex-col items-center justify-center py-12 px-6"
    >
      <div
        class="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-8 h-8 text-gray-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No jobs found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 text-center max-w-sm">
        No jobs have been executed yet. Jobs will appear here once they are
        created and run.
      </p>
    </div>

    <JobResultModal
      v-if="selectedResult"
      :job-id="selectedResult"
      @close="selectedResult = null"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  jobs: {
    type: Array,
    required: true,
  },
});

const selectedResult = ref(null);

const showResult = result => {
  selectedResult.value = result;
};
</script>

<style scoped>
.row {
  @apply dark:bg-primary-dark dark:text-primary-light px-4 py-2 text-neutral-600 flex items-center;
}
</style>
