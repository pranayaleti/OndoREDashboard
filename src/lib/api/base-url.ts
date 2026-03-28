/**
 * Resolved API base URL (Dashboard → OndoREBackend or Supabase Edge `.../functions/v1/api`).
 *
 * When `VITE_API_BASE_URL` is unset, defaults to port **3030** to match
 * `PORT` in `OndoREBackend/src/config/env.ts` and `.env.example` (run backend
 * alongside Dashboard on 3001 without clashing with Next/other tools on 3000).
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) {
    const trimmed = fromEnv.trim().replace(/\/$/, "");
    // Common misconfig: `http://localhost:3030` without `/api` → every route 404s.
    try {
      const u = new URL(trimmed);
      const path = u.pathname.replace(/\/$/, "") || "";
      if (path === "" && !trimmed.includes("/functions/v1")) {
        return `${u.origin}/api`;
      }
    } catch {
      /* fall through */
    }
    return trimmed;
  }
  return "http://localhost:3030/api";
}
