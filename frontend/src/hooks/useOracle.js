// ============================================================
// hooks/useOracle.js
// ============================================================
// Market Oracle feed hook — fetches /oracle-feed every 5 minutes.
// The backend caches the result server-side, so re-fetching is safe.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

async function fetchOracleFeed() {
  const response = await apiClient.get("/oracle-feed");
  return response.data;
}

export function useOracle() {
  return useQuery({
    queryKey: ["oracle-feed"],
    queryFn:  fetchOracleFeed,
    // Backend caches for 5 min; poll every 5 min on frontend too
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
    // Don't hammer on window refocus — the data is intentionally slow-moving
    refetchOnWindowFocus: false,
    // Keep showing last known data while re-fetching (no flash to loading)
    placeholderData: (prev) => prev,
    retry: 2,
  });
}
