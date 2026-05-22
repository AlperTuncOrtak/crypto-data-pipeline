// ============================================================
// api/client.js
// ============================================================
import axios from "axios";
import { supabase } from "../lib/supabase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Auth interceptor ──────────────────────────────────────────
// Her istekten önce Supabase session'dan token alıp
// Authorization header'a ekler. Token yoksa header eklenmez
// (public endpoint'ler etkilenmez).
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return config;
});
