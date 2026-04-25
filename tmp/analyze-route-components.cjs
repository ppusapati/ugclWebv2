const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'src');
const routesDir = path.join(src, 'routes');
const compsDir = path.join(src, 'components');
const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

function walk(dir) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function resolveFrom(file, spec) {
  let base = null;
  if (spec.startsWith('~/')) base = path.join(src, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(file), spec);
  else return null;

  const candidates = [];
  if (path.extname(base)) {
    candidates.push(base);
  } else {
    candidates.push(base);
    for (const ext of exts) candidates.push(base + ext);
    for (const ext of exts) candidates.push(path.join(base, 'index' + ext));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }
  return null;
}

function importsOf(file) {
  const text = read(file);
  const importRe = /(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?["']([^"']+)["']/g;
  const dynamicRe = /import\(\s*["']([^"']+)["']\s*\)/g;
  const specs = [];

  for (const re of [importRe, dynamicRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) specs.push(m[1]);
  }
  return specs;
}

const routeFiles = walk(routesDir).filter((f) => /\.(t|j)sx?$/.test(f));
const componentFiles = walk(compsDir);
const componentCodeFiles = componentFiles.filter((f) => /\.(t|j)sx?$/.test(f) || f.endsWith('.backup'));
const srcCodeFiles = walk(src).filter((f) => /\.(t|j)sx?$/.test(f));

const level1 = new Set();
for (const routeFile of routeFiles) {
  for (const spec of importsOf(routeFile)) {
    const resolved = resolveFrom(routeFile, spec);
    if (resolved && resolved.startsWith(compsDir)) level1.add(resolved);
  }
}

const level2 = new Set();
for (const compFile of level1) {
  for (const spec of importsOf(compFile)) {
    const resolved = resolveFrom(compFile, spec);
    if (resolved && resolved.startsWith(compsDir)) level2.add(resolved);
  }
}

const used = new Set([...level1, ...level2]);
const unusedComponents = componentCodeFiles.filter((f) => !used.has(path.normalize(f)));

// Safety pass: if an "unused-by-route-chain" file is still imported from anywhere else in src,
// keep it to avoid breaking entry files like root.tsx or shared contexts/services.
const unresolvedByRouteChain = new Set(unusedComponents.map((f) => path.normalize(f)));
const importedByOutside = new Set();
for (const importer of srcCodeFiles) {
  for (const spec of importsOf(importer)) {
    const resolved = resolveFrom(importer, spec);
    if (!resolved || !resolved.startsWith(compsDir)) continue;

    const normalized = path.normalize(resolved);
    if (unresolvedByRouteChain.has(normalized) && !unresolvedByRouteChain.has(path.normalize(importer))) {
      importedByOutside.add(normalized);
    }
  }
}

const archiveCandidates = unusedComponents.filter(
  (f) => !importedByOutside.has(path.normalize(f)),
);

const out = [];
out.push(`ROUTES_TOTAL=${routeFiles.length}`);
out.push(`COMPONENT_FILES_TOTAL=${componentCodeFiles.length}`);
out.push(`LEVEL1_USED=${level1.size}`);
out.push(`LEVEL2_USED=${level2.size}`);
out.push(`USED_UNION=${used.size}`);
out.push(`UNUSED_COMPONENTS=${unusedComponents.length}`);
out.push(`UNUSED_BUT_IMPORTED_ELSEWHERE=${importedByOutside.size}`);
out.push(`ARCHIVE_CANDIDATES=${archiveCandidates.length}`);
out.push('---LEVEL1---');
for (const f of Array.from(level1).sort()) out.push(path.relative(root, f).replace(/\\/g, '/'));
out.push('---LEVEL2---');
for (const f of Array.from(level2).sort()) out.push(path.relative(root, f).replace(/\\/g, '/'));
out.push('---UNUSED_COMPONENTS---');
for (const f of unusedComponents.sort()) out.push(path.relative(root, f).replace(/\\/g, '/'));
out.push('---UNUSED_BUT_IMPORTED_ELSEWHERE---');
for (const f of Array.from(importedByOutside).sort()) out.push(path.relative(root, f).replace(/\\/g, '/'));
out.push('---ARCHIVE_CANDIDATES---');
for (const f of archiveCandidates.sort()) out.push(path.relative(root, f).replace(/\\/g, '/'));

fs.writeFileSync(path.join(root, 'tmp', 'route-component-usage.txt'), out.join('\n'));
console.log('Wrote tmp/route-component-usage.txt');
