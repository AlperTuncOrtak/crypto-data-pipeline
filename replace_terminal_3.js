const fs = require("fs");
let content = fs.readFileSync("frontend/src/pages/Terminal.tsx", "utf-8");

const replacements = [
  { search: /bg-\[#f0b90b\]/g, replace: "bg-[var(--warning)]" },
  { search: /hover:bg-\[#f44336\]/g, replace: "hover:bg-[var(--negative)]\/90" },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync("frontend/src/pages/Terminal.tsx", content, "utf-8");
console.log("Terminal.tsx updated again!");

