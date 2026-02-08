<template>
  <div class="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
    <div
      v-for="job of computedJobs"
      :key="job.title"
      class="relative p-6 overflow-hidden transition-all duration-300 bg-white border border-gray-200 cursor-pointer group dark:bg-gray-900 dark:border-gray-700 rounded-3xl hover:shadow-xl"
    >
      <div class="relative z-10 flex items-start justify-between mb-4">
        <div class="w-full min-w-0">
          <h3
            v-tippy="{ content: job.title }"
            class="w-auto text-xl text-gray-900 truncate font-handwriting dark:text-gray-100"
          >
            {{ job.title }}
          </h3>

          <p
            v-if="
              getCronInterval(job) <
              Math.floor(
                // @ts-expect-error
                (new Date() - new Date(job.jobs[0]?.createdAt)) / 1000 / 60,
              )
            "
            class="my-2 text-xl text-gray-500"
          >
            {{ performDelayedSentence(job) }}
          </p>

          <div class="flex justify-between w-full mt-4">
            <span
              class="inline-flex items-center px-3 py-1 text-xs text-gray-800 border border-gray-300 rounded-2xl font-handwriting bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            >
              {{ job.hostname }}
            </span>

            <button
              v-if="
                !launchedTitles.has(job.title) && !job?.jobs[0]?.queuePending
              "
              type="button"
              :disabled="launchingTitle === job.title"
              class="flex items-center px-4 py-2 text-gray-700 transition-all duration-200 border border-gray-300 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 font-handwriting active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              :class="{ 'animate-pulse': launchingTitle === job.title }"
              @click="startJobNow(job.title)"
            >
              <svg
                v-if="launchingTitle !== job.title"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-2 animate-spin"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {{ launchingTitle === job.title ? "Queuing…" : "Launch" }}
            </button>

            <div
              v-if="
                // @ts-expect-error
                job.jobs[0].queuePending ||
                (launchedTitles.has(job.title) &&
                  !job.jobs.some(j => j.statusCode === -1))
              "
              class="flex items-center px-4 py-1.5 space-x-2 border-2 rounded-2xl bg-yellow-100 dark:bg-yellow-500/20 border-yellow-400 dark:border-yellow-500 shadow-md shadow-yellow-200/50 dark:shadow-yellow-500/10 animate-pulse"
            >
              <div
                class="w-3 h-3 bg-yellow-500 rounded-full dark:bg-yellow-400"
              ></div>
              <span
                class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 font-handwriting"
                >Queued</span
              >
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasBeenExecutedAtLeastOnce(job)" class="relative z-10 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm text-gray-800 font-handwriting dark:text-gray-200">
            Recent Executions
          </h4>

          <div
            class="flex items-center text-xs text-gray-500 dark:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 mr-1"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span
              v-tippy="{ content: displayedJobs(job).at(-1)?.updatedAt }"
              class="font-handwriting"
            >
              {{ format(displayedJobs(job).at(-1)?.updatedAt!) }}
            </span>
          </div>
        </div>

        <div class="flex space-x-1">
          <div
            v-for="(_, idx) in ((jobMetadata[job.title] ??
              Math.max(10, displayedJobs(job).length)) as number) -
            displayedJobs(job).length"
            :key="'empty-' + idx"
            class="flex-1 h-8 transition-all duration-200 border border-gray-400 rounded-lg bg-gray-200/30 dark:bg-gray-700/30"
          ></div>
          <div
            v-for="subJob of displayedJobs(job)"
            :key="subJob.id"
            v-tippy="{
              content: `${format(subJob.updatedAt)} - ${subJob.statusCode === 0 ? 'Success' : subJob.statusCode === -1 ? 'Running' : 'Failed'}`,
            }"
            class="flex-1 h-8 transition-all duration-200 border rounded-lg cursor-pointer hover:scale-105 border-white/20"
            :class="{
              'bg-green-400/50 hover:bg-green-500/60 border-green-500/50 dark:bg-green-500/40 dark:hover:bg-green-400/50 dark:border-green-500/40':
                subJob.statusCode === 0,
              'bg-red-400/50 hover:bg-red-500/60 border-red-500/50 dark:bg-red-500/40 dark:hover:bg-red-400/50 dark:border-red-500/40':
                subJob.statusCode !== 0 && subJob.statusCode !== -1,
              'bg-violet-400/50 hover:bg-violet-500/60 border-violet-500/50 dark:bg-violet-500/40 dark:hover:bg-violet-400/50 dark:border-violet-500/40 animate-pulse':
                subJob.statusCode === -1,
            }"
            @click="showLogs(subJob.id)"
          ></div>
        </div>
      </div>

      <div
        v-if="hasBeenExecutedAtLeastOnce(job)"
        class="relative z-10 flex items-center justify-between text-sm"
      >
        <div
          class="flex items-center space-x-4 text-gray-700 dark:text-gray-300"
        >
          <div class="flex items-center space-x-1 font-handwriting">
            <p>Average</p>
            <span class="ml-1">{{ computeJobStats(job).avg }}</span>
          </div>

          <div class="flex items-center space-x-1 font-handwriting">
            <p>Min</p>
            <span>{{ computeJobStats(job).min }}</span>
          </div>

          <div class="flex items-center space-x-1">
            <div>Max</div>
            <span class="font-handwriting">{{ computeJobStats(job).max }}</span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="relative z-10 flex flex-col items-center justify-center py-2 text-center"
      >
        <div
          class="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-800 dark:border-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-gray-500"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 font-handwriting">
          No executions yet
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

import { CronExpressionParser } from "cron-parser";
import { format } from "timeago.js";

import type { ExternalJob } from "~/types/external-job";

const cronRegex =
  /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
const { notify } = useNotification();

const $emit = defineEmits(["showLogsForJobId", "refresh"]);
const launchingTitle = ref<string | null>(null);
const launchedTitles = ref<Set<string>>(new Set());

const $props = defineProps({
  jobs: {
    type: Array as PropType<Array<ExternalJob>>,
    required: true,
  },
  jobMetadata: {
    type: Object as PropType<Record<string, string>>,
    required: true,
  },
});

export type GroupedJob = {
  title: string;
  hostname: string;
  jobs: Array<ExternalJob>;
};

watch(
  () => $props.jobs,
  newJobs => {
    for (const title of launchedTitles.value) {
      const stillQueued = newJobs.some(
        j => j.title === title && j.queuePending,
      );
      if (!stillQueued) {
        launchedTitles.value.delete(title);
      }
    }
  },
);

const hasBeenExecutedAtLeastOnce = (job: GroupedJob) => {
  // @ts-expect-error
  return !job.jobs[0].neverExecuted;
};

const computedJobs = computed(() => {
  const groupedJobs: Array<GroupedJob> = [];

  for (const job of $props.jobs) {
    const index = groupedJobs.findIndex(gJob => gJob.title === job.title);
    if (index !== -1) {
      // @ts-expect-error
      groupedJobs[index].jobs.push(job);
    } else {
      groupedJobs.push({
        title: job.title!,
        hostname: job.hostname!,
        jobs: [job],
      });
    }
  }

  return groupedJobs.sort((a, b) => {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  });
});

const startJobNow = async (title: string) => {
  const config = useRuntimeConfig();
  const url = `${config.public.apiEndpoint}/jobs/queue`;
  launchingTitle.value = title;

  try {
    await fetch(url, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });
    notify({ title: "Job added in the queue", type: "success", text: title });
    launchedTitles.value.add(title);
    $emit("refresh");
  } catch {
    notify({
      title: "Error to add job to the queue",
      type: "error",
      text: title,
    });
  } finally {
    launchingTitle.value = null;
  }
};

const showLogs = (jobId: string) => {
  $emit("showLogsForJobId", jobId);
};

const displayedJobs = (job: GroupedJob) =>
  job.jobs.filter(j => !j.neverExecuted).reverse();

const computeJobStats = (job: GroupedJob) => {
  const values = job.jobs
    .filter(job => job.statusCode === 0)
    .map(
      j => new Date(j.updatedAt).getTime() - new Date(j.createdAt).getTime(),
    );

  if (values.length === 0) {
    return {
      min: "—",
      max: "—",
      avg: "—",
    };
  }

  let minUnit = "ms";
  let maxUnit = "ms";
  let avgUnit = "ms";
  let min = Math.min(...values);
  let max = Math.max(...values);
  let avg = values.reduce((acc, v) => acc + v, 0) / values.length;

  if (min > 1000) {
    minUnit = "s";
    min = min / 1000;
  }
  if (max > 1000) {
    maxUnit = "s";
    max = max / 1000;
  }
  if (avg > 1000) {
    avgUnit = "s";
    avg = avg / 1000;
  }
  if (min > 60) {
    minUnit = "mn";
    min = min / 60;
  }
  if (max > 60) {
    maxUnit = "mn";
    max = max / 60;
  }
  if (avg > 60) {
    avgUnit = "mn";
    avg = avg / 60;
  }
  if (min > 60) {
    minUnit = "h";
    min = min / 60;
  }
  if (max > 60) {
    maxUnit = "h";
    max = max / 60;
  }
  if (avg > 60) {
    avgUnit = "h";
    avg = avg / 60;
  }

  return {
    min: `${Math.floor(min)}${minUnit}`,
    max: `${Math.floor(max)}${maxUnit}`,
    avg: `${Math.floor(avg)}${avgUnit}`,
  };
};

const getCronInterval = (job: GroupedJob): number => {
  const cronString = job.jobs[0]?.cron;
  if (cronString && cronString.match(cronRegex)) {
    const parser = CronExpressionParser.parse(cronString);

    const first = parser.next().toDate();
    const second = parser.next().toDate();

    // @ts-expect-error
    const intervalMs = second - first;
    const intervalMin = intervalMs / 60000;
    return intervalMin;
  }

  return +Infinity;
};

const performDelayedSentence = (job: GroupedJob): string => {
  const now = new Date().getTime();
  // @ts-expect-error
  const createdAt = new Date(job.jobs[0]?.createdAt).getTime();
  const minutes = Math.floor((now - createdAt) / 1000 / 60);

  if (minutes < 60) {
    return `🚨 Delayed for ${minutes} minutes`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `🚨 Delayed for ${hours} hours`;
  }

  const days = hours / 24;

  return `🚨 Delayed for more than ${Math.floor(days)} days`;
};
</script>
