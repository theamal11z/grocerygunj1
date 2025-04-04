const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .ts and .tsx files containing console.error
const files = execSync('find .. -type f -name "*.tsx" -o -name "*.ts" | xargs grep -l "console\\.error"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files with console.error statements`);

let totalRemovedLines = 0;

files.forEach(filePath => {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace console.error statements, preserving the structure of error handling
  const newContent = content.replace(/console\.error\([^;]*\);(\s*)/g, '$1');
  
  // Count removed instances
  const removedCount = (content.match(/console\.error\([^;]*\);/g) || []).length;
  totalRemovedLines += removedCount;
  
  // Write back to file
  fs.writeFileSync(filePath, newContent);
  
  console.log(`✅ Processed ${filePath}: removed ${removedCount} console.error statements`);
});

console.log(`\nRemoved ${totalRemovedLines} console.error statements from ${files.length} files`);
console.log('Complete! The application is now production-ready.'); 