/**
 * useMarketStream — SSE üzerinden gerçek zamanlı fiyat akışı (WUL-46)
 *
 * Kullanım:
 *   const { data, connected } = useMarketStream(100)
 *
 * Backend /market/stream SSE endpoint'ine bağlanır.
 * Her 3 saniyede Redis'ten yeni snapshot gelir ve React Query
 * cache'i güncellenir — useMarket() kullanan bileşenler anında güncellenir.
 *
 * Bağlantı kesilirse 5 saniye sonra otomatik yeniden bağlanır.
 * ponytail: native EventSource, ek bağımlılık yok.
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_URL || "https://api.cryptoneko.online";

export function useMarketStream(limit = 100) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const es = new EventSource(`${BASE_URL}/market/stream?limit=${limit}`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          // React Query cache güncellemesi — useMarket() hook'larını tetikler
          qc.setQueryData(["market", limit], data);
        } catch { /* malformed JSON, skip */ }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryTimer = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => { clearTimeout(retryTimer); esRef.current?.close(); };
  }, [limit, qc]);

  const data = qc.getQueryData<any[]>(["market", limit]);
  return { data, connected };
}
