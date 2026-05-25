// ============================================================
// hooks/useSpikes.js
// ============================================================
// Fetches recent volume spikes (Flash Alerts) from the backend.
// Polls every 10 seconds.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

async function fetchVolumeSpikes(limit = 10) {
  const response = await apiClient.get("/market/volume-spikes", {
    params: { limit },
  });
  return response.data;
}

export function useSpikes(limit = 10) {
  return useQuery({
    queryKey: ["volume-spikes", limit],
    queryFn: () => fetchVolumeSpikes(limit),
    refetchInterval: 10 * 1000, // poll every 10s
    staleTime: 5 * 1000,
    placeholderData: (prev) => prev,
    retry: 2,
  });
}
