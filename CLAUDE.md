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

## Internationalization (i18n) — MANDATORY FOR ALL CHANGES

The app is fully multi-language using `react-i18next`. **Every UI change must include translations for all 8 languages.**

### Supported locales

| Code | Language | Native label |
|------|----------|--------------|
| `en` | English | English (United States) |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `it` | Italian | Italiano |
| `te` | Telugu | తెలుగు |
| `hi` | Hindi | हिन्दी |
| `ta` | Tamil | தமிழ் |
| `kn` | Kannada | ಕನ್ನಡ |

### i18n rules

- **Never hardcode English strings** in JSX or component logic. Always use the `t()` function from `useTranslation()`.
- **Translation files**: `public/locales/{locale}/common.json`. When adding a new string to `en/common.json`, add the translated equivalent to all other 7 locale files in the same PR/commit.
- **New namespaces**: If you create a new i18n namespace (e.g. `dashboard.json`, `tenant.json`), create it for all 8 locales simultaneously.
- **i18n config**: `src/lib/i18n.ts` — HTTP backend loading from `/locales/`, `ondo_locale` localStorage key.
- **Language switcher**: `src/components/ui/language-switcher.tsx` — already wired into the header. Do not duplicate the locale list; import from a shared source.
- **Date/number formatting**: Use helpers from `src/lib/locale-format.ts` (`formatDate`, `formatDateTime`, `formatNumber`, `formatCurrency`) instead of hardcoded `toLocaleDateString()` or `new Intl.*` calls.
- **Backend sync**: On language change, the switcher calls `PUT /api/users/me/locale` to persist the preference for logged-in users. The locale is loaded from the backend on session restore via `preferredLocale` in the `/api/auth/me` response.

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
