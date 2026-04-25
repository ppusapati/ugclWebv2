import fs from 'fs';
import path from 'path';

const files = [
  'src/components/layout/header/header.tsx',
  'src/components/layout/sidebar/index.tsx',
  'src/contexts/menu-context.tsx',
  'src/routes/index.tsx',
];

for (const rel of files) {
  const f = path.join(process.cwd(), rel);
  let text = fs.readFileSync(f, 'utf8');
  let updated = text
    // href: '/admin/...  or href: "/admin/...  (object property style)
    .replace(/(\bhref\s*:\s*)(['"])\/admin\//g, (_, pre, q) => pre + q + '/')
    // nav(u ? '/admin/dashboard' : '/login')
    .replace(/nav\(u\s*\?\s*'\/admin\/dashboard'/g, "nav(u ? '/dashboard'")
    .replace(/nav\(u\s*\?\s*"\/admin\/dashboard"/g, 'nav(u ? "/dashboard"');
  if (updated !== text) {
    fs.writeFileSync(f, updated, 'utf8');
    console.log('FIXED: ' + rel);
  }
}
console.log('done');
