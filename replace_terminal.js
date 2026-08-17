const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Terminal.tsx", "utf-8");

const replacements = [
  { search: /bg-\[#0a0b0d\]/g, replace: "bg-[var(--bg-base)]" },
  { search: /bg-\[#0e0f11\]/g, replace: "bg-[var(--bg-subtle)]" },
  { search: /border-\[#1c1d20\]/g, replace: "border-[var(--border-base)]" },
  { search: /bg-\[#1c1d20\]/g, replace: "bg-[var(--border-base)]" },
  { search: /hover:bg-\[#1c1d20\]/g, replace: "hover:bg-[var(--bg-overlay)]" },
  { search: /text-\[#848e9c\]/g, replace: "text-[var(--text-muted)]" },
  { search: /text-\[#26a69a\]/g, replace: "text-[var(--positive)]" },
  { search: /bg-\[#26a69a\]\/10/g, replace: "bg-[var(--positive-muted)]" },
  { search: /border-\[#26a69a\]/g, replace: "border-[var(--positive)]" },
  { search: /bg-\[#26a69a\]/g, replace: "bg-[var(--positive)]" },
  { search: /hover:bg-\[#26a69a\]\/90/g, replace: "hover:bg-[var(--positive)]/90" },
  { search: /text-\[#ef5350\]/g, replace: "text-[var(--negative)]" },
  { search: /bg-\[#ef5350\]\/10/g, replace: "bg-[var(--negative-muted)]" },
  { search: /border-\[#ef5350\]/g, replace: "border-[var(--negative)]" },
  { search: /bg-\[#ef5350\]/g, replace: "bg-[var(--negative)]" },
  { search: /hover:bg-\[#ef5350\]\/90/g, replace: "hover:bg-[var(--negative)]/90" },
  { search: /text-\[#f0b90b\]/g, replace: "text-[var(--warning)]" },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync("frontend/src/pages/Terminal.tsx", content, "utf-8");
console.log("Terminal.tsx updated!");

