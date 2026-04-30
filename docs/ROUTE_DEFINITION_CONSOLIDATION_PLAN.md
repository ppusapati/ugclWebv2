# Route Definition Consolidation Plan

## Goal
Use one canonical route metadata source for:
- admin menu navigation
- breadcrumb generation
- help-context topic resolution

This prevents route drift and repeated manual updates across multiple files.

## Current Sources To Consolidate
- `src/config/admin-menu.ts`
- `src/services/breadcrumb.service.ts`
- `src/content/help-content.ts`

## Proposed Target Architecture
1. Introduce a new canonical route registry file:
   - `src/config/route-registry.ts`
2. Registry entry shape should include:
   - `pathPattern`
   - `label`
   - `icon`
   - `parentPathPattern`
   - `menuVisibility` (admin, module, hidden)
   - `helpTopicId` and optional `helpVariantId`
3. Keep route matching utility in one place:
   - static route matching
   - dynamic segment matching (`:id`, `:code`, etc.)

## Migration Steps
1. Phase 1: Read-only adoption in breadcrumb service
   - Refactor breadcrumb generation to consume route registry.
   - Keep existing fallback behavior.
2. Phase 2: Menu parity
   - Replace admin-menu hardcoded list with projections from route registry.
   - Preserve icon and ordering behavior.
3. Phase 3: Help-context parity
   - Replace direct `routePatterns` matching with route registry mapping to topic/variant.
   - Keep help content itself unchanged.
4. Phase 4: Cleanup
   - Remove duplicated route tables.
   - Add tests for route matching and projections.

## Regression-Safety Checks
- Breadcrumb labels/parents unchanged for all existing configured routes.
- Admin menu entries and order unchanged.
- Help drawer resolves same topic/variant for representative static and dynamic routes.
- Add tests for:
  - `/`
  - `/masters/module`
  - `/rbac/roles`
  - `/masters/business/:code/forms/:formCode`
  - `/analytics/reports/view/:id`

## Non-Goals
- No redesign of help content text.
- No navigation UX changes.
- No mobile behavior changes.
