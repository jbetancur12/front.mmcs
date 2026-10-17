import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Skeleton,
  TextField,
  Typography
} from '@mui/material'
import { getApiErrorMessage } from '@utils/apiError'
import { useCustomerServices } from 'src/hooks/useCustomerServices'
import { CalibrationServiceStatus } from 'src/types/calibrationService'
import { CALIBRATION_SERVICE_STATUS_LABELS } from 'src/constants/calibrationServices'
import CustomerServiceCard from './CustomerServiceCard'

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

/** Pestaña "Servicios": ODS emitidas de la empresa y sus documentos descargables. */
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

  const services = query.data?.services ?? []

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Typography variant='h5' fontWeight='bold'>
          Servicios contratados
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}
        >
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
      </Box>

      {query.isLoading ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} variant='rounded' height={110} />
          ))}
        </Box>
      ) : query.isError ? (
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
      ) : services.length === 0 ? (
        <Typography color='text.secondary' sx={{ py: 6, textAlign: 'center' }}>
          No hay servicios con orden de servicio en {year}
          {status ? ' con ese estado' : ''}.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'repeat(2, minmax(0, 1fr))'
            }
          }}
        >
          {services.map((service) => (
            <CustomerServiceCard
              key={service.id}
              customerId={customerId}
              service={service}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default CustomerServicesTab
