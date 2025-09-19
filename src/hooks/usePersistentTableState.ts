import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_VisibilityState,
  MRT_DensityState
} from 'material-react-table'

// Complete table state interface
export interface TableState {
  columnFilters: MRT_ColumnFiltersState
  sorting: MRT_SortingState
  pagination: MRT_PaginationState
  columnVisibility?: MRT_VisibilityState
  density?: MRT_DensityState
}

// Configuration options for the hook
export interface UsePersistentTableStateOptions {
  tableId: string
  persistedProperties?: Array<keyof TableState>
  useBackendApi?: boolean
  debounceMs?: number
  defaultState?: Partial<TableState>
}

// Default table state
const DEFAULT_TABLE_STATE: TableState = {
  columnFilters: [],
  sorting: [],
  pagination: {
    pageIndex: 0,
    pageSize: 10
  },
  columnVisibility: {},
  density: 'comfortable'
}

// Debounce utility function
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay]
  )
}

// Validate table state structure
const validateState = (state: any): state is Partial<TableState> => {
  if (!state || typeof state !== 'object') return false

  const validKeys: Array<keyof TableState> = [
    'columnFilters',
    'sorting',
    'pagination',
    'columnVisibility',
    'density'
  ]
  const stateKeys = Object.keys(state)

  return stateKeys.every((key) => validKeys.includes(key as keyof TableState))
}

// Load state from localStorage
const loadStateFromStorage = (
  tableId: string,
  defaultState: TableState
): TableState => {
  try {
    const savedState = localStorage.getItem(`table-state-${tableId}`)
    if (!savedState) return defaultState

    const parsedState = JSON.parse(savedState)
    if (!validateState(parsedState)) {
      console.warn(`Invalid table state for ${tableId}, using default`)
      return defaultState
    }

    return { ...defaultState, ...parsedState }
  } catch (error) {
    console.error(`Error loading table state for ${tableId}:`, error)
    return defaultState
  }
}

// Save state to localStorage
const saveStateToStorage = (
  tableId: string,
  state: Partial<TableState>,
  persistedProperties: Array<keyof TableState>
) => {
  try {
    const stateToSave: Partial<TableState> = {}
    persistedProperties.forEach((prop) => {
      if (state[prop] !== undefined) {
        stateToSave[prop] = state[prop]
      }
    })

    localStorage.setItem(`table-state-${tableId}`, JSON.stringify(stateToSave))
  } catch (error) {
    console.error(`Error saving table state for ${tableId}:`, error)
  }
}

/**
 * Generic hook for persistent table state across all MaterialReactTable components
 *
 * @param options Configuration options for the hook
 * @returns Table state and handlers for MaterialReactTable
 */
export const usePersistentTableState = (
  options: UsePersistentTableStateOptions
) => {
  const {
    tableId,
    persistedProperties = ['columnFilters', 'sorting', 'pagination'],
    useBackendApi = false,
    debounceMs = 300,
    defaultState = {}
  } = options

  // Merge default state with provided default state
  const mergedDefaultState: TableState = {
    ...DEFAULT_TABLE_STATE,
    ...defaultState
  }

  // Initialize state
  const [tableState, setTableState] = useState<TableState>(() =>
    loadStateFromStorage(tableId, mergedDefaultState)
  )

  // Debounced save function
  const debouncedSave = useDebounce((state: TableState) => {
    saveStateToStorage(tableId, state, persistedProperties)

    // TODO: Add backend API call here if useBackendApi is true
    if (useBackendApi) {
      // Future implementation for backend persistence
      console.log(`Would save to backend API for table ${tableId}:`, state)
    }
  }, debounceMs)

  // Generic state update function
  const updateTableState = useCallback(
    (updates: Partial<TableState>) => {
      setTableState((prevState) => {
        const newState = { ...prevState, ...updates }
        debouncedSave(newState)
        return newState
      })
    },
    [debouncedSave]
  )

  // Individual state handlers
  const handleColumnFiltersChange = useCallback(
    (updater: any) => {
      const newFilters =
        typeof updater === 'function'
          ? updater(tableState.columnFilters)
          : updater
      updateTableState({ columnFilters: newFilters })
    },
    [tableState.columnFilters, updateTableState]
  )

  const handleSortingChange = useCallback(
    (updater: any) => {
      const newSorting =
        typeof updater === 'function' ? updater(tableState.sorting) : updater
      updateTableState({ sorting: newSorting })
    },
    [tableState.sorting, updateTableState]
  )

  const handlePaginationChange = useCallback(
    (updater: any) => {
      const newPagination =
        typeof updater === 'function' ? updater(tableState.pagination) : updater
      updateTableState({ pagination: newPagination })
    },
    [tableState.pagination, updateTableState]
  )

  const handleColumnVisibilityChange = useCallback(
    (updater: any) => {
      const newVisibility =
        typeof updater === 'function'
          ? updater(tableState.columnVisibility || {})
          : updater
      updateTableState({ columnVisibility: newVisibility })
    },
    [tableState.columnVisibility, updateTableState]
  )

  const handleDensityChange = useCallback(
    (updater: any) => {
      const newDensity =
        typeof updater === 'function'
          ? updater(tableState.density || 'comfortable')
          : updater
      updateTableState({ density: newDensity })
    },
    [tableState.density, updateTableState]
  )

  // Clear state function
  const clearState = useCallback(() => {
    localStorage.removeItem(`table-state-${tableId}`)
    setTableState(mergedDefaultState)
  }, [tableId, mergedDefaultState])

  // Clear only filters function (keep pagination/other settings)
  const clearFilters = useCallback(() => {
    const clearedState = {
      ...tableState,
      columnFilters: [],
      sorting: [],
      pagination: {
        pageIndex: 0,
        pageSize: tableState.pagination.pageSize // Keep current page size
      }
    }
    setTableState(clearedState)
    debouncedSave(clearedState)
  }, [tableState, debouncedSave])

  // Load state function (for manual refresh)
  const loadState = useCallback(() => {
    const loadedState = loadStateFromStorage(tableId, mergedDefaultState)
    setTableState(loadedState)
  }, [tableId, mergedDefaultState])

  return {
    // Current state
    tableState,

    // Individual state properties for easy access
    columnFilters: tableState.columnFilters,
    sorting: tableState.sorting,
    pagination: tableState.pagination,
    columnVisibility: tableState.columnVisibility,
    density: tableState.density,

    // Event handlers for MaterialReactTable
    onColumnFiltersChange: handleColumnFiltersChange,
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onDensityChange: handleDensityChange,

    // Utility functions
    updateTableState,
    clearState,
    clearFilters,
    loadState
  }
}
