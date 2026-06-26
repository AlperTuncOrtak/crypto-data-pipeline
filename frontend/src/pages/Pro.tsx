import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Zap,
  Terminal,
  Cpu,
  RefreshCw,
  FolderSync,
  Palette,
  Cloud,
  ArrowRight,
  Check,
  Star,
  Lock,
  MessageSquare
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Background Aurora ──────────────────────────────────────────
const BackgroundAurora = () => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "10%",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(circle, rgba(255, 51, 102, 0.15) 0%, transparent 60%)",
          filter: "blur(100px)",
          borderRadius: "50%"
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "5%",
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
          filter: "blur(120px)",
          borderRadius: "50%"
        }}
      />
      
      {/* Subtle Grid overlay like raycast */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          opacity: 0.5
        }}
      />
    </div>
  );
};

// ── Bento Card (Glassmorphic) ───────────────────────────────────
interface BentoCardProps {
  icon: any;
  title: string;
  desc: string;
  delay?: number;
}

const BentoCard = ({ icon: Icon, title, desc, delay = 0 }: BentoCardProps) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "rgba(20, 20, 20, 0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: "32px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      {/* Spotlight Hover */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.06), transparent 80%)`,
            zIndex: 0
          }}
        />
      )}
      {/* Border Hover Glow */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: 24,
            padding: 1,
            background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.4), transparent 80%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            zIndex: 1
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
          }}
        >
          <Icon size={22} style={{ color: "#fff" }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>
          {title}
        </h3>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

// ── Hero Mockup Component (Raycast Style) ──────────────────────
const HeroMockup = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);

  return (
    <motion.div 
      style={{ y, scale, opacity }}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="hero-mockup-wrapper"
    >
      <div 
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          background: "rgba(10, 10, 10, 0.8)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 24,
          boxShadow: "0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
      >
        {/* Mockup Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <Sparkles size={16} style={{ color: "#ff3366" }} />
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>CryptoNeko AI Console</span>
        </div>
        
        {/* Mockup Content */}
        <div style={{ display: "flex", padding: 24, gap: 24, height: 380 }}>
          {/* Left Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255, 153, 0, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>₿</span>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Bitcoin AI Signal</div>
                <div style={{ color: "#10b981", fontSize: 11, fontWeight: 500 }}>Strong Buy - Confidence 92%</div>
              </div>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>Ξ</span>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Ethereum Analysis</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Analyzing smart contract volume...</div>
              </div>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(236, 72, 153, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>◎</span>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Solana Alert</div>
                <div style={{ color: "#ef4444", fontSize: 11 }}>Whale sell-off detected</div>
              </div>
            </div>
          </div>
          
          {/* Right Panel (Terminal) */}
          <div style={{ flex: 1.5, background: "#050505", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 20, fontFamily: "monospace", display: "flex", flexDirection: "column" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 16 }}>// AI Market Analysis Stream</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, display: "flex", gap: 8 }}>
                <span style={{ color: "#ff3366" }}>{">"}</span>
                <span>Initializing deep learning models... [OK]</span>
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 13, display: "flex", gap: 8 }}>
                <span style={{ color: "#ff3366" }}>{">"}</span>
                <span>Scanning order books across 14 exchanges... [OK]</span>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{ color: "#10b981", fontSize: 13, display: "flex", gap: 8, marginTop: 8 }}
              >
                <span style={{ color: "#10b981" }}>$</span>
                <span>Opportunity Found: BTC/USDT Arbitrage</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, paddingLeft: 16 }}
              >
                Expected yield: 0.8% • Execution time: 1.2s<br/>
                Auto-execute enabled via Pro API.
              </motion.div>
              <motion.div 
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ width: 8, height: 16, background: "#ff3366", marginTop: 8 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
export default function Pro() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "relative",
        background: "#000000",
        minHeight: "100vh",
        color: "#ffffff",
        overflowX: "hidden",
        paddingBottom: 120
      }}
    >
      <BackgroundAurora />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        
        {/* ── HERO SECTION ── */}
        <div style={{ paddingTop: 140, paddingBottom: 100, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(255, 51, 102, 0.1)",
              border: "1px solid rgba(255, 51, 102, 0.2)",
              marginBottom: 32,
              boxShadow: "0 0 20px rgba(255, 51, 102, 0.1)"
            }}
          >
            <Star size={14} style={{ color: "#ff3366", fill: "#ff3366" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#ff3366", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {t("pro_page.hero_badge") || "CryptoNeko Pro"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontSize: "clamp(48px, 6vw, 80px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginBottom: 24,
              maxWidth: 900
            }}
          >
            Unlock a new level of
            <br />
            <span
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              crypto intelligence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 600,
              margin: "0 auto 48px",
              lineHeight: 1.5,
              letterSpacing: "-0.01em"
            }}
          >
            {t("pro_page.hero_desc") || "Supercharge your trading with predictive AI, custom themes, and lightning-fast real-time webhooks. Built for professionals."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "14px 32px",
                borderRadius: 999,
                background: "#ffffff",
                color: "#000000",
                fontWeight: 600,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 0 40px rgba(255, 255, 255, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 60px rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(255, 255, 255, 0.2)";
              }}
            >
              Get Pro <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "14px 32px",
                borderRadius: 999,
                background: "transparent",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 16,
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* ── HERO MOCKUP ── */}
        <HeroMockup />

        {/* ── BENTO GRID FEATURES ── */}
        <div style={{ marginTop: 160 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Everything you need to excel
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }}>
              Powerful features engineered for performance.
            </p>
          </motion.div>

          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              maxWidth: 1000,
              margin: "0 auto"
            }}
          >
            <BentoCard
              icon={Cpu}
              title={t("pro_page.feature_ai_title") || "More AI Power"}
              desc={t("pro_page.feature_ai_desc") || "Access advanced, uncensored trading models and deep sentiment analysis."}
              delay={0}
            />
            <BentoCard
              icon={Palette}
              title={t("pro_page.themes_title") || "Custom Themes"}
              desc={t("pro_page.themes_subtitle") || "Make it yours with custom color palettes and personalized dashboards."}
              delay={0.1}
            />
            <BentoCard
              icon={Cloud}
              title="Cloud Sync"
              desc="Seamlessly sync your portfolios, alerts, and settings across all your devices securely."
              delay={0.2}
            />
            <BentoCard
              icon={Zap}
              title="Unlimited APIs"
              desc="Connect to unlimited exchange APIs with zero rate limits on our platform."
              delay={0.3}
            />
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            marginTop: 160,
            marginBottom: 80,
            textAlign: "center",
            padding: "80px 40px",
            background: "linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.8) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 32,
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* subtle glow in CTA */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 300, height: 300, background: "radial-gradient(circle, rgba(255,51,102,0.15), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
          
          <Lock size={40} style={{ color: "rgba(255,255,255,0.8)", margin: "0 auto 24px", display: "block" }} />
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Ready to become a Pro?
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            Join thousands of traders leveraging our AI tools. Cancel anytime.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              padding: "16px 40px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 10px 30px rgba(255, 255, 255, 0.15)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Start Free Trial
          </button>
        </motion.div>

      </div>
    </div>
  );
}
