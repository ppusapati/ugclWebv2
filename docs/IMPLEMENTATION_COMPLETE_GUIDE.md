# Complete Web Implementation Guide

## Overview
This guide provides the complete implementation status and remaining tasks for the UGCL web application based on the backend API.

## ✅ COMPLETED SCREENS

### 1. Authentication & Profile
- ✅ Login (`/login`)
- ✅ Register (`/register`)
- ✅ Change Password (`/change-password`)
- ✅ Profile View (`/dashboard/profile`)
- ✅ Profile Edit (`/dashboard/profile/edit`)

### 2. Dashboard
- ✅ Main Dashboard with KPI Tabs (`/dashboard`)
- ✅ Diesel KPI Dashboard
- ✅ Stock KPI Dashboard
- ✅ Contractor KPI Dashboard
- ✅ Dairy Site KPI Dashboard

### 3. Admin - User Management (NEWLY COMPLETED)
- ✅ User List (`/dashboard/admin/users` or `/dashboard/users`) - Enhanced with service layer
- ✅ Create User (`/dashboard/admin/users/new`) - NEW
- ✅ View User Details (`/dashboard/admin/users/[id]`) - NEW
- ✅ Edit User (`/dashboard/admin/users/[id]/edit`) - NEW
- ✅ Delete User (inline action)

### 4. Admin - Role Management
- ✅ Global Roles List (`/dashboard/admin/roles`)
- ✅ Create/Edit Global Role with Permissions
- ✅ Delete Role
- ✅ Permission checkbox interface

### 5. Business Management
- ✅ My Businesses (`/dashboard/my-businesses`)
- ✅ Admin Businesses List (`/dashboard/admin/businesses`)
- ✅ Create Business (`/dashboard/admin/businesses/new`)
- ✅ View Business (`/dashboard/admin/businesses/[id]`)
- ✅ Edit Business (`/dashboard/admin/businesses/[id]/edit`)

### 6. Site Management (Partial)
- ✅ My Sites (`/dashboard/my-sites`)
- ✅ Business Sites List (`/business/[code]/sites`)
- ✅ Create Site (`/business/[code]/sites/new`)

---

## 🚧 REMAINING SCREENS TO IMPLEMENT

### Priority 1: Admin & Authorization (Critical)

#### 1.1 Permission Management
**Route:** `/dashboard/admin/permissions`
**Status:** Missing
**Features Needed:**
- List all permissions with resource grouping
- Create new permission
- Filter by resource/action
- Search permissions
**Backend Endpoints:**
- GET `/api/v1/admin/permissions`
- POST `/api/v1/admin/permissions`

#### 1.2 Business Role Management (Per Vertical)
**Route:** `/business/[code]/roles`
**Status:** Missing
**Features Needed:**
- List roles for specific business
- Create business-specific role
- Edit business role with permissions
- Delete business role
- Assign user to business role
**Backend Endpoints:**
- GET `/api/v1/business/{businessCode}/roles`
- POST `/api/v1/business/{businessCode}/roles`
- PUT `/api/v1/business/{businessCode}/roles/{id}`
- DELETE `/api/v1/business/{businessCode}/roles/{id}`
- POST `/api/v1/business/{businessCode}/users/assign`

#### 1.3 Business User Assignment
**Route:** `/business/[code]/users`
**Status:** Missing
**Features Needed:**
- List users in business
- Assign user to business with role
- Remove user from business
- View user's business roles
**Backend Endpoints:**
- GET `/api/v1/business/{businessCode}/users`
- POST `/api/v1/business/{businessCode}/users/assign`

### Priority 2: Site Management (Complete)

#### 2.1 Site Edit
**Route:** `/business/[code]/sites/[id]/edit`
**Status:** Template exists, needs implementation
**Features Needed:**
- Edit site details
- Update location (map picker)
- Toggle active status

#### 2.2 Site Access Management
**Route:** `/business/[code]/sites/[id]/access`
**Status:** Template exists, needs implementation
**Features Needed:**
- List users with site access
- Assign user to site with permissions (read, create, update, delete)
- Revoke site access
- View permission matrix
**Backend Endpoints:**
- GET `/api/v1/business/{businessCode}/sites/{siteId}/users`
- POST `/api/v1/business/{businessCode}/sites/access`
- DELETE `/api/v1/business/{businessCode}/sites/access/{accessId}`

### Priority 3: Report CRUD Screens (15 Types × 2 Screens = 30 Screens)

All report types need:
1. List screen with filters
2. Create/Edit screen with form

#### Report Types:
1. **DPR Site** (`/reports/dprsite`)
   - Endpoints: GET/POST `/api/v1/dprsite`, GET/PUT/DELETE `/api/v1/dprsite/{id}`

2. **Water Tanker** (`/reports/water`)
   - Endpoints: GET/POST `/api/v1/water`, GET/PUT/DELETE `/api/v1/water/{id}`

3. **Material** (`/reports/material`)
   - Endpoints: GET/POST `/api/v1/material`, GET/PUT/DELETE `/api/v1/material/{id}`

4. **Payment** (`/reports/payment`)
   - Endpoints: GET/POST `/api/v1/payment`, GET/PUT/DELETE `/api/v1/payment/{id}`

5. **Wrapping** (`/reports/wrapping`)
   - Endpoints: GET/POST `/api/v1/wrapping`, GET/PUT/DELETE `/api/v1/wrapping/{id}`

6. **E-way Bill** (`/reports/eway`)
   - Endpoints: GET/POST `/api/v1/eway`, GET/PUT/DELETE `/api/v1/eway/{id}`

7. **Stock/Inventory** (`/reports/stock`)
   - Endpoints: Similar pattern

8. **Contractor** (`/reports/contractor`)
   - Endpoints: Similar pattern

9. **Dairy Site** (`/reports/dairysite`)
   - Endpoints: Similar pattern

10. **MNR** (`/reports/mnr`)
    - Endpoints: Similar pattern

11. **NMR Vehicle** (`/reports/nmr_vehicle`)
    - Endpoints: Similar pattern

12. **Painting** (`/reports/painting`)
    - Endpoints: Similar pattern

13. **Diesel** (`/reports/diesel`)
    - Endpoints: Similar pattern

14. **Tasks** (`/reports/tasks`)
    - Endpoints: Similar pattern

15. **Vehicle Log** (`/reports/vehiclelog`)
    - Endpoints: Similar pattern

**Common Features for All Reports:**
- Paginated list with server-side pagination
- Date range filters
- Site filter
- Contractor/Engineer filter
- Search functionality
- View/Edit/Delete actions
- Photo gallery display
- Location map display
- Export functionality

**Form Fields Pattern:**
- Business vertical selector
- Site selector
- Date picker
- File uploads (photos, documents)
- Location map picker (lat/lng)
- Dynamic fields per report type
- Validation
- Submit/Cancel buttons

### Priority 4: Form Configuration (Admin)

#### 4.1 Form List
**Route:** `/dashboard/admin/forms`
**Status:** Missing
**Features Needed:**
- List all app forms
- Show module, route, version
- Active/inactive toggle
- Create/Edit/Delete forms
**Backend Endpoints:**
- GET `/api/v1/admin/app-forms`
- POST `/api/v1/admin/app-forms`

#### 4.2 Form Create/Edit
**Route:** `/dashboard/admin/forms/new` and `/dashboard/admin/forms/[code]/edit`
**Status:** Missing
**Features Needed:**
- Form code, title, description
- Module selection
- Form schema editor (JSON)
- Steps configuration
- Validation rules
- Accessible verticals (multi-select)
- Required permission
**Backend Endpoints:**
- POST `/api/v1/admin/app-forms`
- POST `/api/v1/admin/app-forms/{formCode}/verticals`

#### 4.3 Form Access Management
**Route:** `/dashboard/admin/forms/[code]/access`
**Status:** Missing
**Features Needed:**
- Multi-select business verticals
- Assign form access to verticals
**Backend Endpoints:**
- POST `/api/v1/admin/app-forms/{formCode}/verticals`

### Priority 5: Analytics & KPIs

#### 5.1 Business Analytics Dashboard
**Route:** `/business/[code]/analytics`
**Status:** Missing
**Features Needed:**
- Business-wide statistics
- Report counts by type
- User activity metrics
- Site-wise breakdown
- Time period filters
- Charts and visualizations
**Backend Endpoints:**
- GET `/api/v1/business/{businessCode}/analytics`

---

## 📋 IMPLEMENTATION TEMPLATES

### Generic Report List Template

```typescript
// src/routes/reports/[reportType]/index.tsx
import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { P9ETable } from '~/components/table';
import { reportService } from '~/services/report.service';

export default component$(() => {
  const nav = useNavigate();
  const reportType = 'water'; // or 'dprsite', 'material', etc.

  const state = useStore({
    data: [],
    loading: true,
    error: '',
    page: 0,
    limit: 10,
    total: 0,
    filters: {
      start_date: '',
      end_date: '',
      site_id: '',
    },
  });

  const fetchReports = $(async (page = state.page) => {
    state.loading = true;
    try {
      const response = await reportService.getReports(reportType, {
        page: page + 1,
        page_size: state.limit,
        ...state.filters,
      });
      state.data = response.data || [];
      state.total = response.total || 0;
    } catch (error: any) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await fetchReports();
  });

  const handleDelete = $(async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      await reportService.deleteReport(reportType, id);
      await fetchReports(state.page);
    } catch (error: any) {
      alert(error.message);
    }
  });

  return (
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold">
          {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports
        </h1>
        <button
          onClick$={() => nav(`/reports/${reportType}/new`)}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Report
        </button>
      </div>

      {/* Filters */}
      <div class="bg-white p-4 rounded-lg shadow mb-4 flex gap-4">
        <input
          type="date"
          value={state.filters.start_date}
          onInput$={(e) => {
            state.filters.start_date = (e.target as HTMLInputElement).value;
            fetchReports(0);
          }}
          class="px-3 py-2 border rounded"
          placeholder="Start Date"
        />
        <input
          type="date"
          value={state.filters.end_date}
          onInput$={(e) => {
            state.filters.end_date = (e.target as HTMLInputElement).value;
            fetchReports(0);
          }}
          class="px-3 py-2 border rounded"
          placeholder="End Date"
        />
      </div>

      {/* Table */}
      <P9ETable
        header={[
          { key: 'date', label: 'Date' },
          { key: 'site_name', label: 'Site' },
          { key: 'created_by', label: 'Created By' },
          { key: 'actions', label: 'Actions', render: (_val, row) => (
            <div class="flex gap-2">
              <button
                onClick$={() => nav(`/reports/${reportType}/${row.id}`)}
                class="px-3 py-1 bg-blue-100 text-blue-700 rounded"
              >
                View
              </button>
              <button
                onClick$={() => nav(`/reports/${reportType}/${row.id}/edit`)}
                class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded"
              >
                Edit
              </button>
              <button
                onClick$={() => handleDelete(row.id)}
                class="px-3 py-1 bg-red-100 text-red-700 rounded"
              >
                Delete
              </button>
            </div>
          )},
        ]}
        data={state.data}
        defaultLimit={10}
        serverPagination={true}
        totalCount={state.total}
        onPageChange$={$((p, l) => fetchReports(p))}
      />
    </div>
  );
});
```

### Generic Report Form Template

```typescript
// src/routes/reports/[reportType]/new/index.tsx
import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { DynamicForm, type FormField } from '~/components/form_generator';
import { reportService } from '~/services/report.service';
import { siteService } from '~/services/site.service';

export default component$(() => {
  const nav = useNavigate();
  const reportType = 'water'; // Dynamically set based on route

  const state = useStore({
    sites: [],
    loading: false,
    error: '',
  });

  useVisibleTask$(async () => {
    // Load sites for dropdown
    try {
      const response = await siteService.getMySites();
      state.sites = response.data || [];
    } catch (error) {
      console.error('Failed to load sites');
    }
  });

  const formSchema: FormField<any>[] = [
    {
      type: 'select',
      name: 'site_id',
      label: 'Site',
      required: true,
      options: state.sites.map(s => ({ label: s.name, value: s.id })),
    },
    {
      type: 'date',
      name: 'date',
      label: 'Date',
      required: true,
    },
    // Add report-specific fields here
  ];

  const handleSubmit = $(async (data: any) => {
    state.loading = true;
    state.error = '';

    try {
      await reportService.createReport(reportType, data);
      nav(`/reports/${reportType}`);
    } catch (error: any) {
      state.error = error.message;
    } finally {
      state.loading = false;
    }
  });

  return (
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Create New Report</h1>

      {state.error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      <DynamicForm
        formFields={formSchema}
        formLoader={{}}
        onClick$={handleSubmit}
        submitButtonText={state.loading ? 'Submitting...' : 'Submit Report'}
        submitButtonDisabled={state.loading}
      />
    </div>
  );
});
```

---

## 🔧 TECHNICAL NOTES

### Service Layer Pattern
All screens should use centralized service classes:
- `userService` for user operations
- `roleService` for role/permission operations
- `businessService` for business operations
- `siteService` for site operations
- `reportService` for all report types
- `formService` for form configuration

### Authentication Guards
Add permission checks to routes:
```typescript
useVisibleTask$(async () => {
  const user = authService.getUser();
  if (!authService.hasPermission('manage_roles')) {
    nav('/dashboard');
    return;
  }
});
```

### Reusable Components
- `P9ETable` - For all list views
- `DynamicForm` - For all form inputs
- `PermissionGuard` - Wrap sensitive components
- `BusinessSelector` - Select active business context
- `SiteSelector` - Select site from user's accessible sites

---

## 📊 PROGRESS SUMMARY

| Category | Completed | Remaining | Total | Progress |
|----------|-----------|-----------|-------|----------|
| Auth & Profile | 5 | 0 | 5 | 100% |
| Dashboard | 5 | 1 | 6 | 83% |
| User Management | 4 | 0 | 4 | 100% |
| Role Management | 4 | 1 | 5 | 80% |
| Business Management | 5 | 2 | 7 | 71% |
| Site Management | 3 | 2 | 5 | 60% |
| Report Screens | 0 | 30 | 30 | 0% |
| Form Config | 0 | 3 | 3 | 0% |
| Analytics | 4 | 1 | 5 | 80% |
| **TOTAL** | **30** | **40** | **70** | **43%** |

**Updated Progress: 43% Complete (30 of 70 screens)**

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

1. ✅ **User Management** (COMPLETED)
2. **Permission Management** (1 screen)
3. **Business Role Management** (3 screens)
4. **Site Edit & Access** (2 screens)
5. **Report CRUD Templates** (Create reusable templates)
6. **Implement 5 Priority Reports** (DPR, Water, Material, Payment, Stock)
7. **Implement Remaining 10 Reports** (Copy from template)
8. **Form Configuration** (3 screens)
9. **Business Analytics** (1 screen)
10. **Add Permission Guards** (All routes)

---

## 🚀 NEXT STEPS

Based on this guide, you should:

1. **Review** the completed user management screens
2. **Implement** permission management screen
3. **Implement** business role management screens
4. **Create** report templates and apply to all 15 types
5. **Test** all screens with the backend API
6. **Add** permission guards to protect routes

---

## 📝 FILE NAMING CONVENTIONS

```
src/routes/
├── dashboard/
│   ├── admin/
│   │   ├── users/
│   │   │   ├── index.tsx           # List
│   │   │   ├── new/index.tsx       # Create
│   │   │   └── [id]/
│   │   │       ├── index.tsx       # View
│   │   │       └── edit/index.tsx  # Edit
│   │   ├── roles/
│   │   ├── permissions/
│   │   └── forms/
│   └── ...
├── business/
│   └── [code]/
│       ├── roles/
│       ├── users/
│       ├── sites/
│       └── analytics/
└── reports/
    ├── dprsite/
    ├── water/
    ├── material/
    └── ... (15 types)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Status:** Active Development
