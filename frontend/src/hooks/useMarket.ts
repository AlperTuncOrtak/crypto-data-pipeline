// ============================================================
// hooks/useMarket.js
// ============================================================
// Market verisini cekmek icin React Query hook'u.
// Kullanim:
//   const { data, isLoading, error } = useMarket(20)
//
// Otomatik olarak:
//  - Mount oldugunda fetch eder
//  - 30 saniyede bir yeniler (refetchInterval)
//  - Loading/error state'leri doner
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

// -----------------------
// FETCH FUNCTION
// -----------------------
// Saf bir async function. React Query bunu cagiracak.
// Hook mantigina karistirmiyoruz ki test edebilir kalsin.
async function fetchMarket(limit) {
  const response = await apiClient.get("/market", {
    params: { limit },
  });
  return response.data;
}

// -----------------------
// HOOK
// -----------------------
export function useMarket(limit = 3000) {
  return useQuery({
    // queryKey React Query icin cache anahtari. limit degisirse
    // yeni bir cache entry olur, eski verimiz kalir.
    queryKey: ["market", limit],

    // Asil fetch fonksiyonu
    queryFn: () => fetchMarket(limit),

    // 30 saniyede bir otomatik yenile (Streamlit'teki auto-refresh
    // davranisinin karsiligi)
    refetchInterval: 5 * 1000,
  });
}
async function fetchGainers(limit) {
  const response = await apiClient.get("/market/gainers", {
    params: { limit },
  });
  return response.data;
}

export function useGainers(limit = 5) {
  return useQuery({
    queryKey: ["gainers", limit],
    queryFn: () => fetchGainers(limit),
    // 24h değişim verisi — 5 saniyede biri yenilemek gürültü katar.
    // 60 saniye yeterli; staleTime önce önbelleği gösterir.
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

async function fetchLosers(limit) {
  const response = await apiClient.get("/market/losers", {
    params: { limit },
  });
  return response.data;
}

export function useLosers(limit = 5) {
  return useQuery({
    queryKey: ["losers", limit],
    queryFn: () => fetchLosers(limit),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

async function fetchVolume(limit) {
  const response = await apiClient.get("/market/volume", {
    params: { limit },
  });
  return response.data;
}

export function useVolume(limit = 5) {
  return useQuery({
    queryKey: ["volume", limit],
    queryFn: () => fetchVolume(limit),
    refetchInterval: 5 * 1000,
  });
}

async function fetchTrending() {
  const response = await apiClient.get("/market/trending");
  return response.data;
}

export function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
}

async function fetchStats() {
  const response = await apiClient.get("/market/stats");
  return response.data;
}

export function useMarketStats() {
  return useQuery({
    queryKey: ["market-stats"],
    queryFn: fetchStats,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}


// -----------------------
// SPARKLINES
// -----------------------
async function fetchSparklines(symbols, hours) {
  if (!symbols || symbols.length === 0) return {};
  
  // Construct query string for multiple symbols: ?symbols=BTC&symbols=ETH
  const params = new URLSearchParams();
  symbols.forEach(sym => params.append("symbols", sym));
  params.append("hours", hours.toString());
  
  const response = await apiClient.get(`/market/sparklines?${params.toString()}`);
  return response.data;
}

export function useSparklines(symbols = [], hours = 24) {
  return useQuery({
    queryKey: ["sparklines", symbols, hours],
    queryFn: () => fetchSparklines(symbols, hours),
    enabled: symbols.length > 0,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}
