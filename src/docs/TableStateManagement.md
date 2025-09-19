# Table State Management Guide

This guide explains how to use the generic persistent table state solution across all modules in the MetroMedics frontend application.

## Overview

The table state management system provides:
- **Persistent state**: Automatically saves and restores table state across browser sessions
- **Configurable persistence**: Choose which state properties to persist
- **Module-specific defaults**: Predefined configurations for different modules
- **Type safety**: Full TypeScript support with comprehensive interfaces
- **Performance optimization**: Debounced saves and efficient state management
- **Future-ready**: Backend API integration support

## Quick Start

### Basic Usage

```tsx
import React from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { usePersistentTableState } from '@hooks/usePersistentTableState'
import { createTableStateHandlers } from '@utils/tableStateUtils'

interface MyData {
  id: number
  name: string
  status: string
}

const MyTableComponent: React.FC = () => {
  // Basic configuration
  const { tableState, updateTableState } = usePersistentTableState({
    tableId: 'my-table'
  })

  // Create event handlers
  const tableHandlers = createTableStateHandlers(tableState, updateTableState)

  const columns: MRT_ColumnDef<MyData>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' }
  ]

  const data: MyData[] = [
    { id: 1, name: 'Item 1', status: 'Active' },
    { id: 2, name: 'Item 2', status: 'Inactive' }
  ]

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      state={{
        columnFilters: tableState.columnFilters,
        sorting: tableState.sorting,
        pagination: tableState.pagination,
        columnVisibility: tableState.columnVisibility,
        density: tableState.density
      }}
      {...tableHandlers}
    />
  )
}
```

### Module-Specific Configuration

```tsx
import { getModuleTableConfig } from '@utils/tableStateUtils'

const PurchaseRequestsTable: React.FC = () => {
  // Use predefined module configuration
  const config = getModuleTableConfig('PURCHASES', 'purchase-requests')
  const { tableState, updateTableState } = usePersistentTableState(config)

  // Rest of your component...
}
```

## Available Modules

The system provides predefined configurations for these modules:

- **PURCHASES**: Full state persistence with 10 items per page
- **FLEET**: Full state persistence with 15 items per page, compact density
- **LMS**: Basic state persistence with 20 items per page
- **IOT**: Analytics configuration with 25 items per page, compact density
- **LABORATORY**: Full state persistence with 10 items per page
- **QUOTATIONS**: Full state persistence with 12 items per page

## Configuration Options

### Persistence Properties

You can choose which state properties to persist:

```tsx
const { tableState, updateTableState } = usePersistentTableState({
  tableId: 'my-table',
  persistedProperties: ['columnFilters', 'sorting', 'pagination'] // Only these will be saved
})
```

Available properties:
- `columnFilters`: Filter states for all columns
- `sorting`: Column sorting configuration
- `pagination`: Page size and current page
- `columnVisibility`: Hidden/visible columns
- `density`: Table density (comfortable, compact, spacious)

### Custom Default State

```tsx
const { tableState, updateTableState } = usePersistentTableState({
  tableId: 'my-table',
  defaultState: {
    pagination: { pageIndex: 0, pageSize: 25 },
    density: 'compact'
  }
})
```

### Debounce Configuration

```tsx
const { tableState, updateTableState } = usePersistentTableState({
  tableId: 'my-table',
  debounceMs: 500 // Wait 500ms before saving changes
})
```

## Utility Functions

### Table State Handlers

Instead of manually creating event handlers, use the utility:

```tsx
import { createTableStateHandlers } from '@utils/tableStateUtils'

const tableHandlers = createTableStateHandlers(tableState, updateTableState)

// Use with spread operator
<MaterialReactTable
  {...tableHandlers}
  // other props...
/>
```

### State Presets

Use predefined configurations:

```tsx
import { TABLE_STATE_PRESETS } from '@utils/tableStateUtils'

const { tableState, updateTableState } = usePersistentTableState({
  tableId: 'my-table',
  persistedProperties: TABLE_STATE_PRESETS.BASIC // ['columnFilters', 'sorting', 'pagination']
})
```

Available presets:
- `BASIC`: Filters, sorting, pagination
- `FULL`: All state properties
- `MINIMAL`: Filters and pagination only
- `ANALYTICS`: Sorting, visibility, density

### Unique Table IDs

Generate consistent table IDs:

```tsx
import { generateTableId } from '@utils/tableStateUtils'

const tableId = generateTableId('fleet', 'vehicles') // 'fleet-vehicles-table'
```

## Advanced Features

### Manual State Management

```tsx
const { tableState, updateTableState, clearState, saveState, loadState } = usePersistentTableState({
  tableId: 'my-table'
})

// Clear all saved state
const handleClearFilters = () => {
  clearState()
}

// Force save current state
const handleSaveState = () => {
  saveState()
}

// Reload state from storage
const handleRefreshState = () => {
  loadState()
}
```

### State Reset Utility

Create reset functions for specific properties:

```tsx
import { createStateResetter } from '@utils/tableStateUtils'

const resetFilters = createStateResetter(['columnFilters'], defaultTableState)

// Later in your component
const handleResetFilters = () => {
  resetFilters(updateTableState)
}
```

### State Validation

Validate state updates before applying:

```tsx
import { validateTableStateUpdate } from '@utils/tableStateUtils'

const handleCustomUpdate = (newState) => {
  if (validateTableStateUpdate(newState)) {
    updateTableState(newState)
  } else {
    console.warn('Invalid state update')
  }
}
```

## Migration from Existing Tables

To migrate an existing table component:

1. **Remove old state management**:
   ```tsx
   // Remove these:
   const [columnFilters, setColumnFilters] = useState([])
   const [sorting, setSorting] = useState([])
   const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
   ```

2. **Add the new hook**:
   ```tsx
   const config = getModuleTableConfig('YOUR_MODULE', 'your-table-name')
   const { tableState, updateTableState } = usePersistentTableState(config)
   const tableHandlers = createTableStateHandlers(tableState, updateTableState)
   ```

3. **Update MaterialReactTable**:
   ```tsx
   <MaterialReactTable
     state={{
       columnFilters: tableState.columnFilters,
       sorting: tableState.sorting,
       pagination: tableState.pagination,
       columnVisibility: tableState.columnVisibility,
       density: tableState.density
     }}
     {...tableHandlers}
     // other props...
   />
   ```

## Best Practices

### Table ID Naming

Use descriptive, unique table IDs:
- ✅ `'purchase-requests-main'`
- ✅ `'fleet-vehicles-active'`
- ✅ `'lms-courses-enrolled'`
- ❌ `'table'`
- ❌ `'data'`

### Module Configuration

Always use module-specific configurations when available:
```tsx
// Preferred
const config = getModuleTableConfig('PURCHASES', 'requests')

// Instead of
const config = { tableId: 'some-id', persistedProperties: [...] }
```

### Performance Considerations

- Use appropriate debounce delays (300ms default is usually fine)
- Only persist properties you actually need
- Consider using `MINIMAL` preset for simple tables

### Error Handling

The system includes built-in error handling, but you can add custom handling:

```tsx
const { tableState, updateTableState } = usePersistentTableState({
  tableId: 'my-table',
  // The system will gracefully handle localStorage errors
  // and fall back to default state
})
```

## Troubleshooting

### State Not Persisting

1. Check that `tableId` is unique and descriptive
2. Verify `persistedProperties` includes the properties you want saved
3. Check browser developer tools > Application > Local Storage for your keys

### Invalid State Errors

1. Clear localStorage for your table: `localStorage.removeItem('mrt-state-your-table-id')`
2. Check that custom `defaultState` follows the correct interface
3. Ensure TypeScript interfaces match MaterialReactTable expectations

### Performance Issues

1. Increase `debounceMs` if saves are too frequent
2. Reduce `persistedProperties` to only essential properties
3. Consider using `MINIMAL` preset for large datasets

## TypeScript Support

The system includes comprehensive TypeScript interfaces:

```tsx
import {
  TableState,
  TableStateUpdate,
  UsePersistentTableStateOptions,
  PersistableTableProperty,
  ApplicationModule
} from '@types/tableState'
```

All functions and hooks are fully typed with proper IntelliSense support.

## Future Features

- Backend API integration for user-specific state persistence
- State migration system for handling interface changes
- State compression for large datasets
- Encrypted storage for sensitive data
- Performance monitoring and analytics

## Examples by Module

### Purchases Module
```tsx
const config = getModuleTableConfig('PURCHASES', 'purchase-requests')
const { tableState, updateTableState } = usePersistentTableState(config)
```

### Fleet Module
```tsx
const config = getModuleTableConfig('FLEET', 'vehicles')
const { tableState, updateTableState } = usePersistentTableState({
  ...config,
  defaultState: {
    ...config.defaultState,
    pagination: { pageIndex: 0, pageSize: 20 } // Override default
  }
})
```

### LMS Module
```tsx
const config = getModuleTableConfig('LMS', 'courses')
const { tableState, updateTableState } = usePersistentTableState(config)
```

### IoT Module
```tsx
const config = getModuleTableConfig('IOT', 'devices')
const { tableState, updateTableState } = usePersistentTableState(config)
```

## Contributing

When adding new features or modules:

1. Update `ApplicationModule` type in `@types/tableState`
2. Add module configuration to `MODULE_TABLE_DEFAULTS`
3. Update this documentation
4. Add TypeScript interfaces for new features
5. Include comprehensive JSDoc comments

For questions or issues, refer to the codebase or create an issue in the project repository.