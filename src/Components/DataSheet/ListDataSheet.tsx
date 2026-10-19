import {
  Add as AddKpi,
  Build as BuildKpi,
  CheckCircle as CheckKpi,
  Inventory as InventoryKpi,
  WarningAmber as WarnKpi
} from '@mui/icons-material'
import { Button, Container, Grid, Paper } from '@mui/material'
import {
  MRT_ColumnFiltersState,
  MaterialReactTable,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useEffect, useState } from 'react'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import {
  COLUMN_FILTERS_STORAGE_KEY,
  initialColumnVisibility
} from './list-data-sheet/constants'
import { CreateNewDataSheetModal } from './list-data-sheet/CreateNewDataSheetModal'
import { confirmDeleteDataSheet } from './list-data-sheet/dataSheetDialogs'
import DataSheetRowActions from './list-data-sheet/DataSheetRowActions'
import DataSheetToolbarActions from './list-data-sheet/DataSheetToolbarActions'
import { DataSheetData } from './list-data-sheet/types'
import { useDataSheetActions } from './list-data-sheet/useDataSheetActions'
import { useDataSheetColumns } from './list-data-sheet/useDataSheetColumns'
import { useDataSheetsQuery } from './list-data-sheet/useDataSheets'

export type {
  CalibrationHistory,
  DataSheetData
} from './list-data-sheet/types'
export { CreateNewDataSheetModal } from './list-data-sheet/CreateNewDataSheetModal'

const ListDataSheet: React.FC = () => {
  const canCreateDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_CREATE)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    () => {
      // Restaurar los filtros desde el localStorage al inicializar
      const savedFilters = localStorage.getItem(COLUMN_FILTERS_STORAGE_KEY)
      return savedFilters ? JSON.parse(savedFilters) : []
    }
  )

  const { dataSheets } = useDataSheetsQuery()
  const actions = useDataSheetActions()
  const { columns, validationErrors, setValidationErrors } =
    useDataSheetColumns()

  useEffect(() => {
    // Guardar los filtros en el localStorage cada vez que cambien
    localStorage.setItem(
      COLUMN_FILTERS_STORAGE_KEY,
      JSON.stringify(columnFilters)
    )
  }, [columnFilters])

  const handleSaveRowEdits: MaterialReactTableProps<DataSheetData>['onEditingRowSave'] =
    async ({ exitEditingMode, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }

        if (updatedValues.insuredValue) {
          updatedValues.insuredValue = parseInt(
            updatedValues.insuredValue.replace(/[\s$.]/g, ''), // Eliminar espacios, puntos y $
            10
          )
        }

        delete updatedValues.id
        await actions.saveDataSheet(values.id, updatedValues)

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const handleDeleteRow = (row: MRT_Row<DataSheetData>) => {
    confirmDeleteDataSheet(row.getValue('equipmentName')).then((result) => {
      if (result.isConfirmed) {
        actions.removeDataSheet(row.getValue('id'))
      }
    })
  }

  const dueSoonCount = dataSheets.filter(
    (d) => d.isCalibrationDueSoon || d.isInspectionDueSoon
  ).length

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Hojas de vida de equipos'
        subtitle='Inventario de equipos, calibración y mantenimiento'
        icon={<InventoryKpi />}
        actions={
          canCreateDataSheet ? (
            <Button variant='contained' startIcon={<AddKpi />} onClick={() => setCreateModalOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
              Crear hoja de vida
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Equipos' value={dataSheets.length} icon={<InventoryKpi />} tone='teal' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Disponibles'
            value={dataSheets.filter((d) => d.status === 'available').length}
            icon={<CheckKpi />}
            tone='green'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Ocupados'
            value={dataSheets.filter((d) => d.status === 'busy').length}
            icon={<BuildKpi />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Por calibrar o inspeccionar'
            value={dueSoonCount}
            icon={<WarnKpi />}
            tone={dueSoonCount > 0 ? 'red' : 'green'}
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <MaterialReactTable
        {...purchaseTableStyle}
        onColumnFiltersChange={setColumnFilters} //hoist internal columnFilters state to your state
        state={{ columnFilters }}
        enablePinning
        initialState={{
          columnPinning: { right: ['mrt-row-actions'] },
          columnVisibility: initialColumnVisibility
        }}
        displayColumnDefOptions={{
          'mrt-row-actions': {
            header: '',
            muiTableHeadCellProps: {
              align: 'center'
            },

            size: 10
          }
        }}
        columns={columns}
        data={dataSheets}
        editingMode='modal'
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <DataSheetRowActions
            row={row}
            table={table}
            actions={actions}
            onDelete={handleDeleteRow}
          />
        )}
        renderTopToolbarCustomActions={() => {
          if (!canCreateDataSheet) {
            return
          }
          return <DataSheetToolbarActions tableData={dataSheets} />
        }}
      />
      </Paper>

      <CreateNewDataSheetModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Container>
  )
}

export default ListDataSheet
