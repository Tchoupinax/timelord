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
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold dark:text-gray-200">Job logs</h3>
          <span
            v-if="isLive"
            class="text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            Live
          </span>
        </div>
        <button
          class="text-neutral-600 transition-colors duration-200 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>

      <div
        ref="logScrollContainer"
        class="h-[calc(100%-45px)] p-2 pt-4 overflow-auto bg-gray-50"
      >
        <div ref="highlightedLogs" />
        <p v-if="showEmpty" class="px-4 text-sm text-neutral-500 dark:text-gray-400">
          No logs for this job.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getHighlighter, type Highlighter } from "shikiji";

const POLL_INTERVAL_MS = 2000;
const TAIL_POLLS_AFTER_JOB_END = 3;

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
      lastLogIndex: -1,
      isLive: false,
      tailPollsLeft: 0,
      pollTimer: null as ReturnType<typeof setInterval> | null,
      shiki: null as Highlighter | null,
      onKeydown: null as ((evt: KeyboardEvent) => void) | null,
    };
  },
  async mounted() {
    this.onKeydown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        this.$emit("close");
      }
    };
    document.addEventListener("keydown", this.onKeydown);

    try {
      await this.loadShiki();
      const { running } = await this.fetchLogs();
      await this.renderLogs();

      if (running) {
        this.isLive = true;
        this.tailPollsLeft = TAIL_POLLS_AFTER_JOB_END;
        this.startPolling();
      }
    } catch (error) {
      console.error("Failed to load job logs:", error);
      this.showEmpty = true;
    }
  },
  beforeUnmount() {
    this.stopPolling();
    if (this.onKeydown) {
      document.removeEventListener("keydown", this.onKeydown);
    }
  },
  methods: {
    async loadShiki() {
      const shiki = await getHighlighter({
        themes: ["nord", "dark-plus"],
        langs: ["javascript"],
      });

      await shiki.loadTheme("vitesse-light");
      await shiki.loadLanguage("bash");
      this.shiki = shiki;
    },
    logsUrl(afterIndex?: number) {
      const config = useRuntimeConfig();
      const url = new URL(`${config.public.apiEndpoint}/logs`);
      url.searchParams.set("jobId", this.$props.jobId);
      url.searchParams.set("format", "json");
      if (afterIndex !== undefined && afterIndex >= 0) {
        url.searchParams.set("afterIndex", String(afterIndex));
      }
      return url.toString();
    },
    async fetchLogs(afterIndex?: number) {
      const response = await fetch(this.logsUrl(afterIndex), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to load logs (${response.status})`);
      }

      const payload = (await response.json()) as {
        content: string;
        maxLogIndex: number;
        jobRunning: boolean;
      };

      const maxIndex = payload.maxLogIndex;
      const running = payload.jobRunning;
      const chunk = payload.content ?? "";

      if (chunk) {
        if (this.logs.length > 0) {
          this.logs += "\n";
        }
        this.logs += chunk;
        this.showEmpty = false;
      } else {
        this.showEmpty = !this.logs.trim() && !running;
      }

      if (!Number.isNaN(maxIndex)) {
        this.lastLogIndex = maxIndex;
      }

      return { running, hadNew: chunk.length > 0 };
    },
    async renderLogs() {
      if (!this.logs.trim() || !this.shiki) {
        return;
      }

      const highlightedLogs = this.$refs.highlightedLogs as HTMLElement | undefined;
      if (!highlightedLogs) {
        return;
      }

      const text = this.logs.endsWith("\n") ? this.logs : `${this.logs}\n`;
      highlightedLogs.innerHTML = this.shiki.codeToHtml(text, {
        theme: "none",
        lang: "",
        defaultColor: "light",
      });

      const scrollContainer = this.$refs.logScrollContainer as
        | HTMLElement
        | undefined;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    },
    startPolling() {
      if (this.pollTimer) {
        return;
      }

      this.pollTimer = setInterval(async () => {
        try {
          const { running, hadNew } = await this.fetchLogs(this.lastLogIndex);
          if (hadNew) {
            await this.renderLogs();
          }

          if (running) {
            this.isLive = true;
            this.tailPollsLeft = TAIL_POLLS_AFTER_JOB_END;
            return;
          }

          this.isLive = false;

          if (this.tailPollsLeft > 0) {
            this.tailPollsLeft -= 1;
            if (this.tailPollsLeft === 0) {
              this.stopPolling();
            }
            return;
          }

          this.stopPolling();
        } catch (error) {
          console.error("Failed to refresh job logs:", error);
          this.isLive = false;
          this.stopPolling();
        }
      }, POLL_INTERVAL_MS);
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
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
