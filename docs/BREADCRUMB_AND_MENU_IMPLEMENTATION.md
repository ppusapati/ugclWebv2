# Breadcrumb and Menu State Implementation

This document describes the implementation of the breadcrumb service and sidebar menu state persistence.

## Overview

Two main features have been implemented:
1. **Breadcrumb Service** - Automatic breadcrumb generation based on current route
2. **Menu State Persistence** - Sidebar menu state persists across page refreshes and route changes

## Features Implemented

### 1. Breadcrumb Service

**Location**: [src/services/breadcrumb.service.ts](src/services/breadcrumb.service.ts)

The breadcrumb service provides:
- Automatic breadcrumb generation based on current route
- Configurable route mappings with custom labels and icons
- Hierarchical breadcrumb chain building
- Fallback to path-based breadcrumb generation

**Usage Example**:
```typescript
import { breadcrumbService } from '~/services/breadcrumb.service';

// Get breadcrumbs for current path
const breadcrumbs = breadcrumbService.getBreadcrumbs('/admin/masters/module');
// Returns: [
//   { label: 'Home', href: '/dashboard', icon: 'i-heroicons-home-solid' },
//   { label: 'Admin', href: '/admin', icon: 'i-heroicons-shield-check-solid' },
//   { label: 'Masters', href: '/admin/masters' },
//   { label: 'Modules' } // Current page (no href)
// ]
```

**Key Methods**:
- `getBreadcrumbs(path: string)` - Get breadcrumb items for a path
- `addRoute(config: RouteConfig)` - Add custom route configuration
- `getLabel(path: string)` - Get label for a specific path

**Route Configuration**:
Routes are pre-configured for all main sections:
- Admin (modules, users, roles, settings, audit, backup)
- HR (employees, recruitment, payroll, performance, training, policies)
- Finance (accounts, invoices, expenses, budgets, reports, taxes)
- Operations (projects, inventory, suppliers, quality, maintenance)
- Sales (leads, customers, orders, pipeline, analytics)

### 2. Breadcrumb Component

**Location**: [src/components/breadcrumb/index.tsx](src/components/breadcrumb/index.tsx)

A reusable Qwik component that displays breadcrumbs with:
- Automatic route detection using `useLocation()`
- Icon support for breadcrumb items
- Hover effects and transitions
- Chevron separators between items
- Active page highlighting (non-clickable, bold text)

**Features**:
- Responsive design
- Accessible with ARIA labels
- Smooth transitions and hover effects
- Integration with Qwik City routing

### 3. Menu State Persistence

**Location**: [src/contexts/menu-context.tsx](src/contexts/menu-context.tsx)

The menu context has been enhanced with:
- **localStorage persistence** - Menu state saved to browser storage
- **Route synchronization** - Active menu automatically set based on current route
- **Automatic restoration** - State restored on page refresh
- **Route tracking** - Menu updates when navigating between routes

**Key Features**:
- Persists `activeMainMenu` and `activeSidebarItem` to localStorage
- Automatically syncs menu state with current route on:
  - Initial page load
  - Page refresh
  - Route navigation
- Prevents menu state loss on refresh

**How It Works**:
1. On mount, the context restores menu state from localStorage
2. The `setActiveFromRoute()` function matches the current URL to menu items
3. When a match is found, both the main menu and sidebar item are set
4. State is saved to localStorage for persistence
5. Route changes are watched via `useVisibleTask$` and trigger state updates

**Menu Configuration**:
All menu items are centralized in the context:
```typescript
const menuItems: MenuItem[] = [
  {
    id: 'admin',
    label: 'Admin',
    subItems: [
      { id: 'modules', label: 'Modules', href: '/admin/masters/module' },
      { id: 'users', label: 'Users', href: '/admin/users' },
      // ...
    ]
  },
  // ...
];
```

### 4. Layout Integration

**Location**: [src/routes/admin/layout.tsx](src/routes/admin/layout.tsx)

The admin layout now includes:
- Breadcrumb component above main content
- Proper spacing and styling
- Integration with MenuProvider context

**Layout Structure**:
```
<MenuProvider>
  <Header />
  <div class="flex">
    <Sidebar />
    <main class="flex-1">
      <Breadcrumb />        <!-- New -->
      <div class="px-6 pb-6">
        <Slot />            <!-- Page content -->
      </div>
    </main>
  </div>
</MenuProvider>
```

## Files Modified

1. **New Files**:
   - `src/services/breadcrumb.service.ts` - Breadcrumb service
   - `src/components/breadcrumb/index.tsx` - Breadcrumb component

2. **Modified Files**:
   - `src/contexts/menu-context.tsx` - Added localStorage persistence and route sync
   - `src/routes/admin/layout.tsx` - Added breadcrumb component

## Testing

The implementation has been tested and verified:
- ✅ Development server runs without errors
- ✅ No TypeScript compilation errors
- ✅ No runtime errors in console

**To Test**:
1. Navigate to different admin routes (e.g., `/admin/masters/module`, `/admin/users`)
2. Verify breadcrumbs appear correctly
3. Verify sidebar menu stays active on the correct item
4. Refresh the page - menu state should persist
5. Navigate to different sections - breadcrumbs should update

## Benefits

1. **Better User Experience**:
   - Users always know where they are in the app
   - Easy navigation back to parent pages
   - Consistent menu state across sessions

2. **Improved Navigation**:
   - Quick access to parent pages via breadcrumbs
   - Visual hierarchy of current location
   - Reduced confusion when navigating deep pages

3. **Persistence**:
   - Menu state survives page refreshes
   - Automatic synchronization with routes
   - No manual menu selection needed

4. **Maintainability**:
   - Centralized route configuration
   - Easy to add new routes
   - Type-safe implementation

## Future Enhancements

Possible improvements:
1. Add breadcrumb customization via page metadata
2. Support dynamic breadcrumb labels (e.g., showing entity names)
3. Add breadcrumb dropdown menus for siblings
4. Implement breadcrumb truncation for very deep paths
5. Add analytics tracking for breadcrumb clicks

## Usage Instructions

### Adding New Routes to Breadcrumbs

To add a new route to the breadcrumb service:

```typescript
// In breadcrumb.service.ts
private routeConfigs: RouteConfig[] = [
  // ... existing routes
  {
    path: '/admin/new-page',
    label: 'New Page',
    parent: '/admin',
    icon: 'i-heroicons-star-solid' // optional
  },
];
```

### Adding New Menu Items

To add a new menu item with route syncing:

```typescript
// In menu-context.tsx
const menuItems: MenuItem[] = [
  {
    id: 'admin',
    label: 'Admin',
    subItems: [
      // ... existing items
      {
        id: 'new-item',
        label: 'New Item',
        href: '/admin/new-item'
      },
    ]
  },
];
```

The system will automatically:
- Generate breadcrumbs for the new route
- Sync menu state when navigating to it
- Persist the selection to localStorage

## Conclusion

The breadcrumb and menu persistence implementation provides a robust, user-friendly navigation system that enhances the overall user experience of the UGCL portal. Both features work seamlessly together to provide clear navigation context and persistent state management.
