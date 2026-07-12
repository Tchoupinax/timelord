<template>
  <div>
  <div
    class="grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
    :class="expanded ? 'bg-gray-50 dark:bg-gray-800/30' : ''"
    @click="emit('select')"
  >
    <div class="flex items-center col-span-2">
      <div class="flex items-center space-x-3">
        <div
          class="flex items-center justify-center w-10 h-10 bg-black border border-gray-300 dark:bg-white rounded-xl dark:border-gray-600"
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
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
        </div>
        <span
          class="font-medium text-gray-900 truncate transition-colors duration-200 font-handwriting dark:text-gray-100 group-hover:text-black dark:group-hover:text-white"
          >{{ gitConfig.name }}</span
        >
      </div>
    </div>

    <div class="flex items-center col-span-1">
      <span
        :class="
          gitConfig.enabled
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            : 'bg-gray-200 text-gray-900 dark:bg-gray-700/30 dark:text-gray-400 border-gray-400 dark:border-gray-500'
        "
        class="inline-flex items-center px-3 py-1 text-xs font-medium border-2 rounded-full font-handwriting"
      >
        {{ gitConfig.enabled ? "Active" : "Disabled" }}
      </span>
    </div>

    <div class="flex items-center col-span-4">
      <span
        class="font-mono text-sm text-gray-700 truncate transition-colors duration-200 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
        >{{ gitConfig.sshUrl }}</span
      >
    </div>

    <div class="flex items-center col-span-2">
      <span
        class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
        >{{ gitConfig.folderNameInGitRepository || "/" }}</span
      >
    </div>

    <div class="flex items-center col-span-2">
      <div
        v-tippy="{ content: gitConfig.pullAt }"
        class="text-sm text-gray-700 transition-colors duration-200 dark:text-gray-300 font-handwriting group-hover:text-black dark:group-hover:text-white"
      >
        {{ gitConfig.pullAt ? format(gitConfig.pullAt) : "Never" }}
      </div>
    </div>

    <div class="flex items-center justify-end col-span-1">
      <button
        :disabled="saving"
        :class="
          gitConfig.enabled
            ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/30 border-gray-300 dark:border-gray-600'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/30 border-gray-300 dark:border-gray-600'
        "
        class="flex items-center justify-center w-10 h-10 transition-all duration-200 border-2 rounded-xl hover:scale-110 disabled:opacity-70 disabled:cursor-wait"
        :title="gitConfig.enabled ? 'Disable repository' : 'Enable repository'"
        @click.stop="toggleEnabled"
      >
        <svg
          v-if="gitConfig.enabled"
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
            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
          />
        </svg>
        <svg
          v-else
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
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </button>
    </div>
  </div>

  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="expanded"
      class="px-6 py-5 border-t border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
      @click.stop
    >
      <div class="flex items-start gap-10 mb-6">
        <div>
          <p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase font-handwriting dark:text-gray-400">
            Latest Commit SHA
          </p>
          <code
            v-if="gitConfig.lastCommitSha"
            class="px-2 py-1 font-mono text-sm text-gray-800 bg-gray-100 border border-gray-200 dark:bg-gray-700/60 dark:border-gray-600 dark:text-gray-200 rounded-lg"
            :title="gitConfig.lastCommitSha"
          >{{ gitConfig.lastCommitSha.slice(0, 12) }}</code>
          <span v-else class="text-sm text-gray-400 font-handwriting dark:text-gray-500">—</span>
        </div>

        <div class="flex-1">
          <p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase font-handwriting dark:text-gray-400">
            Latest Commit Message
          </p>
          <p
            v-if="gitConfig.lastCommitMessage"
            class="text-sm text-gray-800 font-handwriting dark:text-gray-200"
          >{{ gitConfig.lastCommitMessage }}</p>
          <span v-else class="text-sm text-gray-400 font-handwriting dark:text-gray-500">No commit synced yet</span>
        </div>
      </div>

      <form class="pt-5 border-t border-dashed border-gray-200 dark:border-gray-700" @submit.prevent="saveChanges">
        <h4 class="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase font-handwriting dark:text-gray-200">
          Edit Configuration
        </h4>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label
              :for="`sshUrl-${gitConfig.id}`"
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              SSH URL
            </label>
            <input
              :id="`sshUrl-${gitConfig.id}`"
              v-model="form.sshUrl"
              type="url"
              class="w-full px-4 py-3 font-mono text-sm text-gray-900 transition-colors duration-200 border border-gray-300 dark:text-gray-100 bg-white dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white"
              placeholder="git@github.com:user/repo.git"
              required
            />
          </div>

          <div>
            <label
              :for="`folder-${gitConfig.id}`"
              class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
            >
              Folder in repository
            </label>
            <input
              :id="`folder-${gitConfig.id}`"
              v-model="form.folderNameInGitRepository"
              type="text"
              class="w-full px-4 py-3 text-gray-900 transition-colors duration-200 border border-gray-300 dark:text-gray-100 bg-white dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white font-handwriting"
              placeholder="timelord"
              required
            />
          </div>
        </div>

        <div class="mt-4">
          <label
            :for="`sshKey-${gitConfig.id}`"
            class="block mb-2 text-sm text-gray-700 font-handwriting dark:text-gray-200"
          >
            SSH Private Key
          </label>
          <textarea
            :id="`sshKey-${gitConfig.id}`"
            v-model="form.sshPrivateKey"
            rows="4"
            class="w-full px-4 py-3 font-mono text-sm text-gray-900 transition-colors duration-200 border border-gray-300 resize-none dark:text-gray-100 bg-white dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 dark:focus:ring-white dark:focus:border-white"
            placeholder="Leave empty to keep the current key"
          />
        </div>

        <div class="flex items-center justify-between mt-5">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.enabled"
              type="checkbox"
              class="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-white"
            />
            <span class="text-sm text-gray-700 font-handwriting dark:text-gray-200">
              Repository enabled
            </span>
          </label>

          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 transition-colors duration-200 bg-gray-100 border border-gray-300 font-handwriting dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-600 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700/80 disabled:opacity-70"
              :disabled="saving || !isDirty"
              @click="resetForm"
            >
              Reset
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-white transition-all duration-200 bg-black border border-gray-300 shadow-lg font-handwriting dark:text-black dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 dark:border-gray-600 disabled:opacity-70 disabled:cursor-wait"
              :disabled="saving || !isDirty"
            >
              {{ saving ? "Saving…" : "Save changes" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
import { format } from "timeago.js";
import type { PropType } from "vue";
import { computed, reactive, ref, watch } from "vue";

import type { GitConfig } from "../../server/prisma/generated/prisma";

const emit = defineEmits(["select", "updated"]);

const props = defineProps({
  gitConfig: {
    type: Object as PropType<GitConfig>,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
});

const config = useRuntimeConfig();
const { notify } = useNotification();
const saving = ref(false);

const form = reactive({
  sshUrl: "",
  folderNameInGitRepository: "",
  sshPrivateKey: "",
  enabled: true,
});

const resetForm = () => {
  form.sshUrl = props.gitConfig.sshUrl;
  form.folderNameInGitRepository =
    props.gitConfig.folderNameInGitRepository || "timelord";
  form.enabled = props.gitConfig.enabled;
  form.sshPrivateKey = "";
};

watch(() => props.gitConfig, resetForm, { immediate: true, deep: true });

const isDirty = computed(
  () =>
    form.sshUrl !== props.gitConfig.sshUrl ||
    form.folderNameInGitRepository !==
      (props.gitConfig.folderNameInGitRepository || "timelord") ||
    form.enabled !== props.gitConfig.enabled ||
    Boolean(form.sshPrivateKey),
);

const updateConfig = async (payload: {
  sshUrl?: string;
  folderNameInGitRepository?: string;
  enabled?: boolean;
  sshPrivateKey?: string;
}) => {
  saving.value = true;

  try {
    const response = await fetch(
      `${config.public.apiEndpoint}/git-configs/${props.gitConfig.id}`,
      {
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const updated = (await response.json()) as GitConfig;
    emit("updated", updated);
    notify({
      title: "Repository updated",
      type: "success",
      text: props.gitConfig.name,
    });
    return updated;
  } catch {
    notify({
      title: "Failed to update repository",
      type: "error",
      text: props.gitConfig.name,
    });
  } finally {
    saving.value = false;
  }
};

const saveChanges = async () => {
  const payload: {
    sshUrl: string;
    folderNameInGitRepository: string;
    enabled: boolean;
    sshPrivateKey?: string;
  } = {
    sshUrl: form.sshUrl,
    folderNameInGitRepository: form.folderNameInGitRepository,
    enabled: form.enabled,
  };

  if (form.sshPrivateKey) {
    payload.sshPrivateKey = form.sshPrivateKey;
  }

  const updated = await updateConfig(payload);
  if (updated) {
    form.sshPrivateKey = "";
  }
};

const toggleEnabled = async () => {
  await updateConfig({ enabled: !props.gitConfig.enabled });
};
</script>
