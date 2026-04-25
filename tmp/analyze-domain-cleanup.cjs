const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'src');
const archiveDir = path.join(src, 'archive');
const targets = ['services', 'types', 'hooks', 'contexts'].map((d) => path.join(src, d));
const exts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

function norm(p) {
  return path.normalize(p).toLowerCase();
}

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

function isCodeFile(file) {
  return /\.(t|j)sx?$/.test(file);
}

function resolveFrom(file, spec) {
  let base = null;
  if (spec.startsWith('~/')) base = path.join(src, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(file), spec);
  else return null;

  const candidates = [];
  const ext = path.extname(base);
  if (ext && exts.includes(ext)) {
    candidates.push(base);
  } else {
    candidates.push(base);
    for (const ext of exts) candidates.push(base + ext);
    for (const ext of exts) candidates.push(path.join(base, 'index' + ext));
  }

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return norm(c);
  }
  return null;
}

function specsFrom(text) {
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

const allSrcFiles = walk(src);
const activeCodeFiles = allSrcFiles.filter((f) => isCodeFile(f) && !f.startsWith(archiveDir));
const targetFiles = targets.flatMap((d) => walk(d)).filter((f) => isCodeFile(f) || f.endsWith('.bak'));

const inbound = new Map();
for (const f of targetFiles) inbound.set(norm(f), []);

for (const importer of activeCodeFiles) {
  const text = read(importer);
  for (const spec of specsFrom(text)) {
    const resolved = resolveFrom(importer, spec);
    if (!resolved) continue;
    const key = norm(resolved);
    if (inbound.has(key)) {
      inbound.get(key).push(norm(importer));
    }
  }
}

const neverArchive = new Set([
  norm(path.join(src, 'contexts', 'auth-context.tsx')),
  norm(path.join(src, 'contexts', 'menu-context.tsx')),
  norm(path.join(src, 'contexts', 'theme-context.tsx')),
]);

const candidates = [];
for (const file of targetFiles) {
  const key = norm(file);
  const refs = inbound.get(key) || [];
  if (refs.length === 0 && !neverArchive.has(key)) {
    candidates.push(file);
  }
}

const lines = [];
lines.push(`TARGET_FILES=${targetFiles.length}`);
lines.push(`ACTIVE_CODE_FILES=${activeCodeFiles.length}`);
lines.push(`ZERO_INBOUND_CANDIDATES=${candidates.length}`);
lines.push('---CANDIDATES---');
for (const c of candidates.sort()) lines.push(path.relative(root, c).replace(/\\/g, '/'));
lines.push('---INBOUND_COUNTS---');
for (const file of targetFiles.sort()) {
  const key = norm(file);
  lines.push(`${path.relative(root, file).replace(/\\/g, '/')} :: ${(inbound.get(key) || []).length}`);
}

const outPath = path.join(root, 'tmp', 'domain-cleanup-report.txt');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${path.relative(root, outPath).replace(/\\/g, '/')}`);
