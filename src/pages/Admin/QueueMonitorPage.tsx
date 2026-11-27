import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import {
  CheckCircleOutline,
  ErrorOutline,
  HourglassEmpty,
  OutboxOutlined,
  PlayCircleOutline,
  Refresh
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import SignalLoader from 'src/Components/Common/SignalLoader'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import {
  type FailedJob,
  type QueueStatus,
  useQueueMonitor
} from 'src/hooks/useQueueMonitor'
import { getApiErrorReason } from 'src/utils/apiError'
import { neutral } from 'src/theme/designTokens'
import { jobTypeLabel, referenceLabel } from './queueMonitorLabels'

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : '—'

const FailedTable = ({ jobs }: { jobs: FailedJob[] }) => {
  const columns = useMemo<MRT_ColumnDef<FailedJob>[]>(
    () => [
      {
        id: 'failedAt',
        header: 'Falló',
        accessorFn: (job) => formatDate(job.failedAt ?? job.createdAt),
        size: 170
      },
      {
        id: 'type',
        header: 'Trabajo',
        accessorFn: (job) => jobTypeLabel(job.type),
        size: 180
      },
      {
        id: 'reference',
        header: 'Referencia',
        accessorFn: (job) => referenceLabel(job.reference),
        size: 200
      },
      {
        accessorKey: 'reason',
        header: 'Motivo',
        size: 420,
        // El motivo es lo que se viene a leer: se muestra completo, en varias líneas
        muiTableBodyCellProps: {
          sx: { whiteSpace: 'normal', wordBreak: 'break-word' }
        }
      },
      { accessorKey: 'attempts', header: 'Intentos', size: 90 }
    ],
    []
  )
  return (
    <DataTable<FailedJob>
      columns={columns}
      data={jobs}
      itemLabel={['fallo', 'fallos']}
      searchPlaceholder='Buscar en los fallos'
      enableSorting={false}
    />
  )
}

const QueuePanel = ({ queue }: { queue: QueueStatus }) => {
  const { counts, failed } = queue
  const cards = [
    {
      label: 'En espera',
      value: counts.waiting + counts.delayed,
      tone: 'orange' as const,
      icon: <HourglassEmpty />
    },
    {
      label: 'En ejecución',
      value: counts.active,
      tone: 'blue' as const,
      icon: <PlayCircleOutline />
    },
    {
      label: 'Completados',
      value: counts.completed,
      tone: 'green' as const,
      icon: <CheckCircleOutline />
    },
    {
      label: 'Fallidos',
      value: counts.failed,
      tone: 'red' as const,
      icon: <ErrorOutline />
    }
  ]
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mb: 3,
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))'
          }
        }}
      >
        {cards.map((card) => (
          <LmsStatCard key={card.label} {...card} />
        ))}
      </Box>
      <Typography variant='body2' sx={{ mb: 1, color: neutral.textBody }}>
        Se muestran los fallos más recientes (hasta 50). Los completados son los
        que la cola todavía guarda.
      </Typography>
      <FailedTable jobs={failed} />
    </>
  )
}

/** Panel de desarrollador: estado de las colas de correos y reportes, solo para mirar. */
const QueueMonitorPage = () => {
  const { data, isLoading, isFetching, error, refetch } = useQueueMonitor()
  const [selected, setSelected] = useState(0)
  const queue = data?.[selected]

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Colas de envío'
        subtitle='Correos y reportes en espera, completados y fallidos'
        icon={<OutboxOutlined />}
        actions={
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Actualizar
          </Button>
        }
      />
      <Alert severity='info' sx={{ mb: 3 }}>
        Solo lectura: desde aquí no se reintenta ni se borra nada. Se actualiza
        cada 30 segundos.
      </Alert>
      {isLoading && <SignalLoader />}
      {error ? (
        <Alert severity='error'>
          {getApiErrorReason(error) ?? 'No se pudo consultar las colas'}
        </Alert>
      ) : null}
      {data && queue ? (
        <>
          <Tabs
            value={selected}
            onChange={(_, value: number) => setSelected(value)}
            sx={{ mb: 3 }}
          >
            {data.map((item) => (
              <Tab key={item.key} label={item.name} />
            ))}
          </Tabs>
          <QueuePanel key={queue.key} queue={queue} />
        </>
      ) : null}
    </Container>
  )
}

export default QueueMonitorPage
