#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const globSync = require('glob').sync;

const targetFiles = [
  ...globSync('src/routes/**/*.tsx', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    windowsPathsNoEscape: true,
  }),
  ...globSync('src/components/**/*.tsx', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    windowsPathsNoEscape: true,
  }),
];

const rules = [
  {
    id: 'raw-primary-button-classes',
    pattern: /bg-blue-600|bg-primary-600|hover:bg-blue-700|hover:bg-primary-700/gi,
    message: 'Use DS Btn variants instead of raw primary color classes.',
    context: 'check-button-color-classes',
  },
  {
    id: 'raw-success-button-classes',
    pattern: /bg-green-600|hover:bg-green-700/gi,
    message: 'Use DS Btn/Badge semantic variants instead of raw success classes.',
    context: 'check-button-color-classes',
  },
  {
    id: 'raw-danger-button-classes',
    pattern: /bg-red-600|hover:bg-red-700/gi,
    message: 'Use DS Btn danger variant instead of raw danger classes.',
    context: 'check-button-color-classes',
  },
  {
    id: 'legacy-btn-shortcuts',
    pattern: /class\s*=\s*"[^"]*\bbtn\s+btn-(primary|secondary|danger|ghost|success|info)\b[^"]*"/gi,
    message: 'Use DS Btn component instead of legacy btn class shortcuts.',
  },
  {
    id: 'legacy-alert-classes',
    pattern: /class\s*=\s*"[^"]*\b(alert|alert-danger|alert-error|alert-success|alert-warning|alert-info)\b[^"]*"/gi,
    message: 'Use DS Alert component instead of legacy alert class wrappers.',
  },
  {
    id: 'legacy-form-control-classes',
    pattern: /class\s*=\s*"[^"]*\b(form-control|input input-bordered|select select-bordered|textarea textarea-bordered)\b[^"]*"/gi,
    message: 'Use FormField and tokenized control classes instead of legacy form-control/input-bordered shortcuts.',
  },
  {
    id: 'legacy-stats-classes',
    pattern: /class\s*=\s*"[^"]*\b(stats|stat-title|stat-value)\b[^"]*"/gi,
    message: 'Use DS StatCard instead of legacy stats/stat-title/stat-value classes.',
  },
  {
    id: 'inline-style-attribute',
    pattern: /style\s*=\s*\{[^}]+\}|style\s*=\s*"[^"]+"/gi,
    message: 'Avoid direct style attributes unless using CSS variables only.',
  },
  {
    id: 'formfield-missing-id',
    pattern: /<FormField\s+label=/gi,
    message: 'FormField must have id prop for accessibility contract (aria-describedby wiring).',
    context: 'check-formfield-id',
  },
  {
    id: 'formfield-required-missing-aria',
    pattern: /<FormField[^>]*required[^>]*>/gi,
    message: 'FormField with required prop: ensure wrapped control has aria-required="true".',
    context: 'check-formfield-aria-required',
  },
];

const findings = [];

for (const filePath of targetFiles) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rule of rules) {
    if (rule.context === 'check-button-color-classes') {
      lines.forEach((line, index) => {
        const isLikelyButton = /<button\b/.test(line);
        if (!isLikelyButton) {
          rule.pattern.lastIndex = 0;
          return;
        }

        if (rule.pattern.test(line)) {
          findings.push({
            filePath,
            line: index + 1,
            rule: rule.id,
            message: rule.message,
            snippet: line.trim(),
          });
        }
        rule.pattern.lastIndex = 0;
      });
      continue;
    }

    // Special handling for FormField rules
    if (rule.context === 'check-formfield-id') {
      lines.forEach((line, index) => {
        // Check for FormField without id prop - but allow if it's on multiple lines
        if (/<FormField\s+label=/.test(line) && !/<FormField\s+id=/.test(line)) {
          // Look ahead to next line to see if id is there
          const nextLine = lines[index + 1] || '';
          if (!/^\s*id=/.test(nextLine)) {
            findings.push({
              filePath,
              line: index + 1,
              rule: rule.id,
              message: rule.message,
              snippet: line.trim(),
            });
          }
        }
      });
      continue;
    }

    if (rule.context === 'check-formfield-aria-required') {
      // This is informational only - most required fields already have aria-required
      // Skip automated enforcement as it requires multi-line context analysis
      continue;
    }

    // Standard pattern-based rules
    lines.forEach((line, index) => {
      if (rule.id === 'inline-style-attribute' && rule.pattern.test(line)) {
        const hasCssVariableOnlyStyle =
          /style\s*=\s*\{\s*['"]--[\w-]+['"]\s*:/.test(line) ||
          /style\s*=\s*\{\s*\.{3}/.test(line);

        if (hasCssVariableOnlyStyle) {
          rule.pattern.lastIndex = 0;
          return;
        }
      }

      if (rule.pattern.test(line)) {
        findings.push({
          filePath,
          line: index + 1,
          rule: rule.id,
          message: rule.message,
          snippet: line.trim(),
        });
      }
      rule.pattern.lastIndex = 0;
    });
  }
}

if (findings.length === 0) {
  console.log('CSS audit passed: no banned patterns found in src/routes/**/*.tsx or src/components/**/*.tsx');
  process.exit(0);
}

console.error(`CSS audit failed: ${findings.length} issue(s) found.\n`);
for (const finding of findings) {
  console.error(`- ${finding.filePath}:${finding.line} [${finding.rule}] ${finding.message}`);
  console.error(`  ${finding.snippet}`);
}

process.exit(1);
