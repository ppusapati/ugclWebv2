# UGCL Design System TODO

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done

## A. Foundation
- [x] Create DS folder and base exports (`src/components/ds/index.ts`)
- [x] Build `Btn` primitive with variants and sizes
- [x] Build `Badge` primitive with semantic variants
- [x] Build `PageHeader` primitive with title/subtitle/actions slot
- [x] Build `SectionCard` primitive
- [x] Build `FormField` primitive (label/required/help/error wrapper)
- [x] Build `TabBar` primitive (pill tabs)
- [x] Build `DataTable` scaffold (header/body slots + standard classes)

## B. Layout Unification
- [x] Standardize admin content spacing via shared wrapper usage
- [x] Ensure sidebar-content distance is consistent across all admin screens
- [x] Standardize card padding and section spacing

## C. Buttons and Actions Migration
- [x] Replace ad hoc create buttons with `Btn` primary in admin list screens
- [x] Replace mixed Edit/Delete patterns with DS button variants
- [x] Standardize top-right action bars in edit screens

## D. Headings and Page Structure
- [x] Replace per-screen page heading blocks with `PageHeader` (28 admin routes + 2 builders done)
- [x] Remove accent-colored heading text variants (blue/purple heading text)
- [x] Normalize subtitle style

## E. Form Standardization
- [x] Migrate forms to `FormField` wrappers (18 route files done)
- [x] Fix textarea label misalignment in dashboard info form
- [x] Standardize required marker, help text, and error text style
- [x] Standardize 2-column responsive form grid pattern

## F. Tabs and Navigation
- [x] Migrate RBAC underline tabs to DS pill tabs
- [x] Migrate forms/workflow tabs to DS TabBar contract
- [x] Standardize tab icon + count treatment

## G. Badges and Status
- [x] Replace raw status spans with `Badge` (15 route files done; all analytics screens migrated)
- [x] Standardize active/inactive/level/type badge semantics

## H. Tables
- [x] Standardize table header and cell density using DS table styles (6 route files done: business, sites, policies, attributes, business sites list, business site access)
- [x] Standardize actions column spacing and button placement

## I. Enforcement and QA
- [x] Add grep/lint checks for banned ad hoc patterns in admin routes and shared components
- [x] Run migration checklist on all admin routes
- [x] Validate with `pnpm run build`
- [x] Validate with `pnpm run css:audit` (0 banned pattern findings in `src/routes/**/*.tsx` and `src/components/**/*.tsx`)
- [x] Final visual QA pass across shared screen set

## J. Rollout Order
- [x] 1) Business Verticals
- [x] 2) RBAC
- [x] 3) Workflows
- [x] 4) Projects create
- [x] 5) Forms builder
- [x] 6) Dashboard/report builders
- [x] 7) Remaining admin screens (Phase 4 complete)

## K. Current Reality Check (Code-Verified)
- [x] Action/button anti-pattern sweep completed in admin routes (`pnpm run css:audit` passes)
- [x] Shared-component button anti-pattern sweep completed in auth, builders, geofencing, projects, tasks, documents, and admin support components
- [x] `PageHeader` adoption: **28 route files** — attributes, workflows, forms/new, users, masters/module, policies, masters/sites, masters/sites/new, masters/sites/[id]/edit, rbac/roles, rbac/permissions, masters/business, projects/create, notifications/preferences, masters/business/[code]/roles, masters/business/[code]/sites/new, documents, chats, admin/index, notifications/index, forms/index, projects/index, masters/business/[code]/sites, masters/business/[code]/sites/[id]/edit, masters/business/[code]/sites/[id]/access, masters/attendance, masters/business/[code]/attendance, analytics/reports
- [x] `FormField` adoption: **18 route files** — policies create/edit/test, masters/sites/new, masters/sites/[id]/edit, rbac/roles modal, rbac/permissions modal, users modal, masters/module modal, attributes modal, notifications/preferences, masters/business/[code]/roles modal, masters/business/[code]/sites/new, notifications/index filters, forms/index filters, projects/index filters, masters/business/[code]/sites/[id]/edit, masters/business/[code]/sites/[id]/access
- [x] `TabBar` adoption: **4 route files** — rbac/layout, policies/[id] detail, projects/[projectId] detail, admin/index dashboard
- [x] `Badge` (DS) adoption: **15 route files** — masters/business, workflows, rbac/roles, policies, rbac/permissions, masters/sites, masters/module, attributes, notifications/index, masters/business/[code]/sites, masters/business/[code]/sites/[id]/access, masters/attendance, masters/business/[code]/attendance, analytics/reports, analytics/dashboards
- [x] `DataTable` adoption: **6 route files** — masters/business, masters/sites, policies, attributes, masters/business/[code]/sites, masters/business/[code]/sites/[id]/access

## L. Enhancement Execution (Sequential)
- [x] 1) Replace `useVisibleTask$` permission derivation on analytics reports pages with `useTask$` + SSR guards
- [x] 2) Add global form state variants (`success`, `error`, `warning`, `readonly`) in `src/global.css`
- [x] 3) Harden DS `FormField` accessibility contract and adopt in high-traffic forms
  - [x] Base contract hardening in FormField component
  - [x] Slice 1 adoption: policies create/edit/test (19 fields)
  - [x] Slice 2 adoption: attributes modal, permissions modal, sites new/edit (24 fields)
  - [x] Slice 3 adoption: users modal, roles modal, modules modal (17 fields)
  - [x] Slice 4 adoption: business vertical roles, sites new/edit (17 fields)
  - [x] Slice 5 adoption: notifications filters and preferences (6 fields)
  - [x] Total: 82 FormField instances across 15 high-traffic route files
  - [x] Optional: Continue with remaining forms (workflow, geofencing, reports ~20-30 fields)
    - [x] Slice A: Workflow editor components (`StateEditor`, `TransitionEditor`, `WorkflowPanel`, `NotificationConfigEditor`, `WorkflowDesigner` basic info)
    - [x] Slice B: Report surfaces (`ReportForm`, `ReportTemplate`, analytics report builder modal/config fields)
    - [x] Slice C: Remaining geofencing/report-builder/workflow long-tail fields
      - [x] Workflow long-tail: `FieldEditorComplete` core sections (basic, type-specific, validation)
      - [x] Report-builder long-tail: selected fields alias + filter builder controls
      - [x] Workflow residuals: state color/icon selectors and workflow preview headings aligned to DS form-heading conventions
      - [x] Geofencing/residual scan completed (no actionable legacy form-class leftovers in targeted optional scope)
- [x] 4) Expand `scripts/css-audit.mjs` to block legacy form class regressions and enforce FormField contract adherence
  - [x] Add formfield-missing-id rule to detect FormField components without id props
  - [x] Add formfield-required-missing-aria informational rule
  - [x] Fix 6 remaining FormField violations detected by new rules
  - [x] Expand audit target scope from admin routes to all routes and shared components
  - [x] Clear remaining shared-component legacy/raw button violations with DS `Btn` migration
  - [x] Maintain legacy rules for button classes, shortcuts, inline styles
  - [x] Validate: build ✅, css:audit ✅, type-check ✅, lint ✅

## M. Enhancement Validation
- [x] Run `pnpm run build` after Enhancement 1
- [x] Re-run `pnpm run css:audit` after Enhancement 1
- [x] Verify no `qwik/no-use-visible-task` warning on analytics reports routes
- [x] Run `pnpm run build` after Enhancement 2
- [x] Re-run `pnpm run css:audit` after Enhancement 2
- [x] Run `pnpm run build` after Enhancement 3 (current adoption slice)
- [x] Re-run `pnpm run css:audit` after Enhancement 3 (current adoption slice)
- [x] Run `pnpm run build` after Enhancement 4 rule expansion
- [x] Re-run `pnpm run css:audit` after Enhancement 4 with new FormField rules
- [x] Re-run `pnpm run build` after component-scope button cleanup
- [x] Re-run `pnpm run css:audit` after component-scope button cleanup

## N. Continuation Sweep (2026-04-24)
- [x] Standardize form-builder renderer field components (`TextField`, `TextAreaField`, `NumberField`, `DateField`, `FileUploadField`, `SelectField`) to DS `FormField` patterns.
- [x] Standardize form-builder submissions surfaces (`SubmissionList`, `SubmissionDetail`, `CommentModal`) with DS `Badge`, `FormField`, and `Btn`.
- [x] Continue shared-component cleanup in `FieldEditor`, `FormBuilder`, and `FormBuilderComplete` with DS wrappers and action controls.
- [x] Update docs with continuation sweep results.
