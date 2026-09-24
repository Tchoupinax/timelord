<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
    @click.self="emit('close')"
  >
    <div
      class="flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden bg-white shadow-xl dark:bg-gray-900 xl:rounded-xl"
      role="dialog"
      aria-labelledby="job-logs-title"
    >
      <header
        class="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <h3
            id="job-logs-title"
            class="truncate text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            Job logs
          </h3>
          <span
            v-if="isLive"
            class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            Live
          </span>
          <span
            v-if="totalLogCount > 0"
            class="truncate text-xs text-gray-500 dark:text-gray-400"
          >
            <template v-if="entries.length >= totalLogCount">
              {{ totalLogCount.toLocaleString() }} lines
            </template>
            <template v-else-if="entries.length > 0">
              Showing lines
              {{ (entries[0]!.index + 1).toLocaleString() }}–{{
                (entries.at(-1)!.index + 1).toLocaleString()
              }}
              of {{ totalLogCount.toLocaleString() }}
            </template>
          </span>
        </div>

        <div
          class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap"
        >
          <label class="relative min-w-0 flex-1 sm:flex-initial sm:w-48">
            <span class="sr-only">Search logs</span>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search…"
              class="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <span
              class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            >
              ⌕
            </span>
          </label>

          <label
            class="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
          >
            <input
              v-model="followTail"
              type="checkbox"
              class="rounded border-gray-300 dark:border-gray-600"
            />
            Follow tail
          </label>

          <button
            type="button"
            class="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            :disabled="entries.length === 0"
            title="Downloads lines currently loaded in the viewer"
            @click="downloadLogs"
          >
            Download
          </button>

          <button
            type="button"
            class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            @click="emit('close')"
          >
            Close
          </button>
        </div>
      </header>

      <div
        v-if="hasOlder && !loadingOlder"
        class="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center dark:border-amber-900/50 dark:bg-amber-950/40"
      >
        <button
          type="button"
          class="text-sm font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
          @click="loadOlder"
        >
          Load older lines
        </button>
        <span class="ml-2 text-xs text-amber-700/80 dark:text-amber-300/80">
          (scroll to top also loads more)
        </span>
      </div>

      <div
        v-if="loadingOlder"
        class="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-2 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        Loading older lines…
      </div>

      <div
        ref="scrollContainer"
        class="min-h-0 flex-1 overflow-auto bg-gray-50 dark:bg-gray-950"
        @scroll="onScroll"
      >
        <p
          v-if="showEmpty"
          class="px-4 py-8 text-sm text-neutral-500 dark:text-gray-400"
        >
          No logs for this job.
        </p>

        <p
          v-else-if="searchQuery && filteredEntries.length === 0"
          class="px-4 py-8 text-sm text-neutral-500 dark:text-gray-400"
        >
          No lines match “{{ searchQuery }}”.
        </p>

        <div
          v-else
          :style="{ height: `${virtualTotalHeight}px`, position: 'relative' }"
        >
          <div
            class="absolute left-0 right-0 font-mono text-[13px] leading-5"
            :style="{ transform: `translateY(${virtualOffsetY}px)` }"
          >
            <div
              v-for="entry in visibleEntries"
              :key="entry.index"
              class="flex h-5 shrink-0 gap-3 px-3 hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
              :class="lineClass(entry)"
            >
              <span
                class="w-14 shrink-0 select-none text-right tabular-nums text-gray-400 dark:text-gray-500"
              >
                {{ entry.index + 1 }}
              </span>
              <span
                class="min-w-0 flex-1 overflow-x-auto whitespace-pre text-gray-900 dark:text-gray-100"
                v-html="highlightContent(entry.content)"
              />
            </div>
          </div>
        </div>
      </div>

      <footer
        v-if="searchQuery && filteredEntries.length > 0"
        class="shrink-0 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        {{ filteredEntries.length }} matching line{{
          filteredEntries.length === 1 ? "" : "s"
        }}
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ jobId: string }>();
const emit = defineEmits<{ close: [] }>();

const POLL_INTERVAL_MS = 2000;
const TAIL_POLLS_AFTER_JOB_END = 3;
const INITIAL_TAIL = 1500;
const OLDER_PAGE = 500;
const LINE_HEIGHT_PX = 20;
const VIRTUAL_OVERSCAN = 25;
const LOAD_OLDER_THRESHOLD_PX = 80;

type LogEntry = { index: number; content: string };

type LogsPayload = {
  content: string;
  entries: LogEntry[];
  maxLogIndex: number;
  minLogIndex: number;
  totalLogCount: number;
  hasOlder: boolean;
  jobRunning: boolean;
};

const entries = ref<LogEntry[]>([]);
const showEmpty = ref(false);
const lastLogIndex = ref(-1);
const totalLogCount = ref(0);
const hasOlder = ref(false);
const isLive = ref(false);
const tailPollsLeft = ref(0);
const loadingOlder = ref(false);
const followTail = ref(true);
const searchQuery = ref("");
const scrollTop = ref(0);
const viewportHeight = ref(480);

const scrollContainer = ref<HTMLElement | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const config = useRuntimeConfig();

const displayEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    return entries.value;
  }
  return entries.value.filter(entry =>
    entry.content.toLowerCase().includes(q),
  );
});

const filteredEntries = displayEntries;

const virtualTotalHeight = computed(
  () => filteredEntries.value.length * LINE_HEIGHT_PX,
);

const virtualStartIndex = computed(() =>
  Math.max(
    0,
    Math.floor(scrollTop.value / LINE_HEIGHT_PX) - VIRTUAL_OVERSCAN,
  ),
);

const virtualVisibleCount = computed(() =>
  Math.ceil(viewportHeight.value / LINE_HEIGHT_PX) + VIRTUAL_OVERSCAN * 2,
);

const virtualOffsetY = computed(
  () => virtualStartIndex.value * LINE_HEIGHT_PX,
);

const visibleEntries = computed(() =>
  filteredEntries.value.slice(
    virtualStartIndex.value,
    virtualStartIndex.value + virtualVisibleCount.value,
  ),
);

function logsUrl(params: Record<string, string>) {
  const url = new URL(`${config.public.apiEndpoint}/logs`);
  url.searchParams.set("jobId", props.jobId);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fetchLogs(params: Record<string, string> = {}) {
  const response = await fetch(logsUrl(params), { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to load logs (${response.status})`);
  }
  const payload = (await response.json()) as LogsPayload;
  if (!payload.entries?.length && payload.content) {
    payload.entries = payload.content
      .split("\n")
      .filter((line, index, lines) => line.length > 0 || index < lines.length - 1)
      .map((content, index) => ({ index, content }));
  }
  payload.entries ??= [];
  return payload;
}

function mergeEntries(incoming: LogEntry[], mode: "replace" | "append" | "prepend") {
  if (mode === "replace") {
    entries.value = incoming;
    return;
  }

  const byIndex = new Map(entries.value.map(entry => [entry.index, entry]));
  for (const entry of incoming) {
    byIndex.set(entry.index, entry);
  }
  entries.value = [...byIndex.values()].sort((a, b) => a.index - b.index);
}

async function loadInitial() {
  const payload = await fetchLogs({ tail: String(INITIAL_TAIL) });
  mergeEntries(payload.entries, "replace");
  totalLogCount.value = payload.totalLogCount;
  hasOlder.value = payload.hasOlder;
  lastLogIndex.value = payload.maxLogIndex;
  showEmpty.value =
    payload.totalLogCount === 0 && !payload.jobRunning;

  if (payload.jobRunning) {
    isLive.value = true;
    tailPollsLeft.value = TAIL_POLLS_AFTER_JOB_END;
    followTail.value = true;
    startPolling();
  }

  await nextTick();
  scrollToBottom();
}

async function loadOlder() {
  if (loadingOlder.value || !hasOlder.value || entries.value.length === 0) {
    return;
  }

  const container = scrollContainer.value;
  const beforeIndex = entries.value[0]!.index;
  const previousScrollHeight = container?.scrollHeight ?? 0;

  loadingOlder.value = true;
  try {
    const payload = await fetchLogs({
      beforeIndex: String(beforeIndex),
      limit: String(OLDER_PAGE),
    });
    if (payload.entries.length === 0) {
      hasOlder.value = false;
      return;
    }
    mergeEntries(payload.entries, "prepend");
    hasOlder.value = payload.hasOlder;
    totalLogCount.value = payload.totalLogCount;

    await nextTick();
    if (container) {
      const delta = container.scrollHeight - previousScrollHeight;
      container.scrollTop += delta;
    }
  } finally {
    loadingOlder.value = false;
  }
}

function startPolling() {
  if (pollTimer) {
    return;
  }

  pollTimer = setInterval(async () => {
    try {
      const payload = await fetchLogs({
        afterIndex: String(lastLogIndex.value),
      });
      totalLogCount.value = payload.totalLogCount;

      if (payload.entries.length > 0) {
        mergeEntries(payload.entries, "append");
        lastLogIndex.value = payload.maxLogIndex;
        showEmpty.value = false;
        await nextTick();
        if (followTail.value) {
          scrollToBottom();
        }
      }

      if (payload.jobRunning) {
        isLive.value = true;
        tailPollsLeft.value = TAIL_POLLS_AFTER_JOB_END;
        return;
      }

      isLive.value = false;
      if (tailPollsLeft.value > 0) {
        tailPollsLeft.value -= 1;
        if (tailPollsLeft.value === 0) {
          stopPolling();
        }
        return;
      }
      stopPolling();
    } catch (error) {
      console.error("Failed to refresh job logs:", error);
      isLive.value = false;
      stopPolling();
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function scrollToBottom() {
  const container = scrollContainer.value;
  if (!container) {
    return;
  }
  container.scrollTop = container.scrollHeight;
}

function onScroll() {
  const container = scrollContainer.value;
  if (!container) {
    return;
  }

  scrollTop.value = container.scrollTop;
  viewportHeight.value = container.clientHeight;

  const atBottom =
    container.scrollTop + container.clientHeight >=
    container.scrollHeight - LOAD_OLDER_THRESHOLD_PX;
  followTail.value = atBottom;

  if (
    container.scrollTop < LOAD_OLDER_THRESHOLD_PX &&
    hasOlder.value &&
    !loadingOlder.value &&
    !searchQuery.value.trim()
  ) {
    void loadOlder();
  }
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlightContent(content: string) {
  const escaped = escapeHtml(content);
  const q = searchQuery.value.trim();
  if (!q) {
    return escaped;
  }
  const lower = content.toLowerCase();
  const query = q.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) {
    return escaped;
  }
  const before = escapeHtml(content.slice(0, idx));
  const match = escapeHtml(content.slice(idx, idx + q.length));
  const after = escapeHtml(content.slice(idx + q.length));
  return `${before}<mark class="rounded bg-amber-200 px-0.5 dark:bg-amber-600/50">${match}</mark>${after}`;
}

function lineClass(entry: LogEntry) {
  const text = entry.content;
  if (/\bERROR\b/i.test(text) || /\berror:/i.test(text)) {
    return "border-l-2 border-red-400 pl-2 dark:border-red-500";
  }
  if (/\bWARN(ING)?\b/i.test(text)) {
    return "border-l-2 border-amber-400 pl-2 dark:border-amber-500";
  }
  return "";
}

function downloadLogs() {
  const body = entries.value.map(entry => entry.content).join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `job-${props.jobId.slice(0, 8)}-logs.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  const onEscape = (evt: KeyboardEvent) => {
    if (evt.key === "Escape") {
      emit("close");
    }
  };
  document.addEventListener("keydown", onEscape);

  try {
    await loadInitial();
  } catch (error) {
    console.error("Failed to load job logs:", error);
    showEmpty.value = true;
  }

  await nextTick();
  const container = scrollContainer.value;
  if (container) {
    viewportHeight.value = container.clientHeight;
    scrollTop.value = container.scrollTop;
    resizeObserver = new ResizeObserver(() => {
      if (scrollContainer.value) {
        viewportHeight.value = scrollContainer.value.clientHeight;
      }
    });
    resizeObserver.observe(container);
  }

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onEscape);
    resizeObserver?.disconnect();
    stopPolling();
  });
});
</script>

<style scoped>
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}
:deep(.dark) ::-webkit-scrollbar-thumb {
  background-color: #475569;
}
</style>
