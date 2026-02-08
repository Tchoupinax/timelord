<template>
  <div
    v-if="jsonObject"
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
          class="text-gray-600 transition-colors duration-200 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>

      <div class="h-[calc(100%-45px)] p-2 pt-4 overflow-auto bg-gray-50">
        <div v-html="jsonObject"></div>
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
      logs: "",
      jsonObject: "",
    };
  },
  async mounted() {
    const shiki = await getHighlighter({
      themes: ["nord", "dark-plus"],
      langs: ["javascript"],
    });

    await shiki.loadTheme("vitesse-light");
    await shiki.loadLanguage("bash");

    const config = useRuntimeConfig();
    this.logs = await fetch(
      `${config.public.apiEndpoint}/logs?jobId=${this.$props.jobId}`,
      {
        credentials: "include",
      },
    ).then(res => res.text());

    this.logs += "\n";

    this.jsonObject = shiki.codeToHtml(this.logs, {
      theme: "none",
      lang: "",
      defaultColor: "light",
    });

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
