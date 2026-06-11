const fs = require('fs');

const path = 'frontend/src/pages/Portfolio.tsx';
let code = fs.readFileSync(path, 'utf8');

// Find sections
const donutStart = code.indexOf('        {/* Donut */}');
const donutEnd = code.indexOf('        </SoftCard>', donutStart) + 19;
const donutStr = code.slice(donutStart, donutEnd).replace('className="lg:col-span-4 flex flex-col min-h-[380px]"', 'className="w-full flex flex-col min-h-[380px]"');

const dataSrcStart = code.indexOf('        {/* Data Sources */}');
const dataSrcEnd = code.indexOf('        </SoftCard>', dataSrcStart) + 19;
const dataSrcStr = code.slice(dataSrcStart, dataSrcEnd).replace('className="lg:col-span-8 flex flex-col gap-5"', 'className="w-full flex flex-col gap-5"');

const taxStart = code.indexOf('      {/* TAX SUMMARY */}');
const taxEnd = code.indexOf('      {/* AI PORTFOLIO INSIGHTS */}');
const taxStr = code.slice(taxStart, taxEnd);

const aiStart = code.indexOf('      {/* AI PORTFOLIO INSIGHTS */}');
const aiEnd = code.indexOf('      {/* HOLDINGS TABLE */}');
const aiStr = code.slice(aiStart, aiEnd);

const holdingsStart = code.indexOf('      {/* HOLDINGS TABLE */}');
const holdingsEnd = code.indexOf('      {/* Empty state */}');
const holdingsStr = code.slice(holdingsStart, holdingsEnd);

const newLayout = `      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 mt-8">
        
        {/* LEFT COLUMN: Data Sources + Table */}
        <div className="lg:col-span-8 flex flex-col gap-8">
${dataSrcStr}

${holdingsStr}
        </div>

        {/* RIGHT COLUMN: Donut + AI Insights + Tax Summary */}
        <div className="lg:col-span-4 flex flex-col gap-8">
${donutStr}

${aiStr}
${taxStr}
        </div>
      </div>

`;

const preLayout = code.slice(0, code.indexOf('      {/* ROW 1: Donut + Data Sources */}'));
const postLayout = code.slice(holdingsEnd);

fs.writeFileSync(path, preLayout + newLayout + postLayout);
console.log("Restructured Portfolio layout successfully!");
