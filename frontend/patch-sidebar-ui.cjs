const fs = require('fs');

const files = [
  'src/components/layout/WatchlistSidebar.tsx',
  'src/pages/Market.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove explicit borders on repeating list items/cards
  // In WatchlistSidebar, items often have border: "1px solid var(--border)"
  content = content.replace(/border: "1px solid var\(--border\)"/g, 'border: "1px solid rgba(255, 255, 255, 0.02)"');
  content = content.replace(/borderBottom: "1px solid var\(--border\)"/g, 'borderBottom: "1px solid rgba(255, 255, 255, 0.02)"');

  // 2. Remove translate hover effects that cause jitter (like translateY(-2px))
  content = content.replace(/transform: "translateY\(-2px\)"/g, 'transform: "none"');
  content = content.replace(/transform: "translateX\(2px\)"/g, 'transform: "none"');

  // 3. Flatten percentage boxes (like in Dashboard)
  content = content.replace(/background: isUp \? "rgba\(16, 185, 129, 0\.15\)" : "rgba\(239, 68, 68, 0\.15\)"/g, 'background: isUp ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"');
  content = content.replace(/border: `1px solid \$\{isUp \? 'var\(--positive\)' : 'var\(--negative\)'\}`/g, '/* removed border */');
  content = content.replace(/border: `1px solid \$\{isUp \? T\.greenBorder : T\.redBorder\}`/g, '/* removed border */');
  
  // 4. Flatten Market grid cards
  if (file.includes('Market.tsx')) {
    content = content.replace(/boxShadow: "0 4px 12px rgba\(0,0,0,0\.15\)"/g, 'boxShadow: "none"');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Simplified UI for ${file}`);
}
