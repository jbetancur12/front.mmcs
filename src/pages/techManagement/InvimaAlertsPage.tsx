import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Add, ArrowBack, CampaignOutlined, Delete, Edit } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import {
  techErrorMessage,
  useDeleteInvimaAlert,
  useInvimaAlerts,
  useSaveInvimaAlert
} from '@hooks/useTechManagement'
import { InvimaAlert } from 'src/types/techManagement'
import {
  ALERT_TYPE_LABELS,
  confirmAction,
  formatDate,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  tableStyleProps
} from 'src/Components/techManagement/techUi'

type AlertForm = Partial<InvimaAlert>

const FIELDS: { key: keyof InvimaAlert; label: string; sm: number; multiline?: boolean }[] = [
  { key: 'code', label: 'Código de la alerta *', sm: 6 },
  { key: 'title', label: 'Título *', sm: 12 },
  { key: 'deviceName', label: 'Dispositivo', sm: 6 },
  { key: 'invimaRegistry', label: 'Registro sanitario', sm: 6 },
  { key: 'brand', label: 'Marca', sm: 4 },
  { key: 'model', label: 'Modelo', sm: 4 },
  { key: 'manufacturer', label: 'Fabricante', sm: 4 },
  { key: 'affectedLots', label: 'Lotes / series afectados', sm: 12 },
  { key: 'description', label: 'Descripción y acciones recomendadas', sm: 12, multiline: true },
  { key: 'url', label: 'Enlace a la publicación del INVIMA', sm: 12 }
]

/**
 * Catálogo de alertas, recalls e informes de seguridad del INVIMA (no hay API pública: lo carga Metromedics). Cada
 * alerta se cruza sola con los inventarios de las instituciones que tienen el módulo.
 */
const InvimaAlertsPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<AlertForm | null>(null)
  const { data, isLoading, isFetching, isError } = useInvimaAlerts({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: search || undefined
  })
  const save = useSaveInvimaAlert()
  const remove = useDeleteInvimaAlert()

  const set = (key: keyof InvimaAlert, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form) return
    try {
      const { id, ...payload } = form
      delete payload.matches
      const result = await save.mutateAsync({ id, payload })
      notifySuccess(`Alerta guardada · ${result.matches} equipo(s) nuevos cruzados`)
      setForm(null)
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar la alerta'))
    }
  }

  const handleDelete = async (alert: InvimaAlert) => {
    if (!(await confirmAction(`¿Eliminar la alerta ${alert.code}?`, 'También se quitan sus cruces con los inventarios.', 'Eliminar'))) return
    try {
      await remove.mutateAsync(alert.id)
      notifySuccess('Alerta eliminada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo eliminar la alerta'))
    }
  }

  const columns = useMemo<MRT_ColumnDef<InvimaAlert>[]>(
    () => [
      { header: 'Publicada', id: 'publishedAt', size: 110, accessorFn: (row) => formatDate(row.publishedAt) },
      {
        header: 'Alerta',
        id: 'title',
        size: 320,
        Cell: ({ row }) => (
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {row.original.code}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.title}
            </Typography>
          </Box>
        )
      },
      { header: 'Tipo', id: 'type', size: 160, accessorFn: (row) => ALERT_TYPE_LABELS[row.type] },
      {
        header: 'Dispositivo',
        id: 'device',
        size: 220,
        accessorFn: (row) => [row.deviceName, row.brand, row.model].filter(Boolean).join(' · ') || row.invimaRegistry || '—'
      },
      { header: 'Equipos cruzados', id: 'matches', size: 120, accessorFn: (row) => row.matches ?? 0 }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Alertas del INVIMA'
        subtitle='Alertas sanitarias, recalls e informes de seguridad que se cruzan con los inventarios de las instituciones'
        icon={<CampaignOutlined />}
        actions={
          <>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/tech-management')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Instituciones
            </Button>
            <Button variant='contained' startIcon={<Add />} onClick={() => setForm({ type: 'alerta' })} sx={primaryButtonSx}>
              Nueva alerta
            </Button>
          </>
        }
      />
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <MaterialReactTable
          columns={columns}
          data={data?.items ?? []}
          localization={MRT_Localization_ES}
          getRowId={(row, index) => (row?.id != null ? String(row.id) : `cargando-${index}`)}
          manualPagination
          manualFiltering
          rowCount={data?.total ?? 0}
          onPaginationChange={setPagination}
          onGlobalFilterChange={(value: string | undefined) => {
            setSearch(value || '')
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          state={{
            isLoading,
            showProgressBars: isFetching,
            pagination,
            globalFilter: search,
            showAlertBanner: isError,
            columnPinning: { right: ['mrt-row-actions'] }
          }}
          initialState={{ showGlobalFilter: true, density: 'comfortable' }}
          muiToolbarAlertBannerProps={isError ? { color: 'error', children: 'No se pudieron cargar las alertas.' } : undefined}
          enablePinning
          enableColumnFilters={false}
          enableSorting={false}
          enableColumnActions={false}
          enableRowActions
          positionActionsColumn='last'
          displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 100 } }}
          {...tableStyleProps}
          muiTablePaperProps={{ elevation: 0 }}
          renderRowActions={({ row }) => (
            <Box display='flex' gap={0.5}>
              <Tooltip title='Editar'>
                <IconButton size='small' color='primary' onClick={() => setForm(row.original)}>
                  <Edit fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton size='small' color='error' onClick={() => handleDelete(row.original)}>
                  <Delete fontSize='small' />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle
          sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
        >
          {form?.id ? 'Editar alerta' : 'Nueva alerta del INVIMA'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Typography variant='body2' color='text.secondary' mb={2}>
            Para cruzar con los inventarios se usa el registro sanitario o la marca con el modelo o el nombre del
            dispositivo.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size='small' label='Tipo' value={form?.type || 'alerta'} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Fecha de publicación *'
                value={form?.publishedAt?.slice(0, 10) || ''}
                onChange={(e) => set('publishedAt', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {FIELDS.map((field) => (
              <Grid item xs={12} sm={field.sm} key={field.key}>
                <TextField
                  fullWidth
                  size='small'
                  label={field.label}
                  value={(form?.[field.key] as string) || ''}
                  onChange={(e) => set(field.key, e.target.value)}
                  multiline={field.multiline}
                  minRows={field.multiline ? 3 : undefined}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForm(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={save.isLoading} sx={primaryButtonSx}>
            Guardar y cruzar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default InvimaAlertsPage
