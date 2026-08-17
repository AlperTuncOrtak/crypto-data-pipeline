const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Terminal.tsx", "utf-8");

const replacements = [
  { search: /border-\[#2c2d30\]/g, replace: "border-[var(--border-base)]" },
  { search: /hover:border-\[#848e9c\]/g, replace: "hover:border-[var(--text-muted)]" },
  { search: /border-\[#f0b90b\]/g, replace: "border-[var(--warning)]" },
  { search: /hover:bg-\[#2c2d30\]/g, replace: "hover:bg-[var(--bg-elevated)]" },
  { search: /hover:bg-\[#2bbbad\]/g, replace: "hover:bg-[var(--accent)]" },
  { search: /layout: \{ background: \{ color: "#0a0b0d" \}, textColor: "#848e9c" \},/g, replace: "layout: { background: { color: \"transparent\" }, textColor: \"#848e9c\" }," },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync("frontend/src/pages/Terminal.tsx", content, "utf-8");
console.log("Terminal.tsx updated again!");

