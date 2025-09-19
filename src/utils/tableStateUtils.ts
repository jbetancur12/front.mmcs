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
