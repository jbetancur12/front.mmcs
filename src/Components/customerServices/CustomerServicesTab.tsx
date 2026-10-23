import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { AssignmentOutlined } from '@mui/icons-material'
import { MRT_ColumnDef } from 'material-react-table'
import { getApiErrorMessage } from '@utils/apiError'
import { useCustomerServices } from 'src/hooks/useCustomerServices'
import { CalibrationServiceStatus } from 'src/types/calibrationService'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS,
  chipColorToStatusTone
} from 'src/constants/calibrationServices'
import { CustomerServiceSummary } from 'src/types/customerIndicators'
import DataTable from '../Common/DataTable'
import EmptyState from '../Common/EmptyState'
import StatusPill from '../Common/StatusPill'
import {
  TEAL_TEXT,
  formatCount,
  formatDate,
  formatSigned
} from '../customerIndicators/indicatorFormat'
import ServiceDocumentButtons from './ServiceDocumentButtons'

interface Props {
  customerId: number | string
}

const STATUS_OPTIONS: CalibrationServiceStatus[] = [
  'pending_programming',
  'scheduled',
  'in_execution',
  'technically_completed',
  'closed'
]

const STATUS_FILTER_LABELS: Partial<Record<CalibrationServiceStatus, string>> =
  {
    pending_programming: 'Por programar',
    scheduled: 'Programado',
    in_execution: 'En ejecución',
    technically_completed: 'Terminado técnicamente',
    closed: 'Cerrado'
  }

/**
 * Pestaña "Servicios": ODS emitidas de la empresa y sus documentos
 * descargables, en una tabla con año y estado como filtros. Nunca muestra
 * precios.
 */
const CustomerServicesTab: React.FC<Props> = ({ customerId }) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [status, setStatus] = useState<CalibrationServiceStatus | ''>('')

  // Sin filtros: sirve para armar las opciones de año y queda en caché.
  const allQuery = useCustomerServices(customerId, null, null)
  const query = useCustomerServices(customerId, year, status || null)

  const yearOptions = useMemo(() => {
    const years = new Set<number>([currentYear, year])
    allQuery.data?.services.forEach((service) =>
      years.add(new Date(service.odsGeneratedAt).getFullYear())
    )
    return [...years].sort((a, b) => b - a)
  }, [allQuery.data, currentYear, year])

  const services = useMemo(() => query.data?.services ?? [], [query.data])

  const columns = useMemo<MRT_ColumnDef<CustomerServiceSummary>[]>(
    () => [
      {
        accessorKey: 'odsCode',
        header: 'ODS',
        size: 170,
        Cell: ({ cell }) => (
          <Typography
            variant='body2'
            fontWeight={700}
            sx={{ color: TEAL_TEXT }}
          >
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        id: 'emitida',
        header: 'Emitida',
        size: 150,
        accessorFn: (row) => formatDate(row.odsGeneratedAt),
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>
              {formatDate(row.original.odsGeneratedAt)}
            </Typography>
            {row.original.site ? (
              <Typography variant='caption' color='text.secondary'>
                {row.original.site}
              </Typography>
            ) : null}
          </Box>
        )
      },
      {
        id: 'equipos',
        header: 'Equipos',
        size: 170,
        accessorFn: (row) => row.effective,
        Cell: ({ row }) => {
          const { effective, quoted, adjustmentsNet } = row.original
          return (
            <Box>
              <Typography variant='body2' fontWeight={600}>
                {formatCount(effective)}{' '}
                {effective === 1 ? 'equipo' : 'equipos'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {formatCount(quoted)} cotizados
                {adjustmentsNet !== 0
                  ? ` · ${formatSigned(adjustmentsNet)} novedad`
                  : ''}
              </Typography>
            </Box>
          )
        }
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 200,
        Cell: ({ cell }) => {
          const value = cell.getValue<CalibrationServiceStatus>()
          return (
            <StatusPill
              size='small'
              tone={chipColorToStatusTone(
                CALIBRATION_SERVICE_STATUS_COLORS[value]
              )}
              label={CALIBRATION_SERVICE_STATUS_LABELS[value] ?? value}
            />
          )
        }
      },
      {
        id: 'documentos',
        header: 'Documentos',
        enableSorting: false,
        size: 340,
        accessorFn: () => '',
        Cell: ({ row }) => (
          <ServiceDocumentButtons
            customerId={customerId}
            serviceId={row.original.id}
            odsCode={row.original.odsCode}
            documents={row.original.documents}
          />
        )
      }
    ],
    [customerId]
  )

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
          Servicios
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Órdenes de servicio emitidas y sus documentos para descargar.
        </Typography>
      </Box>

      {query.isError ? (
        <Alert
          severity='error'
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => query.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(
            query.error,
            'No se pudieron cargar los servicios.'
          )}
        </Alert>
      ) : (
        <DataTable<CustomerServiceSummary>
          columns={columns}
          data={services}
          itemLabel={['servicio', 'servicios']}
          searchPlaceholder='Buscar por ODS o sede'
          state={{ isLoading: query.isLoading }}
          muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
          renderTopToolbarCustomActions={() => (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                select
                size='small'
                label='Año'
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                sx={{ minWidth: 110 }}
              >
                {yearOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Estado'
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CalibrationServiceStatus | '')
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value=''>Todos</MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {STATUS_FILTER_LABELS[option] ??
                      CALIBRATION_SERVICE_STATUS_LABELS[option]}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
          renderEmptyRowsFallback={() => (
            <EmptyState
              icon={<AssignmentOutlined />}
              title={`No hay servicios con ODS en ${year}${
                status ? ' con ese estado' : ''
              }`}
              hint='Prueba con otro año o quita el filtro de estado.'
            />
          )}
        />
      )}
    </Box>
  )
}

export default CustomerServicesTab
