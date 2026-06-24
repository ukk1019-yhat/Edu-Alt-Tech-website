---
title: Polishing all pages and updating index CSS
type: feat
status: active
created: 2026-06-23
---

## Problem Frame
We need to improve the visual quality and responsiveness of every user‑facing page in the site, replace any AI‑generated styling shortcuts with handcrafted Tailwind utilities, and ensure that the shared `index.css` reflects the design system used across components.

## Scope Boundaries
- **In scope:** All pages under `src/pages/`, all components used by those pages, and the global stylesheet `src/index.css`.
- **Out of scope:** Backend API changes, content authoring, and any pages not imported in the React router.
- **Deferred:** Major redesign of layout grids (handled in a separate UI overhaul ticket).

## Implementation Units
### U1. Audit page component usage
**Goal**: Identify every page component under `src/pages/` and list the UI components it imports.
**Requirements**: Complete coverage of all route files.
**Dependencies**: None.
**Files**: `src/pages/**/*.tsx`
**Approach**: Run a static import analysis script to generate a mapping of pages → components.
**Test scenarios**:
- Verify the script outputs at least one component for each page file.
- Ensure no page is missing from the report.

### U2. Align component props and styling
**Goal**: Ensure each component used on pages follows the design system (no inline `style=` attributes, consistent Tailwind classes, ARIA where needed).
**Requirements**: All component files in `src/components/` must use Tailwind utility classes only.
**Dependencies**: U1.
**Files**: `src/components/**/*.tsx`
**Approach**: For each component identified in U1, replace inline styles with Tailwind equivalents, add missing `role`/`aria-label` where appropriate, and remove any `style={{...}}` objects.
**Test scenarios**:
- Component renders without React warnings.
- Snapshot test of each component matches the updated Tailwind output.
- Accessibility audit (via axe) reports no violations for the updated components.

### U3. Refactor global `index.css`
**Goal**: Migrate any custom CSS rules in `src/index.css` to Tailwind config or component‑scoped utilities.
**Requirements**: No residual selectors that target component class names.
**Dependencies**: U2 (to ensure component classes are stable).
**Files**: `src/index.css`
**Approach**: Identify custom selectors, convert them to Tailwind `@apply` rules in `src/styles/tailwind.css` (or extend `tailwind.config.js`). Remove the original rules.
**Test scenarios**:
- Build succeeds with Tailwind and no CSS warnings.
- Visual diff of a representative page shows no regression.

### U4. Add responsive breakpoints
**Goal**: Verify each page looks correct at mobile (640px), tablet (768px), and desktop (1024px) breakpoints.
**Requirements**: No layout overflow or hidden content.
**Dependencies**: U2, U3.
**Files**: All page JSX files.
**Approach**: Add Tailwind responsive utilities (`sm:`, `md:`, `lg:`) where needed, based on design mockups.
**Test scenarios**:
- Cypress viewport tests for the three breakpoints assert that main navigation is visible and no horizontal scroll occurs.
- Snapshot diff tests confirm no layout shifts.

### U5. End‑to‑end polish verification
**Goal**: Run a full suite of visual regression tests across all pages after changes.
**Requirements**: CI passes with 0 visual diffs.
**Dependencies**: U4.
**Files**: `cypress/`, `src/pages/`.
**Approach**: Use `cypress-image-snapshot` to capture page screenshots at the three breakpoints and compare against baseline.
**Test scenarios**:
- All pages generate a snapshot.
- No snapshot diff exceeds the 0.1% threshold.

## Risks & Mitigations
- **Risk**: Missing a component used dynamically via `React.lazy`. *Mitigation*: Include a runtime import trace in the audit script.
- **Risk**: Tailwind class explosion leading to larger bundle. *Mitigation*: Purge unused classes in production build.

## Execution note
Start with test‑first for each unit: write failing tests, then apply the Tailwind changes.

## Residual Deferred Work
- Redesign of the hero section layout (requires design mockups).
- Migration of legacy Sass files (outside current scope).