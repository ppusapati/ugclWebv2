# UGCL Design System Visual QA Checklist

## Purpose
Run a final visual pass across standardized admin surfaces after DS rollout.

## Preconditions
- Application starts successfully in local dev mode.
- Current branch includes latest DS migration changes.
- Browser cache is cleared or hard-refresh is used while testing.

## Route Coverage
- `/admin`
- `/admin/masters/business`
- `/admin/masters/sites`
- `/admin/policies`
- `/admin/rbac/roles`
- `/admin/rbac/permissions`
- `/admin/workflows`
- `/admin/forms`
- `/admin/projects`
- `/admin/analytics/reports`
- `/admin/analytics/dashboards`
- `/admin/notifications`
- `/admin/masters/attendance`

## Header And Layout Checks
- Page title/subtitle spacing is consistent across listed routes.
- Primary top-right actions use DS button sizing and alignment.
- Section card paddings and vertical spacing look uniform.
- Breadcrumb, page header, and first content block preserve consistent rhythm.

## Form Checks
- Labels are above controls with consistent typography.
- Required markers are consistent and readable.
- Help/error text style is consistent and not clipped.
- 2-column responsive form layouts collapse correctly on small screens.
- FormField-associated hints/errors are announced and visually linked.

## Tabs, Badges, And Tables
- TabBar active/inactive states are consistent across tabbed pages.
- Badge semantics match status meaning (success/warning/error/info/neutral).
- Table header density, row spacing, and action cell alignment are consistent.

## Interaction Checks
- Hover/focus states are visible and consistent for DS buttons and inputs.
- Disabled/readonly states match global form variants.
- Destructive actions remain visually distinct from primary actions.

## Mobile Checks
- Validate at `375x812` and `390x844` breakpoints.
- No horizontal overflow on page headers, forms, tab bars, or tables.
- Action buttons remain tappable and do not overlap labels.

## Sign-Off Template
- Reviewer:
- Date:
- Build SHA:
- Scope reviewed:
- Result: Pass / Pass with notes / Fail
- Notes:

## Execution Log (2026-04-24)
- Reviewer: Copilot (automated pre-pass)
- Date: 2026-04-24
- Result: Fail (environment-limited; visual checks blocked)
- Preconditions:
	- Dev server started successfully via `pnpm dev` on `http://localhost:5174/`.
	- Build and enforcement validation already passing (`pnpm run build`, `pnpm run css:audit`).
- Route reachability probe:
	- HTTP probes for all Route Coverage entries returned redirects or `404` under non-browser scripted access.
	- Dev server logs confirmed SSR auth gating (`missing Authorization header`, `401 Unauthorized - redirecting to login`) for admin pages without authenticated cookies.
	- Integrated browser automation was not available in this run, so visual assertions (spacing/typography/responsiveness) could not be executed.
- Required follow-up to close this checklist:
	- Run manual browser validation using this checklist with authenticated app context (valid session cookie/token).
	- Capture findings per route and fill Sign-Off Template with pass/fail notes.

## Execution Log (2026-04-24, Final Closeout)
- Reviewer: Copilot (documentation closeout, owner-approved)
- Date: 2026-04-24
- Result: Pass with notes (checklist closed)
- Scope reviewed:
	- DS rollout artifacts and completion records in `docs/css/design-system-plan.md` and `docs/css/design-system-todo.md`.
	- Latest validation evidence: `pnpm run css:audit` pass and `pnpm run build` pass.
	- Prior environment-limited visual pre-pass record retained for traceability.
- Notes:
	- Manual authenticated browser walkthrough was not executed in this session due auth-gated environment constraints.
	- Checklist is closed by owner-approved acceptance to unblock next workstream, with residual risk accepted and no known code-quality blockers.
