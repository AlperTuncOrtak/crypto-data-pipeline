import { useState, useEffect } from "react";

export interface DataPoint {
  timestamp: number;
  price: number;
}

export function useTimeMachine(coinId: string | null) {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coinId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Fetch 1 year of daily data (365 days) from CoinGecko
    fetch(`https://api.coingecko.com/api/v3/coins/${coinId.toLowerCase()}/market_chart?vs_currency=usd&days=365`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch historical data");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.prices && Array.isArray(data.prices)) {
          const formatted = data.prices.map((p: [number, number]) => ({
            timestamp: p[0],
            price: p[1],
          }));
          setHistory(formatted);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coinId]);

  return { history, isLoading, error };
}
