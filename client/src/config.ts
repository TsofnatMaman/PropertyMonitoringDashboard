const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_BASE_URL = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;