// ============================================================
// hooks/useSparklines.js
// ============================================================
// Birden fazla coin icin sparkline (mini chart) verisi ceker.
// Tek bir endpoint cagrisiyla tum coinlerin son N saatlik
// fiyat noktalarini alir.
//
// Donen yapi:
//   { "BTC": [{price, time}, ...], "ETH": [...] }
//
// Kullanim:
//   const { data } = useSparklines(['BTC', 'ETH'], 24)
//   data?.BTC // [{price, time}, ...]
//
// NOT: symbols dizisi bos ise hook hic istek atmaz (enabled: false)
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'


async function fetchSparklines(symbols, hours) {
  const response = await apiClient.get('/market/sparklines', {
    params: {
      // axios array'i otomatik olarak ?symbols=A&symbols=B seklinde serialize eder
      symbols,
      hours,
    },
    // Buyuk istekleri brackets formatinda gondermesin diye serializer
    paramsSerializer: {
      indexes: null,   // symbols=A&symbols=B (symbols[]=A degil)
    },
  })
  return response.data
}


export function useSparklines(symbols = [], hours = 24) {
  return useQuery({
    // queryKey'de symbols dizisi var - degisirse cache yenilenir.
    // Sirali tutuyoruz ki ['BTC','ETH'] ile ['ETH','BTC'] ayni cache'e dussun.
    queryKey: ['sparklines', [...symbols].sort().join(','), hours],

    queryFn: () => fetchSparklines(symbols, hours),

    // symbols bos ise istek atma
    enabled: symbols.length > 0,

    // Sparkline verisi sik degismesine gerek yok - 60 saniye yeterli
    refetchInterval: 60 * 1000,
  })
}