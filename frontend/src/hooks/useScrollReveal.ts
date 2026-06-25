import { useEffect, useRef } from 'react'

/**
 * useScrollReveal
 *
 * Attach the returned ref to a wrapper element. Any child
 * elements with the class "reveal", "reveal-left",
 * "reveal-right", or "reveal-scale" will smoothly animate
 * in as they enter the viewport — Raycast / Resend style.
 *
 * Usage:
 *   const ref = useScrollReveal()
 *   <div ref={ref}>
 *     <div className="reveal">...</div>
 *     <div className="reveal" style={{ '--reveal-delay': '100ms' }}>...</div>
 *   </div>
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const targets = container.querySelectorAll<HTMLElement>(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    )

    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            // Once revealed, stop observing to save resources
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,   // trigger when 10% of element is visible
        rootMargin: '0px 0px -40px 0px', // slight bottom offset — feels more natural
        ...options,
      }
    )

    targets.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return ref
}
