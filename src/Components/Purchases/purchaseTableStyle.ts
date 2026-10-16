import { MRT_Localization_ES } from 'material-react-table/locales/es'

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
        backgroundColor: '#f5f5f5',
        fontWeight: 600
      },
      '& .MuiTableBody-root .MuiTableRow-root:hover': {
        backgroundColor: 'rgba(0, 191, 165, 0.04)'
      }
    }
  },
  muiTableBodyCellProps: { sx: { textAlign: 'left' as const } },
  muiTopToolbarProps: { sx: { backgroundColor: '#fafafa' } },
  muiBottomToolbarProps: { sx: { backgroundColor: '#fafafa' } },
  muiTableContainerProps: { sx: { maxHeight: '600px' } },
  muiSearchTextFieldProps: {
    placeholder: 'Buscar...',
    sx: { minWidth: '300px' },
    variant: 'outlined' as const
  }
}

export const PURCHASE_TEAL = '#00BFA5'
export const PURCHASE_TEAL_HOVER = '#00ACC1'
