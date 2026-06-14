import fs from 'fs';

const data = [
  { time: '2023-01-01T10:00:00Z', price: '100' },
  { time: '2023-01-01T10:05:00Z', price: '105' },
  { time: '2023-01-01T10:10:00Z', price: '102' },
  { time: '2023-01-01T10:15:00Z', price: '108' }
];

function aggregateToOHLC(data, targetBuckets = 60) {
  if (!data || data.length < 2) return [];

  // Safely parse timestamps and prices
  const parsed = data
    .map(d => ({
      time: new Date(d.time).getTime(),
      price: Number(d.price)
    }))
    .filter(d => !isNaN(d.time) && !isNaN(d.price));

  if (parsed.length < 2) return [];

  const sorted = parsed.sort((a, b) => a.time - b.time);
  const startTime = sorted[0].time;
  const endTime = sorted[sorted.length - 1].time;
  
  if (startTime === endTime) return [];

  const actualBuckets = Math.min(targetBuckets, Math.max(12, Math.floor(sorted.length / 2)));
  const interval = (endTime - startTime) / actualBuckets;
  
  const buckets = Array.from({ length: actualBuckets }, (_, i) => ({
    time: startTime + i * interval,
    prices: [],
  }));

  sorted.forEach(point => {
    let idx = Math.floor((point.time - startTime) / interval);
    if (idx >= actualBuckets) idx = actualBuckets - 1;
    if (idx < 0) idx = 0;
    buckets[idx].prices.push(point.price);
  });

  let lastValidClose = sorted[0].price;
  let lastTime = 0;

  const result = [];
  for (const b of buckets) {
    let t = Math.floor(b.time / 1000);
    // LightweightCharts requires strictly ascending, unique times
    if (t <= lastTime) {
      t = lastTime + 1;
    }
    lastTime = t;

    if (b.prices.length === 0) {
      result.push({
        time: t,
        open: lastValidClose,
        high: lastValidClose,
        low: lastValidClose,
        close: lastValidClose,
      });
    } else {
      const open = b.prices[0];
      const close = b.prices[b.prices.length - 1];
      const high = Math.max(...b.prices);
      const low = Math.min(...b.prices);
      
      lastValidClose = close;
      
      result.push({
        time: t,
        open,
        high,
        low,
        close,
      });
    }
  }
  return result;
}

console.log(JSON.stringify(aggregateToOHLC(data, 100), null, 2));
