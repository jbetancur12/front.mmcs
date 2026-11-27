import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { MRT_ColumnDef, MRT_Row } from 'material-react-table'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import { useNavigate } from 'react-router-dom'
import SignalLoader from 'src/Components/Common/SignalLoader'
import DataTable from '../../../Components/Common/DataTable'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { useFeature } from 'src/hooks/useFeatureFlags'
import {
  useUploadLag,
  useVisitBoard,
  useVisitIndicators
} from '../../../hooks/useCalibrationVisits'
import {
  BoardVisit,
  PersonCompliance,
  UploadLagRow
} from '../../../types/calibrationVisit'
import { CLOCK_META, formatDay, formatRange } from './visitUtils'

type Filter = 'uploadOverdue' | 'uploadDueSoon' | 'review' | 'adjustment' | null

const MATCHES: Record<Exclude<Filter, null>, (row: BoardVisit) => boolean> = {
  uploadOverdue: (r) => r.upload?.state === 'overdue',
  uploadDueSoon: (r) => r.upload?.state === 'due_soon',
  review: (r) => r.review.overdue > 0,
  adjustment: (r) => r.adjustment.pending > 0
}

const responsibleName = (row: BoardVisit) =>
  row.metrologists.find((m) => m.userId === row.uploadResponsibleUserId)
    ?.name || 'Sin responsable'

const stageText = (stage: BoardVisit['review']) => {
  if (!stage.pending) return '—'
  return stage.overdue
    ? `${stage.overdue} vencidos de ${stage.pending}`
    : `${stage.pending} pendientes`
}

const BoardTab = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useVisitBoard()
  const [filter, setFilter] = useState<Filter>(null)

  const rows = useMemo(() => {
    const all = data?.visits || []
    return filter ? all.filter(MATCHES[filter]) : all
  }, [data, filter])

  const columns = useMemo<MRT_ColumnDef<BoardVisit>[]>(
    () => [
      {
        id: 'order',
        header: 'Orden',
        accessorFn: (r) =>
          `${r.odsCode || r.serviceCode} ${r.customerName || ''}`,
        Cell: ({ row }: { row: MRT_Row<BoardVisit> }) => (
          <Box>
            <Typography variant='body2' fontWeight={600}>
              {`${row.original.odsCode || row.original.serviceCode} · visita ${row.original.visitNumber}`}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.customerName || 'Sin cliente'}
            </Typography>
          </Box>
        )
      },
      {
        id: 'date',
        header: 'Visita',
        accessorFn: (r) => r.endDate,
        Cell: ({ row }: { row: MRT_Row<BoardVisit> }) =>
          formatRange(row.original.startDate, row.original.endDate)
      },
      {
        id: 'responsible',
        header: 'Responsable',
        accessorFn: responsibleName
      },
      {
        id: 'upload',
        header: 'Carga',
        accessorFn: (r) => r.upload?.dueDate || '',
        Cell: ({ row }: { row: MRT_Row<BoardVisit> }) => {
          const { upload, quantities } = row.original
          if (!upload) return '—'
          return (
            <Stack spacing={0.5} alignItems='flex-start'>
              <Chip
                size='small'
                color={CLOCK_META[upload.state].color}
                label={CLOCK_META[upload.state].label}
              />
              <Typography variant='caption' color='text.secondary'>
                {`${quantities.uploaded} de ${quantities.expectedCertificates} · ${upload.completedOn ? 'cumplida' : `vence ${formatDay(upload.dueDate)}`}`}
              </Typography>
            </Stack>
          )
        }
      },
      {
        id: 'review',
        header: 'Revisión',
        accessorFn: (r) => stageText(r.review)
      },
      {
        id: 'adjustment',
        header: 'Corrección',
        accessorFn: (r) => stageText(r.adjustment)
      }
    ],
    []
  )

  if (isError)
    return (
      <Alert
        severity='error'
        action={<Button onClick={() => void refetch()}>Reintentar</Button>}
      >
        No pudimos cargar los pendientes.
      </Alert>
    )
  if (isLoading || !data) return <SignalLoader />

  const cards = [
    {
      key: 'uploadOverdue' as const,
      label: 'Cargas vencidas',
      value: data.totals.uploadOverdue,
      tone: 'red' as const,
      icon: <CloudUploadOutlinedIcon />
    },
    {
      key: 'uploadDueSoon' as const,
      label: 'Cargas por vencer',
      value: data.totals.uploadDueSoon,
      tone: 'orange' as const,
      icon: <ScheduleOutlinedIcon />
    },
    {
      key: 'review' as const,
      label: 'Revisiones vencidas',
      value: data.totals.reviewOverdue,
      tone: 'red' as const,
      icon: <RuleOutlinedIcon />
    },
    {
      key: 'adjustment' as const,
      label: 'En corrección',
      value: data.totals.adjustmentPending,
      tone: 'orange' as const,
      icon: <ReplayOutlinedIcon />
    }
  ]

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card) => (
          <Grid item xs={6} md={3} key={card.key}>
            <LmsStatCard
              label={card.label}
              value={card.value}
              tone={card.tone}
              icon={card.icon}
              active={filter === card.key}
              onClick={() =>
                setFilter((current) => (current === card.key ? null : card.key))
              }
            />
          </Grid>
        ))}
      </Grid>
      <DataTable<BoardVisit>
        columns={columns}
        data={rows}
        itemLabel={['visita pendiente', 'visitas pendientes']}
        searchPlaceholder='Buscar orden, cliente o persona'
        muiTableBodyRowProps={({ row }) => ({
          onClick: () =>
            navigate(
              `/calibration-services/${row.original.serviceId}?tab=visits`
            ),
          sx: { cursor: 'pointer' }
        })}
      />
    </>
  )
}

const percentText = (value: number | null) =>
  value === null ? '—' : `${value}%`

const complianceColumns: MRT_ColumnDef<PersonCompliance>[] = [
  { id: 'name', header: 'Persona', accessorFn: (r) => r.name || 'Sin asignar' },
  {
    id: 'percent',
    header: 'A tiempo',
    accessorFn: (r) => r.onTimePercent ?? -1,
    Cell: ({ row }: { row: MRT_Row<PersonCompliance> }) =>
      percentText(row.original.onTimePercent)
  },
  { accessorKey: 'onTime', header: 'Cumplidos' },
  { accessorKey: 'late', header: 'Tarde' },
  { accessorKey: 'overdue', header: 'Vencidos' },
  {
    id: 'average',
    header: 'Días de atraso (promedio)',
    accessorFn: (r) => r.averageLateBusinessDays ?? '—'
  }
]

const lagColumns: MRT_ColumnDef<UploadLagRow>[] = [
  {
    id: 'name',
    header: 'Quien cargó',
    accessorFn: (r) => r.name || 'Sin usuario'
  },
  { accessorKey: 'certificates', header: 'Certificados' },
  {
    id: 'median',
    header: 'Días hábiles (mediana)',
    accessorFn: (r) => r.medianBusinessDays ?? '—'
  },
  {
    id: 'max',
    header: 'Máximo',
    accessorFn: (r) => r.maxBusinessDays ?? '—'
  },
  { accessorKey: 'late', header: 'Fuera de plazo' },
  {
    id: 'percent',
    header: '% fuera de plazo',
    accessorFn: (r) => r.latePercent ?? -1,
    Cell: ({ row }: { row: MRT_Row<UploadLagRow> }) =>
      percentText(row.original.latePercent)
  }
]

const Section = ({
  title,
  hint,
  children
}: {
  title: string
  hint: string
  children: React.ReactNode
}) => (
  <Box>
    <Typography variant='h6' fontWeight={700}>
      {title}
    </Typography>
    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
      {hint}
    </Typography>
    <Paper variant='outlined' sx={{ borderRadius: 2 }}>
      {children}
    </Paper>
  </Box>
)

const IndicatorsTab = () => {
  const releaseOn = useFeature('release_certificates')
  const indicators = useVisitIndicators(true)
  const lag = useUploadLag(releaseOn)

  if (indicators.isError)
    return (
      <Alert
        severity='error'
        action={
          <Button onClick={() => void indicators.refetch()}>Reintentar</Button>
        }
      >
        No pudimos calcular los indicadores.
      </Alert>
    )
  if (!indicators.data) return <SignalLoader />

  return (
    <Stack spacing={4}>
      <Section
        title='Carga de certificados'
        hint='Por responsable de cada visita.'
      >
        <DataTable<PersonCompliance>
          columns={complianceColumns}
          data={indicators.data.upload}
          itemLabel={['persona', 'personas']}
        />
      </Section>
      <Section
        title='Revisión y liberación'
        hint='Por quien liberó; lo pendiente aparece sin asignar.'
      >
        <DataTable<PersonCompliance>
          columns={complianceColumns}
          data={indicators.data.review}
          itemLabel={['persona', 'personas']}
        />
      </Section>
      {releaseOn && lag.data && (
        <Section
          title='Días entre la calibración y la carga'
          hint={`Todos los certificados cargados, tengan visita o no. Plazo general: ${lag.data.targetBusinessDays} días hábiles.`}
        >
          <DataTable<UploadLagRow>
            columns={lagColumns}
            data={lag.data.uploaders}
            itemLabel={['persona', 'personas']}
          />
        </Section>
      )}
    </Stack>
  )
}

/** Lo atrasado de las visitas: quién debe cargar, qué falta revisar y cómo va cada persona. */
const CalibrationPendingPage = () => {
  const canSeeIndicators = useCan(PERMISSIONS.CALIBRATION_ANALYTICS_VIEW)
  const [tab, setTab] = useState<'board' | 'indicators'>('board')

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Pendientes de certificados'
        subtitle='Qué visitas tienen la carga, la revisión o la corrección atrasadas.'
        icon={<HourglassBottomIcon />}
      />
      {canSeeIndicators && (
        <Tabs
          value={tab}
          onChange={(_, value: 'board' | 'indicators') => setTab(value)}
          sx={{ mb: 3 }}
        >
          <Tab label='Pendientes' value='board' />
          <Tab label='Cumplimiento' value='indicators' />
        </Tabs>
      )}
      {tab === 'board' || !canSeeIndicators ? <BoardTab /> : <IndicatorsTab />}
    </Container>
  )
}

export default CalibrationPendingPage
