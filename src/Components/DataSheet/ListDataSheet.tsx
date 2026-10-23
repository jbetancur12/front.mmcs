import {
  Add as AddKpi,
  Build as BuildKpi,
  CheckCircle as CheckKpi,
  Inventory as InventoryKpi,
  WarningAmber as WarnKpi
} from '@mui/icons-material'
import { Button, Container, Grid } from '@mui/material'
import {
  MRT_ColumnFiltersState,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useEffect, useState } from 'react'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
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
import {
  DATASHEET_EXACT_FILTERS,
  DATASHEET_SORTABLE_FIELDS,
  useDataSheetCounts,
  useDataSheetsPaginated
} from './list-data-sheet/useDataSheets'
import {
  useKeepPageInRange,
  useServerTableState
} from 'src/hooks/useServerTable'

export type { CalibrationHistory, DataSheetData } from './list-data-sheet/types'
export { CreateNewDataSheetModal } from './list-data-sheet/CreateNewDataSheetModal'

const ListDataSheet: React.FC = () => {
  const canCreateDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_CREATE)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    () => {
      // Restaurar los filtros desde el localStorage al inicializar
      // (solo los filtros que el backend aplica; los demás ya no existen)
      try {
        const savedFilters = localStorage.getItem(COLUMN_FILTERS_STORAGE_KEY)
        const parsed: MRT_ColumnFiltersState = savedFilters
          ? JSON.parse(savedFilters)
          : []
        return Array.isArray(parsed)
          ? parsed.filter((filter) =>
              (DATASHEET_EXACT_FILTERS as readonly string[]).includes(filter.id)
            )
          : []
      } catch {
        return []
      }
    }
  )

  const server = useServerTableState({
    sortableFields: DATASHEET_SORTABLE_FIELDS,
    exactFilters: DATASHEET_EXACT_FILTERS,
    columnFilters,
    onColumnFiltersChange: setColumnFilters
  })
  const { dataSheets, totalItems, totalPages, isLoading, isFetching } =
    useDataSheetsPaginated(server.params)
  useKeepPageInRange(
    totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const { data: counts } = useDataSheetCounts()
  const actions = useDataSheetActions()
  const { columns, validationErrors, setValidationErrors } =
    useDataSheetColumns()

  useEffect(() => {
    // Guardar los filtros en el localStorage cada vez que cambien
    try {
      localStorage.setItem(
        COLUMN_FILTERS_STORAGE_KEY,
        JSON.stringify(columnFilters)
      )
    } catch {
      // Sin almacenamiento disponible: los filtros no se recuerdan.
    }
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

  const dueSoonCount = counts?.dueSoon ?? 0

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Hojas de vida de equipos'
        subtitle='Inventario de equipos, calibración y mantenimiento'
        icon={<InventoryKpi />}
        actions={
          canCreateDataSheet ? (
            <Button
              variant='contained'
              startIcon={<AddKpi />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00897B' }
              }}
            >
              Crear hoja de vida
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Equipos'
            value={counts?.total ?? totalItems}
            icon={<InventoryKpi />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Disponibles'
            value={counts?.available ?? 0}
            icon={<CheckKpi />}
            tone='green'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Ocupados'
            value={counts?.busy ?? 0}
            icon={<BuildKpi />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            variant='quiet'
            label='Por calibrar o inspeccionar'
            value={dueSoonCount}
            icon={<WarnKpi />}
            tone='red'
          />
        </Grid>
      </Grid>

      <DataTable
        itemLabel={['equipo', 'equipos']}
        searchPlaceholder='Buscar equipos'
        enableRowActions
        {...server.tableProps}
        rowCount={totalItems}
        state={{
          ...server.tableState,
          isLoading,
          showProgressBars: isFetching && !isLoading
        }}
        initialState={{
          columnPinning: { right: ['mrt-row-actions'] },
          columnVisibility: initialColumnVisibility
        }}
        columns={columns}
        data={dataSheets}
        editingMode='modal'
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

      <CreateNewDataSheetModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Container>
  )
}

export default ListDataSheet
