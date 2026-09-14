import { apiRequest, ApiError } from "@/lib/api/client";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from "./storage";
import type { AuthSession, AuthUser } from "./types";

export class AuthApiError extends ApiError {
  constructor(body: ConstructorParameters<typeof ApiError>[0]) {
    super(body);
    this.name = "AuthApiError";
  }
}

function asAuthError(err: unknown): never {
  if (err instanceof ApiError) {
    throw new AuthApiError({
      success: false,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });
  }
  throw err;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  try {
    const data = await apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(data);
    return data;
  } catch (err) {
    asAuthError(err);
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  try {
    const data = await apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(data);
    return data;
  } catch (err) {
    asAuthError(err);
  }
}

export async function fetchMe(): Promise<AuthUser> {
  try {
    const data = await apiRequest<{ user: AuthUser }>("/auth/me", {
      method: "GET",
      auth: true,
    });
    return data.user;
  } catch (err) {
    asAuthError(err);
  }
}

export async function refreshSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await apiRequest<AuthSession>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    saveSession(data);
    return data;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // ignore
  } finally {
    clearSession();
  }
}

export async function restoreSession(): Promise<AuthUser | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    return await fetchMe();
  } catch {
    const refreshed = await refreshSession();
    return refreshed?.user ?? null;
  }
}
