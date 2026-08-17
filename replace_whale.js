const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/WhaleXRay.tsx", "utf-8");

const replacements = [
  // Mock Data Colors
  { search: /bg-blue-500/g, replace: "bg-[var(--accent)]" },
  { search: /bg-blue-300/g, replace: "bg-[var(--accent-hover)]" },
  { search: /bg-green-500/g, replace: "bg-[var(--positive)]" },
  { search: /bg-emerald-500/g, replace: "bg-[var(--positive-muted)]" },
  
  // Backgrounds & Gradients
  { search: /bg-emerald-500\/10/g, replace: "bg-[var(--accent)]/10" },
  { search: /bg-emerald-500\/20/g, replace: "bg-[var(--accent)]/20" },
  { search: /from-emerald-400/g, replace: "from-[var(--accent)]" },
  { search: /to-emerald-600/g, replace: "to-[var(--accent-hover)]" },
  { search: /from-emerald-500\/20/g, replace: "from-[var(--accent)]/20" },
  { search: /to-emerald-500\/20/g, replace: "to-[var(--accent)]/20" },
  { search: /from-red-500\/5/g, replace: "from-[var(--negative)]/5" },
  { search: /group-hover:from-red-500\/10/g, replace: "group-hover:from-[var(--negative)]/10" },
  { search: /bg-green-500\/10/g, replace: "bg-[var(--positive)]/10" },
  { search: /bg-red-500\/10/g, replace: "bg-[var(--negative)]/10" },
  { search: /bg-blue-500\/10/g, replace: "bg-[var(--accent)]/10" },
  
  // Text Colors
  { search: /text-emerald-400/g, replace: "text-[var(--accent)]" },
  { search: /text-red-400/g, replace: "text-[var(--negative)]" },
  { search: /text-green-400/g, replace: "text-[var(--positive)]" },
  { search: /text-blue-400/g, replace: "text-[var(--accent)]" },
  { search: /group-focus-within:text-emerald-400/g, replace: "group-focus-within:text-[var(--accent)]" },
  
  // Border Colors
  { search: /hover:border-emerald-500\/50/g, replace: "hover:border-[var(--accent)]/50" },
  { search: /border-emerald-400\/20/g, replace: "border-[var(--accent)]/20" },
  { search: /border-red-500\/20/g, replace: "border-[var(--negative)]/20" },
  { search: /border-white\/10/g, replace: "border-[var(--border-subtle)]" },
  
  // Badges & Buttons
  { search: /bg-emerald-400\/10/g, replace: "bg-[var(--accent)]/10" },
  { search: /bg-white text-black/g, replace: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border-none" },
  { search: /hover:bg-gray-200/g, replace: "hover:bg-[var(--accent-hover)]" },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync("frontend/src/pages/WhaleXRay.tsx", content, "utf-8");
console.log("WhaleXRay.tsx updated!");

