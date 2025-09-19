# Guía de Filtros Persistentes para Tablas

Esta guía explica cómo implementar filtros persistentes en todas las tablas MaterialReactTable de la aplicación MetroMedics.

## 🎯 Características

- ✅ **Filtros de columnas persistentes** - Se mantienen al navegar
- ✅ **Ordenamiento persistente** - Sort direction y columna seleccionada
- ✅ **Paginación persistente** - Página actual y tamaño de página
- ✅ **Visibilidad de columnas** (opcional) - Columnas ocultas/visibles
- ✅ **Densidad de tabla** (opcional) - Compact/comfortable/spacious
- ✅ **Configuración por módulo** - Cada módulo tiene sus propias configuraciones
- ✅ **Type-safe** - TypeScript completo con interfaces
- 🆕 **Indicadores visuales** - Los usuarios siempre saben si hay filtros activos
- 🆕 **Botón limpiar filtros** - Un click para eliminar todos los filtros
- 🆕 **Resumen de filtros** - Muestra exactamente qué filtros están aplicados
- 🆕 **Badges compactos** - Indicadores discretos en la barra de herramientas

## 📁 Archivos Principales

```
src/
├── hooks/
│   └── usePersistentTableState.ts       # Hook genérico reutilizable
├── utils/
│   └── tableStateUtils.ts               # Utilidades y configuraciones
└── pages/
    └── Purchases/
        └── PurchaseRequest.tsx          # Ejemplo de implementación
```

## 🚀 Implementación Rápida

### 1. Importar las dependencias

```typescript
import { usePersistentTableState } from '../../hooks/usePersistentTableState'
import { createTableStateHandlers, generateTableId, getModuleTableConfig } from '../../utils/tableStateUtils'
```

### 2. Configurar el hook en tu componente

```typescript
const MyTableComponent: React.FC = () => {
  // Obtener configuración del módulo
  const tableConfig = getModuleTableConfig('purchases') // o 'fleet', 'lms', etc.

  // Configurar el estado persistente
  const persistentTableState = usePersistentTableState({
    tableId: generateTableId('purchases', 'purchase-requests'),
    persistedProperties: tableConfig.persistedProperties,
    defaultState: {
      pagination: {
        pageIndex: 0,
        pageSize: tableConfig.defaultPageSize
      }
    }
  })

  // Crear handlers para MaterialReactTable
  const tableHandlers = createTableStateHandlers(persistentTableState)

  // ... resto del componente
}
```

### 3. Aplicar a MaterialReactTable

```typescript
<MaterialReactTable
  columns={columns}
  data={data}
  state={{
    isLoading,
    ...tableHandlers.state
  }}
  onColumnFiltersChange={tableHandlers.onColumnFiltersChange}
  onSortingChange={tableHandlers.onSortingChange}
  onPaginationChange={tableHandlers.onPaginationChange}
  // Opcional: si el módulo soporta visibilidad de columnas
  onColumnVisibilityChange={tableHandlers.onColumnVisibilityChange}
  // Opcional: si el módulo soporta densidad
  onDensityChange={tableHandlers.onDensityChange}
  // ... otras props
/>
```

## ⚙️ Configuración por Módulo

Las configuraciones están definidas en `src/utils/tableStateUtils.ts`:

### Módulos Disponibles

| Módulo | Página por defecto | Propiedades persistidas | Densidad | Visibilidad |
|--------|-------------------|------------------------|----------|-------------|
| `purchases` | 10 | filters, sorting, pagination | ✅ | ❌ |
| `fleet` | 15 | filters, sorting, pagination, visibility | ✅ | ✅ |
| `lms` | 20 | filters, sorting, pagination | ❌ | ❌ |
| `laboratory` | 10 | filters, sorting, pagination, density | ✅ | ❌ |
| `iot` | 25 | ALL | ✅ | ✅ |
| `quotations` | 10 | filters, sorting, pagination | ✅ | ❌ |

### Agregar un Nuevo Módulo

```typescript
// En src/utils/tableStateUtils.ts
const MODULE_TABLE_CONFIGS: Record<string, ModuleTableConfig> = {
  // ... configuraciones existentes

  'mi-nuevo-modulo': {
    defaultPageSize: 15,
    persistedProperties: ['columnFilters', 'sorting', 'pagination', 'columnVisibility'],
    enableDensity: true,
    enableColumnVisibility: true
  }
}
```

## 🔧 Opciones Avanzadas

### Configuración Personalizada

```typescript
const persistentTableState = usePersistentTableState({
  tableId: 'mi-tabla-unica',
  persistedProperties: ['columnFilters', 'sorting'], // Solo filtros y orden
  useBackendApi: false, // Usar localStorage por ahora
  debounceMs: 500, // Guardar cada 500ms en lugar de 300ms
  defaultState: {
    pagination: { pageIndex: 0, pageSize: 25 },
    density: 'compact'
  }
})
```

### IDs de Tabla Únicos

Para evitar conflictos entre diferentes tablas:

```typescript
// ✅ Correcto - cada tabla tiene su propio ID
const mainTableState = usePersistentTableState({
  tableId: generateTableId('purchases', 'purchase-requests')
})

const detailTableState = usePersistentTableState({
  tableId: generateTableId('purchases', 'purchase-items')
})

// ❌ Incorrecto - mismo ID para diferentes tablas
const tableState = usePersistentTableState({
  tableId: 'purchases-table' // Muy genérico
})
```

## 🛠️ Utilidades Adicionales

### Limpiar Estado de Tablas

```typescript
import { clearModuleTableStates } from '../../utils/tableStateUtils'

// Limpiar todas las tablas de un módulo (útil en logout)
clearModuleTableStates('purchases')
```

### Debug - Ver todos los estados guardados

```typescript
import { getAllTableStates } from '../../utils/tableStateUtils'

// En desarrollo, para ver qué se está guardando
console.log('Todos los estados de tabla:', getAllTableStates())
```

### Resetear una tabla específica

```typescript
// En tu componente
const { clearState } = persistentTableState

// Botón para resetear filtros
<Button onClick={clearState}>
  Limpiar Filtros
</Button>
```

## 📋 Ejemplos por Módulo

### Fleet Management

```typescript
import { usePersistentTableState } from '../../hooks/usePersistentTableState'
import { createTableStateHandlers, generateTableId, getModuleTableConfig } from '../../utils/tableStateUtils'

const FleetVehiclesTable: React.FC = () => {
  const tableConfig = getModuleTableConfig('fleet')
  const persistentTableState = usePersistentTableState({
    tableId: generateTableId('fleet', 'vehicles'),
    persistedProperties: tableConfig.persistedProperties, // Incluye columnVisibility
    defaultState: {
      pagination: { pageIndex: 0, pageSize: 15 }
    }
  })

  const tableHandlers = createTableStateHandlers(persistentTableState)

  return (
    <MaterialReactTable
      columns={vehicleColumns}
      data={vehicles}
      state={{ isLoading, ...tableHandlers.state }}
      onColumnFiltersChange={tableHandlers.onColumnFiltersChange}
      onSortingChange={tableHandlers.onSortingChange}
      onPaginationChange={tableHandlers.onPaginationChange}
      onColumnVisibilityChange={tableHandlers.onColumnVisibilityChange} // Fleet soporta esto
      onDensityChange={tableHandlers.onDensityChange}
      enableColumnOrdering
      enableColumnResizing
    />
  )
}
```

### LMS Courses

```typescript
const LMSCoursesTable: React.FC = () => {
  const tableConfig = getModuleTableConfig('lms')
  const persistentTableState = usePersistentTableState({
    tableId: generateTableId('lms', 'courses'),
    persistedProperties: ['columnFilters', 'sorting', 'pagination'], // Solo básicos para LMS
    defaultState: {
      pagination: { pageIndex: 0, pageSize: 20 } // LMS usa páginas más grandes
    }
  })

  const tableHandlers = createTableStateHandlers(persistentTableState)

  return (
    <MaterialReactTable
      columns={courseColumns}
      data={courses}
      state={{ isLoading, ...tableHandlers.state }}
      onColumnFiltersChange={tableHandlers.onColumnFiltersChange}
      onSortingChange={tableHandlers.onSortingChange}
      onPaginationChange={tableHandlers.onPaginationChange}
      // LMS no usa density ni columnVisibility según configuración
    />
  )
}
```

## 🔄 Migración desde Implementación Manual

Si ya tienes una tabla con estado manual, sigue estos pasos:

### Antes (implementación manual):

```typescript
const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
const [sorting, setSorting] = useState<MRT_SortingState>([])
const [pagination, setPagination] = useState<MRT_PaginationState>({
  pageIndex: 0,
  pageSize: 10
})

<MaterialReactTable
  state={{ columnFilters, sorting, pagination }}
  onColumnFiltersChange={setColumnFilters}
  onSortingChange={setSorting}
  onPaginationChange={setPagination}
/>
```

### Después (implementación persistente):

```typescript
const tableConfig = getModuleTableConfig('tu-modulo')
const persistentTableState = usePersistentTableState({
  tableId: generateTableId('tu-modulo', 'tu-tabla'),
  persistedProperties: tableConfig.persistedProperties
})
const tableHandlers = createTableStateHandlers(persistentTableState)

<MaterialReactTable
  state={{ isLoading, ...tableHandlers.state }}
  onColumnFiltersChange={tableHandlers.onColumnFiltersChange}
  onSortingChange={tableHandlers.onSortingChange}
  onPaginationChange={tableHandlers.onPaginationChange}
/>
```

## 🐛 Troubleshooting

### Los filtros no se guardan
- Verifica que el `tableId` sea único
- Asegúrate de que las `persistedProperties` incluyan `'columnFilters'`
- Revisa la consola para errores de localStorage

### Los filtros se comparten entre tablas
- Cada tabla debe tener un `tableId` único
- Usa `generateTableId('modulo', 'tabla-nombre')` para evitar conflictos

### La página se resetea al navegar
- Verifica que `'pagination'` esté en `persistedProperties`
- Asegúrate de no tener múltiples estados de paginación en conflicto

### TypeScript errors
- Importa correctamente `TableState` desde `usePersistentTableState`
- Verifica que las interfaces de datos sean compatibles con MaterialReactTable

## 👁️ Indicadores Visuales de Filtros Activos

### Problema Resuelto
Uno de los problemas más comunes es que los usuarios no se dan cuenta de que hay filtros aplicados cuando regresan a una tabla. Esto puede causar confusión al ver resultados limitados sin saber por qué.

### Soluciones Implementadas

#### 1. **Indicador Principal** (Encima de la tabla)
```typescript
<ActiveFiltersIndicator
  tableState={persistentTableState.tableState}
  onClearFilters={persistentTableState.clearFilters}
  showDetails={true}
/>
```

**Características:**
- 🟠 **Banner naranja** muy visible cuando hay filtros activos
- 📊 **Cuenta de filtros** - "3 filtro(s) activo(s)"
- 📝 **Resumen expandible** - Lista todos los filtros aplicados
- 🗑️ **Botón "Limpiar Filtros"** - Un click para eliminar todo

#### 2. **Badge Compacto** (En la barra de herramientas)
```typescript
<ActiveFiltersIndicator
  tableState={persistentTableState.tableState}
  onClearFilters={persistentTableState.clearFilters}
  compact={true}
/>
```

**Características:**
- 🏷️ **Chip pequeño** con ícono de filtro y número
- 💡 **Tooltip informativo** al hacer hover
- ⚡ **Click para limpiar** directamente desde el badge

### Implementación Completa

```typescript
import ActiveFiltersIndicator from '../../components/Table/ActiveFiltersIndicator'

const MyTableComponent = () => {
  const persistentTableState = usePersistentTableState({
    tableId: generateTableId('mi-modulo', 'mi-tabla'),
    // ... configuración
  })

  return (
    <>
      <Typography variant="h5">Mi Tabla</Typography>

      {/* Indicador principal - siempre visible si hay filtros */}
      <ActiveFiltersIndicator
        tableState={persistentTableState.tableState}
        onClearFilters={persistentTableState.clearFilters}
        showDetails={true}
      />

      <MaterialReactTable
        // ... configuración de tabla
        renderTopToolbarCustomActions={() => (
          <Box>
            {/* Otros botones */}

            {/* Badge compacto en toolbar */}
            <ActiveFiltersIndicator
              tableState={persistentTableState.tableState}
              onClearFilters={persistentTableState.clearFilters}
              compact={true}
            />
          </Box>
        )}
      />
    </>
  )
}
```

### Configuración de Estilos

Los indicadores usan un esquema de colores **naranja/warning** para máxima visibilidad:

- **Fondo**: `#fff3e0` (naranja muy claro)
- **Borde izquierdo**: `#ff9800` (naranja)
- **Ícono**: Color warning de Material-UI
- **Chips**: Color warning con variantes outlined/filled

### Funciones de Utilidad

```typescript
import {
  hasActiveFilters,
  getActiveFiltersCount,
  getFilterSummary
} from '../../utils/tableStateUtils'

// Verificar si hay filtros activos
const hasFilters = hasActiveFilters(tableState) // boolean

// Obtener número de filtros
const count = getActiveFiltersCount(tableState) // number

// Obtener resumen detallado
const summary = getFilterSummary(tableState) // string[]
// Ejemplo: ["status: pending", "Ordenado por: date (desc)", "Página: 2"]
```

### Beneficios UX

✅ **Visibilidad máxima** - Imposible no notar que hay filtros activos
✅ **Información clara** - Saben exactamente qué filtros están aplicados
✅ **Acción rápida** - Un click para limpiar todo
✅ **No intrusivo** - Solo aparece cuando es necesario
✅ **Consistente** - Mismo comportamiento en todas las tablas

## 📚 Próximos Pasos

1. **Implementar en todas las tablas** de la aplicación
2. **Agregar sincronización con backend** (API ya implementada)
3. **Agregar configuraciones por usuario** (preferencias personales)
4. **Implementar exportación/importación** de configuraciones
5. **Agregar notificaciones** cuando se aplican filtros automáticamente

¡Ya tienes todo lo necesario para implementar filtros persistentes con excelente UX en cualquier tabla de la aplicación! 🎉