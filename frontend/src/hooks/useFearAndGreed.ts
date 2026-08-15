import { useState, useEffect } from 'react';

import { apiClient } from '../api/client';

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export function useFearAndGreed() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [history, setHistory] = useState<FearGreedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fallback to direct fetch since we want 30 days history 
        // (if backend doesn't support limit=30 easily, we'll just hit alternative.me directly)
        const directResponse = await fetch('https://api.alternative.me/fng/?limit=30');
        const directJson = await directResponse.json();
        
        if (directJson && directJson.data && directJson.data.length > 0) {
          setData(directJson.data[0]);
          setHistory(directJson.data);
          return;
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 1 hour
    const interval = setInterval(fetchData, 3600000);
    return () => clearInterval(interval);
  }, []);

  return { data, history, loading, error };
}

export function getAiAnalysisText(score: number): string {
  if (score <= 20) {
    return "Market is in Extreme Fear. High volume of panic selling detected. Contrarian indicators suggest an upcoming bounce opportunity.";
  } else if (score <= 40) {
    return "Market sentiment is Fearful. Selling pressure remains dominant, but accumulation patterns are forming in major support zones.";
  } else if (score <= 60) {
    return "Market is Neutral. Capital is rotating between sectors with no clear directional momentum. Algorithmic trading is ranging.";
  } else if (score <= 80) {
    return "Market shows Greed. Buying momentum is strong with steady retail inflow. Breakout structures are holding well.";
  } else {
    return "Market is in Extreme Greed. Euphoria detected with highly overleveraged longs. AI warns of a potential sharp correction or localized top.";
  }
}
