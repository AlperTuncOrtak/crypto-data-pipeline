import React from "react";
import { T } from "../components/landing/LandingHelpers";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import FaqSection from "../components/landing/FaqSection";
import CtaSection from "../components/landing/CtaSection";

export default function Landing({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  return (
    <div className="mesh-hero" style={{ background: T.bg, color: T.textPrimary, fontFamily: "Inter, sans-serif", overflowX: "clip" }}>
      <HeroSection onAuthOpen={onAuthOpen} />
      <FeaturesSection />
      <PricingSection onAuthOpen={onAuthOpen} />
      <FaqSection />
      <CtaSection onAuthOpen={onAuthOpen} />
    </div>
  );
}
