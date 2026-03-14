<template>
  <span
    v-if="count !== null"
    class="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
  >
    {{ count }}
  </span>
</template>

<script setup lang="ts">
const { count } = useOnlineAgentsCount();
</script>
