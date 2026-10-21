import React from 'react'
import { Box, Typography } from '@mui/material'
import MaterialReactTable, {
  MaterialReactTableProps,
  MRT_GlobalFilterTextField,
  MRT_ShowHideColumnsButton,
  MRT_TableInstance,
  MRT_ToggleFiltersButton
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'

const TEAL_INK = '#00695C'
const TEAL_DARK = '#00897B'
// Grises del sistema (levemente fríos), los mismos del menú lateral y las tarjetas
const HEAD_BG = '#f3f4f6'
const TOOLBAR_BG = '#f9fafb'
const LINE = '#e5e7eb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- misma restricción que MRT; las interfaces no encajan en Record<string, unknown>
type DataTableProps<TData extends Record<string, any>> =
  MaterialReactTableProps<TData> & {
    /** Qué lista la tabla, para el conteo junto al buscador: ['cliente', 'clientes']. */
    itemLabel?: [string, string]
    /** Texto del buscador: "Buscar clientes". */
    searchPlaceholder?: string
  }

const countText = (count: number, [singular, plural]: [string, string]) =>
  `${count.toLocaleString('es-CO')} ${count === 1 ? singular : plural}`

/**
 * Tabla de datos de los listados (Material React Table) con las reglas del
 * sistema de diseño ya puestas: español, buscador visible a la izquierda con
 * el conteo, encabezados limpios (ordenar con clic; sin arrastrar ni menú por
 * columna), solo los botones de filtros y columnas, acciones fijas a la
 * derecha y hover turquesa. Cada pantalla puede volver a activar lo que
 * necesite pasando la prop de MRT (por ejemplo `enableColumnOrdering`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- misma restricción que MRT; las interfaces no encajan en Record<string, unknown>
function DataTable<TData extends Record<string, any>>({
  itemLabel,
  searchPlaceholder = 'Buscar',
  initialState,
  muiTablePaperProps,
  muiTableProps,
  renderTopToolbarCustomActions,
  enableRowActions,
  ...props
}: DataTableProps<TData>): React.ReactElement {
  const renderCount = (table: MRT_TableInstance<TData>) => {
    if (!itemLabel) return null
    const count = props.manualPagination
      ? props.rowCount ?? table.getRowModel().rows.length
      : table.getFilteredRowModel().rows.length
    return (
      <Typography
        variant='body2'
        color='text.secondary'
        aria-live='polite'
        sx={{ whiteSpace: 'nowrap' }}
      >
        {countText(count, itemLabel)}
      </Typography>
    )
  }

  return (
    <MaterialReactTable<TData>
      localization={MRT_Localization_ES}
      // Encabezados limpios: se ordena con clic en el nombre
      enableColumnActions={false}
      enableColumnOrdering={false}
      enableColumnDragging={false}
      enableGrouping={false}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableStickyHeader
      enableGlobalFilter
      // El buscador se dibuja en el bloque izquierdo, junto al conteo
      positionGlobalFilter='none'
      positionActionsColumn='last'
      enablePinning={Boolean(enableRowActions)}
      enableRowActions={enableRowActions}
      initialState={{
        density: 'comfortable',
        showGlobalFilter: true,
        ...(enableRowActions
          ? { columnPinning: { right: ['mrt-row-actions'] } }
          : {}),
        ...initialState
      }}
      displayColumnDefOptions={{
        'mrt-row-actions': {
          header: 'Acciones',
          size: 120,
          // Fija a la derecha: fondo sólido para que no se vea lo que pasa debajo
          muiTableHeadCellProps: {
            align: 'left',
            sx: { backgroundColor: HEAD_BG, opacity: 1 }
          },
          muiTableBodyCellProps: {
            align: 'left',
            sx: { backgroundColor: '#fff', boxShadow: `-1px 0 0 ${LINE}` }
          }
        },
        ...props.displayColumnDefOptions
      }}
      muiSearchTextFieldProps={{
        placeholder: searchPlaceholder,
        variant: 'outlined',
        size: 'small',
        sx: {
          minWidth: { xs: 0, sm: 300 },
          // Foco turquesa, igual que AuthField y los formularios nuevos
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            { borderColor: TEAL_DARK, borderWidth: 2 }
        },
        inputProps: { 'aria-label': searchPlaceholder }
      }}
      renderToolbarInternalActions={({ table }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <MRT_ToggleFiltersButton table={table} />
          <MRT_ShowHideColumnsButton table={table} />
        </Box>
      )}
      renderTopToolbarCustomActions={({ table }) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <MRT_GlobalFilterTextField table={table} />
          {renderCount(table)}
          {renderTopToolbarCustomActions?.({ table })}
        </Box>
      )}
      muiTableHeadCellProps={{
        sx: { px: 1.5, borderBottom: `1px solid ${LINE}` }
      }}
      muiTableBodyCellProps={{
        // Cifras tabulares: teléfonos, NIT, fechas y totales en columna recta
        sx: {
          px: 1.5,
          borderBottom: `1px solid ${LINE}`,
          fontVariantNumeric: 'tabular-nums'
        }
      }}
      muiTopToolbarProps={{ sx: { backgroundColor: TOOLBAR_BG } }}
      muiBottomToolbarProps={{
        sx: { backgroundColor: TOOLBAR_BG, borderTop: `1px solid ${LINE}` }
      }}
      muiTableContainerProps={{ sx: { maxHeight: '600px' } }}
      muiTablePaperProps={
        muiTablePaperProps ?? {
          elevation: 2,
          sx: { borderRadius: '16px', overflow: 'hidden' }
        }
      }
      muiTableProps={
        muiTableProps ?? {
          sx: {
            '& .MuiTableHead-root .MuiTableCell-root': {
              backgroundColor: HEAD_BG,
              color: '#374151',
              fontWeight: 600,
              fontSize: 14
            },
            '& .MuiTableHead-root .Mui-TableHeadCell-Content-Labels:focus-visible':
              { outline: `3px solid ${TEAL_INK}`, outlineOffset: 2 },
            '& .MuiTableBody-root .MuiTableRow-root:hover > td': {
              // Turquesa al 4 % sobre blanco, sólido para la columna fija
              backgroundColor: '#f6fcfb'
            }
          }
        }
      }
      {...props}
    />
  )
}

export default DataTable
