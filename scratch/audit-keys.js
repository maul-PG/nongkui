import fs from 'fs';
import path from 'path';

const searchFolders = ['pages', 'lib', 'styles', 'prisma'];
const regexSensitive = /AIzaSy[A-Za-z0-9_-]{33}|process\.env\.[A-Za-z0-9_]+/g;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== 'scratch') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log('Auditing codebase for sensitive variables and keys...');
walkDir('.', (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.cjs')) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    const sensitiveMatches = [];
    while ((match = regexSensitive.exec(content)) !== null) {
      sensitiveMatches.push(match[0]);
    }
    
    if (sensitiveMatches.length > 0) {
      console.log(`\nFile: ${filePath}`);
      sensitiveMatches.forEach(m => {
        console.log(`  -> Found: ${m}`);
      });
    }
  }
});

console.log('\nAudit finished.');
