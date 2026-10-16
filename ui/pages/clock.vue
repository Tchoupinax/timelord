<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <ModalAuthentication v-if="!isAuthenticated" />

    <header
      class="px-6 py-10 border-b border-gray-200 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm dark:border-gray-800"
    >
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <TimelordMark class="w-14 h-14 shrink-0" />
            <h1
              class="relative text-3xl text-gray-900 font-handwriting dark:text-white"
            >
              Clock
            </h1>
          </div>

          <nav class="flex items-center space-x-2">
            <NuxtLink
              to="/"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              Dashboard
            </NuxtLink>

            <nav-link-clock />
            <NavLinkActivity />
            <NavLinkAgents />

            <NuxtLink
              to="/git-config"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
              Git Config
            </NuxtLink>

            <NuxtLink
              to="/secrets"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              Secrets
            </NuxtLink>

            <NuxtLink
              to="/settings"
              class="relative flex items-center px-6 py-3 text-lg text-gray-800 transition-all duration-200 border border-transparent group dark:text-gray-200 hover:text-black dark:hover:text-white font-handwriting rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 3.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 3.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-3.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-3.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              Settings
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="px-6 py-8 mx-auto max-w-7xl">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-4xl text-gray-900 font-handwriting dark:text-white">
            {{ clockLabel }}
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 font-handwriting">
            {{ dateLabel }}
          </p>
        </div>
        <p class="max-w-md text-sm text-gray-500 dark:text-gray-400 font-handwriting">
          Next times each script’s When opens. Add
          <span class="text-gray-800 dark:text-gray-200">#&gt;&gt; Timezone: Europe/Paris</span>
          to pin that clock. Without it, the schedule is UTC.
        </p>
      </div>

      <div
        v-if="entries.length === 0 && unreadable.length === 0"
        class="p-10 text-center border border-gray-200 border-dashed dark:border-gray-700 rounded-3xl"
      >
        <p class="text-2xl text-gray-800 font-handwriting dark:text-gray-100">
          No scheduled scripts
        </p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 font-handwriting">
          A script shows up here once it has a #&gt;&gt; When: line in git.
        </p>
      </div>

      <ol v-else class="relative space-y-4">
        <li
          v-for="entry of entries"
          :key="`${entry.hostname}-${entry.title}`"
          class="relative p-6 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-3xl"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm text-gray-500 dark:text-gray-400 font-handwriting">
                {{ relativeLabel(entry.nextFires[0]) }}
              </p>
              <h2 class="mt-1 text-2xl text-gray-900 font-handwriting dark:text-white">
                {{ entry.title }}
              </h2>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-300 font-handwriting">
                <time :datetime="entry.nextFires[0]">{{ formatFire(entry.nextFires[0], entry) }}</time>
              </p>
            </div>

            <span
              class="inline-flex items-center px-3 py-1 text-xs border rounded-2xl font-handwriting"
              :class="periodClass(entry.openPeriod.state)"
            >
              {{ periodLabel(entry.openPeriod.state) }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2 mt-4">
            <span
              class="inline-flex items-center px-3 py-1 text-xs text-gray-800 border border-gray-300 rounded-2xl font-handwriting bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            >
              {{ entry.hostname }}
            </span>
            <span
              class="inline-flex items-center px-3 py-1 font-mono text-xs text-gray-700 border border-gray-200 rounded-2xl dark:text-gray-200 dark:border-gray-700"
            >
              {{ entry.cron }}
            </span>
            <span
              class="inline-flex items-center px-3 py-1 text-xs border rounded-2xl font-handwriting"
              :class="entry.timezoneInvalid
                ? 'text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-700 dark:bg-red-900/20'
                : 'text-gray-700 border-gray-200 dark:text-gray-200 dark:border-gray-700'"
            >
              {{ timezoneLabel(entry) }}
            </span>
          </div>

          <ol class="flex flex-wrap gap-2 mt-4">
            <li
              v-for="(fire, index) of entry.nextFires"
              :key="fire"
              class="px-3 py-1 text-xs border rounded-2xl font-handwriting"
              :class="index === 0
                ? 'text-gray-900 border-gray-400 bg-gray-100 dark:text-white dark:border-gray-500 dark:bg-gray-800'
                : 'text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700'"
            >
              <time :datetime="fire">{{ formatFire(fire, entry) }}</time>
            </li>
          </ol>
        </li>
      </ol>

      <section v-if="unreadable.length > 0" class="mt-8">
        <h2 class="mb-3 text-lg text-gray-900 font-handwriting dark:text-white">
          Could not read
        </h2>
        <ul class="space-y-2">
          <li
            v-for="script of unreadable"
            :key="`${script.hostname}-${script.title}`"
            class="px-4 py-3 text-sm border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-2xl"
          >
            <span class="font-handwriting text-gray-900 dark:text-gray-100">{{ script.title }}</span>
            <span class="text-gray-500 dark:text-gray-400"> · {{ script.hostname }}</span>
            <p class="mt-1 text-red-700 dark:text-red-300">{{ script.message }}</p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

import type { PeriodState, ScheduleEntry, ScheduleResponse } from "~/types/schedule";

const config = useRuntimeConfig();
const entries = ref<Array<ScheduleEntry>>([]);
const unreadable = ref<ScheduleResponse["unreadable"]>([]);
const now = ref(new Date());
const isAuthenticated = ref(true);

const clockLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now.value),
);

const dateLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now.value),
);

const periodLabel = (state: PeriodState): string => {
  switch (state) {
    case "success":
      return "This period succeeded";
    case "warning":
      return "This period finished with a warning";
    case "error":
      return "This period failed";
    case "running":
      return "Running";
    case "cancelled":
      return "This period was cancelled";
    case "waiting":
      return "Waiting for this period";
  }
};

const periodClass = (state: PeriodState): string => {
  switch (state) {
    case "success":
      return "text-green-800 bg-green-100 border-green-300 dark:text-green-200 dark:bg-green-900/30 dark:border-green-700";
    case "warning":
      return "text-yellow-800 bg-yellow-100 border-yellow-300 dark:text-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700";
    case "error":
      return "text-red-800 bg-red-100 border-red-300 dark:text-red-200 dark:bg-red-900/30 dark:border-red-700";
    case "running":
      return "text-violet-800 bg-violet-100 border-violet-300 dark:text-violet-200 dark:bg-violet-900/30 dark:border-violet-700";
    case "cancelled":
      return "text-orange-800 bg-orange-100 border-orange-300 dark:text-orange-200 dark:bg-orange-900/30 dark:border-orange-700";
    case "waiting":
      return "text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600";
  }
};

const timezoneLabel = (entry: ScheduleEntry): string => {
  if (!entry.timezone) {
    return "UTC";
  }

  if (entry.timezoneInvalid) {
    return `${entry.timezone} · unrecognized, using UTC`;
  }

  return entry.timezone;
};

const formatFire = (iso: string | undefined, entry: ScheduleEntry): string => {
  if (!iso) {
    return "";
  }

  const timeZone = entry.timezone && !entry.timezoneInvalid ? entry.timezone : "UTC";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso));
};

const relativeLabel = (iso: string | undefined): string => {
  if (!iso) {
    return "";
  }

  const totalMinutes = Math.floor((new Date(iso).getTime() - now.value.getTime()) / 1000 / 60);
  if (totalMinutes <= 0) {
    return "opening now";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: Array<string> = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  return `in ${parts.join(" and ")}`;
};

const refreshSchedule = async () => {
  try {
    const res = await fetch(`${config.public.apiEndpoint}/schedule`, {
      credentials: "include",
    });
    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as ScheduleResponse;
    entries.value = data.entries ?? [];
    unreadable.value = data.unreadable ?? [];
  } catch (err) {
    console.error("Failed to refresh schedule:", err);
  }
};

const { data } = await useFetch<ScheduleResponse>(
  `${config.public.apiEndpoint}/schedule`,
  { credentials: "include" },
);

entries.value = data.value?.entries ?? [];
unreadable.value = data.value?.unreadable ?? [];

let clockTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!document.cookie.includes("timelord-nickname")) {
    void fetch(`${config.public.apiEndpoint}/version`)
      .then(res => res.json())
      .then((version: { authenticationDisabled?: boolean }) => {
        if (!version.authenticationDisabled) {
          isAuthenticated.value = false;
        }
      });
  }

  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);
  refreshTimer = setInterval(() => {
    void refreshSchedule();
  }, 30000);
});

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>
