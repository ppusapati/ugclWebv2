# Archive

This folder contains frontend files moved out of active source folders during cleanup.

## Scope Used
- Evaluated files only under `src/routes` and `src/components`.
- Kept route files in place (Qwik file-based routes are active by presence).
- Marked component files as archive candidates when they were:
  - not imported by route files,
  - not imported by components directly imported by routes,
  - and not imported from other source files in `src`.

## Result
- Archived unused component files into `src/archive/components` preserving original folder structure.
- Created `src/archive/routes` for route-archive scope (no route files moved in this pass).
