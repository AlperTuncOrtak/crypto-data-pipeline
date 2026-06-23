const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/#00f0ff/gi, 'var(--accent)');
      content = content.replace(/rgba\(0,\s*240,\s*255,\s*(0\.\d+|1)\)/g, (match, opacity) => {
         return parseFloat(opacity) > 0.3 ? 'var(--accent-border)' : 'var(--accent-soft)';
      });
      content = content.replace(/rgba\(245,\s*166,\s*35,\s*(0\.\d+|1)\)/g, (match, opacity) => {
         return parseFloat(opacity) > 0.3 ? 'var(--accent-border)' : 'var(--accent-soft)';
      });
      content = content.replace(/rgba\(245,\s*158,\s*11,\s*(0\.\d+|1)\)/g, (match, opacity) => {
         return parseFloat(opacity) > 0.3 ? 'var(--accent-border)' : 'var(--accent-soft)';
      });
      content = content.replace(/rgba\(139,\s*92,\s*246,\s*(0\.\d+|1)\)/g, (match, opacity) => {
         return parseFloat(opacity) > 0.3 ? 'var(--secondary)' : 'var(--secondary-soft)';
      });
      content = content.replace(/boxShadow:\s*['`"][^'`"]*?0 0 (10|15|20|30)px[^'`"]*?['`"]/gi, 'boxShadow: "none"');
      content = content.replace(/textShadow:\s*['`"][^'`"]+['`"]/gi, 'textShadow: "none"');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  });
}

processDir(path.join(__dirname, 'frontend/src'));
