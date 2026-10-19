import { useMemo, useState } from 'react'
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from '@mui/material'
import { FolderZipOutlined } from '@mui/icons-material'
import { techErrorMessage, techPaths, useAuditLog } from '@hooks/useTechManagement'
import { AuditEntry } from 'src/types/techManagement'
import { notifyError, notifySuccess, primaryButtonSx, tableStyleProps, todayIso } from './techUi'
import { useTechAccess } from './useTechAccess'

const ENTITY_LABELS: Record<string, string> = {
  customerEquipment: 'Equipo',
  equipmentActivity: 'Actividad',
  techSurveillanceProgram: 'Programa',
  techSurveillanceReport: 'Reporte',
  techSurveillanceAnalysis: 'Análisis',
  techSurveillanceAction: 'Acción',
  invimaAlertMatch: 'Alerta del equipo',
  invimaAlert: 'Alerta INVIMA'
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó',
  update: 'Editó',
  delete: 'Eliminó',
  execute: 'Registró ejecución',
  view: 'Consultó',
  regenerate_qr: 'Regeneró el QR',
  surveillance_review: 'Respondió la revisión',
  sync: 'Sincronizó'
}

const describeChanges = (changes: AuditEntry['changes']) =>
  changes
    ? Object.entries(changes)
        .slice(0, 4)
        .map(([field, [before, after]]) => `${field}: ${before ?? '—'} → ${after ?? '—'}`)
        .join(' · ')
    : ''

const AuditLog = ({ customerId }: { customerId: string }) => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 })
  const { data, isLoading, isFetching } = useAuditLog(customerId, { page: pagination.pageIndex + 1, pageSize: pagination.pageSize })

  const columns = useMemo<MRT_ColumnDef<AuditEntry>[]>(
    () => [
      {
        header: 'Fecha',
        id: 'createdAt',
        size: 160,
        accessorFn: (row) => new Date(row.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
      },
      {
        header: 'Quién',
        id: 'user',
        size: 200,
        Cell: ({ row }) => (
          <Box display='flex' gap={1} alignItems='center'>
            <span>{row.original.userName || 'Sistema'}</span>
            {row.original.isStaff && <Chip size='small' label='Metromedics' variant='outlined' />}
          </Box>
        )
      },
      {
        header: 'Qué',
        id: 'action',
        size: 220,
        accessorFn: (row) =>
          `${ACTION_LABELS[row.action] || row.action} ${(ENTITY_LABELS[row.entity] || row.entity).toLowerCase()}${row.entityId ? ` #${row.entityId}` : ''}`
      },
      { header: 'Cambios', id: 'changes', size: 360, accessorFn: (row) => describeChanges(row.changes) || '—' }
    ],
    []
  )

  return (
    <MaterialReactTable
      columns={columns}
      data={data?.items ?? []}
      localization={MRT_Localization_ES}
      getRowId={(row, index) => (row?.id != null ? String(row.id) : `cargando-${index}`)}
      manualPagination
      rowCount={data?.total ?? 0}
      onPaginationChange={setPagination}
      state={{ isLoading, showProgressBars: isFetching, pagination }}
      enableGlobalFilter={false}
      enableColumnFilters={false}
      enableSorting={false}
      enableColumnActions={false}
      {...tableStyleProps}
      renderTopToolbarCustomActions={() => (
        <Typography variant='h6' fontWeight={600} px={1}>
          Bitácora
        </Typography>
      )}
    />
  )
}

/** Carpeta para la visita de verificación (un PDF con todo) y bitácora de cambios del módulo. */
const VisitFolderTab = ({ customerId }: { customerId: string }) => {
  const access = useTechAccess(customerId)
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [to, setTo] = useState(todayIso())
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    setDownloading(true)
    try {
      await techPaths.downloadFile(techPaths.visitFolder(customerId), `carpeta_visita_${from}_${to}.pdf`, { from, to })
      notifySuccess('Carpeta generada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo generar la carpeta'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <CardContent>
          <Typography variant='h6' fontWeight={600} mb={1}>
            Carpeta para la visita de verificación
          </Typography>
          <Typography variant='body2' color='text.secondary' mb={2}>
            Un PDF con el indicador de cumplimiento, el inventario con su estado, el cronograma del periodo, el programa de
            tecnovigilancia, los reportes, las alertas gestionadas y, anexos, los certificados de calibración vigentes.
          </Typography>
          <Box display='flex' gap={1.5} flexWrap='wrap' alignItems='center'>
            <TextField size='small' type='date' label='Desde' value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size='small' type='date' label='Hasta' value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant='contained' startIcon={<FolderZipOutlined />} onClick={download} disabled={downloading} sx={primaryButtonSx}>
              {downloading ? 'Generando…' : 'Generar carpeta'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      {access.canViewSurveillance && <AuditLog customerId={customerId} />}
    </Stack>
  )
}

export default VisitFolderTab
