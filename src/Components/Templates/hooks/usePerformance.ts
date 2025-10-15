// Custom hooks for performance optimization
import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

// Hook for expensive computations with dependency tracking
export const useExpensiveComputation = <T>(
  computeFn: () => T,
  deps: React.DependencyList,
  shouldSkip?: () => boolean
): T => {
  const lastResult = useRef<T>()
  const lastDeps = useRef<React.DependencyList>()

  return useMemo(() => {
    // Skip computation if condition is met
    if (shouldSkip && shouldSkip()) {
      return lastResult.current as T
    }

    // Check if dependencies have actually changed
    if (lastDeps.current && depsEqual(lastDeps.current, deps)) {
      return lastResult.current as T
    }

    // Perform computation
    const result = computeFn()
    lastResult.current = result
    lastDeps.current = deps
    return result
  }, deps)
}

// Hook for stable callback references with performance tracking
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callCount = useRef(0)
  const lastCallTime = useRef(0)

  return useCallback((...args: Parameters<T>) => {
    const now = performance.now()
    callCount.current++

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      const timeSinceLastCall = now - lastCallTime.current
      if (timeSinceLastCall < 100 && callCount.current > 1) {
        console.warn(
          `Callback called ${callCount.current} times in ${timeSinceLastCall}ms`
        )
      }
    }

    lastCallTime.current = now
    return callback(...args)
  }, deps) as T
}

// Hook for virtualization support
export const useVirtualization = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const bufferSize = Math.min(5, Math.floor(visibleCount * 0.5))

    return {
      visibleCount,
      bufferSize,
      totalHeight: itemCount * itemHeight
    }
  }, [itemCount, itemHeight, containerHeight])
}

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const observe = useCallback(
    (callback: (entry: IntersectionObserverEntry) => void) => {
      if (!elementRef.current) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(callback)
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options
        }
      )

      observerRef.current.observe(elementRef.current)

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    },
    [options]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return { elementRef, observe }
}

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0)
  const mountTime = useRef(performance.now())
  const lastRenderTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current++
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    lastRenderTime.current = now

    if (process.env.NODE_ENV === 'development') {
      // Log slow renders
      if (renderTime > 16) {
        console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`)
      }

      // Log excessive re-renders
      if (renderCount.current > 10) {
        const totalTime = now - mountTime.current
        console.warn(
          `${componentName} rendered ${renderCount.current} times in ${totalTime.toFixed(2)}ms`
        )
      }
    }
  })

  return {
    renderCount: renderCount.current,
    totalTime: performance.now() - mountTime.current
  }
}

// Hook for batch updates
export const useBatchedUpdates = <T>(
  initialValue: T,
  batchDelay: number = 100
) => {
  const [value, setValue] = useState(initialValue)
  const pendingUpdates = useRef<T[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const batchedSetValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(value)
          : newValue

      pendingUpdates.current.push(resolvedValue)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const latestValue =
          pendingUpdates.current[pendingUpdates.current.length - 1]
        setValue(latestValue)
        pendingUpdates.current = []
      }, batchDelay)
    },
    [value, batchDelay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, batchedSetValue] as const
}

// Utility function to compare dependency arrays
function depsEqual(
  deps1: React.DependencyList,
  deps2: React.DependencyList
): boolean {
  if (deps1.length !== deps2.length) return false
  return deps1.every((dep, index) => Object.is(dep, deps2[index]))
}

export default useExpensiveComputation
