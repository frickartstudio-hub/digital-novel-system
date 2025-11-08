const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface ApiError extends Error {
  status?: number;
  body?: string;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error;
}

export function buildApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Failed to parse API response");
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = buildApiUrl(path);
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    const error: ApiError = new Error(
      `API request failed (${response.status}): ${body || response.statusText}`,
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return parseJson<T>(response);
}

export function getApiAssetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}
