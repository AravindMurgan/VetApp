const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return false;
  }

  const body = (await response.json()) as { accessToken: string };
  setAccessToken(body.accessToken);
  return true;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const isAuthEndpoint = path.startsWith("/auth/");
  if (response.status === 401 && !isAuthEndpoint && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, options, true);
    }
    setAccessToken(null);
    onUnauthenticated?.();
  }

  return response;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(
      response.status,
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "Something went wrong",
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
