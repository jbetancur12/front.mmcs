import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { MRT_Cell, MRT_ColumnDef, MRT_Row } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import StatusPill from 'src/Components/Common/StatusPill'
import {
  CALIBRATION_SERVICE_SLA_COLORS,
  chipColorToStatusTone
} from '../../../constants/calibrationServices'
import {
  CalibrationService,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import CalibrationServiceStatusChip from '../CalibrationServiceStatusChip'
import {
  currencyFormatter,
  FILTER_ALL,
  SLA_OPTIONS,
  SLA_FILTER_ALERT,
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

interface CalibrationServicesTableProps {
  services: CalibrationService[]
  isTechnicalOnlyView: boolean
  isAnalystOnlyView: boolean
  openServiceDetail: (serviceId: number) => void
}

const Empty = () => (
  <Typography variant='body2' sx={{ color: ui.muted }}>
    —
  </Typography>
)

/** Vista de tabla de los servicios cargados, con DataTable del sistema. */
const CalibrationServicesTable = ({
  services,
  isTechnicalOnlyView,
  isAnalystOnlyView,
  openServiceDetail
}: CalibrationServicesTableProps) => {
  const showCommercial = !isTechnicalOnlyView && !isAnalystOnlyView

  const columns: MRT_ColumnDef<CalibrationService>[] = [
    {
      accessorKey: 'serviceCode',
      header: 'Código',
      size: 120,
      Cell: ({ row }: ServiceCellProps) => (
        <Stack spacing={0.25}>
          <Typography
            variant='body2'
            fontWeight={700}
            sx={{
              color: ui.text,
              lineHeight: 1.2,
              fontSize: 13,
              whiteSpace: 'nowrap'
            }}
          >
            {row.original.serviceCode}
          </Typography>
          {row.original.odsCode ? (
            <Typography variant='caption' sx={{ color: ui.textSecondary }}>
              {row.original.odsCode}
            </Typography>
          ) : null}
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
      size: 170,
      Cell: ({ row }: ServiceCellProps) => (
        <Stack spacing={0.25}>
          <Typography
            variant='body2'
            sx={{ color: ui.text, fontWeight: 600, lineHeight: 1.3 }}
          >
            {row.original.customer?.nombre ||
              row.original.executionCustomerName ||
              ''}
          </Typography>
          {row.original.scopeType === 'site' ? (
            <Typography variant='caption' sx={{ color: ui.textSecondary }}>
              Sede: {getServiceSiteLabel(row.original)}
            </Typography>
          ) : null}
        </Stack>
      )
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      size: 150,
      filterVariant: 'select',
      filterSelectOptions: STATUS_OPTIONS.filter(
        (o) => o.value !== FILTER_ALL
      ).map((o) => ({
        text: o.label,
        value: o.value
      })),
      Cell: ({ cell }: ServiceCellProps) => (
        <CalibrationServiceStatusChip
          status={cell.getValue<CalibrationServiceStatus>()}
        />
      )
    },
    {
      accessorFn: (s) => getServiceOperationalFocus(s)?.label ?? '',
      id: 'billing',
      header: 'Facturación',
      size: 140,
      filterVariant: 'select',
      filterSelectOptions: [
        'Por facturar',
        'Por facturar corte',
        'Facturado',
        'Facturado corte',
        'Pendiente corte',
        'Listo para cierre final',
        'Pendiente administrativo'
      ].map((value) => ({ text: value, value })),
      Cell: ({ row }: ServiceCellProps) => {
        const focus = getServiceOperationalFocus(row.original)
        return focus ? (
          <StatusPill
            size='small'
            tone={chipColorToStatusTone(focus.color)}
            label={focus.label}
          />
        ) : (
          <Empty />
        )
      }
    },
    {
      accessorFn: (s) => s.slaIndicator?.color || 'gray',
      id: 'sla',
      header: 'Semáforo',
      size: 130,
      filterVariant: 'select',
      filterSelectOptions: SLA_OPTIONS.filter(
        (o) =>
          o.value !== FILTER_ALL && (o.value as string) !== SLA_FILTER_ALERT
      ).map((o) => ({ text: o.label, value: o.value })),
      Cell: ({ row }: ServiceCellProps) =>
        row.original.slaIndicator?.label ? (
          <StatusPill
            size='small'
            tone={chipColorToStatusTone(
              CALIBRATION_SERVICE_SLA_COLORS[
                row.original.slaIndicator?.color || 'gray'
              ]
            )}
            label={row.original.slaIndicator.label}
          />
        ) : (
          <Empty />
        )
    },
    ...(showCommercial
      ? ([
          {
            id: 'total',
            accessorFn: (s: CalibrationService) => getItemsTotal(s),
            header: 'Valor',
            size: 110,
            Cell: ({ cell }: ServiceCellProps) => (
              <Typography
                variant='body2'
                fontWeight={700}
                sx={{ color: '#00695C' }}
              >
                {currencyFormatter.format(cell.getValue() as number)}
              </Typography>
            )
          }
        ] as MRT_ColumnDef<CalibrationService>[])
      : []),
    {
      id: 'updatedAt',
      accessorFn: (s) => new Date(s.updatedAt),
      header: 'Actualizado',
      size: 110,
      sortingFn: 'datetime',
      Cell: ({ cell }: ServiceCellProps) => (
        <Typography variant='body2' sx={{ color: ui.textSecondary }}>
          {cell.getValue<Date>().toLocaleDateString('es-CO')}
        </Typography>
      )
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={services}
      itemLabel={['servicio', 'servicios']}
      // La búsqueda de la bandeja (en el servidor) ya está arriba
      enableGlobalFilter={false}
      initialState={{
        pagination: { pageIndex: 0, pageSize: 25 },
        // Se puede mostrar desde el botón de columnas
        columnVisibility: { updatedAt: false }
      }}
      displayColumnDefOptions={{
        'mrt-row-actions': {
          header: 'Ver',
          size: 64,
          muiTableHeadCellProps: {
            align: 'left',
            sx: { backgroundColor: '#f3f4f6' }
          },
          muiTableBodyCellProps: {
            align: 'left',
            sx: { backgroundColor: '#fff', boxShadow: '-1px 0 0 #e5e7eb' }
          }
        }
      }}
      enableColumnFilters
      enableRowActions
      renderRowActions={({ row }: { row: MRT_Row<CalibrationService> }) => (
        <Tooltip title='Ver detalle'>
          <IconButton
            size='small'
            aria-label={`Ver ${row.original.serviceCode}`}
            onClick={(event) => {
              event.stopPropagation()
              openServiceDetail(row.original.id)
            }}
            sx={{ color: '#00695C' }}
          >
            <VisibilityOutlinedIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      )}
      muiTableBodyRowProps={({
        row
      }: {
        row: MRT_Row<CalibrationService>
      }) => ({
        onClick: () => openServiceDetail(row.original.id),
        sx: { cursor: 'pointer' }
      })}
    />
  )
}

export default CalibrationServicesTable
