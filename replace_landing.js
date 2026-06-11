const fs = require('fs');

const path = 'frontend/src/pages/Landing.tsx';
let code = fs.readFileSync(path, 'utf8');

const startTag = '        <div\n          style={{\n            display: "grid",\n            gridTemplateColumns: "repeat(auto-fit,minmax(min(320px, 100%), 1fr))",';
const endTag = '      {/* HOW IT WORKS */}';

const startIndex = code.indexOf(startTag);
if (startIndex === -1) {
  console.log("Start tag not found");
  process.exit(1);
}
const endIndex = code.indexOf(endTag);
if (endIndex === -1) {
  console.log("End tag not found");
  process.exit(1);
}

const replacement = `        <div className="relative mx-auto mt-20" style={{ maxWidth: 1000 }}>
          {[
            {
              badge: "LIVE DATA",
              title: "Real-Time Market Tracking",
              desc: "Track 2,500+ cryptocurrencies with blazing fast updates. Never miss a volume spike or a whale movement again with our interactive heatmap.",
              color: "#00f0ff",
              icon: BarChart2,
            },
            {
              badge: "NEKO AI",
              title: "AI Portfolio Manager",
              desc: "Get deep insights powered by Groq Llama 3.3. Our AI agent analyzes your holdings, detects correlation risks, and gives actionable rebalancing recommendations.",
              color: "#b026ff",
              icon: Brain,
            },
            {
              badge: "TAX & REPORTS",
              title: "Automated Tax Calculation",
              desc: "Connect your Ethereum wallets or import Binance CSVs. We automatically calculate your FIFO P&L and generate exportable tax reports in seconds.",
              color: "#2ecc71",
              icon: Wallet,
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                style={{
                  position: "sticky",
                  top: \`calc(140px + \${i * 20}px)\`,
                  marginBottom: i === 2 ? 0 : "30vh",
                  padding: "48px",
                  borderRadius: "32px",
                  background: "rgba(2, 6, 23, 0.85)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: \`0 20px 80px rgba(0,0,0,0.8), inset 0 0 0 1px \${feature.color}20\`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                  zIndex: i + 10,
                  transformOrigin: "top center",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Glow effect in top right corner */}
                <div style={{
                  position: "absolute",
                  top: -100, right: -100,
                  width: 300, height: 300,
                  background: \`radial-gradient(circle, \${feature.color}15 0%, transparent 60%)\`,
                  borderRadius: "50%",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                  zIndex: 0,
                }} />

                <div style={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: 100,
                  background: \`\${feature.color}10\`,
                  border: \`1px solid \${feature.color}30\`,
                  color: feature.color,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  width: "max-content"
                }}>
                  <Icon size={14} />
                  {feature.badge}
                </div>
                
                <h3 style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 900,
                  color: "white",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  {feature.title}
                </h3>
                
                <p style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(16px, 2vw, 20px)",
                  color: "rgba(255, 255, 255, 0.5)",
                  lineHeight: 1.6,
                  maxWidth: "800px",
                  margin: 0
                }}>
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
        </Reveal>
      </section>

`;

const newCode = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync(path, newCode);
console.log("Successfully replaced grid with sticky scroll.");
