import axios from "axios";

export const api = axios.create({
  baseURL: `http://${window.location.hostname}:4000/api`,
});

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