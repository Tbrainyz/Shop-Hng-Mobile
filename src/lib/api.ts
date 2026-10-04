import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

export const TOKEN_KEY = "auth_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// auth.tsx registers this so an expired/invalid token signs the user out automatically.
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

/** fetch() against the Next.js backend: adds the bearer token, parses JSON, turns errors into ApiError. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "EXPO_PUBLIC_API_URL is not set — copy .env.example to .env and restart Expo.");
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((init.headers as Record<string, string> | undefined) ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

/** Product images are stored as site-relative paths like /assets/headphones/headphone1.svg. */
export const imageUrl = (path: string) => (path.startsWith("http") ? path : `${API_URL}${path}`);
