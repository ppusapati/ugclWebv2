# Authorization System UI Guide

This guide explains how to use the comprehensive authorization system UI components built for your Qwik application.

## 🚀 Features

- **Role Management**: Create, edit, and delete roles with specific permissions
- **Permission Management**: Define granular permissions for different business verticals
- **User Role Assignment**: Assign roles and permissions to users across businesses
- **Business Access Control**: Manage user access to different business verticals
- **Permission Guards**: Protect UI components based on user permissions
- **Business Context**: Support for business-specific roles and permissions

## 📁 Components Overview

### 1. Authorization Dashboard (`/admin/authorization`)
Main dashboard that provides access to all authorization management features.

**Features:**
- Overview of the authorization system
- Quick access to all management tools
- System architecture visualization
- Quick stats and actions

### 2. Role Management
Create and manage roles with specific permissions.

**Features:**
- Create new roles
- Edit existing roles
- Assign permissions to roles
- Delete custom roles (system roles are protected)
- Group permissions by category

### 3. Permission Management
Define and manage granular permissions.

**Features:**
- Create custom permissions
- Organize permissions by category
- Set business-specific or global permissions
- Edit permission details
- Delete custom permissions

### 4. User Role Assignment
Assign roles to users for different business verticals.

**Features:**
- Search and filter users
- Assign multiple roles to users
- Business-specific role assignments
- Remove user roles
- View user permissions

### 5. Business Access Control
Manage user access across different business verticals.

**Features:**
- Grant user access to businesses
- Revoke business access
- View business access statistics
- Manage business-specific roles

## 🛡️ Permission Guards

Use permission guards to protect UI components based on user permissions.

### Basic Usage

```tsx
import { PermissionGuard } from '~/components/auth/permission-guard';

// Simple permission check
<PermissionGuard permissions={['read_reports']}>
  <ReportsComponent />
</PermissionGuard>

// Role-based access
<PermissionGuard roles={['admin', 'manager']}>
  <AdminPanel />
</PermissionGuard>

// Multiple permissions (ANY)
<PermissionGuard 
  permissions={['read_reports', 'read_analytics']} 
  requireAll={false}
>
  <AnalyticsComponent />
</PermissionGuard>

// Multiple permissions (ALL required)
<PermissionGuard 
  permissions={['read_reports', 'manage_users']} 
  requireAll={true}
>
  <SuperAdminPanel />
</PermissionGuard>

// Business-specific access
<PermissionGuard 
  permissions={['solar_read_generation']} 
  businessId="SOLAR_BUSINESS_ID"
>
  <SolarDashboard />
</PermissionGuard>

// Custom fallback message
<PermissionGuard 
  permissions={['super_secret_permission']} 
  fallback={<div>You need special access!</div>}
>
  <SecretContent />
</PermissionGuard>
```

### Inline Permission Checks

```tsx
import { PermissionCheck } from '~/components/auth/permission-guard';

<div>
  <p>This content is always visible.</p>
  
  <PermissionCheck permissions={['read_reports']}>
    <p>This only shows if you can read reports.</p>
  </PermissionCheck>
  
  <PermissionCheck roles={['admin']}>
    <button>Admin Only Button</button>
  </PermissionCheck>
</div>
```

## 🔧 Utility Functions

Enhanced auth utilities with business context support:

```tsx
import { 
  hasRole, 
  hasPermission, 
  hasAnyRole, 
  hasAllRoles,
  hasAnyPermission,
  hasAllPermissions,
  getUserBusinessAccess,
  isBusinessAdmin,
  canAccessBusiness
} from '~/utils/auth';

// Check roles
const isAdmin = hasRole('admin');
const isBusinessAdmin = hasRole('admin', 'BUSINESS_ID');

// Check permissions
const canRead = hasPermission('read_reports');
const canReadInBusiness = hasPermission('read_reports', 'BUSINESS_ID');

// Multiple checks
const hasAnyAdminRole = hasAnyRole(['admin', 'super_admin']);
const hasAllPermissions = hasAllPermissions(['read', 'write', 'delete']);

// Business context
const businessAccess = getUserBusinessAccess('BUSINESS_ID');
const isAdmin = isBusinessAdmin('BUSINESS_ID');
const canAccess = canAccessBusiness('BUSINESS_ID');
```

## 🏢 Business Context

The system supports business-specific roles and permissions:

### User Structure
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // Global role
  is_super_admin?: boolean;
  business_roles?: Array<{
    business_vertical_id: string;
    business_name: string;
    roles: string[];
    permissions: string[];
    is_admin: boolean;
  }>;
}
```

### Business Vertical Structure
```typescript
interface BusinessVertical {
  id: string;
  name: string;
  code: string;
  description: string;
  access_type: string;
  roles: string[];
  permissions: string[];
}
```

## 🔐 Permission Categories

Organize permissions by category for better management:

- **admin**: System administration permissions
- **business**: Business management permissions
- **reports**: Report access permissions
- **users**: User management permissions
- **solar**: Solar business specific permissions
- **water**: Water business specific permissions

## 🚦 Access Levels

1. **Super Admin**: Has access to everything across all businesses
2. **Business Admin**: Has admin access within specific businesses
3. **Role-based Access**: Access based on assigned roles and permissions
4. **Guest/Limited Access**: Minimal permissions for basic functionality

## 📋 API Endpoints

The UI components expect these API endpoints:

```
GET /api/v1/admin/roles - Get all roles
POST /api/v1/admin/roles - Create new role
PUT /api/v1/admin/roles/:id - Update role
DELETE /api/v1/admin/roles/:id - Delete role

GET /api/v1/admin/permissions - Get all permissions
POST /api/v1/admin/permissions - Create new permission
PUT /api/v1/admin/permissions/:id - Update permission
DELETE /api/v1/admin/permissions/:id - Delete permission

GET /api/v1/admin/users-with-roles - Get users with their roles
POST /api/v1/admin/assign-user-roles - Assign roles to user
DELETE /api/v1/admin/remove-user-role - Remove role from user

GET /api/v1/admin/business-access - Get business access data
POST /api/v1/admin/grant-business-access - Grant business access
DELETE /api/v1/admin/revoke-business-access - Revoke business access

GET /api/v1/my-businesses - Get user's accessible businesses
```

## 🎨 Styling

The components use Tailwind CSS classes and are designed to match your existing UI. Key design elements:

- Clean, modern interface
- Responsive design
- Consistent color scheme
- Loading states and error handling
- Modal dialogs for forms
- Tabbed navigation

## 🔄 Navigation

Access the authorization system through:

1. **Sidebar**: Added "Authorization" link for super admins
2. **Direct URL**: `/admin/authorization`
3. **Dashboard**: Quick action cards in the overview

## 🛠️ Customization

### Adding New Permission Categories
1. Create permissions with the new category name
2. The UI will automatically group them

### Custom Permission Checks
```tsx
// Create custom permission logic
const hasCustomAccess = () => {
  const user = getUser();
  return user?.is_super_admin || 
         (hasRole('manager') && hasPermission('special_access'));
};

// Use in components
{hasCustomAccess() && <SpecialComponent />}
```

### Business-Specific Components
```tsx
// Create business-aware components
const SolarDashboard = component$(() => {
  const businessId = 'SOLAR_BUSINESS_ID';
  
  return (
    <PermissionGuard 
      permissions={['solar_read_generation']} 
      businessId={businessId}
    >
      <div>Solar-specific content</div>
    </PermissionGuard>
  );
});
```

## 🚀 Getting Started

1. **Access the Dashboard**: Navigate to `/admin/authorization` as a super admin
2. **Set Up Permissions**: Create permissions for your business needs
3. **Create Roles**: Define roles with appropriate permissions
4. **Assign Users**: Assign roles to users for different businesses
5. **Protect Components**: Use PermissionGuard to protect UI elements

## 📝 Best Practices

1. **Principle of Least Privilege**: Give users only the permissions they need
2. **Role-Based Design**: Group related permissions into logical roles
3. **Business Separation**: Keep business-specific permissions separate
4. **Regular Audits**: Review user permissions regularly
5. **Clear Naming**: Use descriptive names for roles and permissions
6. **Documentation**: Document what each permission allows

## 🔍 Troubleshooting

### Common Issues

1. **Permission Guard Not Working**
   - Check if user is logged in
   - Verify permission names match exactly
   - Check business context if using business-specific permissions

2. **API Errors**
   - Verify API endpoints are implemented
   - Check authentication tokens
   - Ensure proper error handling

3. **UI Not Updating**
   - Check if data is being refreshed after changes
   - Verify state management
   - Check for console errors

### Debug Tips

```tsx
// Debug user permissions
const user = getUser();
console.log('User:', user);
console.log('Has permission:', hasPermission('read_reports'));
console.log('Business access:', getUserBusinessAccess('BUSINESS_ID'));
```

This authorization system provides a comprehensive solution for managing user access in your multi-business application. The UI components are designed to be intuitive and powerful, giving you full control over who can access what in your system.