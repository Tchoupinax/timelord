<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <ModalAuthentication v-if="!isAuthenticated" />

    <header
      class="px-6 py-10 border-b border-gray-200 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm dark:border-gray-800"
    >
      <div class="mx-auto max-w-7xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <div
              class="relative flex items-center justify-center bg-black border border-gray-300 w-14 h-14 dark:bg-white rounded-2xl dark:border-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 text-white dark:text-black"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h1
              class="relative text-3xl text-gray-900 font-handwriting dark:text-white"
            >
              Timelord
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

            <NuxtLink
              to="/agents"
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
              Agents
            </NuxtLink>

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
          </nav>
        </div>
      </div>
    </header>

    <main class="px-6 py-8 mx-auto max-w-7xl">
      <div class="p-6">
        <div
          v-if="jobs.length > 0"
          class="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div class="flex-1 min-w-0" />
          <button
            type="button"
            :disabled="launchingAllJobs"
            class="flex items-center px-5 py-2.5 text-gray-700 transition-all duration-200 border border-gray-300 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/40 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 font-handwriting active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            :class="{ 'animate-pulse': launchingAllJobs }"
            @click="launchAllModalOpened = true"
          >
            <svg
              v-if="!launchingAllJobs"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 mr-2"
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
            {{ launchingAllJobs ? "Launching…" : "Launch all jobs" }}
          </button>
        </div>

        <div v-if="jobs.length === 0" class="flex w-full text-3xl text-center">
          <div class="justify-center">No job found.</div>
        </div>

        <JobStatsView
          :jobs="jobs"
          :job-metadata="jobMetadata"
          @show-logs-for-job-id="showLogsForTheJobId"
          @refresh="refreshJobs"
        />
      </div>
    </main>

    <div
      v-if="agentCreationModalOpened"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      tabindex="0"
      @click.self="agentCreationModalOpened = false"
      @keydown.escape="agentCreationModalOpened = false"
    >
      <div
        class="relative w-full max-w-md p-6 mx-4 bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 rounded-3xl dark:border-gray-700"
      >
        <div
          class="flex items-center justify-between pb-4 border-b border-gray-200 border-dashed dark:border-gray-700"
        >
          <h2 class="text-2xl text-gray-900 font-handwriting dark:text-white">
            Create New Agent
          </h2>
          <button
            class="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:text-neutral-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
            @click="agentCreationModalOpened = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div v-if="!agentCreationResultToken" class="mt-6">
          <div class="mb-4">
            <label
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              Agent Name
            </label>
            <input
              v-model="agentCreationName"
              type="text"
              class="w-full px-4 py-3 text-gray-900 transition-colors duration-200 border border-gray-300 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white font-handwriting"
              placeholder="Enter agent name"
              required
            />
          </div>

          <div
            class="p-4 mb-6 border-2 border-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-2xl dark:border-gray-600"
          >
            <p
              class="text-sm text-gray-700 dark:text-gray-300 font-handwriting"
            >
              This will create a new agent and generate a unique token for
              authentication.
            </p>
          </div>
        </div>

        <div v-else class="mt-6">
          <div class="mb-4">
            <label
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              Agent Token
            </label>
            <div class="relative">
              <input
                :value="agentCreationResultToken"
                type="text"
                readonly
                class="w-full px-4 py-3 pr-12 font-mono text-sm text-gray-900 bg-gray-100 border border-gray-300 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600 rounded-2xl"
              />
              <button
                class="absolute p-2 text-gray-500 transition-colors duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                title="Copy token"
                @click="copyToken"
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
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            class="p-4 mb-6 border border-gray-200 bg-gray-50 dark:bg-gray-900/40 rounded-2xl dark:border-gray-700"
          >
            <p
              class="text-sm text-gray-700 dark:text-gray-200 font-handwriting"
            >
              Copy this token and use it to authenticate your agent. Keep it
              secure as it won't be shown again.
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            v-if="!agentCreationResultToken"
            type="button"
            class="px-4 py-2 text-gray-700 transition-colors duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700/80"
            @click="agentCreationModalOpened = false"
          >
            Cancel
          </button>
          <button
            v-if="!agentCreationResultToken"
            class="px-4 py-2 text-white transition-all duration-200 transform bg-black border border-gray-300 shadow-lg font-handwriting dark:text-black dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!agentCreationName.trim()"
            @click="createAgent"
          >
            Create Agent
          </button>
          <button
            v-else
            class="px-4 py-2 text-white transition-all duration-200 transform bg-black border-2 border-gray-300 shadow-lg dark:text-black font-handwriting dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600"
            @click="closeModal"
          >
            Done
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="launchAllModalOpened"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      tabindex="0"
      @click.self="launchAllModalOpened = false"
      @keydown.escape="launchAllModalOpened = false"
    >
      <div
        class="relative w-full max-w-md p-6 mx-4 bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 rounded-3xl dark:border-gray-700"
      >
        <div
          class="flex items-center justify-between pb-4 border-b border-gray-200 border-dashed dark:border-gray-700"
        >
          <h2 class="text-2xl text-gray-900 font-handwriting dark:text-white">
            Launch all jobs
          </h2>
          <button
            class="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:text-neutral-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
            :disabled="launchingAllJobs"
            @click="launchAllModalOpened = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p class="mt-4 text-gray-700 dark:text-gray-300 font-handwriting">
          Are you sure you want to queue all
          <strong>{{ uniqueJobTitles.length }}</strong>
          job(s)? They will be added to the queue and run one after another.
        </p>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 transition-colors duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700/80"
            :disabled="launchingAllJobs"
            @click="launchAllModalOpened = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-white transition-all duration-200 transform bg-black border border-gray-300 shadow-lg font-handwriting dark:text-black dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="launchingAllJobs"
            @click="confirmLaunchAllJobs"
          >
            {{ launchingAllJobs ? "Launching…" : "Launch all" }}
          </button>
        </div>
      </div>
    </div>

    <JobResultModal
      v-if="selectedJobIdToShowLogs"
      :job-id="selectedJobIdToShowLogs"
      @close="selectedJobIdToShowLogs = ''"
    />

    <NuxtNotifications position="top right" :speed="500" />
  </div>
</template>

<script lang="ts" setup>
import { useRuntimeConfig } from "#app";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

import type { ExternalJob } from "~/types/external-job";

import type { Agent } from "../../server/prisma/generated/prisma";

const agentCreationModalOpened = ref(false);
const agentCreationName = ref("");
const agentCreationResultToken = ref("");
const agents = ref<Array<Agent>>([]);
const isAuthenticated = ref(true);
const jobs = ref<Array<ExternalJob>>([]);
const jobMetadata = ref({});
const jobsCount = ref(0);
const selectedJobIdToShowLogs = ref("");
const launchAllModalOpened = ref(false);
const launchingAllJobs = ref(false);

const uniqueJobTitles = computed(() => {
  const titles = jobs.value.map(j => j.title).filter(Boolean) as string[];
  return [...new Set(titles)];
});

const { notify } = useNotification();

const confirmLaunchAllJobs = async () => {
  launchingAllJobs.value = true;
  const titles = uniqueJobTitles.value;
  let successCount = 0;
  let failCount = 0;

  try {
    for (const title of titles) {
      try {
        await fetch(`${config.public.apiEndpoint}/jobs/queue`, {
          credentials: "include",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    await refreshJobs();
    launchAllModalOpened.value = false;
    if (failCount === 0) {
      notify({
        title: "All jobs queued",
        type: "success",
        text: `${successCount} job(s) added to the queue.`,
      });
    } else {
      notify({
        title: "Launch completed with errors",
        type: "warning",
        text: `${successCount} queued, ${failCount} failed.`,
      });
    }
  } finally {
    launchingAllJobs.value = false;
  }
};

const showLogsForTheJobId = (result: string) => {
  selectedJobIdToShowLogs.value = result;
};

const config = useRuntimeConfig();
const { data: jobData } = await useFetch(`${config.public.apiEndpoint}/jobs`, {
  credentials: "include",
});

if (jobData?.value) {
  // @ts-expect-error
  jobs.value = jobData?.value?.jobs ?? [];
  // @ts-expect-error
  jobsCount.value = jobData?.value?.jobsCount ?? 0;
  // @ts-expect-error
  jobMetadata.value = jobData.value.jobMetadatas;
}

const refreshJobs = async () => {
  try {
    const res = await fetch(`${config.public.apiEndpoint}/jobs`, {
      credentials: "include",
    });
    const data = await res.json();
    jobs.value = data?.jobs ?? [];
    jobsCount.value = data?.jobsCount ?? 0;
    jobMetadata.value = data?.jobMetadatas ?? {};
  } catch (err) {
    console.error("Failed to refresh jobs:", err);
  }
};

const hasActiveJobs = computed(() =>
  jobs.value.some(j => j.queuePending || j.statusCode === -1),
);

let pollInterval: ReturnType<typeof setInterval> | null = null;

const startPolling = () => {
  if (pollInterval) return;
  pollInterval = setInterval(refreshJobs, 3000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

watch(hasActiveJobs, active => {
  if (active) {
    startPolling();
  } else {
    stopPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

const listAgents = async (apiUrl: string) => {
  const response = await fetch(`${apiUrl}/agents`, { credentials: "include" });
  return response.json();
};

const createAgent = async () => {
  const url = `${config.public.apiEndpoint}/agents`;
  const response = await fetch(url, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: agentCreationName.value,
    }),
  });

  const agent = await response.json();
  agentCreationResultToken.value = agent.token;
};

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(agentCreationResultToken.value);
  } catch (err) {
    console.error("Failed to copy token:", err);
  }
};

const closeModal = () => {
  agentCreationModalOpened.value = false;
  agentCreationName.value = "";
  agentCreationResultToken.value = "";
};

onMounted(async () => {
  if (!document.cookie.includes("timelord-nickname")) {
    const data = await fetch(`${config.public.apiEndpoint}/version`).then(res =>
      res.json(),
    );
    if (!data.authenticationDisabled) {
      isAuthenticated.value = false;
    }
  } else {
    setInterval(async () => {
      agents.value = await listAgents(config.public.apiEndpoint);
    }, 2000);
  }

  if (hasActiveJobs.value) {
    startPolling();
  }
});
</script>
