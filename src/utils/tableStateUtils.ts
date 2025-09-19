import { TableState } from '../hooks/usePersistentTableState'

// Table configuration by module
export interface ModuleTableConfig {
  defaultPageSize: number
  persistedProperties: Array<keyof TableState>
  enableDensity: boolean
  enableColumnVisibility: boolean
}

// Default configurations for different modules
const MODULE_TABLE_CONFIGS: Record<string, ModuleTableConfig> = {
  purchases: {
    defaultPageSize: 10,
    persistedProperties: ['columnFilters', 'sorting', 'pagination'],
    enableDensity: true,
    enableColumnVisibility: false
  },
  fleet: {
    defaultPageSize: 15,
    persistedProperties: [
      'columnFilters',
      'sorting',
      'pagination',
      'columnVisibility'
    ],
    enableDensity: true,
    enableColumnVisibility: true
  },
  lms: {
    defaultPageSize: 20,
    persistedProperties: ['columnFilters', 'sorting', 'pagination'],
    enableDensity: false,
    enableColumnVisibility: false
  },
  laboratory: {
    defaultPageSize: 10,
    persistedProperties: ['columnFilters', 'sorting', 'pagination', 'density'],
    enableDensity: true,
    enableColumnVisibility: false
  },
  iot: {
    defaultPageSize: 25,
    persistedProperties: [
      'columnFilters',
      'sorting',
      'pagination',
      'columnVisibility',
      'density'
    ],
    enableDensity: true,
    enableColumnVisibility: true
  },
  quotations: {
    defaultPageSize: 10,
    persistedProperties: ['columnFilters', 'sorting', 'pagination'],
    enableDensity: true,
    enableColumnVisibility: false
  }
}

/**
 * Get table configuration for a specific module
 */
export const getModuleTableConfig = (module: string): ModuleTableConfig => {
  return MODULE_TABLE_CONFIGS[module] || MODULE_TABLE_CONFIGS.purchases
}

/**
 * Create table state handlers for easier MaterialReactTable integration
 */
export const createTableStateHandlers = (persistentTableState: any) => {
  return {
    state: {
      columnFilters: persistentTableState.columnFilters,
      sorting: persistentTableState.sorting,
      pagination: persistentTableState.pagination,
      ...(persistentTableState.columnVisibility && {
        columnVisibility: persistentTableState.columnVisibility
      }),
      ...(persistentTableState.density && {
        density: persistentTableState.density
      })
    },
    onColumnFiltersChange: persistentTableState.onColumnFiltersChange,
    onSortingChange: persistentTableState.onSortingChange,
    onPaginationChange: persistentTableState.onPaginationChange,
    ...(persistentTableState.onColumnVisibilityChange && {
      onColumnVisibilityChange: persistentTableState.onColumnVisibilityChange
    }),
    ...(persistentTableState.onDensityChange && {
      onDensityChange: persistentTableState.onDensityChange
    })
  }
}

/**
 * Generate a unique table ID for a specific module and table
 */
export const generateTableId = (module: string, tableName: string): string => {
  return `${module}-${tableName}`
}

/**
 * Clear all table states for a specific module (useful for logout or module reset)
 */
export const clearModuleTableStates = (module: string): void => {
  const keys = Object.keys(localStorage)
  const moduleKeys = keys.filter((key) =>
    key.startsWith(`table-state-${module}-`)
  )

  moduleKeys.forEach((key) => {
    localStorage.removeItem(key)
  })
}

/**
 * Get all saved table states for debugging purposes
 */
export const getAllTableStates = (): Record<string, any> => {
  const tableStates: Record<string, any> = {}
  const keys = Object.keys(localStorage)

  keys.forEach((key) => {
    if (key.startsWith('table-state-')) {
      try {
        const state = localStorage.getItem(key)
        if (state) {
          tableStates[key] = JSON.parse(state)
        }
      } catch (error) {
        console.warn(`Invalid table state for key ${key}:`, error)
      }
    }
  })

  return tableStates
}

/**
 * Check if table has any active filters
 */
export const hasActiveFilters = (tableState: any): boolean => {
  const {
    columnFilters = [],
    sorting = [],
    pagination = { pageIndex: 0, pageSize: 10 }
  } = tableState

  // Check if there are column filters
  const hasColumnFilters = Array.isArray(columnFilters) && columnFilters.length > 0

  // Check if there's active sorting
  const hasSorting = Array.isArray(sorting) && sorting.length > 0

  // Check if not on first page (pagination filter)
  const hasCustomPagination = pagination.pageIndex > 0

  return hasColumnFilters || hasSorting || hasCustomPagination
}

/**
 * Get count of active filters for display
 */
export const getActiveFiltersCount = (tableState: any): number => {
  const {
    columnFilters = [],
    sorting = [],
    pagination = { pageIndex: 0 }
  } = tableState

  let count = 0

  // Count column filters
  if (Array.isArray(columnFilters)) {
    count += columnFilters.length
  }

  // Count sorting (max 1)
  if (Array.isArray(sorting) && sorting.length > 0) {
    count += 1
  }

  // Count pagination if not on first page
  if (pagination.pageIndex > 0) {
    count += 1
  }

  return count
}

/**
 * Get filter summary for display
 */
export const getFilterSummary = (tableState: any): string[] => {
  const {
    columnFilters = [],
    sorting = [],
    pagination = { pageIndex: 0 }
  } = tableState

  const summary: string[] = []

  // Add column filters to summary
  if (Array.isArray(columnFilters) && columnFilters.length > 0) {
    columnFilters.forEach((filter: any) => {
      if (filter.id && filter.value) {
        const value = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value
        summary.push(`${filter.id}: ${value}`)
      }
    })
  }

  // Add sorting to summary
  if (Array.isArray(sorting) && sorting.length > 0) {
    sorting.forEach((sort: any) => {
      if (sort.id) {
        const direction = sort.desc ? 'desc' : 'asc'
        summary.push(`Ordenado por: ${sort.id} (${direction})`)
      }
    })
  }

  // Add pagination to summary
  if (pagination.pageIndex > 0) {
    summary.push(`Página: ${pagination.pageIndex + 1}`)
  }

  return summary
}

/**
 * Reset table state to default values
 */
export const getDefaultTableState = (config: ModuleTableConfig): Partial<TableState> => {
  return {
    columnFilters: [],
    sorting: [],
    pagination: {
      pageIndex: 0,
      pageSize: config.defaultPageSize
    },
    columnVisibility: {},
    density: 'comfortable'
  }
}
