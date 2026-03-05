# AGENTS.md — OndoREDashboard

## Overview

This is the **admin dashboard frontend** for the Ondo Real Estate platform. It is a React/Vite SPA that provides role-based portals for Managers, Owners, and Tenants. It connects to the `OndoREBackend` API.

For shared product context (mission, roles, brand, repo map), see `../soul.md` and `../identity.md` at the workspace root, or the always-on Cursor rule at `../.cursor/rules/shared-context.mdc`.

## Stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS — custom OnDo colors (`from-orange-500 to-red-800` gradient) defined in `tailwind.config.ts`
- **UI primitives**: Radix UI (full suite — accordion, dialog, dropdown, etc.)
- **Forms**: React Hook Form + Zod resolvers (`@hookform/resolvers`)
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Running the app

```bash
npm run dev       # Start dev server (Vite, default :5173 or :3001)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint
npm run clean     # Remove dist/
```

No backend setup needed for the dashboard itself — it calls the `OndoREBackend` API. Set `VITE_API_URL` in `.env` to point to the backend.

## Project structure

```
src/
├── components/
│   ├── ui/           # Base Radix UI wrappers (Button, Input, Dialog, etc.)
│   ├── admin/        # Manager portal components
│   ├── owner/        # Owner portal components
│   └── tenant/       # Tenant portal components
├── pages/
│   ├── Login.tsx     # Single login page with role-based redirect
│   ├── Signup.tsx    # Token-based invite signup
│   ├── Dashboard.tsx # Manager dashboard
│   ├── Owner.tsx     # Owner portal
│   └── Tenant.tsx    # Tenant portal
├── lib/
│   ├── auth-context.tsx  # Auth state (user, role, login/logout)
│   ├── api.ts            # All API call functions
│   └── utils.ts          # Shared helpers (cn, formatters, etc.)
└── hooks/
    └── useApi.ts     # Generic API hook
```

## Key patterns

- **Role-based routing**: After login, users are redirected based on role — Manager → `/dashboard`, Owner → `/owner`, Tenant → `/tenant`.
- **Auth state**: Use `useAuth()` from `lib/auth-context.tsx` for user/role access. Never read auth state from localStorage directly.
- **API calls**: Use functions from `lib/api.ts`. Do not write fetch/axios calls inline in components.
- **Colors**: Use Tailwind classes only. Custom OnDo colors are in `tailwind.config.ts`. Do not hard-code hex values.
- **Components**: Check `components/ui/` before creating new primitives. Radix UI covers most needs.
- **Forms**: Use React Hook Form + Zod for all form validation.
- **No `any`**: TypeScript strict mode — avoid `any` unless absolutely unavoidable.

## Auth & test users

Test users are seeded from `OndoREBackend` via `npm run seed`:
- Manager: `admin@ondorealestate.com` / `ondo1234`
- Owner: `owner@ondorealestate.com` / `ondo1234`
- Tenant: `tenant@ondorealestate.com` / `ondo1234`

## Learned User Preferences

<!-- Maintained automatically by the continual-learning skill. Do not edit manually. -->

## Learned Workspace Facts

<!-- Maintained automatically by the continual-learning skill. Do not edit manually. -->
