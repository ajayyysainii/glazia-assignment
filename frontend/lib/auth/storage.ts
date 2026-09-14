import type { AuthSession, AuthTokens, AuthUser } from "./types";

const ACCESS_KEY = "glazia_access_token";
const REFRESH_KEY = "glazia_refresh_token";
const USER_KEY = "glazia_user";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function saveTokens(tokens: AuthTokens) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
