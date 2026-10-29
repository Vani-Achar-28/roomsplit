import axios from "axios";

const base = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:4000/api`;

export const api = axios.create({ baseURL: base });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = String(err?.config?.url ?? "").startsWith("/auth/");
    if (axios.isAxiosError(err) && err.response?.status === 401 && !isAuthCall) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);