const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace backgrounds and borders
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[1-4]\s*\)/g, 'var(--border-soft)');
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[5-9]\s*\)/g, 'var(--border)');
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1[0-5]\s*\)/g, 'var(--border)');

    // Text and icons
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[2-4]\d*\s*\)/g, 'var(--text-muted)');
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[5-8]\d*\s*\)/g, 'var(--text-secondary)');
    content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.9\d*\s*\)/g, 'var(--text-primary)');
    
    // Exact white strings that might be hardcoded as color
    content = content.replace(/color:\s*["']#fff["']/g, 'color: "var(--text-primary)"');
    content = content.replace(/color:\s*["']#ffffff["']/gi, 'color: "var(--text-primary)"');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
