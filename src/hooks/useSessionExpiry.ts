/**
 * useSessionExpiry
 *
 * Listens for the `auth:session-expired` custom event dispatched by the HTTP
 * layer when a token refresh fails mid-session, and redirects the user to the
 * login page with a descriptive query parameter.
 *
 * Usage: call this hook once at the root of the app (e.g. inside App.tsx or
 * the root layout) so that any authenticated page triggers the redirect.
 *
 * Note: AuthProvider also listens for this event — this hook is a thin
 * complement that handles the navigation side-effect independently.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useSessionExpiry(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      navigate("/login?reason=session_expired", { replace: true });
    };

    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [navigate]);
}
