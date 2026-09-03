import React from "react";

export const BackgroundPlus: React.FC<{
  className?: string;
  plusColor?: string;
  plusSize?: number;
  fade?: boolean;
}> = ({ className = "", plusColor = "#000000", plusSize = 40, fade = true }) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${plusColor} 1px, transparent 0)`,
        backgroundSize: `${plusSize}px ${plusSize}px`,
        maskImage: fade ? "linear-gradient(to bottom, white, transparent)" : undefined,
        WebkitMaskImage: fade ? "linear-gradient(to bottom, white, transparent)" : undefined,
      }}
    />
  );
};
