<template>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
  >
    <div
      class="flex items-center col-span-3 cursor-pointer"
      @click="viewResult"
    >
      <div class="flex items-center space-x-3">
        <div
          class="flex items-center justify-center w-10 h-10 bg-gray-200 border border-gray-300 dark:bg-gray-700 rounded-xl dark:border-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 text-gray-700 dark:text-gray-300"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
        </div>
        <span
          class="font-medium text-gray-900 transition-colors duration-200 font-handwriting dark:text-gray-100 group-hover:text-black dark:group-hover:text-white"
          >{{ agent.name }}</span
        >
      </div>
    </div>

    <div class="flex items-center col-span-3">
      <span
        class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-800 border border-gray-300 rounded-full font-handwriting bg-gray-50 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-600"
      >
        {{ agent.version }}
      </span>
    </div>

    <div class="flex items-center col-span-3">
      <div
        v-tippy="{
          content: agent.seenAt,
        }"
        class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        {{ agent.seenAt ? format(agent.seenAt) : "Never" }}
      </div>
    </div>

    <div class="flex items-center col-span-2">
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 border-2 rounded-full animate-pulse dark:border-gray-600"
          :class="{
            'border-gray-300 bg-gray-700 dark:bg-gray-300':
              new Date().getTime() - new Date(agent.seenAt).getTime() < 60e3,
            'border-gray-400 bg-gray-400 dark:bg-gray-500':
              new Date().getTime() - new Date(agent.seenAt).getTime() > 60e3,
          }"
        ></div>

        <span
          class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
          >{{
            new Date().getTime() - new Date(agent.seenAt).getTime() < 60e3
              ? "Active"
              : "Deactived"
          }}</span
        >
      </div>
    </div>

    <div class="flex items-center justify-center col-span-1">
      <button
        class="p-2 text-gray-500 transition-all duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/20 rounded-xl hover:scale-110"
        title="Delete agent"
        @click.stop="confirmDelete"
      >
        <svg
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
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";

const emit = defineEmits(["view-result", "delete-agent"]);
const props = defineProps({
  agent: {
    type: Object,
    required: true,
  },
});

const viewResult = () => {
  emit("view-result", props.agent.id);
};

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete agent "${props.agent.name}"?`)) {
    emit("delete-agent", props.agent.name);
  }
};
</script>

<style scoped>
.row {
  @apply dark:bg-primary-dark dark:text-primary-light px-4 py-2 text-gray-600;
}
</style>
