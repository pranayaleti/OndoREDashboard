# CLAUDE.md — OndoREDashboard

## Overview

Admin dashboard frontend for the Ondo Real Estate platform. React/Vite SPA with role-based portals for Managers, Owners, and Tenants. Connects to the `OndoREBackend` API.

## Quick Start

```bash
npm run dev       # Vite dev server (default :5173 or :3001)
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

Set `VITE_API_BASE_URL` in `.env` (defaults to `http://localhost:3030/api`).

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS
- Radix UI primitives, React Hook Form + Zod, React Router DOM, Lucide React

## Key Rules

- **Auth state**: Use `useAuth()` from `lib/auth-context.tsx`. Never read auth from localStorage directly.
- **API calls**: Use functions from `lib/api.ts`. No inline fetch/axios in components.
- **Colors**: Tailwind classes only. Custom OnDo colors in `tailwind.config.ts`. No hard-coded hex.
- **Components**: Check `components/ui/` before creating new primitives.
- **Forms**: React Hook Form + Zod for all validation.
- **TypeScript strict**: No `any` unless unavoidable.
- **AI guardrails**: `lib/aiGuardrails.ts` (`validateChatInput`) runs before assistant messages. Handle 400 and 429 in UI.
- **Role-based routing**: Manager → `/dashboard`, Owner → `/owner`, Tenant → `/tenant`.

## Project Structure

```
src/
├── components/
│   ├── ui/        # Base Radix UI wrappers
│   ├── admin/     # Manager portal
│   ├── owner/     # Owner portal
│   └── tenant/    # Tenant portal
├── pages/         # Login, Signup, Dashboard, Owner, Tenant
├── lib/           # auth-context, api, utils
└── hooks/         # useApi
```

## Test Users

Seeded from `OndoREBackend` via `npm run seed`:
- Manager: `admin@ondorealestate.com` / `ondo1234`
- Owner: `owner@ondorealestate.com` / `ondo1234`
- Tenant: `tenant@ondorealestate.com` / `ondo1234`
