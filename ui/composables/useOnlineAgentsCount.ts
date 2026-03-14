const ONLINE_THRESHOLD_MS = 60 * 1000; // 60 seconds (same as agent-row.vue)
const OFFLINE_AGENTS_COUNT_KEY = "timelord-offline-agents-count";

export function useOnlineAgentsCount() {
  const count = useState<number | null>(OFFLINE_AGENTS_COUNT_KEY, () => null);

  async function fetchCount() {
    const config = useRuntimeConfig();
    try {
      const response = await fetch(`${config.public.apiEndpoint}/agents`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const agents: Array<{ seenAt?: string | null }> = await response.json();
      const now = Date.now();
      // Offline: no seenAt or last seen > 60s ago
      count.value = agents.filter((a) => {
        if (!a.seenAt) return true;
        return now - new Date(a.seenAt).getTime() >= ONLINE_THRESHOLD_MS;
      }).length;
    } catch {
      count.value = null;
    }
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;
  onMounted(() => {
    fetchCount();
    intervalId = setInterval(fetchCount, 15000); // refresh every 15s
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { count, refresh: fetchCount };
}
