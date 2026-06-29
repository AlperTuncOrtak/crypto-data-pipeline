import { useEffect, useRef } from 'react'

export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
        ...options,
      }
    )

    // Observe initial targets
    let targets = container.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    targets.forEach((el) => observer.observe(el))

    // Use MutationObserver to watch for dynamically added elements (like async API data rows)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            const el = node as HTMLElement;
            if (el.matches && el.matches('.reveal, .reveal-left, .reveal-right, .reveal-scale')) {
              observer.observe(el);
            }
            // Also check children of added nodes
            if (el.querySelectorAll) {
              const childTargets = el.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right, .reveal-scale');
              childTargets.forEach((child) => observer.observe(child));
            }
          }
        })
      })
    })

    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [options]) // Still run on mount, but now watches mutations

  return ref
}
