/**
 * Back-forward cache (bfcache) support.
 * Uses pagehide/pageshow with event.persisted so pages stay bfcache-eligible.
 * Avoids beforeunload/unload for non-essential logic.
 */

const BFCACHE_RESTORE_EVENT = 'bfcache:restore'

export function isBFCacheRestoreEvent(e: Event): e is PageTransitionEvent & { persisted: true } {
  return e.type === 'pageshow' && 'persisted' in e && (e as PageTransitionEvent).persisted === true
}

/**
 * Dispatches a custom event when the page is restored from bfcache.
 * Components can listen via useBFCacheRestore or document.addEventListener.
 */
function handlePageShow(e: PageTransitionEvent) {
  if (e.persisted) {
    if (import.meta.env.DEV) {
      console.debug('[bfcache] Page restored from back-forward cache')
    }
    window.dispatchEvent(new CustomEvent(BFCACHE_RESTORE_EVENT))
  }
}

let initialized = false

/**
 * Call once at app boot (e.g. in main.tsx).
 * Registers pageshow listener for bfcache restore; does not use beforeunload/unload.
 */
export function initBFCache() {
  if (typeof window === 'undefined' || initialized) return
  initialized = true
  window.addEventListener('pageshow', handlePageShow)
}

export { BFCACHE_RESTORE_EVENT }
