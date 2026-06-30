import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useSparklines(symbols: string[], hours: number = 24) {
  // We use queryKey to cache based on the joined symbols string
  const key = symbols.length > 0 ? symbols.slice().sort().join(",") : "none";
  
  return useQuery({
    queryKey: ["sparklines", key, hours],
    queryFn: async () => {
      if (!symbols || symbols.length === 0) return {};
      
      const searchParams = new URLSearchParams();
      symbols.forEach(s => searchParams.append("symbols", s));
      searchParams.append("hours", hours.toString());
      
      const response = await apiClient.get(`/market/sparklines?${searchParams.toString()}`);
      return response.data; // Expected format: { "BTC": [{price, time}, ...], "ETH": [...] }
    },
    enabled: symbols.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });
}