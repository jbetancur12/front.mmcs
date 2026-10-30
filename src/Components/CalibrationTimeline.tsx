import SignalLoader from 'src/Components/Common/SignalLoader'
import {
  CheckCircleOutline,
  ErrorOutline,
  KeyboardArrowDown,
  LocationOn,
  Schedule,
  SimCardDownloadOutlined
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material'
import { MRT_ColumnDef } from 'material-react-table'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCustomerCalibrationSchedule } from '@hooks/calibration/useCustomerCalibrationSchedule'

import DataTable from './Common/DataTable'
import EmptyState from './Common/EmptyState'
import StatusPill from './Common/StatusPill'

interface Device {
  deviceId: number
  deviceName: string
  serialNumber: string
  location: string
  calibrationMonth: number
  nextCalibrationMonth: number
  calibrationYear: number
  nextCalibrationYear: number
}

interface DataResponse {
  month: number
  nextMonth: number
  totalMonths: number
  startYear: number
  endYear: number
  headquarters: string[]
  devices: Device[]
}

interface Props {
  customerId?: number | string
}

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
]

const MONTH_FULL_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
]

type CellKind = 'done' | 'next' | 'overdue'

const CELL_STYLES: Record<
  CellKind,
  { label: string; color: string; bg: string; Icon: typeof Schedule }
> = {
  done: {
    label: 'Calibración realizada',
    color: '#166534',
    bg: '#dcfce7',
    Icon: CheckCircleOutline
  },
  next: {
    label: 'Próxima calibración',
    color: '#92400e',
    bg: '#fef3c7',
    Icon: Schedule
  },
  overdue: {
    label: 'Calibración vencida',
    color: '#b91c1c',
    bg: '#fee2e2',
    Icon: ErrorOutline
  }
}

// Columna del mes actual: tinte turquesa marcado, con borde fino y barra en el encabezado
const CURRENT_MONTH_BG = '#CFF3EE'
const CURRENT_MONTH_CELL_BG = '#E3F6F3'
const CURRENT_MONTH_LINE = '#8FDDD1'

/** Meses que cubre el cronograma, a partir del mes y año de inicio. */
const createTimeline = ({ month, totalMonths, startYear }: DataResponse) => {
  const months: { month: number; year: number }[] = []
  let currentMonth = month
  let currentYear = startYear
  for (let i = 0; i < totalMonths; i++) {
    months.push({ month: currentMonth, year: currentYear })
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }
  return months
}

/** Marca de una calibración en la celda de su mes: ícono en círculo con texto accesible. */
const CellMark = ({
  kind,
  device,
  month,
  year
}: {
  kind: CellKind
  device: Device
  month: number
  year: number
}) => {
  const { label, color, bg, Icon } = CELL_STYLES[kind]
  const description = `${label}: ${device.deviceName}, ${MONTH_FULL_NAMES[month - 1]} ${year}`
  return (
    <Tooltip title={description}>
      <Box
        role='img'
        aria-label={description}
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: bg,
          color,
          display: 'inline-grid',
          placeItems: 'center'
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
    </Tooltip>
  )
}

/**
 * Cronograma de calibraciones del cliente: un equipo por fila y un mes por
 * columna, con la calibración hecha, la próxima y las vencidas. La leyenda
 * lleva los conteos del mes actual.
 */
const CalibrationTimeline: React.FC<Props> = ({ customerId }) => {
  const navigate = useNavigate()
  const {
    data: scheduleData,
    isLoading,
    isIdle,
    isError
  } = useCustomerCalibrationSchedule<DataResponse>(customerId)
  // Sin cliente la petición no se lanza y se mantiene el esqueleto de carga
  const loading = isLoading || isIdle
  const timeline = useMemo(
    () => (scheduleData ? createTimeline(scheduleData) : []),
    [scheduleData]
  )
  const devices = useMemo<Device[]>(
    () => scheduleData?.devices ?? [],
    [scheduleData]
  )
  const headquarters: string[] = scheduleData?.headquarters ?? []

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentDate = new Date(currentYear, currentMonth - 1)

  const isOverdue = (device: Device) =>
    new Date(device.nextCalibrationYear, device.nextCalibrationMonth - 1) <
    currentDate

  const counts = useMemo(
    () => ({
      done: devices.filter(
        (d) =>
          d.calibrationMonth === currentMonth &&
          d.calibrationYear === currentYear
      ).length,
      next: devices.filter(
        (d) =>
          d.nextCalibrationMonth === currentMonth &&
          d.nextCalibrationYear === currentYear
      ).length,
      overdue: devices.filter(isOverdue).length
    }),
    // isOverdue depende solo del mes actual
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, currentMonth, currentYear]
  )

  const columns = useMemo<MRT_ColumnDef<Device>[]>(
    () => [
      {
        id: 'equipo',
        header: 'Equipo',
        size: 300,
        accessorFn: (row) =>
          `${row.deviceName} ${row.serialNumber ?? ''} ${row.location ?? ''}`,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' fontWeight={600}>
              {row.original.deviceName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Serie {row.original.serialNumber || '—'} ·{' '}
              {row.original.location || 'Sin ubicación'}
            </Typography>
          </Box>
        )
      },
      ...timeline.map<MRT_ColumnDef<Device>>(({ month, year }) => {
        const isCurrent = month === currentMonth && year === currentYear
        return {
          id: `m-${year}-${month}`,
          header: `${MONTH_NAMES[month - 1]} ${year}`,
          size: 72,
          minSize: 72,
          enableSorting: false,
          enableColumnActions: false,
          Header: () => (
            <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
              <Typography variant='body2' fontWeight={700}>
                {MONTH_NAMES[month - 1]}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {year}
              </Typography>
              {isCurrent ? (
                <Typography
                  variant='caption'
                  display='block'
                  sx={{ color: '#00695C', fontWeight: 700 }}
                >
                  Actual
                </Typography>
              ) : null}
            </Box>
          ),
          muiTableHeadCellProps: {
            align: 'center',
            sx: isCurrent
              ? {
                  backgroundColor: CURRENT_MONTH_BG,
                  borderBottom: '3px solid #00BFA5',
                  borderLeft: `1px solid ${CURRENT_MONTH_LINE}`,
                  borderRight: `1px solid ${CURRENT_MONTH_LINE}`
                }
              : undefined
          },
          muiTableBodyCellProps: {
            align: 'center',
            className: isCurrent ? 'current-month' : undefined,
            sx: isCurrent
              ? {
                  backgroundColor: CURRENT_MONTH_CELL_BG,
                  borderLeft: `1px solid ${CURRENT_MONTH_LINE}`,
                  borderRight: `1px solid ${CURRENT_MONTH_LINE}`
                }
              : undefined
          },
          accessorFn: () => '',
          Cell: ({ row }) => {
            const device = row.original
            const done =
              month === device.calibrationMonth &&
              year === device.calibrationYear
            const next =
              month === device.nextCalibrationMonth &&
              year === device.nextCalibrationYear
            if (!done && !next) return null
            return (
              <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                {done ? (
                  <CellMark
                    kind='done'
                    device={device}
                    month={month}
                    year={year}
                  />
                ) : null}
                {next ? (
                  <CellMark
                    kind={isOverdue(device) ? 'overdue' : 'next'}
                    device={device}
                    month={month}
                    year={year}
                  />
                ) : null}
              </Box>
            )
          }
        }
      })
    ],
    // isOverdue depende solo del mes actual
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeline, currentMonth, currentYear]
  )

  if (loading) {
    return <SignalLoader message='Cargando programación...' />
  }

  if (isError) {
    return <Alert severity='error'>Error al cargar la programación.</Alert>
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
            Programación
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Cuándo se calibró cada equipo y cuándo le toca de nuevo.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<SimCardDownloadOutlined />}
          endIcon={<KeyboardArrowDown />}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          disabled={headquarters.length === 0}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e5e7eb',
            color: '#374151',
            bgcolor: '#fff',
            '&:hover': {
              borderColor: '#00897B',
              color: '#00695C',
              bgcolor: '#E0F7F4'
            }
          }}
        >
          Exportar PDF
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 180 } } }}
        >
          {headquarters.map((headquarter) => (
            <MenuItem
              key={headquarter}
              onClick={() => {
                setAnchorEl(null)
                navigate(`schedule/pdf?headquarter=${headquarter}`)
              }}
            >
              <LocationOn sx={{ mr: 1, fontSize: 18, color: '#00695C' }} />
              {headquarter}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Leyenda con los conteos del mes actual */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 2
        }}
        aria-label='Leyenda del cronograma'
      >
        <Typography variant='body2' color='text.secondary'>
          Este mes:
        </Typography>
        <StatusPill
          size='small'
          tone='success'
          label={`${counts.done} calibradas`}
        />
        <StatusPill
          size='small'
          tone='warning'
          label={`${counts.next} por calibrar`}
        />
        <StatusPill
          size='small'
          tone={counts.overdue > 0 ? 'error' : 'idle'}
          label={`${counts.overdue} vencidas`}
        />
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            ml: { sm: 1 }
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 14,
              height: 14,
              borderRadius: '4px',
              bgcolor: CURRENT_MONTH_BG,
              border: '1px solid #00BFA5'
            }}
          />
          <Typography variant='body2' color='text.secondary'>
            Mes actual
          </Typography>
        </Box>
      </Box>

      <DataTable<Device>
        columns={columns}
        data={devices}
        itemLabel={['equipo', 'equipos']}
        searchPlaceholder='Buscar por equipo, serie o ubicación'
        enablePinning
        enableSorting={false}
        initialState={{
          columnPinning: { left: ['equipo'] },
          pagination: { pageIndex: 0, pageSize: 25 }
        }}
        muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50] }}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        // Línea resaltada al pasar el mouse; el mes actual conserva su tinte, un poco más fuerte
        muiTableBodyRowProps={{
          sx: {
            '&&&&:hover > td': { backgroundColor: '#E6F7F5' },
            '&&&&:hover > td.current-month': { backgroundColor: '#C9EEE8' }
          }
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<Schedule />}
            title='No hay equipos programados'
            hint='Cuando el cliente tenga certificados, aquí verás cuándo toca calibrar cada equipo.'
          />
        )}
      />
    </Box>
  )
}

export default CalibrationTimeline
