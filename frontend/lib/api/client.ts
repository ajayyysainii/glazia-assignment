import { getAccessToken } from "@/lib/auth/storage";

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  code?: string;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

type SuccessResponse<T> = {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
};

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  errors?: Record<string, string[] | undefined>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.errors = body.errors;
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = (await res.json().catch(() => null)) as
    | SuccessResponse<T>
    | ApiErrorBody
    | null;

  if (!res.ok || !json || json.success === false) {
    throw new ApiError(
      (json as ApiErrorBody) ?? {
        success: false,
        statusCode: res.status,
        message: "Request failed",
      },
    );
  }

  return json.data;
}
