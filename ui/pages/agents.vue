<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
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
              Agents
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
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            class="flex items-center px-6 py-3 text-lg text-white transition-all duration-200 transform bg-black border border-gray-300 shadow-lg dark:bg-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-xl hover:scale-105 dark:border-gray-600 font-handwriting"
            @click="agentCreationModalOpened = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5 mr-2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Agent
          </button>
        </div>
      </div>

      <div
        class="relative overflow-hidden bg-white border border-gray-200 shadow-lg dark:bg-gray-900 rounded-3xl dark:border-gray-700"
      >
        <div
          class="p-6 border-b border-gray-200 border-dashed dark:border-gray-700"
        >
          <h2 class="text-2xl text-gray-900 font-handwriting dark:text-white">
            Agent Management
          </h2>
        </div>
        <AgentTable :agents="agents" @delete-agent="deleteAgent" />
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
            class="p-2 text-gray-400 transition-colors duration-200 rounded-full hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/80"
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
  </div>
</template>

<script lang="ts">
import { format } from "timeago.js";

import type { Agent } from "../../server/prisma/generated/prisma";

type Store = {
  agents: Array<Agent>;
  agentCreationModalOpened: boolean;
  agentCreationName: string;
  agentCreationResultToken: string;
};

export default {
  data(): Store {
    return {
      agents: [],
      agentCreationModalOpened: false,
      agentCreationName: "",
      agentCreationResultToken: "",
    };
  },
  async mounted() {
    const config = useRuntimeConfig();
    this.agents = await this.listAgents(`${config.public.apiEndpoint}/agents`);
  },
  methods: {
    async listAgents(url: string) {
      const response = await fetch(url, { credentials: "include" });
      return await response.json();
    },
    async createAgent() {
      const config = useRuntimeConfig();
      const url = `${config.public.apiEndpoint}/agents`;
      const response = await fetch(url, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: this.agentCreationName,
        }),
      });

      const agent = await response.json();
      this.agentCreationResultToken = agent.token;
    },
    async copyToken() {
      try {
        await navigator.clipboard.writeText(this.agentCreationResultToken);
      } catch (err) {
        console.error("Failed to copy token:", err);
      }
    },
    closeModal() {
      this.agentCreationModalOpened = false;
      this.agentCreationName = "";
      this.agentCreationResultToken = "";
    },
    async deleteAgent(agentName: string) {
      const config = useRuntimeConfig();
      const url = `${config.public.apiEndpoint}/agents/${encodeURIComponent(agentName)}`;

      try {
        const response = await fetch(url, {
          credentials: "include",
          method: "DELETE",
        });

        if (response.ok) {
          this.agents = this.agents.filter(agent => agent.name !== agentName);
        } else {
          console.error("Failed to delete agent:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting agent:", error);
      }
    },
    format,
  },
};
</script>
