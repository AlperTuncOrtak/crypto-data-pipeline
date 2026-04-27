// ============================================================
// main.jsx
// ============================================================
// Uygulamanin giris noktasi. React Query provider'i burada
// sarmaliyoruz ki tum component'ler useQuery/useMutation
// hook'larini kullanabilsin.
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import App from './App.jsx'


// -----------------------
// QUERY CLIENT
// -----------------------
// Butun uygulama icin tek bir QueryClient instance.
// Varsayilan ayarlar:
//  - staleTime: 30 saniye  -> 30 saniye icinde tekrar fetch etmez
//  - refetchOnWindowFocus: false -> sekme degistirince fetch etmesin
// Bunlar her query'de override edilebilir.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,          // 30 saniye
      refetchOnWindowFocus: false,    // sekme degisince fetch etme
      retry: 1,                       // hata olursa 1 kere tekrar dene
    },
  },
})


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)