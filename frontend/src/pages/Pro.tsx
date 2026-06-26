import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Zap,
  Cloud,
  ArrowRight,
  Search,
  Command,
  ChevronRight,
  MessageSquare,
  Lock,
  Cpu,
  Palette,
  Terminal
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Background Aurora ──────────────────────────────────────────
const BackgroundAurora = () => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(255, 51, 102, 0.12) 0%, rgba(139, 92, 246, 0.08) 30%, transparent 70%)",
          filter: "blur(80px)",
          borderRadius: "50%"
        }}
      />
      {/* Subtle Grain / Dot pattern overlay */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          opacity: 0.6
        }}
      />
    </div>
  );
};

// ── Bento Card (Glassmorphic Premium) ───────────────────────────────────
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(20, 20, 20, 0.4) 0%, rgba(10, 10, 10, 0.4) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 20,
        padding: "32px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
      }}
    >
      {/* Spotlight Hover */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.03), transparent 80%)`,
            zIndex: 0
          }}
        />
      )}
      
      {/* Subtle top border highlight */}
      <div style={{ position: "absolute", top: 0, left: 20, right: 20, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(180deg, rgba(40,40,40,1) 0%, rgba(20,20,20,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}
        >
          <Icon size={20} style={{ color: "rgba(255,255,255,0.9)" }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

// ── Raycast-like Command Mockup ──────────────────────
const HeroMockup = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);

  return (
    <motion.div 
      style={{ y, scale }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="hero-mockup-wrapper"
    >
      <div 
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          background: "rgba(18, 18, 18, 0.8)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
      >
        {/* Mockup Header - Search Bar */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
          <Search size={22} style={{ color: "rgba(255,255,255,0.4)" }} />
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: 400, flex: 1, letterSpacing: "-0.02em" }}>
            Ask CryptoNeko AI...
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", padding: "4px 8px", borderRadius: 6, fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
            <Command size={12} /> K
          </div>
        </div>
        
        {/* Mockup Content - Command List */}
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ padding: "0 12px", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 500, marginBottom: 4, marginTop: 8 }}>
            SUGGESTED
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(255,255,255,0.02)" }}>
            <div style={{ background: "linear-gradient(135deg, #ff3366, #ff7733)", padding: 6, borderRadius: 8 }}>
              <Sparkles size={16} style={{ color: "#fff" }} />
            </div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Analyze BTC Technicals</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Pro Feature</span>
              <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "rgba(255,255,255,0.6)", minWidth: 20, textAlign: "center" }}>↵</kbd>
            </div>
          </div>

          <div style={{ borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, transition: "background 0.2s" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: 6, borderRadius: 8 }}>
              <MessageSquare size={16} style={{ color: "rgba(255,255,255,0.8)" }} />
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500 }}>Summarize Market Sentiment</div>
          </div>
          
          <div style={{ borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: 6, borderRadius: 8 }}>
              <Zap size={16} style={{ color: "rgba(255,255,255,0.8)" }} />
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 500 }}>Check Whale Alert Anomalies</div>
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        paddingBottom: 120
      }}
    >
      <BackgroundAurora />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
        
        {/* ── HERO SECTION ── */}
        <div style={{ paddingTop: 160, paddingBottom: 100, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: 32,
            }}
          >
            <Sparkles size={14} style={{ color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}>
              {t("pro_page.hero_badge") || "Introducing CryptoNeko Pro"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(56px, 7vw, 88px)",
              fontWeight: 700,
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
                background: "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.4) 100%)",
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
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 21,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 580,
              margin: "0 auto 48px",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              fontWeight: 400
            }}
          >
            {t("pro_page.hero_desc") || "Supercharge your workflow with predictive AI, custom themes, and lightning-fast real-time data integrations."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", alignItems: "center", gap: 16 }}
          >
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: "#ffffff",
                color: "#000000",
                fontWeight: 600,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 8px 20px -8px rgba(255,255,255,0.4)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Get Pro <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.03)",
                color: "#ffffff",
                fontWeight: 500,
                fontSize: 15,
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* ── HERO MOCKUP ── */}
        <HeroMockup />

        {/* ── BENTO GRID FEATURES ── */}
        <div style={{ marginTop: 200 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: 80 }}
          >
            <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Everything you need.
            </h2>
            <p style={{ fontSize: 20, color: "rgba(255,255,255,0.4)" }}>
              Powerful features engineered for professional traders.
            </p>
          </motion.div>

          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              maxWidth: 900,
              margin: "0 auto"
            }}
          >
            <BentoCard
              icon={Cpu}
              title={t("pro_page.feature_ai_title") || "Advanced AI"}
              desc={t("pro_page.feature_ai_desc") || "Access advanced trading models and deep sentiment analysis right from the command bar."}
              delay={0}
            />
            <BentoCard
              icon={Palette}
              title={t("pro_page.themes_title") || "Custom Themes"}
              desc={t("pro_page.themes_subtitle") || "Make it yours with custom color palettes, specific to your trading environment."}
              delay={0.1}
            />
            <BentoCard
              icon={Cloud}
              title="Cloud Sync"
              desc="Seamlessly sync your portfolios, alerts, and settings across all your devices securely."
              delay={0.2}
            />
            <BentoCard
              icon={Terminal}
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
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 200,
            marginBottom: 80,
            textAlign: "center",
            padding: "100px 40px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 32,
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* subtle glow in CTA */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 300, background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
          
          <div style={{ width: 64, height: 64, margin: "0 auto 32px", background: "linear-gradient(180deg, rgba(40,40,40,1), rgba(20,20,20,1))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
             <Lock size={28} style={{ color: "rgba(255,255,255,0.9)" }} />
          </div>

          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Ready to become a Pro?
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            Join thousands of traders leveraging our tools.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              padding: "14px 32px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#000000",
              fontWeight: 600,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 8px 20px -8px rgba(255,255,255,0.4)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Start Your Free Trial
          </button>
        </motion.div>

      </div>
    </div>
  );
}
