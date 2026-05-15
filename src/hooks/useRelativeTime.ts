import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UseRelativeTimeOptions {
  updateInterval?: number // in milliseconds
  showSeconds?: boolean
  addSuffix?: boolean
}

export const useRelativeTime = (
  dateString: string | null | undefined,
  options: UseRelativeTimeOptions = {}
) => {
  const {
    updateInterval = 60000, // Update every minute by default
    showSeconds = false,
    addSuffix = true
  } = options

  const [, forceUpdate] = useState({})

  // Parse the date once and memoize it
  const date = useMemo(() => {
    if (!dateString) return null
    try {
      return parseISO(dateString)
    } catch {
      return null
    }
  }, [dateString])

  // Force re-renders to keep the relative time updated
  useEffect(() => {
    if (!date) return

    const interval = setInterval(() => {
      forceUpdate({})
    }, updateInterval)

    return () => clearInterval(interval)
  }, [date, updateInterval])

  const relativeTime = useMemo(() => {
    if (!date) return null

    try {
      return formatDistanceToNow(date, {
        addSuffix,
        locale: es,
        includeSeconds: showSeconds
      })
    } catch {
      return null
    }
  }, [date, addSuffix, showSeconds, forceUpdate])

  const absoluteTime = useMemo(() => {
    if (!date) return null

    try {
      return format(date, 'PPpp', { locale: es })
    } catch {
      return null
    }
  }, [date])

  const shortAbsoluteTime = useMemo(() => {
    if (!date) return null

    try {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return null
    }
  }, [date])

  return {
    relativeTime,
    absoluteTime,
    shortAbsoluteTime,
    date,
    isValid: date !== null
  }
}

export default useRelativeTime