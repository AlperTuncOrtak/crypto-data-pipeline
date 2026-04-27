// ============================================================
// hooks/useAlerts.js
// ============================================================
// Backend'in /alerts endpoint'inden alert listesini ceker.
// Her alert: { type, severity, symbol, message }
//
// Auto-refetch: 30 saniyede bir yeniler (market degistikce
// alertler de degisir). Ileride daha akilli refetch stratejisi
// dusunebiliriz ama simdilik basit tutmak yeterli.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'


async function fetchAlerts() {
  const response = await apiClient.get('/alerts')
  return response.data
}


export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30 * 1000,
  })
}