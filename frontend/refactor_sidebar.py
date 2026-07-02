import re

with open('src/components/layout/WatchlistSidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the RightSidebar main container
content = content.replace(
    'background: "#0a0b0d",\n          borderLeft: "1px solid var(--border)",',
    'background: "rgba(10, 11, 13, 0.85)",\n          backdropFilter: "blur(24px)",\n          borderLeft: "1px solid rgba(39, 57, 81, 0.5)",\n          boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",'
)

# 2. Update the Watchlist coin items to be "Bouncy Premium"
# Find the coin row mapping in WatchlistPanel
old_coin_style = '''                  style={{ borderRadius: 10, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", border: "1px solid transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.borderColor = "var(--accent-soft)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}'''

new_coin_style = '''                  className="group"
                  style={{ 
                    borderRadius: 16, 
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", 
                    border: "1px solid transparent",
                    background: "rgba(255,255,255,0.01)",
                    marginBottom: 4
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#16181c";
                    e.currentTarget.style.borderColor = "rgba(39,57,81,0.5)";
                    e.currentTarget.style.transform = "scale(0.98)";
                    e.currentTarget.style.boxShadow = "inset 0 0 20px rgba(39,57,81,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.01)";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}'''

content = content.replace(old_coin_style, new_coin_style)

# 3. Update the Top Nav / Header of the sidebar
content = content.replace(
    'padding: "16px 16px 12px", borderBottom: "1px solid #1e1e1e"',
    'padding: "20px 16px 12px", borderBottom: "1px solid rgba(39, 57, 81, 0.3)"'
)

# 4. Make addSearch input prettier
content = content.replace(
    'border: "1px solid var(--accent-soft)",',
    'border: "1px solid rgba(83,58,253,0.3)",\n                boxShadow: "inset 0 0 10px rgba(83,58,253,0.1)",'
)

# 5. Fix Alert Panel row styling just in case
content = content.replace(
    'background: "var(--bg-elevated)",\n                      borderRadius: 12,\n                      padding: "12px 14px",\n                      border: "1px solid var(--border)",',
    'background: "#16181c",\n                      borderRadius: 16,\n                      padding: "12px 14px",\n                      border: "1px solid rgba(39,57,81,0.5)",\n                      boxShadow: "inset 0 0 20px rgba(39,57,81,0.1)",'
)

with open('src/components/layout/WatchlistSidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
