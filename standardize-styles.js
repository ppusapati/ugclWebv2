#!/usr/bin/env node
/**
 * CSS Standardization Script
 * Standardizes buttons, icons, and containers across the entire application
 * Based on the pattern from src/routes/admin/masters/module/index.tsx
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Button class replacements
const buttonReplacements = [
  // Primary buttons
  { from: /btn-primary-600\s+btns-lg/g, to: 'btn btn-primary' },
  { from: /btn-primary-600\s+btns-md/g, to: 'btn btn-primary' },
  { from: /btn-primary-600\s+btns-sm/g, to: 'btn btn-primary' },
  { from: /btn-primary-600/g, to: 'btn btn-primary' },

  // Secondary buttons (gray)
  { from: /btn-gray-600\s+btns-lg/g, to: 'btn btn-secondary' },
  { from: /btn-gray-600\s+btns-md/g, to: 'btn btn-secondary' },
  { from: /btn-gray-600\s+btns-sm/g, to: 'btn btn-secondary' },
  { from: /btn-gray-600/g, to: 'btn btn-secondary' },

  // Success buttons (green)
  { from: /btn-green-600\s+btns-lg/g, to: 'btn btn-success' },
  { from: /btn-green-600\s+btns-md/g, to: 'btn btn-success' },
  { from: /btn-green-600\s+btns-sm/g, to: 'btn btn-success' },
  { from: /btn-green-600/g, to: 'btn btn-success' },

  // Light buttons
  { from: /btn-light-300/g, to: 'btn btn-secondary' },

  // Info buttons
  { from: /btn-info-500/g, to: 'btn btn-info' },

  // Other size variants
  { from: /btns-lg/g, to: '' },
  { from: /btns-md/g, to: '' },
  { from: /btns-sm/g, to: '' },
];

// Container replacements
const containerReplacements = [
  { from: /container-lg/g, to: 'container' },
  { from: /container-md/g, to: 'container' },
  { from: /container-sm/g, to: 'container' },
  { from: /container-xl/g, to: 'container' },
  { from: /container-2xl/g, to: 'container' },
  { from: /container-\s/g, to: 'container ' }, // Fix typo
];

// MDI icon replacements (i-mdi-* → i-heroicons-*)
const mdiIconReplacements = [
  { from: /i-mdi-alert-circle/g, to: 'i-heroicons-exclamation-circle-solid w-4 h-4 inline-block' },
  { from: /i-mdi-arrow-left/g, to: 'i-heroicons-arrow-left w-4 h-4 inline-block' },
  { from: /i-mdi-pencil/g, to: 'i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white' },
  { from: /i-mdi-plus-circle/g, to: 'i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white' },
  { from: /i-mdi-eye/g, to: 'i-heroicons-eye-solid w-4 h-4 inline-block text-white' },
  { from: /i-mdi-folder-open/g, to: 'i-heroicons-folder-open w-16 h-16 inline-block' },
  { from: /i-mdi-folder-outline/g, to: 'i-heroicons-folder-solid w-4 h-4 inline-block' },
  { from: /i-mdi-map/g, to: 'i-heroicons-map-solid w-4 h-4 inline-block' },
  { from: /i-mdi-map-marker/g, to: 'i-heroicons-map-pin-solid w-4 h-4 inline-block' },
  { from: /i-mdi-map-marker-check/g, to: 'i-heroicons-map-pin-solid w-4 h-4 inline-block' },
  { from: /i-mdi-map-marker-remove/g, to: 'i-heroicons-map-pin w-4 h-4 inline-block' },
  { from: /i-mdi-map-marker-off/g, to: 'i-heroicons-map w-16 h-16 inline-block' },
  { from: /i-mdi-calendar-start/g, to: 'i-heroicons-calendar w-4 h-4 inline-block' },
  { from: /i-mdi-calendar-end/g, to: 'i-heroicons-calendar-days w-4 h-4 inline-block' },
  { from: /i-mdi-flag/g, to: 'i-heroicons-flag-solid w-4 h-4 inline-block' },
  { from: /i-mdi-account-plus/g, to: 'i-heroicons-user-plus-solid w-4 h-4 inline-block text-white' },
  { from: /i-mdi-update/g, to: 'i-heroicons-arrow-path-solid w-4 h-4 inline-block text-white' },
  { from: /i-mdi-loading/g, to: 'i-heroicons-arrow-path-solid w-4 h-4 inline-block text-white animate-spin' },
  { from: /i-mdi-file-document/g, to: 'i-heroicons-document-solid w-6 h-6 inline-block' },
  { from: /i-mdi-close-circle/g, to: 'i-heroicons-x-circle-solid w-6 h-6 inline-block' },
  { from: /i-mdi-map-marker-up/g, to: 'i-heroicons-arrow-up-tray-solid w-8 h-8 inline-block' },
  { from: /i-mdi-information-outline/g, to: 'i-heroicons-information-circle w-4 h-4 inline-block' },
  { from: /i-mdi-clipboard-list/g, to: 'i-heroicons-clipboard-document-list-solid w-4 h-4 inline-block' },
  { from: /i-mdi-clipboard-list-outline/g, to: 'i-heroicons-clipboard-document-list w-16 h-16 inline-block' },
  { from: /i-mdi-currency-inr/g, to: 'i-heroicons-currency-dollar-solid w-4 h-4 inline-block' },
];

// Emoji icon replacements
const emojiReplacements = [
  { from: /icon:\s*'📊'/g, to: "icon: 'i-heroicons-chart-bar-solid'" },
  { from: /icon:\s*'📁'/g, to: "icon: 'i-heroicons-folder-solid'" },
  { from: /icon:\s*'📄'/g, to: "icon: 'i-heroicons-document-solid'" },
  { from: /icon:\s*'🎯'/g, to: "icon: 'i-heroicons-flag-solid'" },
  { from: /icon:\s*'✅'/g, to: "icon: 'i-heroicons-check-circle-solid'" },
  { from: /icon:\s*'❌'/g, to: "icon: 'i-heroicons-x-circle-solid'" },
  { from: /icon:\s*'🏢'/g, to: "icon: 'i-heroicons-building-office-solid'" },
  { from: /icon:\s*'⚙️'/g, to: "icon: 'i-heroicons-cog-solid'" },
  { from: /icon:\s*'📈'/g, to: "icon: 'i-heroicons-arrow-trending-up-solid'" },
  { from: /icon:\s*'🗂️'/g, to: "icon: 'i-heroicons-folder-open'" },
  { from: /icon:\s*'➕'/g, to: "icon: 'i-heroicons-plus-circle-solid'" },
  { from: /icon:\s*'✏️'/g, to: "icon: 'i-heroicons-pencil-square-solid'" },
  { from: /icon:\s*'🗑️'/g, to: "icon: 'i-heroicons-trash-solid'" },
  { from: /icon:\s*'👤'/g, to: "icon: 'i-heroicons-user-solid'" },
  { from: /icon:\s*'💰'/g, to: "icon: 'i-heroicons-currency-dollar-solid'" },
  { from: /icon:\s*'📋'/g, to: "icon: 'i-heroicons-clipboard-document-list-solid'" },
  { from: /icon:\s*'🎓'/g, to: "icon: 'i-heroicons-academic-cap-solid'" },
  { from: /icon:\s*'🏦'/g, to: "icon: 'i-heroicons-building-library-solid'" },
  { from: /icon:\s*'🧾'/g, to: "icon: 'i-heroicons-document-text-solid'" },
  { from: /icon:\s*'💳'/g, to: "icon: 'i-heroicons-credit-card-solid'" },
  { from: /icon:\s*'🧮'/g, to: "icon: 'i-heroicons-calculator-solid'" },
  { from: /icon:\s*'📦'/g, to: "icon: 'i-heroicons-cube-solid'" },
  { from: /icon:\s*'🚚'/g, to: "icon: 'i-heroicons-truck-solid'" },
  { from: /icon:\s*'🔧'/g, to: "icon: 'i-heroicons-wrench-screwdriver-solid'" },
  { from: /icon:\s*'👥'/g, to: "icon: 'i-heroicons-user-group-solid'" },
  { from: /icon:\s*'🔄'/g, to: "icon: 'i-heroicons-arrow-path-solid'" },
  { from: /icon:\s*'🔒'/g, to: "icon: 'i-heroicons-lock-closed-solid'" },
  { from: /icon:\s*'📝'/g, to: "icon: 'i-heroicons-document-text-solid'" },
  { from: /icon:\s*'💾'/g, to: "icon: 'i-heroicons-server-solid'" },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Apply button replacements
    for (const replacement of buttonReplacements) {
      if (content.match(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }

    // Apply container replacements
    for (const replacement of containerReplacements) {
      if (content.match(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }

    // Apply MDI icon replacements
    for (const replacement of mdiIconReplacements) {
      if (content.match(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }

    // Apply emoji replacements
    for (const replacement of emojiReplacements) {
      if (content.match(replacement.from)) {
        content = content.replace(replacement.from, replacement.to);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting CSS standardization...\n');

  const srcDir = path.join(__dirname, 'src');
  const files = await glob('**/*.{tsx,ts,jsx,js}', {
    cwd: srcDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.backup.*']
  });

  console.log(`Found ${files.length} files to process\n`);

  let processedCount = 0;
  for (const file of files) {
    if (processFile(file)) {
      processedCount++;
    }
  }

  console.log(`\n✅ Complete! Updated ${processedCount} files out of ${files.length} total files.`);
}

main().catch(console.error);
