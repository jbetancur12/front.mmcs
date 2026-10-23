import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan, useHasRole } from '@utils/functions'
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
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import RequestQuoteOutlined from '@mui/icons-material/RequestQuoteOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { toast } from 'react-hot-toast'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import ListItemCard from 'src/Components/Common/ListItemCard'
import StagePipeline from 'src/Components/Common/StagePipeline'
import StatusPill from 'src/Components/Common/StatusPill'
import {
  useEquipmentQuotations,
  useEquipmentSalesMutations,
  useEquipmentQuoteTermsTemplate,
  useEquipmentSequenceConfig
} from '../../hooks/useEquipmentSales'
import {
  EQUIPMENT_QUOTATION_STATUS_COLORS,
  EQUIPMENT_QUOTATION_STATUS_LABELS,
  EQUIPMENT_QUOTATION_STATUS_TONES
} from '../../constants/equipmentSales'
import {
  EquipmentQuotation,
  EquipmentQuotationStatus
} from '../../types/equipmentSales'
import CalibrationServiceRichTextEditor from '../calibration-services/CalibrationServiceRichTextEditor'
import {
  EQUIPMENT_QUOTE_TERM_KEYS,
  EQUIPMENT_QUOTE_TERM_LABELS,
  mergeEquipmentQuoteTerms
} from './equipmentQuoteTerms'
import EquipmentSalesSequenceConfigDialog from './EquipmentSalesSequenceConfigDialog'
import { ROLE_GROUPS } from 'src/constants/roles'
import { confirmDialog } from 'src/utils/confirm'

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

// Ciclo comercial en el orden en que ocurre; rechazada y cancelada salen de él.
const PIPELINE_STATUSES: EquipmentQuotationStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'ready_for_invoicing',
  'invoiced'
]
const OUTSIDE_STATUSES: EquipmentQuotationStatus[] = ['rejected', 'cancelled']

const QUOTATION_STATUS_LABELS: Record<string, string> =
  EQUIPMENT_QUOTATION_STATUS_LABELS
const QUOTATION_STATUS_COLORS: Record<string, string> =
  EQUIPMENT_QUOTATION_STATUS_COLORS

const EquipmentSalesPage = () => {
  const navigate = useNavigate()
  const canCreate = useCan(PERMISSIONS.SALES_QUOTATION_CREATE)
  const canUpdate = useCan(PERMISSIONS.SALES_QUOTATION_UPDATE)
  const canWorkflow = useCan(PERMISSIONS.SALES_QUOTATION_WORKFLOW)
  const canSeeProducts = useCan(PERMISSIONS.SALES_PRODUCT_VIEW)
  const canConfig = useCan(PERMISSIONS.SALES_CONFIG_MANAGE)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateTerms, setTemplateTerms] = useState<Record<string, string>>({})
  const { data: templateData } = useEquipmentQuoteTermsTemplate()
  const { data, isLoading } = useEquipmentQuotations({ limit: 500 })
  const mutations = useEquipmentSalesMutations()
  const isAdmin = useHasRole(ROLE_GROUPS.ADMINS)
  const { data: sequenceConfig } = useEquipmentSequenceConfig(canConfig)
  const [configAnchor, setConfigAnchor] = useState<null | HTMLElement>(null)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)

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
    () =>
      filteredQuotations.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredQuotations, page, rowsPerPage]
  )

  const kanbanColumns = useMemo(
    () =>
      STATUS_ORDER.filter(
        (status) => status !== 'rejected' && status !== 'cancelled'
      ).map((status) => ({
        status,
        label: QUOTATION_STATUS_LABELS[status],
        color: QUOTATION_STATUS_COLORS[status],
        quotations: filteredQuotations.filter((q) => q.status === status)
      })),
    [filteredQuotations]
  )

  const handleOpenTemplate = () => {
    setTemplateTerms(
      mergeEquipmentQuoteTerms(
        templateData?.terms as Record<string, string> | null
      )
    )
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
    const result = await confirmDialog({ title: `¿Marcar la cotización ${quotation.quoteCode} como enviada al cliente?`, confirmLabel: 'Sí, marcar como enviada', cancelLabel: 'Cancelar' })
    if (!result.isConfirmed) return
    try {
      await mutations.requestApproval.mutateAsync(quotation.id)
      toast.success('Cotización enviada al cliente.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos enviar la cotización.')
    }
  }

  const renderStatusChip = (status: string) => (
    <StatusPill
      size='small'
      label={QUOTATION_STATUS_LABELS[status] || status}
      tone={EQUIPMENT_QUOTATION_STATUS_TONES[status] || 'idle'}
    />
  )

  const selectStatus = (status: string) => {
    setStatusFilter(status)
    setPage(0)
  }

  const renderQuickActions = (quotation: EquipmentQuotation) => (
    <Stack direction='row' spacing={0.5}>
      {quotation.status === 'draft' && (canUpdate || canWorkflow) ? (
        <>
          {canUpdate ? (
            <Tooltip title='Editar'>
              <IconButton
                size='small'
                aria-label={`Editar ${quotation.quoteCode}`}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/equipment-sales/${quotation.id}/edit`)
                }}
              >
                <EditOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          ) : null}
          {canWorkflow ? (
            <Tooltip title='Enviar al cliente'>
              <IconButton
                size='small'
                aria-label={`Enviar ${quotation.quoteCode} al cliente`}
                sx={{ color: '#00695C' }}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleSend(quotation)
                }}
              >
                <SendOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          ) : null}
        </>
      ) : null}
    </Stack>
  )

  const tableColumns = useMemo<MRT_ColumnDef<EquipmentQuotation>[]>(
    () => [
      {
        accessorKey: 'quoteCode',
        header: 'Código',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<EquipmentQuotation> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        accessorFn: (q) => q.customer?.nombre || '',
        id: 'customer',
        header: 'Cliente',
        size: 240
      },
      {
        accessorFn: (q) => q.createdBy?.nombre || 'Sin registro',
        id: 'createdBy',
        header: 'Creada por',
        size: 190
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 170,
        filterVariant: 'select',
        filterSelectOptions: STATUS_ORDER.map((status) => ({
          text: QUOTATION_STATUS_LABELS[status],
          value: status
        })),
        Cell: ({ cell }: { cell: MRT_Cell<EquipmentQuotation> }) =>
          renderStatusChip(cell.getValue<string>())
      },
      {
        accessorFn: (q) => q.items?.length ?? 0,
        id: 'items',
        header: 'Productos',
        size: 100,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' }
      },
      {
        accessorFn: (q) => Number(q.grandTotal),
        id: 'grandTotal',
        header: 'Valor',
        size: 150,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ cell }: { cell: MRT_Cell<EquipmentQuotation> }) => (
          <span>{currencyFormatter.format(cell.getValue<number>())}</span>
        )
      },
      {
        accessorFn: (q) => new Date(q.updatedAt),
        id: 'updatedAt',
        header: 'Actualizada',
        size: 130,
        Cell: ({ cell }: { cell: MRT_Cell<EquipmentQuotation> }) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {cell.getValue<Date>().toLocaleDateString('es-CO')}
          </span>
        )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>

      <LmsPageHeader
        title='Cotizaciones de venta de equipos'
        subtitle='Sigue cada cotización desde el borrador hasta la factura.'
        icon={<RequestQuoteOutlined />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<GroupOutlinedIcon />}
              onClick={() => navigate('/calibration-services/customers')}
              sx={{
                color: '#00897B',
                borderColor: '#00BFA5',
                '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
              }}
            >
              Clientes
            </Button>
            {canSeeProducts ? (
              <Button
                variant='outlined'
                startIcon={<Inventory2OutlinedIcon />}
                onClick={() => navigate('/equipment-sales/products')}
                sx={{
                  color: '#00897B',
                  borderColor: '#00BFA5',
                  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
                }}
              >
                Productos
              </Button>
            ) : null}
            {canConfig ? (
              <>
                <Button
                  variant='outlined'
                  startIcon={<SettingsOutlinedIcon />}
                  onClick={(event) => setConfigAnchor(event.currentTarget)}
                  aria-haspopup='menu'
                  aria-expanded={Boolean(configAnchor)}
                  sx={{
                    color: '#00897B',
                    borderColor: '#00BFA5',
                    '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
                  }}
                >
                  Configuración
                </Button>
                <Menu
                  anchorEl={configAnchor}
                  open={Boolean(configAnchor)}
                  onClose={() => setConfigAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      setConfigAnchor(null)
                      handleOpenTemplate()
                    }}
                  >
                    Plantilla de términos
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setConfigAnchor(null)
                      setIsSequenceDialogOpen(true)
                    }}
                  >
                    Consecutivo de cotizaciones
                  </MenuItem>
                </Menu>
              </>
            ) : null}
            {canCreate ? (
              <Button
                variant='contained'
                startIcon={<AddOutlinedIcon />}
                onClick={() => navigate('/equipment-sales/new')}
                sx={{
                  bgcolor: '#00BFA5',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#00ACC1' }
                }}
              >
                Nueva cotización
              </Button>
            ) : null}
          </>
        }
      />

      <StagePipeline
        ariaLabel='Filtrar cotizaciones por etapa'
        total={quotations.length}
        selected={statusFilter}
        onSelect={selectStatus}
        stages={PIPELINE_STATUSES.map((status) => ({
          key: status,
          label: QUOTATION_STATUS_LABELS[status],
          count: statusCounts[status] ?? 0
        }))}
        outside={OUTSIDE_STATUSES.map((status) => ({
          key: status,
          label: QUOTATION_STATUS_LABELS[status],
          count: statusCounts[status] ?? 0
        }))}
      />

      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant='body2' color='text.secondary' aria-live='polite'>
          {filteredQuotations.length === 1
            ? '1 cotización'
            : `${filteredQuotations.length} cotizaciones`}
          {statusFilter
            ? ` en estado ${QUOTATION_STATUS_LABELS[statusFilter].toLowerCase()}`
            : ''}
        </Typography>
        <Stack direction='row' spacing={0.5} role='group' aria-label='Vista'>
          {(
            [
              [
                'list',
                'Ver como tarjetas',
                <ViewStreamOutlinedIcon key='list' fontSize='small' />
              ],
              [
                'table',
                'Ver como tabla',
                <TableChartOutlinedIcon key='table' fontSize='small' />
              ],
              [
                'kanban',
                'Ver por etapa',
                <ViewKanbanOutlinedIcon key='kanban' fontSize='small' />
              ]
            ] as [ViewMode, string, React.ReactNode][]
          ).map(([mode, label, icon]) => (
            <Tooltip key={mode} title={label}>
              <IconButton
                size='small'
                aria-label={label}
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                sx={{
                  border: '1px solid',
                  borderColor: viewMode === mode ? '#00695C' : 'divider',
                  borderRadius: '8px',
                  color: viewMode === mode ? '#00695C' : 'text.secondary',
                  bgcolor: viewMode === mode ? '#E0F7F4' : 'transparent'
                }}
              >
                {icon}
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='40vh'
        >
          <CircularProgress />
        </Box>
      ) : filteredQuotations.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '16px'
          }}
        >
          <Inventory2OutlinedIcon
            sx={{ fontSize: 48, color: '#d1d5db', mb: 1 }}
          />
          <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
            {statusFilter
              ? 'No hay cotizaciones en esta etapa.'
              : 'Aún no hay cotizaciones de venta de equipos. Crea la primera para empezar.'}
          </Typography>
          {canCreate ? (
            <Button
              variant='contained'
              startIcon={<AddOutlinedIcon />}
              onClick={() => navigate('/equipment-sales/new')}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              Nueva cotización
            </Button>
          ) : null}
        </Paper>
      ) : viewMode === 'list' ? (
        <>
          <Grid container spacing={2}>
            {paginatedQuotations.map((quotation) => (
              <Grid item xs={12} sm={6} md={4} key={quotation.id}>
                <ListItemCard
                  title={quotation.quoteCode}
                  subtitle={
                    quotation.customer?.nombre || 'Cliente no especificado'
                  }
                  status={renderStatusChip(quotation.status)}
                  highlight={
                    <>
                      <strong>Total:</strong>{' '}
                      {currencyFormatter.format(quotation.grandTotal)}
                    </>
                  }
                  meta={[
                    `Creada por ${quotation.createdBy?.nombre || 'Sin registro'}`,
                    new Date(quotation.createdAt).toLocaleDateString('es-CO')
                  ]}
                  actions={renderQuickActions(quotation)}
                  onClick={() => navigate(`/equipment-sales/${quotation.id}`)}
                />
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component='div'
            count={filteredQuotations.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            labelRowsPerPage='Por página'
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
            getItemAriaLabel={(type) =>
              type === 'previous'
                ? 'Página anterior'
                : type === 'next'
                  ? 'Página siguiente'
                  : type === 'first'
                    ? 'Primera página'
                    : 'Última página'
            }
          />
        </>
      ) : viewMode === 'table' ? (
        <DataTable
          columns={tableColumns}
          data={filteredQuotations}
          itemLabel={['cotización', 'cotizaciones']}
          searchPlaceholder='Buscar cotizaciones'
          enableRowActions
          enableSorting
          initialState={{ density: 'compact' }}
          muiTableBodyRowProps={({ row }) => ({
            onClick: () => navigate(`/equipment-sales/${row.original.id}`),
            sx: { cursor: 'pointer' }
          })}
          renderRowActions={({ row }) => (
            <Tooltip title='Ver cotización'>
              <IconButton
                size='small'
                aria-label={`Ver cotización ${row.original.quoteCode}`}
                sx={{ color: '#00695C' }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/equipment-sales/${row.original.id}`)
                }}
              >
                <VisibilityOutlined />
              </IconButton>
            </Tooltip>
          )}
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {kanbanColumns.map((column) => (
            <Box key={column.status} sx={{ minWidth: 280, flex: 1 }}>
              <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: column.color
                  }}
                />
                <Typography variant='subtitle2' fontWeight={700}>
                  {column.label}
                </Typography>
                <Chip
                  size='small'
                  label={column.quotations.length}
                  variant='outlined'
                  sx={{
                    height: 20,
                    '& .MuiChip-label': { fontSize: '0.7rem' }
                  }}
                />
              </Stack>
              <Stack spacing={1.5}>
                {column.quotations.map((quotation) => (
                  <Card
                    key={quotation.id}
                    elevation={0}
                    onClick={() => navigate(`/equipment-sales/${quotation.id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant='subtitle2' fontWeight={700}>
                        {quotation.quoteCode}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {quotation.customer?.nombre ||
                          'Cliente no especificado'}
                      </Typography>
                      <Typography
                        variant='body2'
                        fontWeight={700}
                        sx={{ mt: 1, color: '#059669' }}
                      >
                        {currencyFormatter.format(quotation.grandTotal)}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Creada por{' '}
                        {quotation.createdBy?.nombre || 'Sin registro'}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block' }}
                      >
                        {new Date(quotation.createdAt).toLocaleDateString(
                          'es-CO'
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {column.quotations.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: '12px'
                    }}
                  >
                    <Typography variant='caption' color='text.secondary'>
                      Sin cotizaciones
                    </Typography>
                  </Paper>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      <EquipmentSalesSequenceConfigDialog
        open={isSequenceDialogOpen}
        config={sequenceConfig}
        isAdmin={isAdmin}
        isLoading={mutations.upsertSequenceConfig.isLoading}
        onClose={() => setIsSequenceDialogOpen(false)}
        onSubmit={async (values) => {
          try {
            await mutations.upsertSequenceConfig.mutateAsync(values)
            toast.success('El consecutivo de cotizaciones quedó configurado.')
            setIsSequenceDialogOpen(false)
          } catch (error) {
            console.error(error)
            toast.error('No se pudo guardar el consecutivo.')
          }
        }}
      />

      {/* ── Template dialog ── */}
      <Dialog
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Plantilla global de términos y condiciones</DialogTitle>
        <DialogContent dividers>
          <Alert severity='info' sx={{ mb: 2 }}>
            Edita los términos que se cargarán por defecto al crear una nueva
            cotización. Usa {'{{validityDays}}'}, {'{{paymentMethod}}'},{' '}
            {'{{deliveryTime}}'}, {'{{warrantyTerms}}'} como variables
            dinámicas.
          </Alert>
          <Stack spacing={1.5}>
            {EQUIPMENT_QUOTE_TERM_KEYS.map((termKey) => (
              <Accordion
                key={termKey}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                  <Typography fontWeight={800}>
                    {EQUIPMENT_QUOTE_TERM_LABELS[termKey]}
                  </Typography>
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
          <Button
            variant='contained'
            onClick={() => void handleSaveTemplate()}
            disabled={mutations.saveQuoteTermsTemplate.isLoading}
          >
            Guardar plantilla
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default EquipmentSalesPage
