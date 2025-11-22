# CSS Styling Standards

This document outlines the standardized CSS patterns to be used across the entire UGCL application.

## Overview

All components and routes should follow the patterns established in `src/routes/admin/masters/module/index.tsx` as the reference standard.

## Button Classes

### Standard Button Pattern

**Always use:** `btn btn-[variant]`

**Available Variants:**
- `btn btn-primary` - Primary blue buttons (main actions)
- `btn btn-secondary` - Secondary gray buttons (cancel, back, etc.)
- `btn btn-danger` - Red buttons (delete, destructive actions)
- `btn btn-success` - Green buttons (success actions)
- `btn btn-warning` - Yellow buttons (warning actions)
- `btn btn-info` - Info buttons
- `btn btn-ghost` - Transparent/borderless buttons

### ❌ DO NOT USE:
- `btn-primary-600`, `btn-gray-600`, `btn-green-600`, `btn-light-300`, `btn-info-500`
- `btns-sm`, `btns-md`, `btns-lg` (size modifiers)
- Custom color/size combinations

### Examples

```tsx
// ✅ CORRECT
<button class="btn btn-primary">Create</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-danger">Delete</button>

// ❌ INCORRECT
<button class="btn-primary-600 btns-lg">Create</button>
<button class="btn-gray-600 btns-md">Cancel</button>
<button class="btn-green-600 btns-sm">Save</button>
```

## Icon Classes

### Standard Icon Pattern

**Always use Heroicons via UnoCSS:** `i-heroicons-[icon-name]-solid`

All icons should include:
- Icon class name (i-heroicons-*)
- Width and height (`w-4 h-4` for small, `w-6 h-6` for medium, `w-8 h-8` or `w-16 h-16` for large)
- `inline-block` class
- Color classes as needed (`text-white`, `text-gray-400`, etc.)

### ❌ DO NOT USE:
- MDI icons (`i-mdi-*`)
- Emoji icons (📊, 📁, 🎯, etc.)
- Direct SVG elements (unless absolutely necessary)

### Common Icon Mappings

| Purpose | Heroicon Class |
|---------|---------------|
| Edit | `i-heroicons-pencil-square-solid` |
| Delete/Trash | `i-heroicons-trash-solid` |
| View/Eye | `i-heroicons-eye-solid` |
| Add/Plus | `i-heroicons-plus-circle-solid` |
| Check/Success | `i-heroicons-check-circle-solid` |
| Close/X | `i-heroicons-x-circle-solid` |
| Alert/Error | `i-heroicons-exclamation-circle-solid` |
| Info | `i-heroicons-information-circle` |
| User | `i-heroicons-user-solid` |
| Users/Group | `i-heroicons-user-group-solid` |
| Folder | `i-heroicons-folder-solid` |
| Document | `i-heroicons-document-solid` |
| Chart/Analytics | `i-heroicons-chart-bar-solid` |
| Map | `i-heroicons-map-solid` |
| Pin/Location | `i-heroicons-map-pin-solid` |
| Building | `i-heroicons-building-office-solid` |
| Settings/Cog | `i-heroicons-cog-solid` |
| Lock | `i-heroicons-lock-closed-solid` |
| Flag | `i-heroicons-flag-solid` |
| Calendar | `i-heroicons-calendar` |
| Arrow Left | `i-heroicons-arrow-left` |
| Loading/Spin | `i-heroicons-arrow-path-solid animate-spin` |

### Examples

```tsx
// ✅ CORRECT
<i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white mr-2"></i>
<i class="i-heroicons-folder-open w-16 h-16 inline-block text-gray-400"></i>

// ❌ INCORRECT
<i class="i-mdi-pencil mr-2"></i>
<span>📁</span>
<svg>...</svg>
```

### In Sidebar/Menu Items

```tsx
// ✅ CORRECT
const menuItems = [
  {
    id: 'admin',
    label: 'Admin',
    icon: 'i-heroicons-lock-closed-solid',
    subItems: [
      { id: 'users', label: 'Users', href: '/admin/users', icon: 'i-heroicons-user-solid' },
      { id: 'settings', label: 'Settings', href: '/admin/settings', icon: 'i-heroicons-cog-6-tooth-solid' },
    ]
  }
];

// ❌ INCORRECT
const menuItems = [
  {
    id: 'admin',
    label: 'Admin',
    icon: '🔒',  // Emoji!
    subItems: [
      { id: 'users', label: 'Users', href: '/admin/users', icon: '👤' },  // Emoji!
    ]
  }
];
```

## Container Classes

### Standard Container Pattern

**Always use:** `container` (without size modifiers)

### ❌ DO NOT USE:
- `container-lg`
- `container-md`
- `container-sm`
- `container-xl`
- `container-2xl`

### Examples

```tsx
// ✅ CORRECT
<div class="container mx-auto px-4 py-6">
  {/* Content */}
</div>

// ❌ INCORRECT
<div class="container-lg mx-auto px-4 py-6">
  {/* Content */}
</div>
```

## Layout & Spacing

### Common Patterns

```tsx
// Page container
<div class="container mx-auto px-4 py-6">

// Card
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">

// Grid layouts
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex layouts
<div class="flex items-center justify-between mb-6">

// Spacing
<div class="space-y-6">  // Vertical spacing
<div class="space-x-4">  // Horizontal spacing
```

## Forms

### Form Elements

```tsx
// Form group
<div class="form-group">
  <label class="form-label">Label Text</label>
  <input class="form-input w-full" type="text" />
  <div class="form-error">Error message</div>
</div>

// Form label (muted)
<label class="form-label-muted">Optional Label</label>
```

## Alert Messages

```tsx
// Error alert
<div class="alert-error p-3 rounded-md text-sm">
  <i class="i-heroicons-exclamation-circle-solid w-4 h-4 inline-block mr-2"></i>
  Error message here
</div>

// Success alert
<div class="alert-success p-3 rounded-md text-sm">
  <i class="i-heroicons-check-circle-solid w-4 h-4 inline-block mr-2"></i>
  Success message here
</div>
```

## Complete Button Examples

### Primary Action Button
```tsx
<button class="btn btn-primary">
  <i class="i-heroicons-plus-circle-solid w-4 h-4 inline-block text-white mr-2"></i>
  Create New
</button>
```

### Secondary Action Button
```tsx
<button class="btn btn-secondary">
  <i class="i-heroicons-arrow-left w-4 h-4 inline-block mr-2"></i>
  Cancel
</button>
```

### Danger Action Button
```tsx
<button class="btn btn-danger">
  <i class="i-heroicons-trash-solid w-4 h-4 inline-block text-white mr-2"></i>
  Delete
</button>
```

### Loading State Button
```tsx
<button class="btn btn-primary" disabled>
  <i class="i-heroicons-arrow-path-solid w-4 h-4 inline-block text-white animate-spin mr-2"></i>
  Loading...
</button>
```

## Migration Script

A standardization script is available at `standardize-styles.js` to automatically update files:

```bash
node standardize-styles.js
```

This script will:
1. Replace all non-standard button classes with standard ones
2. Replace all MDI icons with Heroicons
3. Replace all emoji icons with Heroicons
4. Replace all container size variants with standard `container`

## Benefits

✅ **Consistency** - Uniform look and feel across the application
✅ **Maintainability** - Easier to update styles globally
✅ **Accessibility** - Proper icon implementations
✅ **Performance** - Optimized icon loading via UnoCSS
✅ **Clarity** - Clear, semantic class names

## Reference File

**Master Reference:** `src/routes/admin/masters/module/index.tsx`

This file demonstrates all the correct patterns and should be used as the standard for all components.

---

**Last Updated:** 2025-11-03
**Version:** 1.0
