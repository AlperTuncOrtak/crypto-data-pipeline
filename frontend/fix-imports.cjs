const fs = require('fs');
const path = require('path');

function injectImport(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('getCoinColor')) {
        const importPath = filePath.includes('components') ? '../../utils/colors' : '../utils/colors';
        content = content.replace(/(import React.*?;\n)/, `$1import { getCoinColor } from '${importPath}';\n`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

injectImport('src/pages/Dashboard.tsx');
