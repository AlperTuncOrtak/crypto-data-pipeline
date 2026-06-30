import React, { useState, useEffect, useRef } from "react";

function formatPrice(n: any) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1000)
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  if (num >= 0.0001) return `$${num.toFixed(6)}`;
  if (num >= 0.000001) return `$${num.toFixed(8)}`;
  return `<$0.000001`;
}

export default function PriceCell({ price, className = "" }: { price: any, className?: string }) {
  const prevPrice = useRef(price);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (price !== prevPrice.current) {
      if (price > prevPrice.current) setFlashClass("price-flash-up");
      else if (price < prevPrice.current) setFlashClass("price-flash-down");
      prevPrice.current = price;
      
      const timer = setTimeout(() => setFlashClass(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [price]);

  return <span className={`font-mono ${flashClass} ${className}`.trim()}>{formatPrice(price)}</span>;
}
