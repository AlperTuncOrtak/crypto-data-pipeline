export interface AnalystResponse {
  structure: {
    trend: "bullish" | "bearish" | "sideways" | "unknown";
    description: string;
  };
  levels: {
    support: { price: number; tests: number }[];
    resistance: { price: number; tests: number }[];
  };
  setupMatch: {
    score: number;
    description: string;
    isMatched: boolean;
  };
  invalidation: {
    price: number;
    description: string;
  };
  confidence: number;
  disclaimer: string;
}

export const analyzeChartMock = async (imageFile: File): Promise<AnalystResponse> => {
  // Simulate network delay (e.g. 3.5 seconds for Claude to "think")
  await new Promise((resolve) => setTimeout(resolve, 3500));

  // Randomize slightly for flavor, but mostly return a solid mock setup
  const isBullish = Math.random() > 0.3; // 70% chance bullish for the mock

  if (isBullish) {
    return {
      structure: {
        trend: "bullish",
        description: "Higher highs and higher lows identified on the macro timeframe. Price is currently consolidating above the 200 EMA.",
      },
      levels: {
        support: [
          { price: 62450.0, tests: 4 },
          { price: 60100.0, tests: 2 },
        ],
        resistance: [
          { price: 65000.0, tests: 3 },
          { price: 67200.0, tests: 1 },
        ],
      },
      setupMatch: {
        score: 8,
        isMatched: true,
        description: "Matches the 'Trend Continuation Breakout' rules. Volume is expanding on the right side of the base.",
      },
      invalidation: {
        price: 61900.0,
        description: "A daily close below 61,900 breaks the local market structure and invalidates the bullish thesis.",
      },
      confidence: 85,
      disclaimer: "I am reading a static image. Confirm exact levels on your live chart. Paper trade first, this isn't financial advice.",
    };
  } else {
    return {
      structure: {
        trend: "bearish",
        description: "Lower highs and lower lows identified. Price is struggling to reclaim the key horizontal pivot.",
      },
      levels: {
        support: [
          { price: 58000.0, tests: 3 },
          { price: 55200.0, tests: 1 },
        ],
        resistance: [
          { price: 61500.0, tests: 4 },
          { price: 63000.0, tests: 2 },
        ],
      },
      setupMatch: {
        score: 4,
        isMatched: false,
        description: "Does NOT match the primary setup rules. Risk:Reward is skewed and momentum indicators show bearish divergence.",
      },
      invalidation: {
        price: 63200.0,
        description: "A 4H close above 63,200 would reclaim the range high and invalidate the bearish thesis.",
      },
      confidence: 78,
      disclaimer: "I am reading a static image. Confirm exact levels on your live chart. Paper trade first, this isn't financial advice.",
    };
  }
};
