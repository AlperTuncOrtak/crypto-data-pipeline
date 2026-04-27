// ============================================================
// hooks/useCoin.js
// ============================================================
// Coin Detail sayfasi icin 3 hook:
//
//  1. useCoinDetail(slug) - metadata + guncel fiyat
//  2. useCoinHistory(slug, range) - chart icin zaman serisi
//  3. useCoinStats(slug) - 24h high/low, data points
//
// Hepsi slug'a gore cache'lenir. Range degisince history
// yeniden fetch edilir (queryKey'de range var).
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'


// -----------------------
// COIN DETAIL
// -----------------------
async function fetchCoinDetail(slug) {
  const response = await apiClient.get(`/coin/${slug}`)
  return response.data
}

export function useCoinDetail(slug) {
  return useQuery({
    queryKey: ['coin', slug],
    queryFn: () => fetchCoinDetail(slug),
    enabled: Boolean(slug),
    retry: false,   // 404 durumunda tekrar deneme (bos sayfa gosterelim)
    staleTime: 30 * 1000,
  })
}


// -----------------------
// COIN HISTORY
// -----------------------
async function fetchCoinHistory(slug, range) {
  const response = await apiClient.get(`/coin/${slug}/history`, {
    params: { range },
  })
  return response.data
}

export function useCoinHistory(slug, range = '24h') {
  return useQuery({
    queryKey: ['coin-history', slug, range],
    queryFn: () => fetchCoinHistory(slug, range),
    enabled: Boolean(slug),
    // History cok sik degismez, 60 saniye yeterli
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}


// -----------------------
// COIN STATS
// -----------------------
async function fetchCoinStats(slug) {
  const response = await apiClient.get(`/coin/${slug}/stats`)
  return response.data
}

export function useCoinStats(slug) {
  return useQuery({
    queryKey: ['coin-stats', slug],
    queryFn: () => fetchCoinStats(slug),
    enabled: Boolean(slug),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}