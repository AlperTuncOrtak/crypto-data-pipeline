const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

// Container
code = code.split('bg-[#0a0b0d]\\/50 backdrop-blur-xl text-[#0a0b0d]').join('bg-transparent text-white');
code = code.split('bg-white').join('bg-[#111214]');

// Headers & Text
code = code.split('text-[#0a0b0d]').join('text-white');
code = code.split('text-[#5b616e]').join('text-gray-400');
code = code.split('text-[#7c828a]').join('text-gray-500');
code = code.split('text-[#a8acb3]').join('text-gray-600');

// Borders
code = code.split('border-[#dee1e6]').join('border-white/10');
code = code.split('border-[#eef0f3]').join('border-white/5');

// Backgrounds
code = code.split('bg-[#f7f7f7]').join('bg-white/5');
code = code.split('bg-[#eef0f3]').join('bg-white/5');
code = code.split('hover:bg-[#f7f7f7]').join('hover:bg-white/10');

// Replace the failed ones from previous
code = code.split('bg-[#0a0b0d]\\/50 backdrop-blur-xl').join('bg-[#111214]');

// Shadows
code = code.split('shadow-[0_4px_12px_rgba(0,0,0,0.02)]').join('shadow-none');
code = code.split('hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]').join('hover:shadow-none');

// 12-col layout overlap
code = code.split('lg:grid-cols-12').join('xl:grid-cols-12');
code = code.split('lg:col-span-8').join('xl:col-span-8');
code = code.split('lg:col-span-4').join('xl:col-span-4');

code = code.split('min-w-[800px]').join('min-w-max w-full');

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', code);
console.log('Fixed syntax in Dashboard.tsx');
