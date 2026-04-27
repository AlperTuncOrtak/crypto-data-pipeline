// ============================================================
// hooks/useAnalysis.js
// ============================================================
// Multi-coin analiz icin iki hook:
//
//  1. useMultiCoinHistory(symbols)
//     -> Her coin icin zaman serisi fiyat noktalari
//     -> Chart'in beslendigi veri kaynagi
//
//  2. useMultiCoinPerformance(symbols)
//     -> Her coin icin baslangic vs son fiyat, toplam getiri %
//     -> Performance tablosunda kullanilir
//
// Iki hook da symbols dizisi bossa istek atmaz (enabled: false).
// Cache key sirali tutulur ki ['BTC','ETH'] ve ['ETH','BTC'] ayni
// cache'i paylassin.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'


// -----------------------
// HISTORY
// -----------------------
async function fetchHistory(symbols) {
  const response = await apiClient.get('/analysis/history', {
    params: { symbols },
    paramsSerializer: { indexes: null },   // ?symbols=A&symbols=B
  })
  return response.data
}

export function useMultiCoinHistory(symbols = []) {
  return useQuery({
    queryKey: ['analysis-history', [...symbols].sort().join(',')],
    queryFn: () => fetchHistory(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 60 * 1000,
  })
}


// -----------------------
// PERFORMANCE
// -----------------------
async function fetchPerformance(symbols) {
  const response = await apiClient.get('/analysis/performance', {
    params: { symbols },
    paramsSerializer: { indexes: null },
  })
  return response.data
}

export function useMultiCoinPerformance(symbols = []) {
  return useQuery({
    queryKey: ['analysis-performance', [...symbols].sort().join(',')],
    queryFn: () => fetchPerformance(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 60 * 1000,
  })
}