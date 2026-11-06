import {
  Add as AddKpi,
  Build as BuildKpi,
  CheckCircle as CheckKpi,
  DeleteForever as DeletedKpi,
  Inventory as InventoryKpi,
  WarningAmber as WarnKpi
} from '@mui/icons-material'
import { Alert, Button, Container, Grid } from '@mui/material'
import { MRT_ColumnFiltersState, type MRT_Row } from 'material-react-table'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { brand } from 'src/theme/designTokens'

import {
  COLUMN_FILTERS_STORAGE_KEY,
  initialColumnVisibility
} from './list-data-sheet/constants'
import { CreateNewDataSheetModal } from './list-data-sheet/CreateNewDataSheetModal'
import DataSheetLifecycleDialog, {
  type DataSheetLifecycleMode,
  type DataSheetLifecycleTarget
} from './list-data-sheet/DataSheetLifecycleDialog'
import DeletedDataSheetsDialog from './list-data-sheet/DeletedDataSheetsDialog'
import DataSheetRowActions from './list-data-sheet/DataSheetRowActions'
import DataSheetEditFormDialog from './list-data-sheet/DataSheetEditFormDialog'
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
  const [showRetired, setShowRetired] = useState(false)
  const listParams = useMemo(
    () => ({
      ...server.params,
      ...(showRetired ? { retired: 'only' } : {})
    }),
    [server.params, showRetired]
  )
  const { dataSheets, totalItems, totalPages, isLoading, isFetching } =
    useDataSheetsPaginated(listParams)
  useKeepPageInRange(
    totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const { data: counts } = useDataSheetCounts()
  const actions = useDataSheetActions()
  const { columns } = useDataSheetColumns()
  const [editingRow, setEditingRow] = useState<DataSheetData | null>(null)
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    mode: DataSheetLifecycleMode
    dataSheet: DataSheetLifecycleTarget
  } | null>(null)
  const [deletedOpen, setDeletedOpen] = useState(false)

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

  const openLifecycleDialog = (
    mode: DataSheetLifecycleMode,
    row: MRT_Row<DataSheetData>
  ) => {
    setLifecycleTarget({
      mode,
      dataSheet: {
        id: row.original.id as number,
        internalCode: row.original.internalCode,
        equipmentName: row.original.equipmentName,
        serialNumber: row.original.serialNumber
      }
    })
  }

  const toggleRetired = () => {
    setShowRetired((current) => !current)
    server.setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const dueSoonCount = counts?.dueSoon ?? 0
  const navigate = useNavigate()
  const statusFilter = columnFilters.find((f) => f.id === 'status')?.value

  // Las tarjetas filtran la tabla por estado; un segundo clic quita el filtro
  const filterByStatus = (status?: string) => {
    server.setColumnFilters((current) => {
      const rest = current.filter((f) => f.id !== 'status')
      return status && status !== statusFilter
        ? [...rest, { id: 'status', value: status }]
        : rest
    })
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Hojas de vida de equipos'
        subtitle='Inventario de equipos, calibración y mantenimiento'
        icon={<InventoryKpi />}
        actions={
          <>
            <Button
              variant='outlined'
              onClick={toggleRetired}
              sx={{
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 600,
                color: brand.ink,
                borderColor: brand.main,
                '&:hover': { borderColor: brand.hover, bgcolor: brand.soft }
              }}
            >
              {showRetired ? 'Ver activos' : 'Ver retirados'}
            </Button>
            <Button
              variant='outlined'
              startIcon={<DeletedKpi />}
              onClick={() => setDeletedOpen(true)}
              sx={{
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 600,
                color: brand.ink,
                borderColor: brand.main,
                '&:hover': { borderColor: brand.hover, bgcolor: brand.soft }
              }}
            >
              Ver eliminados
            </Button>
            {canCreateDataSheet && (
              <Button
                variant='contained'
                startIcon={<AddKpi />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  bgcolor: brand.main,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: brand.hover }
                }}
              >
                Crear hoja de vida
              </Button>
            )}
          </>
        }
      />

      {!showRetired && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <LmsStatCard
              variant='quiet'
              label='Equipos'
              value={counts?.total ?? totalItems}
              icon={<InventoryKpi />}
              tone='teal'
              onClick={() => filterByStatus()}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <LmsStatCard
              variant='quiet'
              label='Disponibles'
              value={counts?.available ?? 0}
              icon={<CheckKpi />}
              tone='green'
              active={statusFilter === 'available'}
              onClick={() => filterByStatus('available')}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <LmsStatCard
              variant='quiet'
              label='Ocupados'
              value={counts?.busy ?? 0}
              icon={<BuildKpi />}
              tone='blue'
              active={statusFilter === 'busy'}
              onClick={() => filterByStatus('busy')}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <LmsStatCard
              variant='quiet'
              label='Por calibrar o inspeccionar'
              value={dueSoonCount}
              icon={<WarnKpi />}
              tone='red'
              onClick={() => navigate('/datasheets/alerts')}
            />
          </Grid>
        </Grid>
      )}

      {showRetired && (
        <Alert severity='info' sx={{ mb: 2 }}>
          Mostrando equipos dados de baja. No aparecen en alertas, cronogramas
          ni préstamos; puedes restaurarlos mientras su código siga libre.
        </Alert>
      )}

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
        renderRowActions={({ row }) => (
          <DataSheetRowActions
            row={row}
            actions={actions}
            onRetire={(target) => openLifecycleDialog('retire', target)}
            onDeletePermanent={(target) =>
              openLifecycleDialog('delete', target)
            }
            onEditData={setEditingRow}
          />
        )}
        renderTopToolbarCustomActions={() => {
          if (!canCreateDataSheet) {
            return
          }
          return <DataSheetToolbarActions tableData={dataSheets} />
        }}
      />

      <DataSheetEditFormDialog
        row={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={actions.saveDataSheet}
      />

      <CreateNewDataSheetModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <DataSheetLifecycleDialog
        open={Boolean(lifecycleTarget)}
        mode={lifecycleTarget?.mode ?? 'retire'}
        dataSheet={lifecycleTarget?.dataSheet ?? null}
        onClose={() => setLifecycleTarget(null)}
        onRetire={async ({ reason, releaseCode }) => {
          if (!lifecycleTarget) return
          await actions.retireDataSheetWithReason(
            lifecycleTarget.dataSheet.id,
            reason,
            releaseCode
          )
        }}
        onDelete={async ({ reason, force }) => {
          if (!lifecycleTarget) return
          await actions.deleteDataSheetPermanently(
            lifecycleTarget.dataSheet.id,
            reason,
            force
          )
        }}
      />

      <DeletedDataSheetsDialog
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
      />
    </Container>
  )
}

export default ListDataSheet
