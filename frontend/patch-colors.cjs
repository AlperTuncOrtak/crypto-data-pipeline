const fs = require('fs');

const filesToPatch = [
  'src/pages/Dashboard.tsx',
  'src/components/layout/WatchlistSidebar.tsx',
  'src/pages/Portfolio.tsx'
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Make sure getCoinColor is imported
    if (!content.includes('getCoinColor')) {
      content = content.replace(/(import React.*?;\n)/, "$1import { getCoinColor } from '../utils/colors';\n");
      content = content.replace(/(import {.*?}.*?;\n)/, "$1import { getCoinColor } from '../../utils/colors';\n");
    }

    // Replace Dashboard text colors
    content = content.replace(/color:\s*T\.textPrimary([^>]*>)\{coin\.symbol\?\.toUpperCase\(\)\}/g, "color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}40`$1{coin.symbol?.toUpperCase()}");
    
    // Replace WatchlistSidebar text colors
    content = content.replace(/color:\s*T\.textPrimary([^>]*>)\{coin\.symbol\}/g, "color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}40`$1{coin.symbol}");
    content = content.replace(/color:\s*['"]var\(--text-primary\)['"]([^>]*>)\{coin\.symbol\}/g, "color: getCoinColor(coin.symbol), textShadow: `0 0 10px ${getCoinColor(coin.symbol)}40`$1{coin.symbol}");
    content = content.replace(/text-gray-200 group-hover:text-white([^>]*>)\{h\.symbol\}/g, "$1{h.symbol}"); // Portfolio might need manual

    fs.writeFileSync(file, content, 'utf8');
    console.log("Patched", file);
  }
}
