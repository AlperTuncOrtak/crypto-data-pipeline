import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface GlobalHistoryData {
  date: string;
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  eth_dominance: number;
}

export function useGlobalHistory(days: number = 30) {
  const [data, setData] = useState<GlobalHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using apiClient to fetch from our FastAPI backend
        const response = await apiClient.get(`/market/global-history?days=${days}`);
        setData(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch global history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  return { data, loading, error };
}
