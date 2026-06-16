const fs = require('fs');

const file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove table row borders and increase padding for breathing room
content = content.replace(
  /borderBottom: `1px solid \$\{T\.border\}`/g,
  'borderBottom: "1px solid rgba(255, 255, 255, 0.03)"'
);

content = content.replace(
  /<td style=\{\{ padding: "12px 12px 12px 0"/g,
  '<td style={{ padding: "16px 12px 16px 0"'
);
content = content.replace(
  /padding: "12px"/g,
  'padding: "16px"'
);

// 2. Simplify percentage pills (Remove explicit borders and soften backgrounds)
content = content.replace(
  /background: isPos \? T\.greenBg : T\.redBg,\s*border: `1px solid \$\{isPos \? T\.greenBorder : T\.redBorder\}`/g,
  'background: isPos ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)"'
);

content = content.replace(
  /border: `1px solid \$\{up \? T\.greenBorder : T\.redBorder\}`/g,
  ''
);

content = content.replace(
  /background: up \? T\.greenBg : T\.redBg/g,
  'background: up ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)"'
);

// 3. Simplify top stat boxes (remove borders)
content = content.replace(
  /border: `1px solid \$\{T\.greenBorder\}`/g,
  '/* removed border */'
);
content = content.replace(
  /border: `1px solid \$\{T\.redBorder\}`/g,
  '/* removed border */'
);

// 4. Clean up CoinCard boxes (Remove default border, only keep very subtle hover border)
// Instead of 1px solid T.border (which is quite visible)
content = content.replace(
  /border: `1px solid \$\{hov \? \(featured \? "rgba\(0,240,255,0\.35\)" : "rgba\(0,240,255,0\.15\)"\) : \(featured \? T\.borderFeat : T\.border\)\}`/g,
  'border: `1px solid ${hov ? (featured ? "rgba(0,240,255,0.3)" : "rgba(255,255,255,0.08)") : (featured ? "rgba(0,240,255,0.15)" : "transparent")}`'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Dashboard UI simplified successfully");
