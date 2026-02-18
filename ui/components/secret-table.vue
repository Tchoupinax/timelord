<template>
  <div class="overflow-hidden">
    <div
      class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-dashed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
    >
      <div class="col-span-3">
        <h3
          class="text-sm font-semibold tracking-wide uppercase font-handwriting text-gray-700 dark:text-gray-200"
        >
          Name
        </h3>
      </div>
      <div class="col-span-4">
        <h3
          class="text-sm font-semibold tracking-wide uppercase font-handwriting text-gray-700 dark:text-gray-200"
        >
          Value
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold tracking-wide uppercase font-handwriting text-gray-700 dark:text-gray-200"
        >
          Created
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-semibold tracking-wide uppercase font-handwriting text-gray-700 dark:text-gray-200"
        >
          Last read
        </h3>
      </div>
      <div class="col-span-1">
        <h3
          class="text-sm font-semibold tracking-wide uppercase font-handwriting text-gray-700 dark:text-gray-200"
        >
          Actions
        </h3>
      </div>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-700/60">
      <SecretRow
        v-for="secret in secrets"
        :key="secret.id"
        :secret="secret"
        @view-result="showResult"
      />
    </div>

    <div
      v-if="secrets.length === 0"
      class="flex flex-col items-center justify-center px-6 py-16"
    >
      <div
        class="flex items-center justify-center w-20 h-20 mb-6 border rounded-full bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-600"
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
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>
      <h3
        class="mb-3 text-xl font-medium font-handwriting text-gray-900 dark:text-gray-50"
      >
        No secrets found
      </h3>
      <p
        class="max-w-sm text-center text-neutral-600 dark:text-gray-300 font-handwriting"
      >
        Get started by creating your first secret to securely store sensitive
        information.
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
  secrets: {
    type: Array,
    required: true,
  },
});

const selectedResult = ref(null);

const showResult = result => {
  selectedResult.value = result;
};
</script>
