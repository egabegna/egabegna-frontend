import { useState, useEffect, useCallback } from 'react'
import signalementService from '../services/signalementService'

export function useSignalementsCount() {
  const [nonLus, setNonLus] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await signalementService.count()
      setNonLus(res.data.non_lus)
    } catch { }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000) // toutes les 30s
    return () => clearInterval(interval)
  }, [refresh])

  return { nonLus, refresh }
}