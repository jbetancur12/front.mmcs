/**
 * TypeScript interfaces and types for table state management
 * across the MetroMedics application
 */

import {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
  MRT_DensityState,
  MRT_VisibilityState
} from 'material-react-table'

/**
 * Complete table state interface supporting all MRT state properties
 */
export interface TableState {
  columnFilters: MRT_ColumnFiltersState
  sorting: MRT_SortingState
  pagination: MRT_PaginationState
  columnVisibility: MRT_VisibilityState
  density: MRT_DensityState
}

/**
 * Partial table state for updates
 */
export type TableStateUpdate = Partial<TableState>

/**
 * Available table state properties that can be persisted
 */
export type PersistableTableProperty = keyof TableState

/**
 * Configuration options for the persistent table state hook
 */
export interface UsePersistentTableStateOptions {
  /** Unique identifier for the table (used for localStorage key) */
  tableId: string
  /** Array of state properties to persist. Defaults to all properties */
  persistedProperties?: PersistableTableProperty[]
  /** Whether to use backend API for state persistence (not implemented yet) */
  useBackendApi?: boolean
  /** Debounce delay in milliseconds for saving state. Defaults to 300ms */
  debounceMs?: number
  /** Custom default state. If not provided, uses built-in defaults */
  defaultState?: Partial<TableState>
}

/**
 * Return type for the persistent table state hook
 */
export interface UsePersistentTableStateReturn {
  /** Current table state */
  tableState: TableState
  /** Function to update table state */
  updateTableState: (updates: TableStateUpdate) => void
  /** Function to clear persisted state and reset to defaults */
  clearState: () => void
  /** Function to manually save current state */
  saveState: () => void
  /** Function to manually load state from storage */
  loadState: () => void
}

/**
 * Event handlers for MaterialReactTable state changes
 */
export interface TableStateHandlers {
  onColumnFiltersChange: (updater: any) => void
  onSortingChange: (updater: any) => void
  onPaginationChange: (updater: any) => void
  onColumnVisibilityChange: (updater: any) => void
  onDensityChange: (updater: any) => void
}

/**
 * Module-specific table configuration
 */
export interface ModuleTableConfig {
  persistedProperties: PersistableTableProperty[]
  defaultState: Partial<TableState>
}

/**
 * Available modules in the MetroMedics application
 */
export type ApplicationModule =
  | 'PURCHASES'
  | 'FLEET'
  | 'LMS'
  | 'IOT'
  | 'LABORATORY'
  | 'QUOTATIONS'
  | 'BASIC'

/**
 * Table state preset configurations
 */
export type TableStatePreset = 'BASIC' | 'FULL' | 'MINIMAL' | 'ANALYTICS'

/**
 * Storage backend types
 */
export type StorageBackend = 'localStorage' | 'api' | 'both'

/**
 * Table state validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Options for state import/export functionality
 */
export interface StateExportOptions {
  includeTimestamp?: boolean
  includeMetadata?: boolean
  format?: 'json' | 'compressed'
}

/**
 * Metadata for exported table state
 */
export interface StateMetadata {
  tableId: string
  exportedAt: string
  version: string
  module?: ApplicationModule
}

/**
 * Complete exported state structure
 */
export interface ExportedTableState {
  state: TableState
  metadata: StateMetadata
  checksum?: string
}

/**
 * Migration function type for state format changes
 */
export type StateMigrationFunction = (
  oldState: any,
  version: string
) => TableState

/**
 * State migration configuration
 */
export interface StateMigrationConfig {
  fromVersion: string
  toVersion: string
  migrate: StateMigrationFunction
}

/**
 * Advanced configuration for enterprise features
 */
export interface AdvancedTableStateOptions
  extends UsePersistentTableStateOptions {
  /** Enable state migrations for version compatibility */
  enableMigrations?: boolean
  /** Migration configurations */
  migrations?: StateMigrationConfig[]
  /** Enable state compression for large datasets */
  enableCompression?: boolean
  /** Maximum age of state in days before auto-cleanup */
  maxAge?: number
  /** Enable encrypted storage for sensitive data */
  enableEncryption?: boolean
  /** Custom storage key prefix */
  storagePrefix?: string
}

/**
 * Performance monitoring metrics
 */
export interface TableStateMetrics {
  /** Time taken to load state (ms) */
  loadTime: number
  /** Time taken to save state (ms) */
  saveTime: number
  /** Size of serialized state (bytes) */
  stateSize: number
  /** Number of state updates */
  updateCount: number
  /** Last update timestamp */
  lastUpdated: Date
}

/**
 * Event types for state management
 */
export type TableStateEvent =
  | 'state-loaded'
  | 'state-saved'
  | 'state-updated'
  | 'state-cleared'
  | 'state-error'
  | 'state-migrated'

/**
 * Event payload for state management events
 */
export interface TableStateEventPayload {
  tableId: string
  event: TableStateEvent
  timestamp: Date
  data?: any
  error?: Error
}
