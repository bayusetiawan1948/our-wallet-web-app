import { apiClient, setAccessToken } from "@/lib/api-client";
import type { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  base_currency: string;
  household_id: string | null;
  role: UserRole | null;
}

interface AuthResponseData {
  access_token: string;
  access_token_expires_in: string;
  user: AuthUser;
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await apiClient.post<{ data: AuthResponseData }>("/auth/register", data);
  setAccessToken(res.data.data.access_token);
  return res.data.data.user;
}

export async function login(data: { email: string; password: string }): Promise<AuthUser> {
  const res = await apiClient.post<{ data: AuthResponseData }>("/auth/login", data);
  setAccessToken(res.data.data.access_token);
  return res.data.data.user;
}

export async function refresh(): Promise<AuthUser | null> {
  try {
    const res = await apiClient.post<{ data: AuthResponseData }>("/auth/refresh");
    setAccessToken(res.data.data.access_token);
    return res.data.data.user;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function me(): Promise<AuthUser> {
  const res = await apiClient.get<{ data: AuthUser }>("/auth/me");
  return res.data.data;
}
