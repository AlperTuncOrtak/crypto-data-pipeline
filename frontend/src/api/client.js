// ============================================================
// api/client.js
// ============================================================
// Axios instance. Tum backend istekleri bu instance uzerinden
// yapilacak. Base URL tek bir yerden yonetiliyor - ileride
// production'a tasirken sadece burayi degistirmemiz gerekecek.
// ============================================================

import axios from 'axios'


// -----------------------
// BASE URL
// -----------------------
// Development'ta localhost:8000 (FastAPI uvicorn). Production'a
// gecince environment variable'dan okuyacagiz (ileride .env.production
// dosyasi eklenecek).
const BASE_URL = 'http://localhost:8000'


// -----------------------
// AXIOS INSTANCE
// -----------------------
// Tum backend istekleri icin ortak header ve timeout ayarlari.
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,              // 10 saniye - uzun surerse iptal
  headers: {
    'Content-Type': 'application/json',
  },
})