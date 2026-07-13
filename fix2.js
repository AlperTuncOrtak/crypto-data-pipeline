const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

// Container
code = code.replace(/className="bg-\\[#0a0b0d\\]\\\\\\/50 backdrop-blur-xl/g, 'className="bg-transparent');
code = code.replace(/className="bg-white/g, 'className="bg-transparent');

// Headers & Text
code = code.replace(/text-\\[#0a0b0d\\]/g, 'text-white');
code = code.replace(/text-\\[#5b616e\\]/g, 'text-gray-400');
code = code.replace(/text-\\[#7c828a\\]/g, 'text-gray-500');
code = code.replace(/text-\\[#a8acb3\\]/g, 'text-gray-600');

// Borders
code = code.replace(/border-\\[#dee1e6\\]/g, 'border-white/10');
code = code.replace(/border-\\[#eef0f3\\]/g, 'border-white/5');

// Backgrounds
code = code.replace(/bg-white/g, 'bg-[#111214]');
code = code.replace(/bg-\\[#f7f7f7\\]/g, 'bg-white/5');
code = code.replace(/bg-\\[#eef0f3\\]/g, 'bg-white/5');
code = code.replace(/hover:bg-\\[#f7f7f7\\]/g, 'hover:bg-white/10');
code = code.replace(/bg-\\[#0a0b0d\\]\\\\\\/50/g, 'bg-[#111214]');
code = code.replace(/backdrop-blur-xl/g, ''); 

// Shadows
code = code.replace(/shadow-\\[0_4px_12px_rgba\\(0,0,0,0\\.02\\)\\]/g, 'shadow-none');
code = code.replace(/shadow-\\[0_8px_24px_rgba\\(0,0,0,0\\.06\\)\\]/g, 'hover:shadow-none');

// 12-col layout overlap
code = code.replace(/lg:grid-cols-12/g, 'xl:grid-cols-12');
code = code.replace(/lg:col-span-8/g, 'xl:col-span-8');
code = code.replace(/lg:col-span-4/g, 'xl:col-span-4');

code = code.replace(/min-w-\\[800px\\]/g, 'min-w-max w-full');

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', code);
console.log('Fixed syntax in Dashboard.tsx');
