import re

with open('src/components/layout/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_nav_items = '''const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, dropdown: null },
  { to: "/portfolio", label: "Portfolio", Icon: Wallet, dropdown: null },
  {
    to: "/market",
    label: "Market",
    Icon: BarChart2,
    dropdown: [
      { to: "/market", label: "All Coins", Icon: Layers, desc: "Browse all tracked coins", soon: false },
      { to: "/market?sort=gain", label: "Top Gainers", Icon: TrendingUp, desc: "Best performers (24h)", soon: false },
      { to: "/market?sort=loss", label: "Top Losers", Icon: TrendingDown, desc: "Worst performers (24h)", soon: false },
      { to: "/narratives", label: "AI Narratives", Icon: Brain, desc: "Live Market Hype Map", soon: false },
    ],
  },
  {
    to: "/analysis",
    label: "Discover",
    Icon: Search,
    dropdown: [
      { to: "/analysis/ai", label: "AI Analysis", Icon: Brain, desc: "AI-powered technical analysis", soon: false },
      { to: "/heatmap", label: "Market Heatmap", Icon: LayoutGrid, desc: "Visual market overview", soon: false },
      { to: "/whale", label: "Whale X-Ray", Icon: Eye, desc: "Analyze wallet portfolios", soon: false },
      { to: "/timemachine", label: "Time Machine", Icon: History, desc: "Historical backtesting", soon: false },
      { to: "/alerts", label: "Active Alerts", Icon: Bell, desc: "Current market alerts", soon: false },
    ],
  },
  { to: "/leaderboard", label: "Leaderboard", Icon: Trophy, dropdown: null },
  { to: "/pro", label: "Pro", Icon: Crown, dropdown: null },
];'''

content = re.sub(r'const NAV_ITEMS = \[.*?\];', new_nav_items, content, flags=re.DOTALL)

with open('src/components/layout/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
