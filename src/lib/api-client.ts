import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Access token sengaja disimpan in-memory (module-level variable), bukan
 * localStorage/sessionStorage — supaya tidak bisa dicuri lewat XSS yang baca
 * storage. Refresh token hidup di httpOnly cookie yang di-set backend, tidak
 * pernah tersentuh oleh JS di sini.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

/**
 * Silent refresh: request lain yang datang saat refresh sedang berjalan
 * numpang di promise yang sama supaya tidak memicu banyak call /auth/refresh
 * bersamaan.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/auth/refresh")
      .then((res) => {
        const token = res.data?.data?.access_token as string | undefined;
        setAccessToken(token ?? null);
        return token ?? null;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as RetriableConfig | undefined;

    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalConfig?.url?.includes("/auth/refresh");

    if (!isUnauthorized || !originalConfig || originalConfig._retried || isRefreshCall) {
      return Promise.reject(error);
    }

    originalConfig._retried = true;
    const newToken = await refreshAccessToken();

    if (!newToken) {
      return Promise.reject(error);
    }

    originalConfig.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient.request(originalConfig);
  }
);

export { refreshAccessToken };
