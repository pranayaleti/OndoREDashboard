# OndoREDashboard — Skill

## Description

This skill provides context for working on the **Ondo Real Estate admin dashboard** — a React/Vite SPA that provides role-based portals for Managers, Owners, and Tenants. It talks to the OndoREBackend API. The AI assistant UI lives at `/assistant`; one component and one API call; backend handles role scoping.

## When to use

- Building or changing Manager, Owner, or Tenant portal UI.
- Working on auth (login, invite signup), sidebar, or role-based routing.
- Implementing or updating the assistant chat UI, risk analytics, notifications, or manager-at-risk views.
- Adding or changing API calls (use `src/lib/api.ts` only; no inline fetch).
- Styling with Tailwind (OnDo gradient: `from-orange-500 to-red-800`; colors in `tailwind.config.ts`).

## Instructions

1. **Auth**: Use `useAuth()` from `src/lib/auth-context.tsx`. Do not read auth from localStorage directly. After login, redirect by role: Manager → `/dashboard`, Owner → `/owner`, Tenant → `/tenant`.
2. **API**: Use functions from `src/lib/api.ts`; do not add raw fetch/axios in components. Set `VITE_API_URL` in `.env` to the backend.
3. **UI**: Prefer components in `src/components/ui/` (Radix wrappers). Use Tailwind only; OnDo colors in `tailwind.config.ts`; no hard-coded hex.
4. **Forms**: React Hook Form + Zod via `@hookform/resolvers`.
5. **Assistant**: One UI in `manager-assistant.tsx`; call `dashboardApi.assistantChat(messages)`; no per-role UI branching — backend scopes data.
6. **TypeScript**: Strict; avoid `any`.

## Key paths

- Pages: `src/pages/` (Login, Signup, Manager/Dashboard, Owner, Tenant, SuperAdmin, About).
- Components: `src/components/ui/`, `src/components/admin/` (manager), `src/components/owner/`, `src/components/tenant/`, `src/components/portal-sidebar.tsx`, `src/components/manager/manager-assistant.tsx`, risk-analytics, manager-at-risk, sparkline-chart.
- Lib: `src/lib/auth-context.tsx`, `src/lib/api.ts`, `src/lib/utils.ts`.
- Hooks: `src/hooks/` (e.g. use-notifications, useApi).

## References

- Workspace context: `../soul.md`, `../identity.md`, `../.cursor/rules/shared-context.mdc`.
- Architecture: `../ARCHITECTURE.md`.
- This repo: `AGENTS.md`.
