import re

with open('frontend/src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r'<div className="relative mx-auto mt-32 pb-40" style=\{\{ maxWidth: 1[0-9]+ \}\}>.*?(?=\s*\{/\*\s*HOW IT WORKS\s*\*/\})', re.DOTALL)
match = pattern.search(code)

if not match:
    print("Not found")
    exit(1)

replacement = """<div style={{ position: "relative", padding: "0 clamp(16px, 4vw, 48px)" }}>
          {[
            {
              badge: "LIVE DATA",
              badgeColor: "#00f0ff",
              icon: BarChart2,
              title: "Real-Time Market Tracking",
              desc: "Track 2,500+ cryptocurrencies with blazing fast updates. Never miss a volume spike or a whale movement again with our interactive heatmap.",
              mockupContent: (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { name: "Bitcoin", sym: "BTC", price: "$107,412", change: "+2.4%", up: true, bar: 82 },
                    { name: "Ethereum", sym: "ETH", price: "$3,891", change: "+1.8%", up: true, bar: 71 },
                    { name: "Solana", sym: "SOL", price: "$182", change: "-0.9%", up: false, bar: 58 },
                    { name: "BNB", sym: "BNB", price: "$724", change: "+3.2%", up: true, bar: 64 },
                    { name: "Avalanche", sym: "AVAX", price: "$38", change: "-1.5%", up: false, bar: 42 },
                  ].map((c, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(0,240,255,0.1)",
                        border: "1px solid rgba(0,240,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, color: "#00f0ff"
                      }}>{c.sym.slice(0,1)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <div style={{ height: 3, width: 60, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ width: c.bar + "%", height: "100%", borderRadius: 2, background: c.up ? "#00f0ff" : "#ff4757" }} />
                          </div>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{c.sym}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "monospace" }}>{c.price}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.up ? "#00f0ff" : "#ff4757", fontFamily: "monospace" }}>{c.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              badge: "NEKO AI",
              badgeColor: "#b026ff",
              icon: Brain,
              title: "AI Portfolio Manager",
              desc: "Get deep insights powered by Groq Llama 3.3. Our AI agent analyzes your holdings, detects correlation risks, and gives actionable rebalancing recommendations.",
              mockupContent: (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "16px", borderRadius: 12, background: "rgba(176,38,255,0.08)", border: "1px solid rgba(176,38,255,0.2)" }}>
                    <div style={{ fontSize: 10, color: "rgba(176,38,255,0.8)", fontWeight: 800, letterSpacing: ".15em", marginBottom: 8 }}>AI NEKO ANALYSIS</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>Your BTC position is up <span style={{ color: "#00f0ff", fontWeight: 700 }}>+18.4%</span> since last month. Consider taking <span style={{ color: "#b026ff", fontWeight: 700 }}>15% profits</span> to rebalance your ETH allocation.</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Portfolio Score", value: "87/100", color: "#2ecc71" },
                      { label: "Risk Level", value: "Medium", color: "#f39c12" },
                      { label: "Correlation", value: "0.72", color: "#b026ff" },
                      { label: "Sharpe Ratio", value: "1.84", color: "#00f0ff" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              badge: "TAX & REPORTS",
              badgeColor: "#2ecc71",
              icon: Wallet,
              title: "Automated Tax Calculation",
              desc: "Connect your Ethereum wallets or import Binance CSVs. We automatically calculate your FIFO P&L and generate exportable tax reports in seconds.",
              mockupContent: (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: ".1em" }}>TRANSACTION HISTORY</span>
                    <span style={{ fontSize: 10, color: "#2ecc71", fontWeight: 700, background: "rgba(46,204,113,0.1)", padding: "3px 10px", borderRadius: 100 }}>FY 2024</span>
                  </div>
                  {[
                    { type: "BUY", asset: "BTC", amount: "+0.42", value: "$43,210", pnl: null, date: "Jan 14" },
                    { type: "SELL", asset: "ETH", amount: "-2.5", value: "$8,340", pnl: "+$1,240", date: "Mar 22" },
                    { type: "SELL", asset: "SOL", amount: "-45", value: "$6,750", pnl: "+$3,100", date: "May 8" },
                    { type: "BUY", asset: "BNB", amount: "+8.2", value: "$4,120", pnl: null, date: "Aug 3" },
                  ].map((t, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                        background: t.type === "BUY" ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)",
                        color: t.type === "BUY" ? "#2ecc71" : "#ff4757",
                        border: "1px solid " + (t.type === "BUY" ? "rgba(46,204,113,0.2)" : "rgba(255,71,87,0.2)"),
                        letterSpacing: ".08em"
                      }}>{t.type}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{t.asset} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{t.amount}</span></div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{t.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{t.value}</div>
                        {t.pnl && <div style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", fontFamily: "monospace" }}>{t.pnl}</div>}
                      </div>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 4, padding: "14px 16px", borderRadius: 12,
                    background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Realized P&L</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#2ecc71", fontFamily: "monospace" }}>+$4,340</span>
                  </div>
                </div>
              ),
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            const isEven = i % 2 === 0;
            return (
              <div
                key={i}
                style={{
                  position: "sticky",
                  top: (100 + i * 30) + "px",
                  marginBottom: i === 2 ? 0 : "90vh",
                  zIndex: i + 10,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 60,
                  alignItems: "center",
                  padding: "80px 80px",
                  borderRadius: "40px",
                  background: "rgba(2, 6, 23, 0.98)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 40px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
                  overflow: "hidden",
                  position: "sticky",
                }}
              >
                {/* BG glow */}
                <div style={{
                  position: "absolute",
                  top: "-30%",
                  left: isEven ? "-10%" : "auto",
                  right: isEven ? "auto" : "-10%",
                  width: "50%", height: "200%",
                  background: "radial-gradient(circle, " + feature.badgeColor + "12 0%, transparent 55%)",
                  filter: "blur(80px)",
                  pointerEvents: "none", zIndex: 0,
                }} />

                {/* Text side */}
                <div style={{ position: "relative", zIndex: 1, order: isEven ? 1 : 2 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "8px 20px", borderRadius: 100,
                    background: feature.badgeColor + "12",
                    border: "1px solid " + feature.badgeColor + "35",
                    color: feature.badgeColor,
                    fontSize: 12, fontWeight: 800, letterSpacing: ".15em",
                    marginBottom: 32,
                    boxShadow: "0 0 24px " + feature.badgeColor + "20",
                  }}>
                    <Icon size={14} />
                    {feature.badge}
                  </div>
                  <h3 style={{
                    fontSize: "clamp(36px, 4.5vw, 56px)",
                    fontWeight: 900, color: "white",
                    margin: "0 0 24px",
                    letterSpacing: "-0.03em", lineHeight: 1.08,
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: "clamp(16px, 1.8vw, 20px)",
                    color: "rgba(255, 255, 255, 0.5)",
                    lineHeight: 1.7, margin: "0 0 40px", maxWidth: 460,
                  }}>
                    {feature.desc}
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    color: feature.badgeColor, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                    Learn more <ArrowRight size={16} />
                  </div>
                </div>

                {/* Mockup panel */}
                <div style={{
                  position: "relative", zIndex: 1,
                  order: isEven ? 2 : 1,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 24, padding: "24px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px " + feature.badgeColor + "10",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 20, paddingBottom: 16,
                    borderBottom: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    {["#ff5f57","#febc2e","#28c840"].map((c,idx) => (
                      <div key={idx} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    ))}
                    <div style={{
                      flex: 1, marginLeft: 8, height: 18, borderRadius: 5,
                      background: "rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>cryptoneko.app</span>
                    </div>
                  </div>
                  {feature.mockupContent}
                </div>
              </div>
            );
          })}
        </div>
        </Reveal>
      </section>
"""

new_code = code[:match.start()] + replacement + code[match.end():]
with open('frontend/src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(new_code)
print("Done")
