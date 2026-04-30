import { useState, useEffect } from 'react'

const STORAGE_KEY = 'crypto_watchlist'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist)) }
    catch {}
  }, [watchlist])

  function addToWatchlist(symbol) {
    setWatchlist(prev => prev.includes(symbol) ? prev : [...prev, symbol])
  }

  function removeFromWatchlist(symbol) {
    setWatchlist(prev => prev.filter(s => s !== symbol))
  }

  function toggleWatchlist(symbol) {
    setWatchlist(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  function isWatched(symbol) {
    return watchlist.includes(symbol)
  }

  return { watchlist, addToWatchlist, removeFromWatchlist, toggleWatchlist, isWatched }
}