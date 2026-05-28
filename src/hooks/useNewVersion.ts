import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL = 60_000

export const useNewVersion = () => {
  const [hasNewVersion, setHasNewVersion] = useState(false)
  const currentVersion = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchVersion = async () => {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`)
      const data = await res.json() as { timestamp: number }
      if (currentVersion.current === null) {
        currentVersion.current = data.timestamp
      } else if (data.timestamp !== currentVersion.current) {
        setHasNewVersion(true)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void fetchVersion()
    intervalRef.current = setInterval(fetchVersion, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return hasNewVersion
}
