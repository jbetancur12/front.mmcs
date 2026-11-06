import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { brand, neutral } from 'src/theme/designTokens'

/**
 * Props de Material React Table compartidas por las tablas de Compras
 * (mismo estilo que el listado de Clientes).
 */
export const purchaseTableStyle = {
  localization: MRT_Localization_ES,
  positionActionsColumn: 'last' as const,
  enableStickyHeader: true,
  muiTableProps: {
    sx: {
      '& .MuiTableHead-root .MuiTableCell-root': {
        backgroundColor: neutral.surfaceHead,
        fontWeight: 600
      },
      '& .MuiTableBody-root .MuiTableRow-root:hover': {
        backgroundColor: 'rgba(0, 191, 165, 0.04)'
      }
    }
  },
  muiTableBodyCellProps: { sx: { textAlign: 'left' as const } },
  muiTopToolbarProps: { sx: { backgroundColor: neutral.surfaceAlt } },
  muiBottomToolbarProps: { sx: { backgroundColor: neutral.surfaceAlt } },
  muiTableContainerProps: { sx: { maxHeight: '600px' } },
  muiSearchTextFieldProps: {
    placeholder: 'Buscar...',
    sx: { minWidth: '300px' },
    variant: 'outlined' as const
  }
}

export const PURCHASE_TEAL = brand.main
export const PURCHASE_TEAL_HOVER = brand.hover
