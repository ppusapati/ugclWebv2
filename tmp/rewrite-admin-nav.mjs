import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'src');
const archive = path.join(src, 'archive');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

// Only nav/redirect/href/breadcrumb path config patterns – NOT backend API endpoint strings
// We match the navigation call patterns explicitly
const replacements = [
  // nav('/admin/...')  nav("/admin/...")  nav(`/admin/...`)
  [/\bnav\((['"`])\/admin\//g, (_, q) => `nav(${q}/`],
  [/\bnav\((['"`])\/admin\1\)/g, (_, q) => `nav(${q}/${q})`],

  // throw redirect(302, '/admin/...')
  [/\bredirect\((\d+,\s*)(['"`])\/admin\//g, (_, code, q) => `redirect(${code}${q}/`],
  [/\bredirect\((\d+,\s*)(['"`])\/admin\2\)/g, (_, code, q) => `redirect(${code}${q}/${q})`],

  // href="/admin/..."  href='/admin/...'  href="/admin"
  [/\bhref=(["'])\/admin\//g, (_, q) => `href=${q}/`],
  [/\bhref=(["'])\/admin\1/g, (_, q) => `href=${q}/${q}`],
  // JSX href={`/admin/...`}
  [/\bhref=\{`\/admin\//g, () => 'href={`/'],
  [/\bhref=\{`\/admin`\}/g, () => 'href={`/`}'],

  // breadcrumb/menu config: path: '/admin/...'  parent: '/admin/...'
  [/(\bpath\s*:\s*)(["'`])\/admin\//g, (_, prefix, q) => `${prefix}${q}/`],
  [/(\bpath\s*:\s*)(["'`])\/admin\2/g, (_, prefix, q) => `${prefix}${q}/${q}`],
  [/(\bparent\s*:\s*)(["'`])\/admin\//g, (_, prefix, q) => `${prefix}${q}/`],
  [/(\bparent\s*:\s*)(["'`])\/admin\2/g, (_, prefix, q) => `${prefix}${q}/${q}`],
];

let changedFiles = 0;
let changedCount = 0;

for (const file of walk(src)) {
  // skip archive
  if (file.startsWith(archive)) continue;
  // only .ts/.tsx
  if (!/\.(tsx?|jsx?)$/.test(file)) continue;

  let text = fs.readFileSync(file, 'utf8');
  let updated = text;

  for (const [pattern, replacement] of replacements) {
    updated = updated.replace(pattern, replacement);
  }

  if (updated !== text) {
    fs.writeFileSync(file, updated, 'utf8');
    const rel = path.relative(root, file).replace(/\\/g, '/');
    console.log(`CHANGED: ${rel}`);
    changedFiles++;
    changedCount++;
  }
}

console.log(`\nDone – ${changedFiles} files updated.`);
