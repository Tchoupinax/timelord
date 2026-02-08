<template>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
    @click="viewResult"
  >
    <div class="flex items-center col-span-3">
      <div class="flex items-center space-x-3">
        <div
          class="flex items-center justify-center w-10 h-10 border bg-black dark:bg-white rounded-xl border-gray-300 dark:border-gray-600"
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
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <span
          class="font-medium transition-colors duration-200 font-handwriting text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white"
          >{{ secret.name }}</span
        >
      </div>
    </div>

    <div class="flex items-center col-span-4">
      <FormHiddenPassword :value="secret.value" />
    </div>

    <div class="flex items-center col-span-2">
      <div
        v-tippy="{ content: secret.createdAt }"
        class="text-sm transition-colors duration-200 text-gray-700 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        {{ format(secret.createdAt) }}
      </div>
    </div>

    <div class="flex items-center col-span-2">
      <div
        v-if="secret.lastRead"
        v-tippy="{ content: secret.lastRead }"
        class="text-sm transition-colors duration-200 text-gray-700 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        {{ format(secret.lastRead) }}
      </div>
      <div
        v-else
        class="text-sm italic transition-colors duration-200 text-gray-700 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        Never used
      </div>
    </div>

    <div class="flex items-center justify-end col-span-1">
      <button
        class="flex items-center justify-center w-10 h-10 text-gray-500 transition-all duration-200 border border-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/30 dark:border-gray-600 rounded-xl hover:scale-110"
        title="Delete secret"
        @click.stop="deleteSecret(secret.name)"
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
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";

const emit = defineEmits(["view-result"]);
const props = defineProps({
  secret: {
    type: Object,
    required: true,
  },
});
const config = useRuntimeConfig();

const viewResult = () => {
  emit("view-result", props.secret.id);
};

const deleteSecret = async (secretName: string) => {
  await fetch(`${config.public.apiEndpoint}/secrets`, {
    credentials: "include",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: secretName,
    }),
  });
};
</script>
