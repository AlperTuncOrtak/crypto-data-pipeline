import { useAuth } from "../hooks/useAuth";
import CryptoNetworkCanvas from "../components/landing/CryptoNetworkCanvas";
import Hero from "../components/landing/Hero";
import LandingNavbar from "../components/landing/LandingNavbar";
import FeatureCards from "../components/landing/FeatureCards";
import BentoStats from "../components/landing/BentoStats";
import CTABanner from "../components/landing/CTABanner";

// ── Partner Logos ──────────────────────────────────────────────
const PARTNERS = [
  { name: "BINANCE", img: "/logos/binance.png" },
  { name: "COINBASE", img: "/logos/coinbase.png" },
  { name: "KRAKEN", img: "/logos/kraken.png" },
  { name: "OKX", img: "/logos/okx.png" },
  { name: "BYBIT", img: "/logos/bybit.png" },
  { name: "BITGET", img: "/logos/bitget.png" },
  { name: "KUCOIN", img: "/logos/kucoin.png" },
  { name: "METAMASK", img: "/logos/metamask.svg" },
  { name: "TRUST WALLET", img: "/logos/trustwallet.png" },
];

// ── Page ───────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();

  return (
    <div
      className="relative min-h-screen bg-[#020817] text-white selection:bg-cyan-500/40 selection:text-white font-sans overflow-x-hidden"
      style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
    >
      {/* ── DEEP SPACE BACKGROUND ───────────────────────────────────
          The 3D globe fills the top viewport and remains visible
          through all sections via `sticky` positioning on the canvas. */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CryptoNetworkCanvas />
      </div>

      {/* Radial vignette overlay so content sections stay readable */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, transparent 40%, #020817 85%)",
        }}
      />

      {/* Bottom gradient masks the globe as content appears */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[50vh] z-[1] pointer-events-none"
        style={{
          background: "linear-gradient(to top, #020817 30%, transparent)",
        }}
      />

      {/* ── NAVBAR ────────────────────────────────────────────────── */}
      <LandingNavbar partners={PARTNERS} />

      {/* ── HERO (full-viewport) ──────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Hero isLoggedIn={!!user} />
        {/* Spacer so hero text sits in the top half and globe peeks below */}
        <div className="flex-1" />
      </div>

      {/* ── CONTENT SECTIONS (scrollable, above the globe) ─────────── */}
      <div className="relative z-10">
        {/* Smooth top fade into the section */}
        <div className="h-24 bg-gradient-to-b from-transparent to-[#020817]" />

        {/* ── FEATURE CARDS (Ascend screenshot 2) ──────────────────── */}
        <div className="bg-[#020817]">
          <FeatureCards />
        </div>

        {/* ── BENTO STATS (Ascend screenshot 3) ────────────────────── */}
        <div className="bg-[#020817]">
          <BentoStats />
        </div>

        {/* ── CTA + FOOTER (Ascend screenshot 4) ───────────────────── */}
        <div className="bg-[#020817] pb-10">
          <CTABanner isLoggedIn={!!user} />
        </div>
      </div>
    </div>
  );
}
