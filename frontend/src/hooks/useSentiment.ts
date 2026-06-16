import { useState, useEffect } from "react";

export interface SentimentData {
  value: number; // 0 to 100
  classification: string;
  lastUpdated: string;
}

export function useSentiment() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSentiment() {
      try {
        setLoading(true);
        const res = await fetch("https://api.alternative.me/fng/");
        if (!res.ok) throw new Error("Failed to fetch sentiment");
        
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          const item = json.data[0];
          setData({
            value: parseInt(item.value, 10),
            classification: item.value_classification,
            lastUpdated: item.timestamp,
          });
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSentiment();
    
    // Poll every hour since it's a slow-moving daily index
    const interval = setInterval(fetchSentiment, 3600000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
