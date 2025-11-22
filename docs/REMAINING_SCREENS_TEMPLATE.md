# 📋 Remaining Screens - Implementation Templates

## ✅ COMPLETED SCREENS (13 screens)

### Authentication & Profile (4 screens)
1. ✅ Registration Page - `/register`
2. ✅ Change Password Page - `/change-password`
3. ✅ Profile Display Page - `/profile`
4. ✅ Profile Edit Page - `/profile/edit`

### Business Management (5 screens)
5. ✅ Business Verticals List (Admin) - `/admin/businesses`
6. ✅ Create Business Form - `/admin/businesses/new`
7. ✅ Edit Business Form - `/admin/businesses/[id]/edit`
8. ✅ Business View/Info Page - `/admin/businesses/[id]`
9. ✅ My Businesses Page - `/my-businesses`

### Site Management (2 screens)
10. ✅ Sites List - `/business/[code]/sites`
11. ✅ Create Site Form - `/business/[code]/sites/new`

---

## ⏳ REMAINING HIGH PRIORITY SCREENS (6 screens)

### Site Management (Continued)

#### 12. Site Edit Form
**Path:** `/business/[code]/sites/[id]/edit`
**Template:** Similar to Create Site, but:
- Pre-fill form with existing site data
- Disable code field (cannot change)
- Add "Last Updated" metadata
- Use `siteService.updateSite(businessCode, siteId, data)`

#### 13. Site Access Management
**Path:** `/business/[code]/sites/[id]/access`
**Features:**
- Display users with access to this site
- Table showing: User Name, Permissions (Read, Create, Update, Delete)
- Add user form with permission checkboxes
- Revoke access button per user
- Use `siteService.getSiteUsers()`, `assignSiteAccess()`, `revokeSiteAccess()`

#### 14. My Sites Page
**Path:** `/my-sites`
**Features:**
- Card view of user's accessible sites
- Show access level per site (Read/Write/Full)
- Filter by business vertical
- Location display (map thumbnail if available)
- Quick actions to navigate to site reports
- Use `siteService.getMySites()`

### Role & Permission Management

#### 15. Global Roles Management
**Path:** `/admin/roles`
**Features:**
- Table: Role Name, Level, User Count, Permissions Count
- Create Role button
- Edit/Delete actions
- Create/Edit Modal with:
  - Name, Display Name, Description
  - Level selector (0-5)
  - Permission multi-select (grouped by resource)
- Use `roleService.getGlobalRoles()`, `createGlobalRole()`, `updateGlobalRole()`, `deleteGlobalRole()`

#### 16. Business Roles Management
**Path:** `/business/[code]/roles`
**Features:**
- Similar to Global Roles but business-specific
- Table: Role Name, Level, Display Name, User Count
- Assign Users to Role functionality
- Use `roleService.getBusinessRoles()`, `createBusinessRole()`, `updateBusinessRole()`, `deleteBusinessRole()`

#### 17. Permissions Management
**Path:** `/admin/permissions`
**Features:**
- Table: Permission Name, Resource, Action, Description
- Create Permission button
- Grouped display by resource (Reports, Materials, Payments, etc.)
- Search and filter
- Use `roleService.getPermissions()`, `getPermissionsGrouped()`, `createPermission()`

---

## 📊 MEDIUM PRIORITY: REPORT MANAGEMENT (30 screens)

### Strategy: Create 2 Generic Components, Then 15 Report Types

### Generic Component 1: Report List Component
**Path:** `/src/components/reports/ReportList.tsx`

```typescript
// Generic props interface
interface ReportListProps {
  reportType: ReportKey;
  businessCode?: string;
}

// Features:
- Uses P9ETable component
- Fetches data using `reportService.getReports(reportType, params)`
- Date range filter
- Business/Site filter
- Search functionality
- Bulk actions (delete, export)
- Column configuration based on report type
- Action buttons: View, Edit, Delete
- Create Report button
```

### Generic Component 2: Report Form Component
**Path:** `/src/components/reports/ReportForm.tsx`

```typescript
// Generic props interface
interface ReportFormProps {
  reportType: ReportKey;
  reportId?: string; // undefined for create, defined for edit
  businessCode?: string;
}

// Features:
- Dynamic field rendering based on report type
- Form validation
- File upload for attachments
- Date/time pickers
- Site selector dropdown
- Auto-save draft functionality
- Submit with confirmation
- Success/Error notifications
```

### Report Type Configuration
**Path:** `/src/config/report-types.ts`

```typescript
export const REPORT_CONFIGS: Record<ReportKey, ReportConfig> = {
  dprsite: {
    displayName: 'DPR Site Reports',
    icon: '📋',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'shift', type: 'select', label: 'Shift', options: ['Morning', 'Evening', 'Night'] },
      { name: 'supervisor', type: 'text', label: 'Supervisor' },
      { name: 'workers_count', type: 'number', label: 'Workers Count' },
      { name: 'work_description', type: 'textarea', label: 'Work Description' },
      { name: 'photos', type: 'file-multiple', label: 'Photos' },
      { name: 'remarks', type: 'textarea', label: 'Remarks' },
    ],
  },
  // ... configure all 15 report types
};
```

### 15 Report Type Pages (30 screens total)

For each report type, create 2 pages:

#### Pattern for List Pages:
**Path:** `/reports/[reportType]/index.tsx`
```typescript
export default component$(() => {
  return <ReportList reportType="dprsite" />;
});
```

#### Pattern for Form Pages:
**Path:** `/reports/[reportType]/new/index.tsx` & `/reports/[reportType]/[id]/edit/index.tsx`
```typescript
export default component$(() => {
  const loc = useLocation();
  const reportId = loc.params.id; // undefined for create

  return <ReportForm reportType="dprsite" reportId={reportId} />;
});
```

### Report Types List:
1. **DPR Site Reports** - `/reports/dprsite`
2. **Water Tanker Reports** - `/reports/water`
3. **Wrapping Reports** - `/reports/wrapping`
4. **E-way Bills** - `/reports/eway`
5. **Material Reports** - `/reports/material`
6. **Payment Records** - `/reports/payment`
7. **Stock Reports** - `/reports/stock`
8. **Dairy Site Reports** - `/reports/dairysite`
9. **MNR Reports** - `/reports/mnr`
10. **NMR Vehicle Reports** - `/reports/nmr_vehicle`
11. **Contractor Reports** - `/reports/contractor`
12. **Painting Reports** - `/reports/painting`
13. **Diesel Reports** - `/reports/diesel`
14. **Tasks** - `/reports/tasks`
15. **Vehicle Logs** - `/reports/vehiclelog`

---

## 📝 IMPLEMENTATION CHECKLIST

### High Priority (6 screens) - Estimated Time: 3-4 hours
- [ ] Site Edit Form
- [ ] Site Access Management
- [ ] My Sites Page
- [ ] Global Roles Management
- [ ] Business Roles Management
- [ ] Permissions Management

### Medium Priority (32 items) - Estimated Time: 6-8 hours
- [ ] Generic Report List Component
- [ ] Generic Report Form Component
- [ ] Report Type Configuration
- [ ] 15 Report List Routes (simple, using generic component)
- [ ] 15 Report Form Routes (simple, using generic component)

---

## 🎯 QUICK IMPLEMENTATION GUIDE

### For Site Edit Form:
1. Copy `/business/[code]/sites/new/index.tsx`
2. Add `useVisibleTask$` to load existing site data
3. Pre-fill form with loaded data
4. Change submit to use `siteService.updateSite()`
5. Disable code field

### For Site Access Management:
1. Create table showing users with access
2. Add form with:
   - User selector (search/autocomplete)
   - 4 checkboxes: Read, Create, Update, Delete
   - Assign button
3. Revoke button per row
4. Use `siteService.getSiteUsers()`, `assignSiteAccess()`, `revokeSiteAccess()`

### For My Sites:
1. Copy `/my-businesses/index.tsx` structure
2. Change to use `siteService.getMySites()`
3. Display site cards with location info
4. Show access level badges

### For Role Management:
1. Create table with role data
2. Add Create/Edit modal
3. Permission multi-select (use grouped display)
4. Level selector (0-5)
5. User count display

### For Report Components:
1. Create generic `ReportList` component using P9ETable
2. Create generic `ReportForm` component with dynamic fields
3. Define report configuration in `/src/config/report-types.ts`
4. Create simple route files that use generic components

---

## 🚀 AFTER COMPLETING ALL SCREENS

### Additional Enhancements:
1. **Add Route Guards** - Protect routes based on permissions
2. **Add Loading States** - Skeleton screens for better UX
3. **Add Error Boundaries** - Graceful error handling
4. **Add Success Toast** - Global notification system
5. **Add Confirmation Dialogs** - Reusable modal component
6. **Add Empty States** - Better empty state illustrations
7. **Add Export Functionality** - CSV/Excel/PDF export for all tables
8. **Add Search Filters** - Advanced filtering for all list views
9. **Add Pagination** - Client and server-side pagination
10. **Add Dark Mode Toggle** - Theme switcher in navbar

### Performance Optimizations:
1. Implement lazy loading for routes
2. Add data caching with stale-while-revalidate
3. Optimize bundle size
4. Add service worker for offline support
5. Implement virtual scrolling for large tables

### Testing:
1. Write unit tests for services
2. Write integration tests for forms
3. Write E2E tests for critical flows
4. Test on mobile devices
5. Test with different user roles

---

## 📊 PROGRESS TRACKING

**Current Status:**
- ✅ Services: 12/12 (100%)
- ✅ Auth & Profile: 4/4 (100%)
- ✅ Business Management: 5/5 (100%)
- ✅ Site Management: 2/5 (40%)
- ⏳ Role Management: 0/3 (0%)
- ⏳ Report Management: 0/32 (0%)

**Overall Progress: 32%**

**Estimated Time to Complete:**
- High Priority: 3-4 hours
- Medium Priority: 6-8 hours
- **Total: 10-12 hours of focused development**

---

## 💡 TIPS FOR FAST IMPLEMENTATION

1. **Copy & Modify:** Don't start from scratch. Copy similar screens and modify.
2. **Use Generic Components:** Leverage P9ETable and ReportList/Form components.
3. **Follow Patterns:** All list views follow same pattern, all forms follow same pattern.
4. **Test As You Go:** Test each screen immediately after creation.
5. **Mobile First:** Ensure responsive design from the start.
6. **Error Handling:** Add error states to every API call.
7. **Success Feedback:** Show success messages after every action.
8. **Validation:** Add client-side validation to all forms.
9. **Loading States:** Show loading indicators for all async operations.
10. **Documentation:** Update IMPLEMENTATION_PROGRESS.md as you complete screens.

---

**Ready to implement! All service layer infrastructure is in place. Just plug in the UI screens using the templates above.**
