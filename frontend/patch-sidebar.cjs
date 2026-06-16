const fs = require('fs');

function patch(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('import { getCoinColor }')) {
      const importPath = file.includes('components') ? '../../utils/colors' : '../utils/colors';
      content = content.replace(/(import .*?;\n)/, `$1import { getCoinColor } from '${importPath}';\n`);
    }
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
  }
}

// WatchlistSidebar.tsx
patch(
  'src/components/layout/WatchlistSidebar.tsx',
  /color:\s*"var\(--accent\)",/g,
  `color: getCoinColor(coin.symbol), textShadow: \`0 0 10px \${getCoinColor(coin.symbol)}50\`,`
);

// Portfolio.tsx (for symbol)
patch(
  'src/pages/Portfolio.tsx',
  /className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">\{h\.symbol\}/g,
  'className="text-sm font-bold transition-colors" style={{ color: getCoinColor(h.symbol), textShadow: `0 0 10px ${getCoinColor(h.symbol)}50` }}>{h.symbol}'
);

// Market.tsx
patch(
  'src/pages/Market.tsx',
  /color:\s*T\.textPrimary\s*\}\}\s*>\{coin\.symbol\?\.toUpperCase\(\)\}/g,
  'color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}50` }}>{coin.symbol?.toUpperCase()}'
);
