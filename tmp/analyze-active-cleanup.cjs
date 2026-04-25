const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'src');
const routesDir = path.join(src, 'routes');
const compsDir = path.join(src, 'components');
const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

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
const componentFiles = walk(compsDir).filter((f) => /\.(t|j)sx?$/.test(f) || f.endsWith('.backup'));
const srcFiles = walk(src).filter((f) => /\.(t|j)sx?$/.test(f));

const level1Components = new Set();
for (const routeFile of routeFiles) {
  for (const spec of importsOf(routeFile)) {
    const resolved = resolveFrom(routeFile, spec);
    if (resolved && resolved.startsWith(compsDir)) level1Components.add(resolved);
  }
}

const level2Components = new Set();
for (const componentFile of level1Components) {
  for (const spec of importsOf(componentFile)) {
    const resolved = resolveFrom(componentFile, spec);
    if (resolved && resolved.startsWith(compsDir)) level2Components.add(resolved);
  }
}

const usedByRouteChain = new Set([...level1Components, ...level2Components].map((p) => path.normalize(p)));
const initiallyUnused = componentFiles.filter((f) => !usedByRouteChain.has(path.normalize(f)));

const initiallyUnusedSet = new Set(initiallyUnused.map((f) => path.normalize(f)));
const importedElsewhere = new Set();

for (const importer of srcFiles) {
  for (const spec of importsOf(importer)) {
    const resolved = resolveFrom(importer, spec);
    if (!resolved || !resolved.startsWith(compsDir)) continue;

    const normalizedResolved = path.normalize(resolved);
    const normalizedImporter = path.normalize(importer);
    if (initiallyUnusedSet.has(normalizedResolved) && !initiallyUnusedSet.has(normalizedImporter)) {
      importedElsewhere.add(normalizedResolved);
    }
  }
}

const archiveCandidatesComponents = initiallyUnused.filter(
  (f) => !importedElsewhere.has(path.normalize(f)),
);

const out = [];
out.push(`ROUTES_TOTAL=${routeFiles.length}`);
out.push(`COMPONENTS_TOTAL=${componentFiles.length}`);
out.push(`COMP_LEVEL1_USED=${level1Components.size}`);
out.push(`COMP_LEVEL2_USED=${level2Components.size}`);
out.push(`COMP_USED_UNION=${usedByRouteChain.size}`);
out.push(`COMP_INITIAL_UNUSED=${initiallyUnused.length}`);
out.push(`COMP_UNUSED_IMPORTED_ELSEWHERE=${importedElsewhere.size}`);
out.push(`COMP_ARCHIVE_CANDIDATES=${archiveCandidatesComponents.length}`);
out.push('---COMP_ARCHIVE_CANDIDATES---');
for (const file of archiveCandidatesComponents.sort()) {
  out.push(path.relative(root, file).replace(/\\/g, '/'));
}

const reportPath = path.join(root, 'tmp', 'active-cleanup-report.txt');
fs.writeFileSync(reportPath, out.join('\n'));
console.log(`Wrote ${path.relative(root, reportPath).replace(/\\/g, '/')}`);
