---
name: ondo-real-estate-ui
description: Guide for AI agents working on the Ondo Real Estate Vite + React + TypeScript + Tailwind UI. Use when modifying frontend code, adding pages/components, or reasoning about this repo’s structure and conventions.
---

## Repository overview

- **App type**: Single-page application for Ondo Real Estate (marketing + dashboard UI).
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI/shadcn-style components, React Router v6.
- **Entry points**: Standard Vite React entry via `index.html` and `src` (do not change these unless explicitly asked).

## Project structure (high level)

- **`src/pages`**: Route-level pages (marketing, auth, dashboard shells, legal, etc.).
- **`src/components`**: Reusable UI components and primitives.
- **`src/features`**: Feature-oriented modules combining logic and UI.
- **`src/hooks`**: Shared React hooks for cross-cutting concerns.
- **`src/lib`**: App-level utilities (API, auth/session helpers, site metadata, formatting).
- **`src/constants` / `src/utils`**: Constants and generic helper utilities.

When adding new functionality, prefer placing:
- Page-sized screens in `src/pages`.
- Reusable building blocks in `src/components`.
- Cohesive business features in `src/features/<feature-name>`.

## Conventions for changes

- **TypeScript**:
  - Use strict, explicit types where reasonable; avoid `any` unless absolutely necessary and justified with a comment.
  - Reuse shared types from `src/types` or relevant feature modules before creating new ones.

- **Styling**:
  - Prefer Tailwind utility classes and existing component patterns over ad-hoc inline styles.
  - Use `tailwind-merge` and existing helpers when combining conditional class names.

- **UI components**:
  - Favor existing Radix/shadcn-style patterns in `src/components` and `src/features`.
  - Keep components small and focused; pull complex logic into hooks or helper functions.

- **Routing**:
  - Use React Router v6 conventions.
  - New routes should be implemented as components in `src/pages` and wired into the existing router configuration.

- **Forms & validation**:
  - Use `react-hook-form` and `zod` for new forms where possible.
  - Keep validation schemas close to the form or in the relevant feature directory.

## Tooling and commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build` (includes TypeScript check)
- **Preview**: `npm run preview`
- **Lint**: `npm run lint`

When proposing or applying non-trivial changes, prefer code that:
- Builds with `npm run build` without new type errors.
- Passes `npm run lint` without introducing warnings or violations.

## Safety and constraints

- **Do not** introduce new dependencies unless needed and consistent with existing patterns; check `package.json` first.
- **Do not** store secrets or environment-specific configuration in source; use Vite env variables (`import.meta.env.VITE_*`) and `.env.example` as reference.
- **Avoid** modifying Vite, TypeScript, ESLint, or Tailwind configuration files unless the user explicitly requests configuration changes.

## How to approach tasks in this repo

1. **Locate context**:
   - Start from `src/pages` for route-level features; follow imports into `src/features`, `src/components`, and `src/lib`.
2. **Follow existing patterns**:
   - Mirror existing naming, file organization, and component patterns for similar features.
3. **Design before coding**:
   - Outline the change (affected pages, components, hooks, utilities) before editing.
4. **Implement incrementally**:
   - Keep edits localized and composable; avoid large, cross-cutting refactors unless requested.
5. **Validate**:
   - Ensure changes are type-safe and lint-clean; respect existing UX and styling conventions.

