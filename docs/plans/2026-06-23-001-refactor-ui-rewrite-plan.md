---
title: Rewrite website UI to match bento-preview-polished.html
type: refactor
status: active
date: 2026-06-23
---

# Rewrite website UI to match bento-preview-polished.html

## Summary

Full UI redesign of the React SPA (44 source files across pages, components, sections, and index.css) to match the bento-preview-polished.html design reference. Preserves all existing functionality (auth, payments, AI, routing, data fetching, animations) while refreshing every visual surface — CSS design tokens, component layouts, typography, spacing, responsive behavior, and dark mode. Adds missing UI primitives from the preview (notification drawer, command palette, breadcrumbs, learning path, skeleton loaders, empty states).

---

## Problem Frame

The website uses a custom brutalist bento design system implemented across a 2692-line monolithic index.css and 44 React components. While functional, the visual execution has drifted from the design reference (bento-preview-polished.html) in typography weights, spacing consistency, card shadows/borders, responsive breakpoints, and several missing UI primitives. This plan aligns the production React app pixel-for-pixel with the approved design reference.

---

## Requirements

- R1. Every page and component matches the bento-preview-polished.html visual design
- R2. All existing functionality is preserved — no breaking changes to auth, payments, AI chat, routing, data fetching, or state management
- R3. Responsive behavior matches the preview's three breakpoints (desktop, tablet, mobile)
- R4. Dark mode continues to work with the bento-preview dark theme variables
- R5. New UI primitives from the preview are added: notification drawer, command palette, breadcrumbs, learning path, skeleton loaders, empty states
- R6. No new external dependencies beyond what the existing project already uses
- R7. All component states (loading, empty, error, populated) remain intact

---

## Scope Boundaries

- Full UI rewrite of all 44 source files — no exemptions
- Backend, API routes, database schema, and data models are NOT touched
- No new routes or page components added (no new pages beyond existing 21)
- bento-preview-polished.html is the reference — it is NOT modified
- Core business logic in lib/ modules is NOT touched
- The Tailwind CSS dependency remains installed but unused (components use custom CSS classes, not Tailwind utility classes)
- No new external dependencies are added

---

## Context & Research

### Relevant Code and Patterns

- `index.css` (2692 lines) — current CSS design system with light/dark CSS variables, utility classes, bento grid patterns, responsive breakpoints
- `bento-preview-polished.html` — target design reference with CSS variable definitions, grid patterns, component styles
- `App.tsx` — HashRouter with 21 lazy-loaded routes, Navbar/Footer/AIAssistant toggled per route
- `components/Navbar.tsx` — sticky nav with lucide-react icons, mode toggle, user menu
- `components/Footer.tsx` — bento grid footer with link sections
- `components/AIAssistant.tsx` — floating AI chat widget with 4 modes
- `components/sections/*.tsx` — 11 landing section components
- `pages/*.tsx` — 21 page components, most with Loading/Empty/Error state handling
- `lib/firebase.ts` — Firebase-compatible SDK wrapper (keep untouched)
- `types.ts` — 440-line type definitions

### Design Token Alignment

- **Light theme**: index.css and bento-preview match on --accent (#2a7a3a), --bg (#f5f5f0), --ink (#1a1a1a), --rule (#d4d4c8)
- **Dark theme divergence**: index.css uses darker greens (#2a7a3a / #1e5e2e), bento-preview uses brighter greens (#3da55d / #4ade80) — plan adopts bento-preview dark values
- **Grid patterns**: both use 2-col, 3-col, 4-col bento grids with 4px 4px 0 hard shadows
- **Typography**: both use Inter (body) + JetBrains Mono (labels/buttons), but index.css overuses monospace; bento reduces it

---

## Key Technical Decisions

- **CSS-first approach**: Update index.css design tokens and utility classes first, then update components to use the new classes — avoids touching every component's JSX twice
- **Preserve component structure**: Keep existing React component architecture, file organization, and state management. Only change className assignments, inline styles, and markup structure where needed to match the bento-preview layout
- **New components as additions**: Notification drawer, command palette, breadcrumbs, skeleton loaders, empty states are new files in components/ — reused across existing pages
- **Framer-motion preserved**: Keep all existing framer-motion animations; add entrance animations matching bento-preview's data-reveal pattern
- **No Tailwind adoption**: The bento-preview uses custom CSS, consistent with the existing approach. No migration to Tailwind utility classes
- **Dark theme alignment**: Adopt bento-preview's brighter dark-mode green palette (#3da55d accent, #4ade80 accent-bright) and darker background (#0a0a0a)

---

## Open Questions

### Resolved During Planning

- CSS approach: Update index.css variables and utility classes, then update components — confirmed CSS-first
- New component placement: Add as new files in components/ following existing naming conventions
- Dark theme: Adopt bento-preview values for consistency

### Deferred to Implementation

- Exact sequence of component updates within each unit — determined during work based on dependency order
- Specific className changes per component — determined by comparing current markup to bento-preview reference

---

## High-Level Technical Design

> This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.

### CSS Token Migration

```
bento-preview CSS vars  →  index.css :root vars (update in place)
  - Keep light theme values (match already close)
  - Update dark theme greens to bento-preview
  - Add any missing utility classes from bento-preview
  - Update font-family assignments (less monospace)
```

### Component Update Pattern

Each component follows this pattern:
1. Read bento-preview reference section for target markup/structure
2. Read current component JSX
3. Update className assignments to match bento-preview classes
4. Update markup structure only where bento-preview diverges significantly
5. Preserve all event handlers, state, data fetching, and business logic

### New Component Integration

```
components/
  NotificationDrawer.tsx    — fixed right panel, toggle from Navbar
  CommandPalette.tsx        — modal overlay with search input
  Breadcrumbs.tsx           — simple nav breadcrumb trail
  SkeletonLoader.tsx        — loading placeholder with CSS animation
  EmptyState.tsx            — reusable empty state with icon + message
```

These integrate into existing pages without changing route structure.

---

## Implementation Units

### U1. CSS Design System Update

**Goal:** Update index.css design tokens, utility classes, and responsive breakpoints to match bento-preview-polished.html

**Requirements:** R1, R3, R4

**Dependencies:** None

**Files:**
- Modify: `index.css`

**Approach:**
- Compare bento-preview `<style>` CSS variable definitions against index.css `:root` and `[data-theme="dark"]`
- Update dark theme greens from (#2a7a3a / #1e5e2e) to (#3da55d / #4ade80) matching bento-preview
- Add missing utility classes from bento-preview (breadcrumb styles, skeleton loader keyframes, empty state styles, notification drawer styles, command palette styles)
- Update `.flabel` and label classes to use Inter instead of JetBrains Mono (matching bento-preview's reduced monospace)
- Add `.breadcrumb`, `.skeleton`, `.empty-state`, `.notif-drawer`, `.cmd-palette` CSS classes
- Update responsive breakpoints to match bento-preview's three-viewport system

**Patterns to follow:**
- Existing index.css variable structure
- bento-preview-polished.html `<style>` section (inline in the HTML file)

**Test scenarios:**
- Visual: light theme matches bento-preview pixel-for-pixel on desktop
- Visual: dark theme matches bento-preview dark variables
- Visual: responsive layout matches at desktop (1280px+), tablet (768-1279px), mobile (<768px)
- Regression: existing components still render without visual breakage

**Verification:**
- CSS variables set correctly for both themes
- Utility classes available and styled correctly

---

### U2. Shared Components Update

**Goal:** Update Navbar, Footer, AIAssistant, and other shared components to match bento-preview visual design

**Requirements:** R1, R2, R7

**Dependencies:** U1

**Files:**
- Modify: `components/Navbar.tsx`
- Modify: `components/Footer.tsx`
- Modify: `components/AIAssistant.tsx`
- Modify: `components/LearningPathView.tsx`
- Modify: `components/AnimatedCounter.tsx`
- Modify: `components/LoginModal.tsx`
- Modify: `components/SmoothScroll.tsx`
- Modify: `components/Chat.tsx`
- Modify: `components/CourseChat.tsx`
- Modify: `components/DoubtSolver.tsx`
- Modify: `components/FlashcardDeck.tsx`

**Approach:**
- Navbar: update classes for sticky header, nav links style, mode toggle, user avatar area. Add notification bell icon (lucide-react Bell) linking to NotificationDrawer toggle. Add search icon (lucide-react Search) linking to CommandPalette toggle. Remove monospace from nav links.
- Footer: update bento grid link sections, social icons, copyright area to match preview footer
- AIAssistant: update floating button style, chat panel style, mode selector tabs
- LearningPathView: redesign as vertical journey path with dot nodes and connecting line (matching bento-preview)
- Chat/CourseChat/DoubtSolver: update message bubbles, input areas, header styles
- FlashcardDeck: update card flip styles, progress indicator
- LoginModal: match bento-preview modal overlay style
- AnimatedCounter: preserve functionality, update display style
- SmoothScroll: no-op (stays disabled)

**Patterns to follow:**
- bento-preview-polished.html sidebar/navbar sections for nav styles
- bento-preview modal overlay for LoginModal
- bento-preview learning path section for LearningPathView

**Test scenarios:**
- Navbar renders on all landing and content pages
- Navbar links navigate correctly
- Footer renders with all link sections
- AIAssistant opens/closes correctly
- LoginModal opens from navbar user icon
- All event handlers and state preserved

**Verification:**
- Visual match with bento-preview
- All existing functionality works (navigation, auth trigger, AI chat, etc.)

---

### U3. New UI Primitives

**Goal:** Build notification drawer, command palette, breadcrumbs, skeleton loaders, and empty state components

**Requirements:** R5

**Dependencies:** U1

**Files:**
- Create: `components/NotificationDrawer.tsx`
- Create: `components/CommandPalette.tsx`
- Create: `components/Breadcrumbs.tsx`
- Create: `components/SkeletonLoader.tsx`
- Create: `components/EmptyState.tsx`
- Modify: `components/Navbar.tsx` (wire notification/command toggles)
- Modify: `pages/*.tsx` (add breadcrumbs, skeleton loaders, empty states where missing)

**Approach:**
- NotificationDrawer: fixed right overlay panel with notification list items, close button, overlay backdrop click-to-close. Toggled from Navbar Bell icon. Mobile: full-width panel.
- CommandPalette: modal overlay with search input, keyboard shortcut (Cmd+K / Ctrl+K) trigger, results list. Toggled from Navbar Search icon and keyboard shortcut.
- Breadcrumbs: simple horizontal nav trail component styled as inline bento tags. Accepts `segments: {label, href?}[]`.
- SkeletonLoader: CSS-animated placeholder boxes. Variants: card, line, avatar, text-block. Uses CSS shimmer animation defined in U1.
- EmptyState: centered icon + heading + description + optional CTA button. Accepts `icon, title, description, action?`.

**Patterns to follow:**
- bento-preview notification drawer (overlay panel in the preview)
- bento-preview command palette (search overlay in the preview)
- bento-preview breadcrumbs (below classroom page heading)
- bento-preview skeleton loaders (CSS animation patterns)
- bento-preview empty states (centered card with message)

**Test scenarios:**
- NotificationDrawer opens/closes via toggle and overlay click
- CommandPalette opens via Ctrl+K / Cmd+K and search icon
- Breadcrumbs render correctly with 2-4 segment paths
- SkeletonLoader renders placeholder animation
- EmptyState renders with all variants (default, with action)

**Verification:**
- All new components render without errors
- Keyboard shortcut for command palette works
- Notification drawer responsive on mobile
- Components reusable across pages (imported where needed)

---

### U4. Landing Sections Update

**Goal:** Update all 11 landing page section components to match bento-preview visual design

**Requirements:** R1, R3

**Dependencies:** U1

**Files:**
- Modify: `components/sections/HeroSection.tsx`
- Modify: `components/sections/ProblemSection.tsx`
- Modify: `components/sections/SolutionSection.tsx`
- Modify: `components/sections/FeaturesSection.tsx`
- Modify: `components/sections/AppShowcaseSection.tsx`
- Modify: `components/sections/CurriculumSection.tsx`
- Modify: `components/sections/ArchitectureSection.tsx`
- Modify: `components/sections/CaseStudySection.tsx`
- Modify: `components/sections/PricingSection.tsx`
- Modify: `components/sections/VisionSection.tsx`
- Modify: `components/sections/CtaSection.tsx`

**Approach:**
- HeroSection: update orbit sphere positioning, tagline typography (Inter body, monospace only for labels), CTA buttons, stats bar. Match bento-preview hero layout.
- ProblemSection: update 3-column grid, card borders/shadows, icon positioning
- SolutionSection: update live demo widget styling, tabs, output area
- FeaturesSection: update tab style (student/teacher/parents), card grids
- AppShowcaseSection: update phone mockup wireframes, tab indicators
- CurriculumSection: update progress tracks, curriculum cards
- ArchitectureSection: update architecture diagram styling, labels
- CaseStudySection: update testimonial cards, impact metrics, stat counters
- PricingSection: update pricing tiers, feature lists, CTA buttons
- VisionSection: update statement tags layout
- CtaSection: update bottom banner, CTA button, background

**Patterns to follow:**
- bento-preview sections (hero, problem, features, etc.)
- Current component state handling patterns (loading/error/empty states)

**Test scenarios:**
- Each section renders with correct content on Home page
- Tab interactions in FeaturesSection work
- Pricing CTA buttons trigger correct flows
- Phone mockup interactions work

**Verification:**
- Visual match with bento-preview for each section
- All interactive elements (tabs, buttons, toggles) work
- Responsive layout correct at all breakpoints

---

### U5. Auth & Profile Pages

**Goal:** Update Login, Signup, Verification, and Profile pages

**Requirements:** R1, R2, R7

**Dependencies:** U1

**Files:**
- Modify: `pages/Login.tsx`
- Modify: `pages/Signup.tsx`
- Modify: `pages/Verification.tsx`
- Modify: `pages/Profile.tsx`

**Approach:**
- Login/Signup: update form card style, input fields (less monospace), button styles, error/success states. Match bento-preview auth section.
- Verification: update email verification notice card
- Profile: update edit form, engagement stats cards, avatar area

**Patterns to follow:**
- bento-preview auth section for form layouts
- Current form validation and submission logic (preserve all)

**Test scenarios:**
- Login form validates and submits correctly
- Signup form validates and submits correctly
- Profile loads user data and saves edits
- Error states render correctly (invalid credentials, network error)

**Verification:**
- Auth flow works end-to-end
- Visual match with bento-preview

---

### U6. Dashboard & Course Pages

**Goal:** Update Dashboard, Courses, CourseDetails, Enroll pages

**Requirements:** R1, R2, R3, R7

**Dependencies:** U1

**Files:**
- Modify: `pages/Dashboard.tsx`
- Modify: `pages/Courses.tsx`
- Modify: `pages/CourseDetails.tsx`
- Modify: `pages/Enroll.tsx`

**Approach:**
- Dashboard: update course summary cards, enrollment status, stats grid, teacher app status section, meeting links, empty state. Use skeleton loaders for loading state. Use empty state component for no-enrollments.
- Courses: update catalog grid, search input, filter chips, course cards
- CourseDetails: update syllabus stages, purchase card, module list
- Enroll: update enrollment form, confirmation card

**Patterns to follow:**
- bento-preview dashboard section for dashboard layout
- bento-preview catalog for course cards

**Test scenarios:**
- Dashboard loads user enrollments correctly
- Dashboard shows empty state when no enrollments
- Courses catalog loads and filters correctly
- CourseDetails loads syllabus and purchase options
- Enroll form submits correctly

**Verification:**
- All data displays correctly from Supabase
- Loading states show skeleton loaders
- Empty states shown when appropriate

---

### U7. Admin, Teacher Panel & Behavior Insights

**Goal:** Update AdminDashboard, TeacherPanel, BehaviorInsights pages (full bento grid layout with breadcrumbs)

**Requirements:** R1, R2, R3, R7

**Dependencies:** U1, U3

**Files:**
- Modify: `pages/AdminDashboard.tsx`
- Modify: `pages/TeacherPanel.tsx`
- Modify: `pages/BehaviorInsights.tsx`

**Approach:**
- AdminDashboard (1700 lines, multi-tab): update tab bar style, each tab content panel (applications, chat, stats, classes, courses). Add breadcrumbs. Use skeleton loaders per tab.
- TeacherPanel: update class management cards, chat pane, controls. Add breadcrumbs. Update student list styling.
- BehaviorInsights: update risk analytics cards, engagement charts, student list. Add breadcrumbs. Update danger/warning badge styles to calm labels.

**Patterns to follow:**
- bento-preview admin section for admin layout
- bento-preview teacher panel section
- bento-preview behavior insights section

**Test scenarios:**
- Admin tabs switch correctly with content loading per tab
- TeacherPanel loads classes and student data
- BehaviorInsights data renders correctly
- Loading states use skeleton loaders
- Empty states shown when data unavailable

**Verification:**
- All tabs/panels render and function correctly
- Breadcrumbs show correct path
- Visual match with bento-preview

---

### U8. Classroom & Practice Pages

**Goal:** Update CourseClassroom and Practice pages

**Requirements:** R1, R2, R3, R7

**Dependencies:** U1, U3

**Files:**
- Modify: `pages/CourseClassroom.tsx`
- Modify: `pages/Practice.tsx`

**Approach:**
- CourseClassroom: update video area, module/lecture sidebar, chat drawer, task list. Add breadcrumbs. Update progress indicators.
- Practice: update problem list, code editor area, difficulty labels, test results panel

**Patterns to follow:**
- bento-preview classroom section for classroom layout
- bento-preview practice labs section

**Test scenarios:**
- Classroom loads course modules and lectures correctly
- Practice problems load and submit correctly
- Chat drawer opens/closes
- Loading states show skeleton loaders
- Error states handled

**Verification:**
- All interactive elements work
- Visual match with bento-preview

---

### U9. Content & Utility Pages

**Goal:** Update About, Services, Contact, Resources, PeerEducation, TeacherApplication, PatchNotes pages

**Requirements:** R1, R2, R7

**Dependencies:** U1

**Files:**
- Modify: `pages/About.tsx`
- Modify: `pages/Services.tsx`
- Modify: `pages/Contact.tsx`
- Modify: `pages/Resources.tsx`
- Modify: `pages/PeerEducation.tsx`
- Modify: `pages/TeacherApplication.tsx`
- Modify: `pages/PatchNotes.tsx`

**Approach:**
- About: update team profiles in bento grids, mission section
- Services: update service offering cards
- Contact: update contact cards, form styling
- Resources: update search card, resource list, filter chips
- PeerEducation: update student/teacher selection path cards
- TeacherApplication: update multi-step form styling
- PatchNotes: update version labels, changelog entries

**Patterns to follow:**
- bento-preview about/contact sections
- Existing component patterns for forms, grids, lists

**Test scenarios:**
- Each page renders with correct content
- Contact form submits correctly
- Teacher application wizard works through all steps
- Resources search and filter work

**Verification:**
- All pages render without errors
- Visual match with bento-preview design patterns

---

### U10. Polish, Responsive, & Dark Mode Verification

**Goal:** Final pass on responsive behavior, dark mode, and visual consistency

**Requirements:** R3, R4

**Dependencies:** U1-U9

**Files:**
- Modify: `index.css` (responsive and dark mode refinements)
- Modify: Affected components (tweaks from responsive testing)

**Approach:**
- Audit every component at 3 viewports (desktop 1280px+, tablet 768-1279px, mobile <768px)
- Verify dark mode renders correctly on every page
- Ensure no overflow, no broken layouts, no missing content
- Collapsible panels and drawer menus on mobile work correctly
- Touch targets are large enough on mobile (min 44px)
- Verify all skeleton loaders animate correctly
- Verify all empty states render correctly

**Patterns to follow:**
- bento-preview's viewport simulator behavior

**Test scenarios:**
- Every page renders correctly at 3 viewport sizes
- Dark mode toggle works on every page
- No horizontal overflow on mobile
- Touch targets on mobile meet accessibility minimum
- Keyboard navigation works (Tab through interactive elements)

**Verification:**
- `npm run build` succeeds without TypeScript errors
- All pages visually verified at 3 viewports
- Dark mode toggles correctly on all pages

---

## System-Wide Impact

- **Interaction graph:** Navbar now wires to NotificationDrawer and CommandPalette (new toggles and state). Existing Navbar links/menu unaffected.
- **Error propagation:** Unchanged — all data fetching, error handling, and state management preserved as-is.
- **State lifecycle risks:** New components (NotificationDrawer, CommandPalette) add isolated UI state — no shared state changes.
- **API surface parity:** No API changes. All existing endpoints, auth flows, and data contracts unchanged.
- **Integration coverage:** New primitives tested in their consuming pages (dashboard, admin, classroom).
- **Unchanged invariants:** Route structure, data flow, auth flow, payment flow, AI chat logic — none of these are touched by this plan.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| CSS update breaks existing component layouts | U1 CSS changes are backward-compatible: existing classes keep their names, only visual properties change. Each component update in U2-U9 explicitly tests for visual breakage. |
| 44-file change set is large, high merge conflict risk | Single branch (`feat/bento-ui-rewrite` already exists), sequential units, no parallel branches. |
| New components (notification drawer, command palette) may conflict with existing UI state | New components use isolated state — no shared state changes with existing features. |
| Dark mode may have inconsistent elements across 44 files | U10 dedicated pass verifies dark mode on every page systematically. |
| TypeScript errors from className changes | Run `tsc` after each unit to catch type errors. Final verification in U10 runs full build. |

---

## Documentation / Operational Notes

- No documentation changes needed — this is a visual refresh, not a behavior change
- Run `npm run build` (tsc && vite build) as final verification
- After completion, run `npm run dev` and visually verify key pages at 3 viewports
