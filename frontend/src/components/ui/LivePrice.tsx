import { useState, useEffect, useRef } from "react";
import NumberFlow from "@number-flow/react";

interface LivePriceProps {
  value: number;
  format?: Intl.NumberFormatOptions;
}

export default function LivePrice({ value, format }: LivePriceProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      setFlash("up");
    } else if (value < prevValue.current) {
      setFlash("down");
    }
    
    prevValue.current = value;
    
    const timer = setTimeout(() => setFlash(null), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  // Determine styles based on flash state
  const baseClasses = "transition-all duration-300 rounded px-1 -mx-1";
  const flashClasses = 
    flash === "up" 
      ? "text-[var(--accent)] bg-[var(--accent)]/10 drop-shadow-[0_0_8px_var(--accent)]" 
      : flash === "down" 
      ? "text-red-400 bg-red-500/10 drop-shadow-[0_0_8px_#ef4444]" 
      : "text-[var(--text-main)]";

  return (
    <div className={`${baseClasses} ${flashClasses}`}>
      <NumberFlow value={value} format={format as any} />
    </div>
  );
}
