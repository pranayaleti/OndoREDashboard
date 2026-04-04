# AGENTS.md — OndoREDashboard

## Overview

This is the **admin dashboard frontend** for the Ondo Real Estate platform. It is a React/Vite SPA that provides role-based portals for Managers, Owners, and Tenants. It connects to the `OndoREBackend` API.

For shared product context (mission, roles, brand, repo map), see `../soul.md` and `../identity.md` at the workspace root, or the always-on Cursor rule at `../.cursor/rules/shared-context.mdc`.

**Agentic experience**: Assistant chat at `/assistant` (Manager, Admin, SuperAdmin, Owner). One UI component (`manager-assistant.tsx`), one API: `dashboardApi.assistantChat(messages)`. Backend scopes data by role; no per-role UI branches.

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

No backend setup needed for the dashboard itself — it calls the `OndoREBackend` API. Set `VITE_API_BASE_URL` in `.env` (defaults to `http://localhost:3030/api` when unset; backend default `PORT` is 3030).

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
- **Assistant chat**: Client-side AI guardrails in `lib/aiGuardrails.ts` (`validateChatInput`) run before sending messages; backend enforces the same limits. Handle 400 (guardrail/validation) and 429 (rate limit) in the assistant UI.

## Internationalization (i18n) — MANDATORY FOR ALL CHANGES

This app uses `react-i18next` for full multi-language support. **Every change that introduces user-facing text must include all 8 locale translations.**

### Supported locales

| Code | Language | Native label | BCP 47 |
|------|----------|--------------|--------|
| `en` | English | English (United States) | `en-US` |
| `es` | Spanish | Español | `es-ES` |
| `fr` | French | Français | `fr-FR` |
| `it` | Italian | Italiano | `it-IT` |
| `te` | Telugu | తెలుగు | `te-IN` |
| `hi` | Hindi | हिन्दी | `hi-IN` |
| `ta` | Tamil | தமிழ் | `ta-IN` |
| `kn` | Kannada | ಕನ್ನಡ | `kn-IN` |

### Rules — follow every time

1. **No hardcoded English strings in JSX.** Use `const { t } = useTranslation()` and `t('namespace.key')`.
2. **Translation files** live at `public/locales/{locale}/common.json`. Adding a key to `en/common.json` requires adding the equivalent to all 7 other locale files in the same change.
3. **New namespaces** (e.g. `tenant.json`, `owner.json`) must be created for all 8 locales at once and registered in `src/lib/i18n.ts`.
4. **Language switcher**: `src/components/ui/language-switcher.tsx`. Do not add locale codes anywhere else — update only `src/lib/i18n.ts` and the switcher if a new language is added.
5. **Date/number formatting**: always use `src/lib/locale-format.ts` helpers (`formatDate`, `formatCurrency`, etc.). Never call `toLocaleDateString()` without a locale.
6. **Toast / error messages**: Use `t()` for all user-visible toast text, error messages, and validation strings.
7. **Backend sync**: `preferredLocale` is returned from `/api/auth/me` and stored in `users.preferred_locale`. The auth context applies it on login via `i18n.changeLanguage()`. Language switcher persists via `PUT /api/users/me/locale`.
8. **i18n fallback**: Missing keys fall back to `en` automatically — but this is not an excuse to skip translations. Always provide all 8.

## Auth & test users

Test users are seeded from `OndoREBackend` via `npm run seed`:
- Manager: `admin@ondorealestate.com` / `ondo1234`
- Owner: `owner@ondorealestate.com` / `ondo1234`
- Tenant: `tenant@ondorealestate.com` / `ondo1234`

## Learned User Preferences

<!-- Maintained automatically by the continual-learning skill. Do not edit manually. -->

## Learned Workspace Facts

<!-- Maintained automatically by the continual-learning skill. Do not edit manually. -->
