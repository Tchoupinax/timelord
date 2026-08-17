<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="h-full overflow-hidden bg-white shadow-lg xl:rounded-lg xl:w-3/4 xl:h-3/4"
    >
      <div
        class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700"
      >
        <h3 class="text-lg font-bold dark:text-gray-200">Job logs</h3>
        <button
          class="text-neutral-600 transition-colors duration-200 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>

      <div class="h-[calc(100%-45px)] p-2 pt-4 overflow-auto bg-gray-50">
        <div ref="highlightedLogs" />
        <p v-if="showEmpty" class="px-4 text-sm text-neutral-500 dark:text-gray-400">
          No logs for this job.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getHighlighter } from "shikiji";

export default {
  props: {
    jobId: {
      type: String,
      default: "",
    },
  },
  emits: ["close"],
  data() {
    return {
      isOpen: true,
      logs: "",
      showEmpty: false,
    };
  },
  async mounted() {
    const config = useRuntimeConfig();

    try {
      const response = await fetch(
        `${config.public.apiEndpoint}/logs?jobId=${this.$props.jobId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to load logs (${response.status})`);
      }

      this.logs = await response.text();

      if (!this.logs.trim()) {
        this.showEmpty = true;
        return;
      }

      const shiki = await getHighlighter({
        themes: ["nord", "dark-plus"],
        langs: ["javascript"],
      });

      await shiki.loadTheme("vitesse-light");
      await shiki.loadLanguage("bash");

      this.logs += "\n";

      const highlightedLogs = this.$refs.highlightedLogs as HTMLElement | undefined;
      if (highlightedLogs) {
        highlightedLogs.innerHTML = shiki.codeToHtml(this.logs, {
          theme: "none",
          lang: "",
          defaultColor: "light",
        });
      }
    } catch (error) {
      console.error("Failed to load job logs:", error);
      this.showEmpty = true;
    }

    document.addEventListener("keydown", evt => {
      if (evt.key === "Escape") {
        this.$emit("close");
      }
    });
  },
};
</script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
</style>

<style>
code {
  counter-reset: step;
  counter-increment: step 0;
}

code .line::before {
  content: counter(step);
  counter-increment: step;
  width: 1rem;
  margin-right: 1.5rem;
  display: inline-block;
  text-align: right;
  color: rgba(115, 138, 148, 0.8);
}
</style>
