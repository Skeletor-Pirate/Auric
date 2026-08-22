const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.git', 'dist'];

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
    } else {
      // Rename file if it contains 'auric' (case insensitive)
      let newName = file;
      if (file.toLowerCase().includes('auric')) {
        newName = file.replace(/auric/gi, 'auric');
        fs.renameSync(fullPath, path.join(dir, newName));
      }
      
      const targetPath = path.join(dir, newName);
      
      // Skip binary files (like images/glb)
      if (['.png', '.jpg', '.glb', '.sqlite3', '.db'].includes(path.extname(targetPath))) continue;

      try {
        let content = fs.readFileSync(targetPath, 'utf8');
        let newContent = content
          .replace(/auric/g, 'auric')
          .replace(/Auric/g, 'Auric')
          .replace(/AURIC/g, 'AURIC');
          
        if (content !== newContent) {
          fs.writeFileSync(targetPath, newContent, 'utf8');
          console.log(`Updated content: ${targetPath}`);
        }
      } catch (e) {
        // Not a text file, ignore
      }
    }
  }
}

console.log('Starting mass rename...');
walkAndReplace(__dirname);
console.log('Done.');
