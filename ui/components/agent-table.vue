<template>
  <div class="overflow-hidden">
    <div
      class="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-dashed border-gray-200 dark:border-gray-700"
    >
      <div class="col-span-3">
        <h3
          class="text-sm font-handwriting font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
        >
          Name
        </h3>
      </div>
      <div class="col-span-3">
        <h3
          class="text-sm font-handwriting font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
        >
          Version
        </h3>
      </div>
      <div class="col-span-3">
        <h3
          class="text-sm font-handwriting font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
        >
          Last Seen
        </h3>
      </div>
      <div class="col-span-2">
        <h3
          class="text-sm font-handwriting font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
        >
          Status
        </h3>
      </div>
      <div class="col-span-1">
        <h3
          class="text-sm font-handwriting font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide"
        >
          Actions
        </h3>
      </div>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-700/60">
      <AgentRow
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        @view-result="showResult"
        @delete-agent="deleteAgent"
      />
    </div>

    <div
      v-if="agents.length === 0"
      class="flex flex-col items-center justify-center py-16 px-6"
    >
      <div
        class="flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800/40 rounded-full mb-6 border border-gray-300 dark:border-gray-600"
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
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>
      </div>
      <h3
        class="text-xl font-handwriting font-medium text-gray-900 dark:text-gray-50 mb-3"
      >
        No agents found
      </h3>
      <p
        class="text-neutral-600 dark:text-gray-300 text-center max-w-sm font-handwriting"
      >
        Get started by creating your first agent to begin managing your
        infrastructure.
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

const emit = defineEmits(["delete-agent"]);
defineProps({
  agents: {
    type: Array,
    required: true,
  },
});

const selectedResult = ref(null);

const showResult = result => {
  selectedResult.value = result;
};

const deleteAgent = agentName => {
  emit("delete-agent", agentName);
};
</script>
