# Permission-Based Access Control Implementation Guide

## Overview
This guide explains how to implement permission-based access control across all frontend screens in the UGCL web application.

---

## 🎯 **Permission System Components**

### 1. **Auth Service** (`src/services/auth-enhanced.service.ts`)
Core service providing permission checking methods:

```typescript
// Check single permission
authService.hasPermission('create_users')

// Check any of multiple permissions (OR logic)
authService.hasAnyPermission(['read_users', 'update_users'])

// Check all permissions (AND logic)
authService.hasAllPermissions(['read_reports', 'export_reports'])

// Check role
authService.hasRole('admin')

// Check multiple roles
authService.hasAnyRole(['admin', 'manager'])
authService.hasAllRoles(['admin', 'super_admin'])

// Check super admin
authService.isSuperAdmin()

// Business-specific checks
authService.canAccessBusiness(businessId)
authService.isBusinessAdmin(businessId)

// Get user's permissions
authService.getUserPermissions(businessId)
authService.getUserRoles(businessId)
```

### 2. **usePermissions Hook** (`src/hooks/usePermissions.ts`)
React-style hook for component-level permission checks:

```typescript
import { usePermissions } from '~/hooks/usePermissions';

export default component$(() => {
  const { hasPermission, hasAnyPermission, isSuperAdmin, user } = usePermissions();

  if (hasPermission('create_users')) {
    // Render create button
  }

  if (isSuperAdmin()) {
    // Show admin panel
  }
});
```

### 3. **PermissionGuard Component** (`src/components/auth/PermissionGuard.tsx`)
Conditional rendering based on permissions:

```typescript
// Single permission
<PermissionGuard permission="create_users">
  <CreateUserButton />
</PermissionGuard>

// Any of permissions (OR)
<PermissionGuard anyPermissions={['read_users', 'update_users']}>
  <ViewButton />
</PermissionGuard>

// All permissions (AND)
<PermissionGuard allPermissions={['read_reports', 'export_reports']}>
  <ExportButton />
</PermissionGuard>

// Role-based
<PermissionGuard role="admin">
  <AdminPanel />
</PermissionGuard>

// Super admin only
<PermissionGuard superAdminOnly>
  <SystemSettings />
</PermissionGuard>

// With fallback content
<PermissionGuard
  permission="view_analytics"
  fallback={<div>Access Denied</div>}
>
  <Analytics />
</PermissionGuard>
```

### 4. **RouteGuard Component** (`src/components/auth/RouteGuard.tsx`)
Protect entire routes with automatic redirection:

```typescript
export default component$(() => {
  return (
    <RouteGuard
      permission="manage_users"
      redirectTo="/dashboard"
      showUnauthorizedMessage={true}
    >
      <Slot /> {/* Protected content */}
    </RouteGuard>
  );
});
```

---

## 📋 **Standard Permissions**

### Admin Permissions
- `read_users` - View users list and details
- `create_users` - Create new users
- `update_users` - Edit user information
- `delete_users` - Delete users
- `read_roles` - View roles
- `create_roles` - Create new roles
- `update_roles` - Edit roles
- `delete_roles` - Delete roles
- `read_permissions` - View permissions
- `create_permissions` - Create new permissions
- `manage_businesses` - Manage business verticals
- `manage_sites` - Manage sites

### Report Permissions
- `read_reports` - View reports
- `create_reports` - Create new reports
- `update_reports` - Edit reports
- `delete_reports` - Delete reports

### Material & Payment Permissions
- `read_materials` - View materials
- `create_materials` - Create materials
- `update_materials` - Edit materials
- `delete_materials` - Delete materials
- `read_payments` - View payments
- `create_payments` - Create payments
- `update_payments` - Edit payments
- `delete_payments` - Delete payments

### Analytics Permissions
- `read_kpis` - View KPI dashboards
- `business_view_analytics` - View business analytics

### Business-Specific Permissions
- `business_manage_roles` - Manage roles in business
- `business_manage_users` - Manage users in business
- `site:view` - View sites
- `site:manage_access` - Manage site access
- `water:read_consumption` - View water consumption
- `inventory:create` - Create inventory items

---

## 🛠️ **Implementation Patterns**

### Pattern 1: Route-Level Protection

**Use Case:** Protect entire pages/routes

```typescript
// src/routes/dashboard/admin/users/layout.tsx
export default component$(() => {
  return (
    <RouteGuard
      anyPermissions={['read_users', 'manage_users']}
      redirectTo="/dashboard"
      showUnauthorizedMessage={true}
      unauthorizedMessage="You need user management permissions to access this page."
    >
      <Slot />
    </RouteGuard>
  );
});
```

### Pattern 2: Component-Level Protection

**Use Case:** Hide buttons, sections, or features

```typescript
export default component$(() => {
  return (
    <div>
      <h1>User Management</h1>

      {/* Only show create button to users with create permission */}
      <PermissionGuard permission="create_users">
        <button onClick$={handleCreate}>Create User</button>
      </PermissionGuard>

      {/* User list visible to all with read permission */}
      <UserList />
    </div>
  );
});
```

### Pattern 3: Action-Level Protection

**Use Case:** Control individual actions in tables/lists

```typescript
const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'actions',
    label: 'Actions',
    render: (_val, row) => (
      <div class="flex gap-2">
        <PermissionGuard anyPermissions={['read_users', 'update_users']}>
          <button onClick$={() => handleView(row.id)}>View</button>
        </PermissionGuard>

        <PermissionGuard permission="update_users">
          <button onClick$={() => handleEdit(row.id)}>Edit</button>
        </PermissionGuard>

        <PermissionGuard permission="delete_users">
          <button onClick$={() => handleDelete(row.id)}>Delete</button>
        </PermissionGuard>
      </div>
    ),
  },
];
```

### Pattern 4: Section-Level Protection

**Use Case:** Show/hide entire sections of UI

```typescript
export default component$(() => {
  return (
    <div>
      {/* Main content - visible to all */}
      <MainContent />

      {/* Admin tools - only for admins */}
      <PermissionGuard role="admin">
        <section class="admin-tools">
          <h2>Admin Tools</h2>
          <BulkOperations />
        </section>
      </PermissionGuard>

      {/* Super admin tools - only for super admins */}
      <PermissionGuard superAdminOnly>
        <section class="super-admin-tools">
          <h2>System Configuration</h2>
          <SystemSettings />
        </section>
      </PermissionGuard>
    </div>
  );
});
```

### Pattern 5: Business-Context Protection

**Use Case:** Business-specific permissions

```typescript
export default component$(() => {
  const loc = useLocation();
  const businessCode = loc.params.code;

  return (
    <div>
      <h1>Business Management</h1>

      {/* Only users with permission in this specific business */}
      <PermissionGuard
        permission="business_manage_roles"
        businessId={businessCode}
      >
        <button>Manage Roles</button>
      </PermissionGuard>

      {/* Only business admins */}
      <PermissionGuard
        customCheck={$(() => authService.isBusinessAdmin(businessCode))}
      >
        <button>Business Settings</button>
      </PermissionGuard>
    </div>
  );
});
```

### Pattern 6: Fallback Content

**Use Case:** Show alternative content when permission denied

```typescript
<PermissionGuard
  permission="view_analytics"
  fallback={
    <div class="bg-gray-100 p-6 rounded text-center">
      <h3>Analytics Unavailable</h3>
      <p>Contact your administrator to request analytics access.</p>
    </div>
  }
>
  <AnalyticsDashboard />
</PermissionGuard>
```

### Pattern 7: Conditional Rendering with Hook

**Use Case:** Complex conditional logic

```typescript
export default component$(() => {
  const { hasPermission, hasAnyRole, isSuperAdmin } = usePermissions();

  const canManage = hasPermission('manage_users') || isSuperAdmin();
  const canView = hasAnyRole(['admin', 'manager', 'viewer']);

  return (
    <div>
      {canView && <UserList />}
      {canManage && <ManagementTools />}
    </div>
  );
});
```

---

## 📁 **Screen-by-Screen Implementation**

### User Management Screens

#### User List (`/dashboard/admin/users`)
```typescript
// Route protection
<RouteGuard anyPermissions={['read_users', 'manage_users']}>
  <div>
    {/* Create button - requires create permission */}
    <PermissionGuard permission="create_users">
      <CreateUserButton />
    </PermissionGuard>

    {/* Table with action buttons */}
    <Table
      actions={row => (
        <>
          <PermissionGuard permission="read_users">
            <ViewButton />
          </PermissionGuard>
          <PermissionGuard permission="update_users">
            <EditButton />
          </PermissionGuard>
          <PermissionGuard permission="delete_users">
            <DeleteButton />
          </PermissionGuard>
        </>
      )}
    />
  </div>
</RouteGuard>
```

#### User Create (`/dashboard/admin/users/new`)
```typescript
<RouteGuard
  permission="create_users"
  redirectTo="/dashboard/admin/users"
>
  <CreateUserForm />
</RouteGuard>
```

#### User Edit (`/dashboard/admin/users/[id]/edit`)
```typescript
<RouteGuard
  permission="update_users"
  redirectTo="/dashboard/admin/users"
>
  <EditUserForm />
</RouteGuard>
```

### Role Management Screens

#### Global Roles (`/dashboard/admin/roles`)
```typescript
<RouteGuard
  anyPermissions={['read_roles', 'manage_roles']}
  redirectTo="/dashboard"
>
  <div>
    <PermissionGuard anyPermissions={['create_roles', 'manage_roles']}>
      <CreateRoleButton />
    </PermissionGuard>

    <RolesList
      actions={role => (
        <>
          <PermissionGuard permission="update_roles">
            <EditButton />
          </PermissionGuard>
          <PermissionGuard permission="delete_roles">
            <DeleteButton />
          </PermissionGuard>
        </>
      )}
    />
  </div>
</RouteGuard>
```

#### Business Roles (`/business/[code]/roles`)
```typescript
<RouteGuard
  permission="business_manage_roles"
  businessId={businessCode}
  redirectTo={`/business/${businessCode}/sites`}
>
  <BusinessRoleManagement />
</RouteGuard>
```

### Permission Management

#### Permission List (`/dashboard/admin/permissions`)
```typescript
<RouteGuard
  anyPermissions={['read_permissions', 'create_permissions']}
  superAdminOnly={true} // Only super admins
  redirectTo="/dashboard"
>
  <PermissionManagement />
</RouteGuard>
```

### Business Management

#### Business List (`/dashboard/admin/businesses`)
```typescript
<RouteGuard
  permission="manage_businesses"
  redirectTo="/dashboard"
>
  <BusinessList />
</RouteGuard>
```

### Site Management

#### Site List (`/business/[code]/sites`)
```typescript
<RouteGuard
  permission="site:view"
  businessId={businessCode}
>
  <SiteList />
</RouteGuard>
```

#### Site Access Management (`/business/[code]/sites/[id]/access`)
```typescript
<RouteGuard
  permission="site:manage_access"
  businessId={businessCode}
>
  <SiteAccessManagement />
</RouteGuard>
```

### Report Screens

#### Report List (All 15 types)
```typescript
<RouteGuard
  permission="read_reports"
  redirectTo="/dashboard"
>
  <div>
    <PermissionGuard permission="create_reports">
      <CreateReportButton />
    </PermissionGuard>

    <ReportList
      actions={report => (
        <>
          <PermissionGuard permission="read_reports">
            <ViewButton />
          </PermissionGuard>
          <PermissionGuard permission="update_reports">
            <EditButton />
          </PermissionGuard>
          <PermissionGuard permission="delete_reports">
            <DeleteButton />
          </PermissionGuard>
        </>
      )}
    />
  </div>
</RouteGuard>
```

### Analytics/KPI Dashboards

#### Main Dashboard
```typescript
<RouteGuard
  permission="read_kpis"
  redirectTo="/dashboard"
>
  <KPIDashboard />
</RouteGuard>
```

#### Business Analytics
```typescript
<RouteGuard
  permission="business_view_analytics"
  businessId={businessCode}
>
  <BusinessAnalytics />
</RouteGuard>
```

---

## 🎨 **Sidebar/Menu Filtering**

Filter menu items based on permissions:

```typescript
// src/components/sidebar/Sidebar.tsx
import { usePermissions } from '~/hooks/usePermissions';

export const Sidebar = component$(() => {
  const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
      visible: true, // Always visible
    },
    {
      label: 'User Management',
      path: '/dashboard/admin/users',
      icon: 'users',
      visible: hasAnyPermission(['read_users', 'manage_users']),
    },
    {
      label: 'Role Management',
      path: '/dashboard/admin/roles',
      icon: 'shield',
      visible: hasAnyPermission(['read_roles', 'manage_roles']),
    },
    {
      label: 'Permissions',
      path: '/dashboard/admin/permissions',
      icon: 'key',
      visible: isSuperAdmin(),
    },
    {
      label: 'Business Management',
      path: '/dashboard/admin/businesses',
      icon: 'building',
      visible: hasPermission('manage_businesses'),
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: 'document',
      visible: hasPermission('read_reports'),
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: 'chart',
      visible: hasPermission('read_kpis'),
    },
  ];

  return (
    <nav>
      {menuItems
        .filter(item => item.visible)
        .map(item => (
          <MenuItem key={item.path} {...item} />
        ))}
    </nav>
  );
});
```

---

## 🔒 **Security Best Practices**

### 1. Always Protect Routes
```typescript
// ❌ BAD - No route protection
export default component$(() => {
  return <AdminPanel />;
});

// ✅ GOOD - Route protected
export default component$(() => {
  return (
    <RouteGuard permission="admin_access">
      <AdminPanel />
    </RouteGuard>
  );
});
```

### 2. Backend Validation is Required
Frontend permissions are for UX only. Always validate on backend:

```typescript
// Frontend - Hide UI
<PermissionGuard permission="delete_users">
  <button onClick$={handleDelete}>Delete</button>
</PermissionGuard>

// Backend - Enforce permission
// DELETE /api/v1/admin/users/:id
// Must check user has delete_users permission
```

### 3. Don't Trust Client-Side Checks
```typescript
// ❌ BAD - Only client-side check
const handleDelete = $(async (userId: string) => {
  if (hasPermission('delete_users')) {
    await userService.deleteUser(userId);
  }
});

// ✅ GOOD - Let backend handle validation
const handleDelete = $(async (userId: string) => {
  try {
    await userService.deleteUser(userId);
  } catch (error) {
    // Backend will return 403 if no permission
    alert('Permission denied');
  }
});
```

### 4. Use Super Admin Wisely
```typescript
// ✅ GOOD - Super admin bypass for permissions
if (user.is_super_admin || hasPermission('manage_users')) {
  // Allow action
}

// ❌ BAD - Don't hardcode super admin checks everywhere
if (user.email === 'admin@example.com') {
  // Allow action
}
```

---

## 📊 **Testing Permissions**

### Manual Testing Checklist

1. **Login as different roles:**
   - Super Admin
   - Admin
   - Project Coordinator
   - Engineer
   - User (read-only)

2. **Verify for each role:**
   - [ ] Correct menu items visible
   - [ ] Create buttons show/hide correctly
   - [ ] Edit buttons show/hide correctly
   - [ ] Delete buttons show/hide correctly
   - [ ] Routes redirect when no permission
   - [ ] Unauthorized message shows correctly

3. **Test business-specific permissions:**
   - [ ] User can only see assigned businesses
   - [ ] User can only manage sites they have access to
   - [ ] Business roles override global roles correctly

### Automated Testing (Example)

```typescript
// tests/permissions.spec.ts
test('user without create permission cannot see create button', async () => {
  const user = { role: 'viewer', permissions: ['read_users'] };
  localStorage.setItem('user', JSON.stringify(user));

  const { container } = render(<UserManagement />);

  expect(container.querySelector('[data-testid="create-user-btn"]')).toBeNull();
});

test('admin can see all action buttons', async () => {
  const user = {
    is_super_admin: true,
    permissions: ['read_users', 'create_users', 'update_users', 'delete_users'],
  };
  localStorage.setItem('user', JSON.stringify(user));

  const { getByText } = render(<UserManagement />);

  expect(getByText('View')).toBeInTheDocument();
  expect(getByText('Edit')).toBeInTheDocument();
  expect(getByText('Delete')).toBeInTheDocument();
});
```

---

## 🚀 **Quick Start Guide**

### Step 1: Protect a Route

```typescript
import { RouteGuard } from '~/components/auth/RouteGuard';

export default component$(() => {
  return (
    <RouteGuard
      permission="manage_users"
      redirectTo="/dashboard"
    >
      <YourProtectedContent />
    </RouteGuard>
  );
});
```

### Step 2: Hide a Button

```typescript
import { PermissionGuard } from '~/components/auth/PermissionGuard';

<PermissionGuard permission="create_users">
  <button>Create User</button>
</PermissionGuard>
```

### Step 3: Filter Menu Items

```typescript
import { usePermissions } from '~/hooks/usePermissions';

const { hasPermission } = usePermissions();

const menuItems = items.filter(item =>
  hasPermission(item.requiredPermission)
);
```

---

## 📚 **Reference**

### Component Props

#### PermissionGuard
- `permission?: string` - Single permission check
- `anyPermissions?: string[]` - OR logic
- `allPermissions?: string[]` - AND logic
- `role?: string` - Single role check
- `anyRoles?: string[]` - Multiple roles (OR)
- `superAdminOnly?: boolean` - Super admin only
- `businessId?: string` - Business context
- `fallback?: any` - Content when denied
- `hideIfDenied?: boolean` - Hide instead of remove

#### RouteGuard
- Same as PermissionGuard, plus:
- `redirectTo?: string` - Redirect path
- `redirectToLogin?: boolean` - Redirect to login
- `loadingComponent?: any` - Custom loader
- `showUnauthorizedMessage?: boolean`
- `unauthorizedMessage?: string`

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Status:** Production Ready
