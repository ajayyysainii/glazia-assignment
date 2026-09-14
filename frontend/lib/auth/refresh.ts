import {
  clearSession,
  getRefreshToken,
  saveSession,
} from "@/lib/auth/storage";
import type { AuthSession } from "@/lib/auth/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh access token using the stored refresh token.
 * Concurrent callers share one in-flight request.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: AuthSession;
      } | null;

      if (!res.ok || !json?.success || !json.data) {
        clearSession();
        return false;
      }

      saveSession(json.data);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
