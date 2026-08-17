import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered')
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setNeedRefresh(false)
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-subtle)]/90 backdrop-blur-xl border border-[var(--accent)]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.15)] max-w-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[var(--text-main)] font-bold text-sm mb-1">New Version Available</h3>
              <p className="text-[var(--text-muted)] text-xs">
                A new version of CryptoNeko is available. Refresh to apply the latest updates and bug fixes.
              </p>
            </div>
            <button
              onClick={close}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-3xl bg-[var(--accent)]/10 border border-[var(--accent)]/50 text-[var(--accent)] font-bold text-sm hover:bg-[var(--accent)] hover:text-[#020817] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RefreshCw size={14} />
            Update & Refresh
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
