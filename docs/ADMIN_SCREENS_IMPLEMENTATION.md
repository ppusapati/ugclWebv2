# Admin Screens Implementation Guide

## Completed Screens ✅

### 1. Module Management
**Location**: `src/routes/admin/masters/module/index.tsx`
**Features**:
- Create, edit, delete modules
- Grid view with icons
- Active/Inactive status
- Display order

**API Endpoints**:
- `GET /api/v1/modules` - List modules
- `POST /api/v1/admin/masters/modules` - Create module
- `PUT /api/v1/admin/masters/modules/{id}` - Update module
- `DELETE /api/v1/admin/masters/modules/{id}` - Delete module

### 2. Business Vertical Management
**Location**: `src/routes/admin/masters/business-verticals/index.tsx`
**Features**:
- Create, edit, delete business verticals
- Table view
- WATER, SOLAR, HO, CONTRACTORS management

**API Endpoints**:
- `GET /api/v1/admin/businesses` - List verticals
- `POST /api/v1/admin/businesses` - Create vertical
- `PUT /api/v1/admin/businesses/{id}` - Update vertical
- `DELETE /api/v1/admin/businesses/{id}` - Delete vertical

### 3. Global Roles Management
**Location**: `src/routes/admin/rbac/global-roles/index.tsx`
**Features**:
- Create, edit, delete global roles
- Assign permissions to roles
- Hierarchy level management (0-5)
- Permission grouping by resource

**API Endpoints**:
- `GET /api/v1/admin/roles` - List global roles
- `POST /api/v1/admin/roles` - Create role
- `PUT /api/v1/admin/roles/{id}` - Update role
- `DELETE /api/v1/admin/roles/{id}` - Delete role
- `GET /api/v1/admin/permissions` - List all permissions

### 4. Business Roles Management
**Location**: `src/routes/admin/rbac/business-roles/index.tsx`
**Features**:
- List all business roles grouped by vertical
- Create business role (select vertical, name, level, permissions)
- Edit business role
- Delete business role
- Filter by business vertical

**API Endpoints**:
- `GET /api/v1/business/{businessCode}/roles` - Get roles for vertical
- `POST /api/v1/business/{businessCode}/roles` - Create business role
- `PUT /api/v1/business/{businessCode}/roles/{id}` - Update business role
- `DELETE /api/v1/business/{businessCode}/roles/{id}` - Delete business role

### 5. Permissions Management
**Location**: `src/routes/admin/rbac/permissions/index.tsx`
**Features**:
- List all permissions grouped by resource
- Create new permission with auto-generated names (resource:action)
- Edit permission
- Delete permission (check if used in roles first)
- Search/filter by resource or action

**API Endpoints**:
- `GET /api/v1/admin/permissions` - List permissions
- `POST /api/v1/admin/permissions` - Create permission
- `PUT /api/v1/admin/permissions/{id}` - Update permission
- `DELETE /api/v1/admin/permissions/{id}` - Delete permission

### 6. User Management
**Location**: `src/routes/admin/users/index.tsx`
**Features**:
- List all users with search and filtering
- View user details modal (global role, business roles, contact info)
- Create new user with password
- Edit user basic info and role assignments
- Activate/deactivate users
- Filter by global role and business vertical

**API Endpoints**:
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/{id}` - Get user details
- `POST /api/v1/register` - Create user
- `PUT /api/v1/admin/users/{id}` - Update user

### 7. User Role Assignment Screen
**Location**: `src/routes/admin/users/[userId]/roles/index.tsx`
**Features**:
- Show and update global role via dropdown
- Show business role assignments table with vertical, role, level
- Assign business role (select vertical first, then role)
- Remove business role assignments
- Display assignment metadata (assigned_at)

**API Endpoints**:
- `GET /api/v1/admin/users/{id}` - Get user with roles
- `PUT /api/v1/admin/users/{id}` - Update global role
- `POST /api/v1/users/{id}/roles/assign` - Assign business role
- `DELETE /api/v1/users/{id}/roles/{roleId}` - Remove business role
- `GET /api/v1/business/{businessCode}/roles` - Get roles for vertical

### 8. User Site Assignment Screen
**Location**: `src/routes/admin/users/[userId]/sites/index.tsx`
**Features**:
- Dual-list selector (Available Sites ↔ Assigned Sites)
- Filter by business vertical
- Search sites by name in both lists
- Select All/Select None functionality
- Bulk assign/revoke site access
- Show assignment metadata (assigned_at, location, code)

**API Endpoints**:
- `GET /api/v1/business/{businessCode}/sites` - All sites in vertical
- `GET /api/v1/business/{businessCode}/sites/user/{userId}/access` - User's assigned sites
- `POST /api/v1/business/{businessCode}/sites/access` - Assign site access (bulk)
- `DELETE /api/v1/business/{businessCode}/sites/access/{accessId}` - Revoke access

### 9. Permissions Mapping (Integrated)
**Location**: Already integrated in Global Roles and Business Roles screens
- Each role create/edit modal shows all permissions
- Grouped by resource
- Checkbox selection with descriptions

## Navigation Structure

Add these routes to your admin menu:

```tsx
// Admin Menu Structure
const adminMenu = [
  {
    title: "Masters",
    items: [
      { name: "Modules", path: "/admin/masters/module" },
      { name: "Business Verticals", path: "/admin/masters/business-verticals" },
    ]
  },
  {
    title: "RBAC",
    items: [
      { name: "Permissions", path: "/admin/rbac/permissions" },
      { name: "Global Roles", path: "/admin/rbac/global-roles" },
      { name: "Business Roles", path: "/admin/rbac/business-roles" },
    ]
  },
  {
    title: "User Management",
    items: [
      { name: "Users", path: "/admin/users" },
      { name: "Role Assignments", path: "/admin/users/role-assignments" },
      { name: "Site Assignments", path: "/admin/users/site-assignments" },
    ]
  }
];
```

## Quick Implementation Checklist

- [x] Module Management
- [x] Business Vertical Management
- [x] Global Roles Management
- [x] Business Roles Management
- [x] Permissions Management
- [x] User Management (List & Details)
- [x] User Role Assignment
- [x] User Site Assignment

**All screens completed! ✅**

## Code Reuse Patterns

All screens follow the same pattern:

1. **State Management**:
```tsx
const state = useStore({
  items: [],
  loading: true,
  showCreateModal: false,
  editingItem: null,
  newItem: {},
  error: "",
  success: "",
});
```

2. **API Utilities**:
```tsx
const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-api-key": API_KEY,
  };
};
```

3. **CRUD Operations**:
- useVisibleTask$ for loading
- $ wrapped handlers for create/update/delete
- Modal for create/edit forms
- Success/error notifications with auto-dismiss

4. **UI Components**:
- Table or Grid view
- Modal dialogs
- Success/Error alerts
- Loading spinners
- Permission guards

## Implementation Summary

All 8 admin screens have been successfully implemented following consistent patterns:

### Completed Implementations:

1. **Module Management** - Grid view with icon management
2. **Business Vertical Management** - CRUD for business units
3. **Global Roles Management** - System-wide roles with permissions
4. **Business Roles Management** - Vertical-specific roles
5. **Permissions Management** - Resource:Action permission system
6. **User Management** - User CRUD with filtering
7. **User Role Assignment** - Global and business role assignments
8. **User Site Assignment** - Dual-list site access management

### Next Steps:

1. **Test each screen** with backend APIs to ensure proper integration
2. **Update admin navigation menu** to include all new routes (see Navigation Structure above)
3. **Add validation** for required fields and business rules
4. **Add pagination** for user list (currently loads all users)
5. **Error handling improvements** - Add specific error messages based on API responses
6. **Add loading states** during API calls (partially implemented)
7. **Add confirmation dialogs** for destructive actions (partially implemented)
8. **Add breadcrumbs** for nested routes (user role/site assignment screens)
9. **Test role hierarchy enforcement** - Ensure users can only assign lower-level roles
10. **Add audit logging** - Track who assigns/revokes roles and site access
