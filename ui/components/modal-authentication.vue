<template>
  <div
    id="modal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div
      class="relative w-full max-w-md p-8 mx-4 bg-white border shadow-2xl dark:bg-gray-900 rounded-3xl border-gray-200 dark:border-gray-700"
    >
      <div class="relative z-10 text-center">
        <div
          class="relative flex items-center justify-center w-20 h-20 mx-auto mb-6 border rounded-full bg-black dark:bg-white border-gray-300 dark:border-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-10 h-10 text-white dark:text-black"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        <h2
          class="mb-3 text-3xl font-handwriting text-gray-900 dark:text-gray-100"
        >
          Welcome to Timelord
        </h2>

        <p
          class="mb-8 text-lg text-gray-700 dark:text-gray-300 font-handwriting"
        >
          Please authenticate to access your dashboard
        </p>

        <button
          class="flex items-center justify-center w-full px-8 py-5 text-xl transition-all duration-200 transform border shadow-xl text-white dark:text-black bg-black dark:bg-white rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-2xl hover:scale-105 border-gray-300 dark:border-gray-600 font-handwriting"
          @click="loginWithAuthelia"
        >
          <img
            :src="oidcProviderImage"
            alt="Authelia Logo"
            class="w-10 h-10 mr-4"
          />
          <span class="text-xl font-handwriting"
            >Login with {{ oidcProviderName }}</span
          >
        </button>

        <div
          class="pt-6 mt-8 border-t border-dashed border-gray-200 dark:border-gray-700"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400 font-handwriting">
            Secure authentication powered by Authelia
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const config = useRuntimeConfig();

const oidcProviderName = ref("");
const oidcProviderImage = ref("");

const fetchLoginDetail = async () => {
  const data = await fetch(`${config.public.apiEndpoint}/version`).then(res =>
    res.json(),
  );
  oidcProviderName.value = data.oidcProviderName;
  oidcProviderImage.value = data.oidcProviderImage;
};

const loginWithAuthelia = () => {
  const config = useRuntimeConfig();
  window.location.href = `${config.public.apiEndpoint}/connect`;
};

onMounted(async () => {
  await fetchLoginDetail();
});
</script>
