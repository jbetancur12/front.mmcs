import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined'
import MaterialReactTable from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Toaster, toast } from 'react-hot-toast'
import { useEquipmentQuotations, useEquipmentSalesMutations, useEquipmentQuoteTermsTemplate } from '../../hooks/useEquipmentSales'
import { EQUIPMENT_QUOTATION_STATUS_COLORS, EQUIPMENT_QUOTATION_STATUS_LABELS } from '../../constants/equipmentSales'
import { EquipmentQuotation, EquipmentQuotationStatus } from '../../types/equipmentSales'
import CalibrationServiceRichTextEditor from '../calibration-services/CalibrationServiceRichTextEditor'
import { EQUIPMENT_QUOTE_TERM_KEYS, EQUIPMENT_QUOTE_TERM_LABELS, mergeEquipmentQuoteTerms } from './equipmentQuoteTerms'

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const STATUS_ORDER: EquipmentQuotationStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'ready_for_invoicing',
  'rejected',
  'invoiced',
  'cancelled'
]

type ViewMode = 'list' | 'table' | 'kanban'

const QUOTATION_STATUS_LABELS: Record<string, string> = EQUIPMENT_QUOTATION_STATUS_LABELS
const QUOTATION_STATUS_COLORS: Record<string, string> = EQUIPMENT_QUOTATION_STATUS_COLORS

const EquipmentSalesPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateTerms, setTemplateTerms] = useState<Record<string, string>>({})
  const { data: templateData } = useEquipmentQuoteTermsTemplate()
  const { data, isLoading } = useEquipmentQuotations({ limit: 500 })
  const mutations = useEquipmentSalesMutations()

  const quotations = data?.data || []

  const filteredQuotations = useMemo(() => {
    if (!statusFilter) return quotations
    return quotations.filter((q) => q.status === statusFilter)
  }, [quotations, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotations.length }
    for (const status of STATUS_ORDER) {
      counts[status] = quotations.filter((q) => q.status === status).length
    }
    return counts
  }, [quotations])

  const paginatedQuotations = useMemo(
    () => filteredQuotations.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredQuotations, page, rowsPerPage]
  )

  const kanbanColumns = useMemo(
    () =>
      STATUS_ORDER.filter((status) => status !== 'rejected' && status !== 'cancelled')
        .map((status) => ({
          status,
          label: QUOTATION_STATUS_LABELS[status],
          color: QUOTATION_STATUS_COLORS[status],
          quotations: filteredQuotations.filter((q) => q.status === status)
        })),
    [filteredQuotations]
  )

  const handleOpenTemplate = () => {
    setTemplateTerms(mergeEquipmentQuoteTerms(templateData?.terms as Record<string, string> | null))
    setTemplateOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      await mutations.saveQuoteTermsTemplate.mutateAsync(templateTerms)
      toast.success('Plantilla de términos actualizada.')
      setTemplateOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo guardar la plantilla.')
    }
  }

  const setTerm = (key: string, value: string) => {
    setTemplateTerms((prev) => ({ ...prev, [key]: value }))
  }

  const handleSend = async (quotation: EquipmentQuotation) => {
    const result = await window.confirm(`¿Marcar la cotización ${quotation.quoteCode} como enviada al cliente?`)
    if (!result) return
    try {
      await mutations.requestApproval.mutateAsync(quotation.id)
      toast.success('Cotización enviada al cliente.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos enviar la cotización.')
    }
  }

  const renderStatusChip = (status: string) => (
    <Chip
      size='small'
      label={QUOTATION_STATUS_LABELS[status] || status}
      sx={{ fontWeight: 700, borderRadius: '8px', backgroundColor: QUOTATION_STATUS_COLORS[status], color: '#fff' }}
    />
  )

  const renderQuickActions = (quotation: EquipmentQuotation) => (
    <Stack direction='row' spacing={0.5}>
      {quotation.status === 'draft' ? (
        <>
          <Tooltip title='Editar'>
            <IconButton size='small' onClick={(e) => { e.stopPropagation(); navigate(`/equipment-sales/${quotation.id}/edit`) }}>
              <EditOutlinedIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Enviar al cliente'>
            <IconButton size='small' color='primary' onClick={(e) => { e.stopPropagation(); void handleSend(quotation) }}>
              <SendOutlinedIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </>
      ) : null}
      <Tooltip title='Ver detalle'>
        <IconButton size='small' onClick={(e) => { e.stopPropagation(); navigate(`/equipment-sales/${quotation.id}`) }}>
          <ChevronRightOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Stack>
  )

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: '#f8fafb' }}>
      <Toaster position='top-center' />

      {/* ── Header banner ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, letterSpacing: '-0.025em', fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Cotizaciones — Venta de Equipos
            </Typography>
            <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontSize: '0.9rem' }}>
              Gestiona el ciclo comercial de venta de equipos: borrador, cotización enviada,
              aprobación del cliente y facturación.
            </Typography>
          </Box>
          <Stack direction='row' spacing={1}>
            <Button variant='text' startIcon={<GroupOutlinedIcon />} onClick={() => navigate('/calibration-services/customers')} sx={{ color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)' } }}>
              Clientes
            </Button>
            <Button variant='text' startIcon={<Inventory2OutlinedIcon />} onClick={() => navigate('/equipment-sales/products')} sx={{ color: 'rgba(255,255,255,0.85)', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)' } }}>
              Productos
            </Button>
            <Button
              variant='contained'
              startIcon={<AddOutlinedIcon />}
              onClick={() => navigate('/equipment-sales/new')}
              sx={{ backgroundColor: '#fff', color: '#047857', textTransform: 'none', fontWeight: 700, borderRadius: '10px', '&:hover': { backgroundColor: '#f0fdf4' } }}
            >
              Nueva Cotización
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {['all', ...STATUS_ORDER].map((status) => (
          <Grid item xs={6} sm={4} md={3} lg={2.4} key={status}>
            <Card
              elevation={0}
              onClick={() => { setStatusFilter(status === 'all' ? '' : status); setPage(0) }}
              sx={{
                cursor: 'pointer',
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                borderLeft: status === 'all' ? '4px solid #059669' : `4px solid ${QUOTATION_STATUS_COLORS[status]}`,
                backgroundColor: statusFilter === status || (status === 'all' && !statusFilter) ? 'rgba(16,185,129,0.06)' : '#fff',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant='caption' fontWeight={600} color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {status === 'all' ? 'Todas' : QUOTATION_STATUS_LABELS[status]}
                </Typography>
                <Typography variant='h5' fontWeight={800} sx={{ mt: 0.5 }}>
                  {statusCounts[status] ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Toolbar: view mode + template ── */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          {filteredQuotations.length} cotización{filteredQuotations.length !== 1 ? 'es' : ''}
        </Typography>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Button variant='outlined' size='small' startIcon={<ExpandMoreOutlinedIcon />} onClick={handleOpenTemplate} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
            Plantilla términos
          </Button>
          <Stack direction='row' spacing={0.5}>
            <IconButton size='small' onClick={() => setViewMode('list')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', color: viewMode === 'list' ? '#059669' : 'text.secondary' }}>
              <ViewStreamOutlinedIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={() => setViewMode('table')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', color: viewMode === 'table' ? '#059669' : 'text.secondary' }}>
              <TableChartOutlinedIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={() => setViewMode('kanban')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', color: viewMode === 'kanban' ? '#059669' : 'text.secondary' }}>
              <ViewKanbanOutlinedIcon fontSize='small' />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>

      {/* ── Status filter chips ── */}
      <Stack direction='row' spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }} useFlexGap>
        <Chip
          label='Todas'
          color={!statusFilter ? 'primary' : 'default'}
          variant={!statusFilter ? 'filled' : 'outlined'}
          onClick={() => { setStatusFilter(''); setPage(0) }}
        />
        {STATUS_ORDER.map((status) => (
          <Chip
            key={status}
            label={QUOTATION_STATUS_LABELS[status]}
            color={statusFilter === status ? 'primary' : 'default'}
            variant={statusFilter === status ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter(status === statusFilter ? '' : status); setPage(0) }}
          />
        ))}
      </Stack>

      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' minHeight='40vh'>
          <CircularProgress />
        </Box>
      ) : filteredQuotations.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '16px' }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }} />
          <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
            {statusFilter
              ? 'Ninguna cotización coincide con el filtro de estado.'
              : 'Aún no hay cotizaciones de venta de equipos.'}
          </Typography>
          <Button variant='contained' startIcon={<AddOutlinedIcon />} onClick={() => navigate('/equipment-sales/new')} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
            Nueva Cotización
          </Button>
        </Paper>
      ) : viewMode === 'list' ? (
        <>
          <Grid container spacing={2}>
            {paginatedQuotations.map((quotation) => (
              <Grid item xs={12} sm={6} md={4} key={quotation.id}>
                <Card
                  elevation={0}
                  onClick={() => navigate(`/equipment-sales/${quotation.id}`)}
                  sx={{ cursor: 'pointer', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.1)' } }}
                >
                  <CardContent>
                    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' sx={{ mb: 1 }}>
                      <Typography variant='subtitle1' fontWeight={700}>{quotation.quoteCode}</Typography>
                      {renderStatusChip(quotation.status)}
                    </Stack>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      {quotation.customer?.nombre || 'Cliente no especificado'}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Total:</strong> {currencyFormatter.format(quotation.grandTotal)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(quotation.createdAt).toLocaleDateString('es-CO')}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      {renderQuickActions(quotation)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component='div'
            count={filteredQuotations.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
            labelRowsPerPage='Filas por página'
          />
        </>
      ) : viewMode === 'table' ? (
        <MaterialReactTable
          columns={[
            {
              accessorKey: 'quoteCode',
              header: 'Código',
              size: 140,
              Cell: ({ row }) => (
                <Typography variant='body2' fontWeight={700} sx={{ color: '#111827', lineHeight: 1.2 }}>
                  {row.original.quoteCode}
                </Typography>
              )
            },
            {
              accessorFn: (q) => q.customer?.nombre || '',
              header: 'Cliente',
              size: 220,
              Cell: ({ cell }) => (
                <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 600 }}>
                  {cell.getValue<string>()}
                </Typography>
              )
            },
            {
              accessorKey: 'status',
              header: 'Estado',
              size: 150,
              filterVariant: 'select',
              filterSelectOptions: STATUS_ORDER.map((status) => ({ text: QUOTATION_STATUS_LABELS[status], value: status })),
              Cell: ({ cell }) => renderStatusChip(cell.getValue<string>())
            },
            {
              accessorFn: (q) => q.items?.length ?? 0,
              header: 'Productos',
              size: 90,
              Cell: ({ cell }) => <Typography variant='body2'>{cell.getValue<number>()}</Typography>
            },
            {
              accessorFn: (q) => Number(q.grandTotal),
              header: 'Valor',
              size: 110,
              Cell: ({ cell }) => (
                <Typography variant='body2' fontWeight={700} sx={{ color: '#059669' }}>
                  {currencyFormatter.format(cell.getValue<number>())}
                </Typography>
              )
            },
            {
              accessorFn: (q) => new Date(q.updatedAt),
              header: 'Actualizado',
              size: 90,
              Cell: ({ cell }) => (
                <Typography variant='body2' sx={{ color: '#9ca3af' }}>
                  {cell.getValue<Date>().toLocaleDateString('es-CO')}
                </Typography>
              )
            },
            {
              id: 'actions',
              header: '',
              size: 80,
              Cell: ({ row }) => (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={(e) => { e.stopPropagation(); navigate(`/equipment-sales/${row.original.id}`) }}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Ver
                </Button>
              )
            }
          ]}
          data={filteredQuotations}
          enableColumnActions={false}
          enableColumnFilters
          enableGlobalFilter
          enableSorting
          enablePagination={false}
          enableBottomToolbar={false}
          enableTopToolbar
          localization={MRT_Localization_ES}
          muiTableBodyRowProps={{
            sx: { cursor: 'pointer' }
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: { border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', overflow: 'hidden' }
          }}
          muiTableHeadCellProps={{ sx: { fontWeight: 700, color: '#6b7280' } }}
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {kanbanColumns.map((column) => (
            <Box key={column.status} sx={{ minWidth: 280, flex: 1 }}>
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: column.color }} />
                <Typography variant='subtitle2' fontWeight={700}>{column.label}</Typography>
                <Chip size='small' label={column.quotations.length} variant='outlined' sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem' } }} />
              </Stack>
              <Stack spacing={1.5}>
                {column.quotations.map((quotation) => (
                  <Card
                    key={quotation.id}
                    elevation={0}
                    onClick={() => navigate(`/equipment-sales/${quotation.id}`)}
                    sx={{ cursor: 'pointer', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant='subtitle2' fontWeight={700}>{quotation.quoteCode}</Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                        {quotation.customer?.nombre || 'Cliente no especificado'}
                      </Typography>
                      <Typography variant='body2' fontWeight={700} sx={{ mt: 1, color: '#059669' }}>
                        {currencyFormatter.format(quotation.grandTotal)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(quotation.createdAt).toLocaleDateString('es-CO')}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {column.quotations.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                    <Typography variant='caption' color='text.secondary'>Sin cotizaciones</Typography>
                  </Paper>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Template dialog ── */}
      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Plantilla global de términos y condiciones</DialogTitle>
        <DialogContent dividers>
          <Alert severity='info' sx={{ mb: 2 }}>
            Edita los términos que se cargarán por defecto al crear una nueva cotización. Usa {'{{validityDays}}'}, {'{{paymentMethod}}'}, {'{{deliveryTime}}'}, {'{{warrantyTerms}}'} como variables dinámicas.
          </Alert>
          <Stack spacing={1.5}>
            {EQUIPMENT_QUOTE_TERM_KEYS.map((termKey) => (
              <Accordion key={termKey} elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}>
                <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                  <Typography fontWeight={800}>{EQUIPMENT_QUOTE_TERM_LABELS[termKey]}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CalibrationServiceRichTextEditor
                    value={templateTerms[termKey] || ''}
                    placeholder={`Escribe ${EQUIPMENT_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                    onChange={(value) => setTerm(termKey, value)}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={() => void handleSaveTemplate()} disabled={mutations.saveQuoteTermsTemplate.isLoading}>
            Guardar plantilla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EquipmentSalesPage
