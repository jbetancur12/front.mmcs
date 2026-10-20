import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import MaterialReactTable, { MRT_Cell, MRT_Row } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_SLA_COLORS
} from '../../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceApprovalStatus,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import {
  APPROVAL_OPTIONS,
  currencyFormatter,
  FILTER_ALL,
  SLA_OPTIONS,
  STATUS_OPTIONS,
  ui
} from './calibrationServicesListConstants'
import {
  getItemsTotal,
  getServiceOperationalFocus,
  getServiceSiteLabel
} from './calibrationServicesListUtils'

/** Parámetros que usan las celdas personalizadas de la tabla. */
interface ServiceCellProps {
  row: MRT_Row<CalibrationService>
  cell: MRT_Cell<CalibrationService>
}

interface ServiceRowProps {
  row: MRT_Row<CalibrationService>
}

interface CalibrationServicesTableProps {
  services: CalibrationService[]
  isTechnicalOnlyView: boolean
  isAnalystOnlyView: boolean
  openServiceDetail: (serviceId: number) => void
}

/** Vista de tabla (Material React Table) de los servicios visibles. */
const CalibrationServicesTable = ({
  services,
  isTechnicalOnlyView,
  isAnalystOnlyView,
  openServiceDetail
}: CalibrationServicesTableProps) => {
  const getRowProps = ({ row }: ServiceRowProps) => ({
    onClick: () => openServiceDetail(row.original.id),
    sx: { cursor: 'pointer', '&:hover td': { backgroundColor: ui.greenLight } }
  })

  return (
    <MaterialReactTable
      columns={[
        {
          accessorKey: 'serviceCode',
          header: 'Código',
          size: 140,
          Cell: ({ row }: ServiceCellProps) => (
            <Stack spacing={0.5}>
              <Typography variant='body2' fontWeight={700} sx={{ color: ui.text, lineHeight: 1.2 }}>{row.original.serviceCode}</Typography>
              {row.original.odsCode ? <Typography variant='caption' sx={{ color: ui.greenDark }}>{row.original.odsCode}</Typography> : null}
            </Stack>
          )
        },
        {
          id: 'customer',
          accessorFn: (s) =>
            [
              s.customer?.nombre || s.executionCustomerName || '',
              s.scopeType === 'site' ? getServiceSiteLabel(s) : ''
            ]
              .filter(Boolean)
              .join(' '),
          header: 'Cliente',
          size: 200,
          Cell: ({ row }: ServiceCellProps) => (
            <Stack spacing={0.5}>
              <Typography variant='body2' sx={{ color: ui.textSecondary, fontWeight: 600, lineHeight: 1.2 }}>
                {row.original.customer?.nombre || row.original.executionCustomerName || ''}
              </Typography>
              {row.original.scopeType === 'site' ? (
                <Typography variant='caption' sx={{ color: ui.muted }}>
                  Sede: {getServiceSiteLabel(row.original)}
                </Typography>
              ) : null}
            </Stack>
          )
        },
        {
          accessorKey: 'status',
          header: 'Estado',
          size: 130,
          filterVariant: 'select',
          filterSelectOptions: STATUS_OPTIONS.filter(o => o.value !== FILTER_ALL).map(o => ({ text: o.label, value: o.value })),
          Cell: ({ cell }: ServiceCellProps) => <CalibrationServiceStatusChip status={cell.getValue<CalibrationServiceStatus>()} />
        },
        {
          accessorFn: (s) => getServiceOperationalFocus(s)?.label ?? '',
          id: 'billing',
          header: 'Facturación',
          size: 150,
          filterVariant: 'select',
          filterSelectOptions: [
            { text: 'Por facturar', value: 'Por facturar' },
            { text: 'Por facturar corte', value: 'Por facturar corte' },
            { text: 'Facturado', value: 'Facturado' },
            { text: 'Facturado corte', value: 'Facturado corte' },
            { text: 'Pendiente corte', value: 'Pendiente corte' },
            { text: 'Listo para cierre final', value: 'Listo para cierre final' },
            { text: 'Pendiente administrativo', value: 'Pendiente administrativo' }
          ],
          Cell: ({ row }: ServiceCellProps) => {
            const focus = getServiceOperationalFocus(row.original)
            return focus ? <Chip size='small' color={focus.color} variant='outlined' label={focus.label} /> : <Typography variant='body2' sx={{ color: ui.muted }}>—</Typography>
          }
        },
        {
          accessorKey: 'slaIndicator.color',
          header: 'SLA',
          size: 90,
          filterVariant: 'select',
          filterSelectOptions: SLA_OPTIONS.filter(o => o.value !== FILTER_ALL).map(o => ({ text: o.label, value: o.value })),
          Cell: ({ row }: ServiceCellProps) => <Chip size='small' color={CALIBRATION_SERVICE_SLA_COLORS[row.original.slaIndicator?.color || 'gray']} label={row.original.slaIndicator?.label || '—'} />
        },
        ...(!isTechnicalOnlyView && !isAnalystOnlyView ? [{
          accessorKey: 'approvalStatus' as const,
          header: 'Respuesta cliente' as const,
          size: 130 as const,
          filterVariant: 'select' as const,
          filterSelectOptions: APPROVAL_OPTIONS.filter((o) => o.value !== FILTER_ALL).map((o) => ({ text: o.label, value: o.value })),
          Cell: ({ cell }: ServiceCellProps) => <Chip size='small' color={CALIBRATION_SERVICE_APPROVAL_COLORS[cell.getValue<CalibrationServiceApprovalStatus>()]} label={CALIBRATION_SERVICE_APPROVAL_LABELS[cell.getValue<CalibrationServiceApprovalStatus>()]} />
        }] : []),
        ...(!isTechnicalOnlyView && !isAnalystOnlyView ? [{
          accessorFn: (s: CalibrationService) => getItemsTotal(s),
          header: 'Valor' as const,
          size: 100 as const,
          Cell: ({ cell }: ServiceCellProps) => <Typography variant='body2' fontWeight={700} sx={{ color: ui.greenDark }}>{currencyFormatter.format(cell.getValue() as number)}</Typography>
        }] : []),
        {
          accessorFn: (s) => new Date(s.updatedAt),
          header: 'Actualizado',
          size: 90,
          Cell: ({ cell }: ServiceCellProps) => <Typography variant='body2' sx={{ color: ui.muted }}>{cell.getValue<Date>().toLocaleDateString('es-CO')}</Typography>
        },
        {
          id: 'actions',
          header: '',
          size: 80,
          enablePinning: true,
          Cell: ({ row }: ServiceCellProps) => (
            <Tooltip title='Ver detalle'>
              <IconButton
                size='small'
                aria-label='Ver detalle'
                onClick={(event) => {
                  event.stopPropagation()
                  openServiceDetail(row.original.id)
                }}
                sx={{ color: ui.greenDark }}
              >
                <VisibilityOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )
        }
      ]}
      data={services}
      enableColumnActions={false}
      enablePinning
      initialState={{ columnPinning: { right: ['actions'] } }}
      enableColumnFilters
      enableGlobalFilter
      enablePagination={false}
      enableSorting
      enableBottomToolbar={false}
      enableTopToolbar
      localization={MRT_Localization_ES}
      muiTableBodyRowProps={getRowProps}
      muiTableProps={{
        sx: { borderRadius: '16px', border: `1px solid ${ui.border}`, '& td': { py: 0.75 } }
      }}
    />
  )
}

export default CalibrationServicesTable
