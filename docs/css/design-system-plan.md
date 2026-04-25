# UGCL CSS Design System Plan

## Goal
Create a production-grade design system where every admin screen uses the same layout, spacing, typography, controls, and interaction patterns through shared primitives built on existing tokens + UnoCSS.

## Why We Are Standardizing
Current inconsistencies are implementation-level, not framework-level:
- Different button patterns for same actions
- Inconsistent page header and section heading styles
- Mixed tab patterns (underline vs pill)
- Inconsistent form label alignment and field spacing
- Repeated per-screen ad hoc utility strings

The token foundation and UnoCSS theme are already in place. We will standardize by converging all screens to shared components and shortcuts.

## Scope
In scope:
- Admin pages under `src/routes/admin/**`
- Shared components under `src/components/**` that render admin and line-of-business UI
- Shared UI primitives for page shell, actions, forms, tabs, badges, cards, tables
- Migration rules and enforcement checks

Out of scope (for initial rollout):
- Public/login/register pages
- Rebranding color palette itself
- Rewriting business logic

## Standards (Contract)
### Layout
- Main content spacing: one canonical container rhythm in admin pages
- Standard page sections:
  1) breadcrumb (existing)
  2) page header (title/subtitle/actions)
  3) content cards/sections

### Buttons
- `primary`: filled brand blue
- `secondary`: outlined neutral
- `danger`: outlined red (filled only for destructive-confirm contexts)
- `ghost`: text-only
- Sizes: `sm | md | lg`

### Headings
- Default heading color is text-primary (not accent colors)
- Accent icon colors allowed only in small leading icon, not heading text

### Forms
- Label above control for all fields
- Required marker style unified
- Help/error text unified
- Consistent vertical rhythm and two-column breakpoints

### Tabs
- Canonical style: pill/outlined tabs with clear active state
- All tabbed screens migrate to same visual model

### Status/Badges
- Use semantic badge variants only (`success | warning | error | info | neutral`)
- No direct ad hoc color classes in route files

### Tables
- Unified header typography, row density, and action cell layout

## Phase Plan
## Phase 1: Foundation Primitives
Create `src/components/ds/*`:
- `Btn`
- `Badge`
- `PageHeader`
- `SectionCard`
- `FormField`
- `TabBar`
- `DataTable` (initial scaffold)
- central exports (`src/components/ds/index.ts`)

Deliverable:
- Reusable primitives with strict variant props
- No screen migration yet

## Phase 2: Core Screen Migration
Migrate highest-visibility screens first:
- Business Verticals
- RBAC Roles/Permissions
- Workflows list + editor header/actions
- Projects create

Deliverable:
- Standardized button/header/layout patterns across these pages

## Phase 3: Forms and Builders
Migrate complex forms/builders:
- Forms create/edit tabs
- Dashboard builder forms/settings panels
- Report builder forms/settings panels

Deliverable:
- Standardized form field wrappers, tab styles, and section cards

## Phase 4: Full Admin Sweep
Migrate remaining admin routes and high-traffic shared components, then remove duplicate local patterns.

Deliverable:
- No ad hoc legacy button/badge patterns in admin route files or shared components

## Phase 5: Enforcement and QA
- Add lint/grep CI checks for banned raw patterns in routes and shared components
- Visual QA checklist on all admin screens
- Build and regression validation

## Acceptance Criteria
- Every admin screen uses DS primitives for headers, primary actions, and status badges
- Form labels and spacing are consistent
- Tabs are visually consistent
- No direct raw color utility anti-patterns for actions/status in route files or shared components
- `pnpm run build` passes

## Current Progress Snapshot
 _Last updated: 2026-04-24 (Phase 3 & 4 complete, Phase 5 validated)_
 
 **Phase 1** — Complete. All DS primitives built (`Btn`, `Badge`, `PageHeader`, `SectionCard`, `FormField`, `TabBar`, `DataTable`).
 
 **Phase 2** — Complete. Business Verticals, RBAC Roles/Permissions, Workflows, Projects Create migrated.
 
 **Phase 3** — Complete. Forms New, Dashboard/Report builders, all dashboard/report builder action controls and headers migrated to DS primitives.
 
 **Phase 4 (Full Admin Sweep)** — Complete. All 30+ admin route files standardized to DS primitives, and the remaining audited shared-component button/action surfaces migrated to `Btn`.
 - Continuation sweep (2026-04-24): form-builder renderer/submissions and builder shells (`FieldEditor`, `FormBuilder`, `FormBuilderComplete`, renderer field components, submission views/modals) received additional DS normalization (`FormField`, `Badge`, `Btn`) with build + audit validation.
 
 | Primitive | Done (route files) | Remaining |
 |---|---|---|
 | `PageHeader` | 28 — attributes, workflows, forms/new, users, masters/module, policies, masters/sites, masters/sites/new, masters/sites/[id]/edit, rbac/roles, rbac/permissions, masters/business, projects/create, notifications/preferences, masters/business/[code]/roles, masters/business/[code]/sites/new, documents, chats, admin/index, notifications/index, forms/index, projects/index, masters/business/[code]/sites, masters/business/[code]/sites/[id]/edit, masters/business/[code]/sites/[id]/access, masters/attendance, masters/business/[code]/attendance, analytics/reports | Complete ✅ |
 | `FormField` | 18 — policies create/edit/test, masters/sites/new, masters/sites/[id]/edit, rbac/roles modal, rbac/permissions modal, users modal, masters/module modal, attributes modal, notifications/preferences, masters/business/[code]/roles modal, masters/business/[code]/sites/new, notifications/index filters, forms/index filters, projects/index filters, masters/business/[code]/sites/[id]/edit, masters/business/[code]/sites/[id]/access | Complete ✅ |
 | `TabBar` | 4 — rbac/layout, policies/[id], projects/[projectId], admin/index | Complete ✅ |
 | `Badge` (DS) | 15 — masters/business, workflows, rbac/roles, policies, rbac/permissions, masters/sites, masters/module, attributes, notifications/index, masters/business/[code]/sites, masters/business/[code]/sites/[id]/access, masters/attendance, masters/business/[code]/attendance, analytics/reports, analytics/dashboards | Complete ✅ |
| `DataTable` | 6 — masters/business, masters/sites, policies, attributes, masters/business/[code]/sites, masters/business/[code]/sites/[id]/access | Complete ✅ |
 
 **Phase 5 (Enforcement)** — Complete.
 - `scripts/css-audit.mjs` added and enforced ✅
 - `scripts/css-audit.mjs` scope expanded to `src/routes/**/*.tsx` and `src/components/**/*.tsx` ✅
 - `pnpm run css:audit` passes — **0 banned patterns** in `src/routes/**/*.tsx` and `src/components/**/*.tsx` ✅
 - `pnpm run build` passing (type-checked + lint-checked) ✅
- Final visual QA pass: checklist closed with owner-approved sign-off notes in `docs/css/design-system-visual-qa-checklist.md` (2026-04-24).

## Risk Controls
- Migrate by vertical slices to avoid large regressions
- Keep wrappers backward-compatible during transition
- Validate each phase with build + screen review

## Bootstrap Decision
Do not switch to Bootstrap.
Reason: inconsistency source is screen implementation drift, not UnoCSS/tokens. Migrating frameworks would increase churn and risk without solving governance.

## Post-Standardization Enhancements (Sequential)
_Last updated: 2026-04-24_

### Enhancement 1: Replace Eager Permission Tasks
Goal:
- Remove `useVisibleTask$` in analytics report screens where permission state is derived.
- Use `useTask$` with SSR guards to avoid eager main-thread blocking work.

Scope:
- `src/routes/admin/analytics/reports/index.tsx`
- `src/routes/admin/analytics/reports/view/[id]/index.tsx`

Success criteria:
- `qwik/no-use-visible-task` warnings removed for these routes.
- Behavior remains unchanged for permission-driven actions.

Status:
- Complete (2026-04-24).

### Enhancement 2: Global Form State Variants
Goal:
- Extend global form standardization with semantic states: `success`, `error`, `warning`, and `readonly`.

Scope:
- `src/global.css`

Success criteria:
- Token-driven classes available across native and aliased controls.
- Disabled/readonly/invalid visuals remain consistent with current DS contracts.

Status:
- Complete (2026-04-24).

### Enhancement 3: DS FormField Contract Hardening
Goal:
- Expand DS `FormField` contract so label/help/error/required wiring is the default path everywhere.

Scope:
- `src/components/ds/FormField*`
- Adoption sweep on high-traffic forms.

Success criteria:
- Reduced ad hoc field wrapper markup in routes.
- Consistent `aria-describedby` and required semantics by default.

Status:
- **Complete** (2026-04-24).
- Base contract hardening completed in `src/components/ds/form-field.tsx` with deterministic ids and alert semantics.
- High-traffic adoption applied across 5 slices, **82 FormField instances wired** across 15 route files:
  - **Slice 1 (Policy routes)**: 19 fields
    - `src/routes/admin/policies/create/index.tsx`
    - `src/routes/admin/policies/[id]/edit/index.tsx`
    - `src/routes/admin/policies/[id]/test/index.tsx`
  - **Slice 2 (Modals & Site forms)**: 24 fields
    - `src/routes/admin/attributes/index.tsx` (6 fields, modal)
    - `src/routes/admin/rbac/permissions/index.tsx` (4 fields, modal)
    - `src/routes/admin/masters/sites/new/index.tsx` (8 fields, full form)
    - `src/routes/admin/masters/sites/[id]/edit/index.tsx` (6 fields, full form)
  - **Slice 3 (User/Role/Module modals)**: 17 fields
    - `src/routes/admin/users/index.tsx` (6 fields, modal)
    - `src/routes/admin/rbac/roles/index.tsx` (6 fields, modal)
    - `src/routes/admin/masters/module/index.tsx` (5 fields, modal)
  - **Slice 4 (Business Vertical forms)**: 17 fields
    - `src/routes/admin/masters/business/[code]/roles/index.tsx` (5 fields, modal)
    - `src/routes/admin/masters/business/[code]/sites/new/index.tsx` (6 fields, full form)
    - `src/routes/admin/masters/business/[code]/sites/[id]/edit/index.tsx` (6 fields, full form)
  - **Slice 5 (Notification forms)**: 6 fields
    - `src/routes/admin/notifications/index.tsx` (3 fields, filters)
    - `src/routes/admin/notifications/preferences/index.tsx` (3 fields, quiet hours + digest)
- Current sequential progress: optional adoption includes workflow editor components (StateEditor, TransitionEditor, WorkflowPanel, NotificationConfigEditor, WorkflowDesigner, FieldEditorComplete core + residual selectors/previews), report surfaces (ReportForm, ReportTemplate), and report-builder modal/core controls.
- Targeted residual scan completed for geofencing/report-builder/workflow optional scope with no actionable legacy form-class leftovers.
- All validations passing: build ✅, css:audit ✅, type-check ✅, lint ✅

### Enhancement 4: CSS Audit Rule Expansion
Goal:
- Add automated enforcement of FormField accessibility contract and legacy form class regressions.

Scope:
- `scripts/css-audit.mjs`
- All route and shared component TSX files (`src/routes/**/*.tsx`, `src/components/**/*.tsx`)

Success criteria:
- Audit detects and blocks FormField instances without id props.
- Audit detects legacy button classes, raw colors, inline styles across routes and components.
- New rules catch regressions in accessibility contract adherence.

Status:
- **Complete** (2026-04-24).
- **New Rules Added**:
  1. `formfield-missing-id`: Detects FormField components without id prop (required for aria-describedby wiring).
  2. `formfield-required-missing-aria`: Informational check for required FormField compliance (multi-line context analysis).
- **Enforcement**: 6 outstanding FormField violations fixed after rule activation:
  - `src/routes/admin/forms/index.tsx` (2 fields: search, module filter)
  - `src/routes/admin/masters/business/[code]/sites/[id]/access/index.tsx` (2 fields: user select, permissions)
  - `src/routes/admin/projects/index.tsx` (2 fields: business vertical, status filters)
- **Scope Expansion**: audit coverage widened from admin routes to all route and component TSX files.
- **Component Cleanup Completed**: remaining legacy/raw button usages migrated in shared components including auth, form builders, workflow designer, geofencing, projects, tasks, documents, and admin/auth dashboards.
- **Legacy Rules Maintained**:
  - Raw primary/success/danger button classes
  - Legacy btn class shortcuts
  - Inline style attributes (with CSS-variable exceptions)
- All validations passing: build ✅, css:audit ✅ (0 violations), type-check ✅, lint ✅
