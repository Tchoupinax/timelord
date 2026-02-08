<template>
  <div class="flex items-center justify-center mt-8 space-x-2">
    <button
      class="hidden px-4 py-2 text-gray-600 bg-gray-200 rounded-lg xl:inline hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500/50 focus:outline-none transition duration-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
      :disabled="currentIndex === 0"
      @click="selectMethod(0)"
    >
      Before
    </button>

    <button
      class="hidden px-4 py-2 text-gray-600 bg-gray-200 rounded-lg xl:inline hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500/50 focus:outline-none transition duration-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
      :disabled="currentIndex === 0"
      @click="selectMethod(currentIndex - 1)"
    >
      Previous
    </button>

    <div
      v-for="index in [currentIndex - 1, currentIndex, currentIndex + 1]"
      :key="index"
    >
      <button
        class="px-4 py-2 rounded-lg transition duration-200 focus:ring-2 focus:outline-none"
        :class="{
          'text-white bg-primary hover:bg-primary/90 focus:ring-primary/50':
            index === currentIndex,
          'text-gray-600 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500/50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500':
            index !== currentIndex,
        }"
        @click="selectMethod(1)"
      >
        {{ index + 1 }}
      </button>
    </div>

    <button
      class="hidden px-4 py-2 text-gray-600 bg-gray-200 rounded-lg xl:inline hover:bg-gray-300 focus:ring-2 focus:ring-gray-500/50 focus:outline-none transition duration-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
      @click="selectMethod(currentIndex + 1)"
    >
      Next
    </button>

    <button
      class="hidden px-4 py-2 text-gray-600 bg-gray-200 rounded-lg xl:inline hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-500/50 focus:outline-none transition duration-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
      @click="selectMethod(currentIndex + 10)"
    >
      End
    </button>
  </div>
</template>

<script lang="ts">
export default {
  emits: ["pageSelected"],
  data() {
    return {
      currentIndex: 0,
    };
  },
  methods: {
    selectMethod(n: number) {
      this.$emit("pageSelected", n);
      this.currentIndex = n;
    },
  },
};
</script>
