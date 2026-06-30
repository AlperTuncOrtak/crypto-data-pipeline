import re

with open('src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the layout from <!-- ¦¦¦ HEADER ¦¦¦ --> to the end of the file.
# The header starts at <div className="reveal" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>

header_start = content.find('{/* ¦¦¦ HEADER ¦¦¦ */}')
if header_start == -1:
    header_start = content.find('<div className="reveal" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>')

end_tag = content.rfind('</div>\n    </div>\n  );\n}')

new_layout = '''{/* ¦¦¦ HEADER ¦¦¦ */}
      <div className="reveal" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", margin: 0,
            background: "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Piyasa özetini 30 saniyede kavra.
          </p>
        </div>
        <LiveBadge />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }}>
        
        {/* LEFT COLUMN: Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* MACRO STRIP */}
          <div
            className="reveal card-apple"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", overflow: "hidden", '--reveal-delay': '60ms' } as any}
          >
            {[
              { label: "Market Cap", value: fmt(totalMcap), sub: ${coins.length}+ asset },
              { label: "24h Volume", value: fmt(totalVolume), sub: "global" },
              { label: "BTC Dominance", value: ${btcDom}%, sub: "of total market" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 24px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
                  {item.value}
                </div>
                {item.sub && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginTop: 4, fontFamily: "monospace" }}>
                    {item.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MAIN CHART */}
          <div className="reveal card-apple" style={{ padding: "24px", '--reveal-delay': '120ms' } as any}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {btcCoin?.image_url && <img src={btcCoin.image_url} alt="BTC" style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Bitcoin (BTC)</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: "#fff", letterSpacing: "-0.02em" }}>
                  {btcCoin ? <PriceCell price={btcCoin.current_price} /> : "—"}
                </div>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, fontFamily: "monospace",
                color: btcUp ? "#22c55e" : "#ef4444",
                background: btcUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                padding: "6px 12px", borderRadius: 8,
              }}>
                {btcCoin && (Number(btcCoin.price_change_percentage_24h) >= 0 ? "+" : "")}{btcCoin ? Number(btcCoin.price_change_percentage_24h).toFixed(2) : "0"}%
              </span>
            </div>
            <div style={{ width: "100%", height: 120, position: "relative" }}>
               {/* Stretch the SVG to fit container width */}
               <MiniChart points={btcPoints} up={btcUp} width={800} height={120} />
            </div>
          </div>

          {/* TOP 10 TABLE */}
          <div className="reveal card-apple" style={{ padding: "20px 8px", '--reveal-delay': '180ms' } as any}>
            <div style={{ padding: "0 16px" }}>
              <SectionHeader icon={BarChart2} title="Top 10" action="Tümü" onAction={() => navigate("/market")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
              {top10.map((coin: any, i: number) => {
                const isUp = Number(coin.price_change_percentage_24h) >= 0;
                return (
                  <div
                    key={coin.symbol}
                    onClick={() => coin.slug && navigate(/coin/)}
                    style={{
                      display: "grid", gridTemplateColumns: "30px 2fr 1fr 1fr", alignItems: "center",
                      padding: "12px", borderRadius: 8, cursor: "pointer",
                      transition: "background 200ms"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{i + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{coin.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#fff", textAlign: "right" }}>
                      <PriceCell price={coin.current_price} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", textAlign: "right", color: isUp ? "#22c55e" : "#ef4444" }}>
                      {isUp ? "+" : ""}{Number(coin.price_change_percentage_24h).toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Fear & Greed */}
          <div className="reveal card-apple" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, '--reveal-delay': '200ms' } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              FEAR & GREED INDEX
            </div>
            {fngValue !== null
              ? <FearGreedDial value={fngValue} />
              : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", height: 74, display: "flex", alignItems: "center" }}>Yükleniyor...</div>
            }
          </div>

          {/* Gainers */}
          <div className="card-apple" style={{ padding: "20px" }}>
            <SectionHeader icon={TrendingUp} title="Top Gainers" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(gainersData || []).slice(0, 4).map((coin: any) => (
                <div
                  key={coin.symbol}
                  onClick={() => coin.slug && navigate(/coin/)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", fontFamily: "monospace" }}>
                    +{Number(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div className="card-apple" style={{ padding: "20px" }}>
            <SectionHeader icon={TrendingDown} title="Top Losers" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(losersData || []).slice(0, 4).map((coin: any) => (
                <div
                  key={coin.symbol}
                  onClick={() => coin.slug && navigate(/coin/)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>
                    {Number(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div className="card-apple" style={{ padding: "20px" }}>
            <SectionHeader icon={Flame} title="Trending" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(trendingData || []).slice(0, 4).map((coin: any, i: number) => (
                <div
                  key={coin.symbol || i}
                  onClick={() => coin.slug && navigate(/coin/)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 16 }}>{i + 1}</span>
                  {coin.image_url && <img src={coin.image_url} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                  <Activity size={12} color="rgba(255,255,255,0.2)" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Sinyal kartý */}
          <div
            className="card-apple"
            onClick={() => navigate("/analysis/ai")}
            style={{
              padding: "20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            } as any}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(94,106,210,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Brain size={18} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Analiz</div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              Gemini destekli detaylý kripto raporu ve günün fýrsatlarý.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
              Analiz Yap <ArrowRight size={14} />
            </div>
          </div>

        </div>
'''

new_content = content[:header_start] + new_layout + '\n      </div>\n    </div>\n  );\n}\n'

with open('src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Dashboard updated successfully.')
