import { useEffect } from 'react'
import { BFCACHE_RESTORE_EVENT } from '@/lib/bfcache'

/**
 * Run a callback when the page is restored from back-forward cache (bfcache).
 * Use this to re-initialize timers, refetch data, or refresh UI that may be stale.
 * Prefer this over beforeunload/unload so the page stays bfcache-eligible.
 */
export function useBFCacheRestore(callback: () => void) {
  useEffect(() => {
    const handler = () => callback()
    window.addEventListener(BFCACHE_RESTORE_EVENT, handler)
    return () => window.removeEventListener(BFCACHE_RESTORE_EVENT, handler)
  }, [callback])
}
