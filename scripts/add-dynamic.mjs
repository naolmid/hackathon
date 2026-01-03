import fs from 'fs';
import path from 'path';

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const routeFiles = findRouteFiles('app/api');

for (const file of routeFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (!content.includes("export const dynamic")) {
    content = "export const dynamic = 'force-dynamic';\n\n" + content;
    fs.writeFileSync(file, content);
    console.log('✅ Updated:', file);
  } else {
    console.log('⏭️ Already has dynamic:', file);
  }
}

console.log('\n✅ Done! All API routes are now dynamic.');

