import React, { useEffect, useMemo, useState } from 'react'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import {
  AccountTree as PlanIcon,
  CheckCircle as DoneIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { usePlanProgress, useTrainingPlans } from 'src/hooks/useLms'
import type {
  PlanComplianceStatus,
  PlanProgressResponse,
  PlanUserProgress
} from 'src/services/lmsService'
import {
  PLAN_TEAL,
  describeDeadlineSource,
  formatPlanDate,
  translateTargetText
} from './planUi'

const STATUS_META: Record<
  PlanComplianceStatus,
  { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info' }
> = {
  completed: { label: 'Completado', color: 'success' },
  overdue: { label: 'Con vencidos', color: 'error' },
  in_progress: { label: 'En curso', color: 'warning' },
  not_started: { label: 'Sin comenzar', color: 'default' },
  no_courses: { label: 'Sin cursos', color: 'info' }
}

type StatusFilter = 'all' | PlanComplianceStatus

interface PlanComplianceTabProps {
  /** Plan preseleccionado (p. ej. desde ?planId= o el diálogo del plan). */
  initialPlanId?: number | null
  onPlanChange?: (planId: number | null) => void
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 130 }}>
    <LinearProgress
      variant='determinate'
      value={value}
      sx={{
        flex: 1,
        height: 8,
        borderRadius: 4,
        bgcolor: '#e0f2f1',
        '& .MuiLinearProgress-bar': { bgcolor: PLAN_TEAL }
      }}
    />
    <Typography variant='body2' sx={{ width: 38, textAlign: 'right' }}>
      {value}%
    </Typography>
  </Box>
)

const describeDestination = (
  destination: PlanUserProgress['destinations'][number]
) =>
  destination.inherited
    ? `${translateTargetText(destination.target)} · vía ${destination.plan_name}`
    : translateTargetText(destination.target)

const csvCell = (value: unknown) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`

/** Exporta una fila por persona y curso: es lo que se revisa en auditorías. */
const exportPlanCompliance = (
  report: PlanProgressResponse,
  users: PlanUserProgress[]
) => {
  const headers = [
    'Plan',
    'Persona',
    'Correo',
    'Destino',
    'Estado persona',
    'Avance persona',
    'Curso',
    'Estado curso',
    'Avance curso',
    'Fecha límite',
    'Origen de la fecha',
    'Último avance'
  ]
  const rows = users.flatMap((user) => {
    const base = [
      report.plan.name,
      user.nombre,
      user.email,
      user.destinations.map(describeDestination).join(' / '),
      STATUS_META[user.status].label,
      `${user.progress_percentage}%`
    ]
    if (user.courses.length === 0) return [[...base, '', '', '', '', '', '']]
    return user.courses.map((course) => [
      ...base,
      course.title,
      course.is_completed
        ? 'Completado'
        : course.is_overdue
          ? 'Vencido'
          : course.completion_percentage > 0
            ? 'En curso'
            : 'Sin comenzar',
      `${course.completion_percentage}%`,
      course.deadline
        ? new Date(course.deadline).toLocaleDateString('es-CO')
        : 'Sin fecha límite',
      describeDeadlineSource(course.deadline_source) ?? '',
      course.last_activity
        ? new Date(course.last_activity).toLocaleDateString('es-CO')
        : ''
    ])
  })

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  // Sin tildes en el nombre del archivo ("calibración" → "calibracion")
  const safeName = (report.plan.name ?? 'plan')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_')
  link.download = `cumplimiento_plan_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** HU-7: cumplimiento por plan, por persona y global (pestaña de Cumplimiento). */
const PlanComplianceTab: React.FC<PlanComplianceTabProps> = ({
  initialPlanId = null,
  onPlanChange
}) => {
  const { data: plans = [], isLoading: plansLoading } = useTrainingPlans()
  const [planId, setPlanId] = useState<number | null>(initialPlanId)
  const [includeOptional, setIncludeOptional] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Sin plan elegido: el primero asignado
  useEffect(() => {
    if (planId || plans.length === 0) return
    const first = plans.find((plan) => plan.assignment_count > 0) ?? plans[0]
    setPlanId(first.id)
  }, [plans, planId])

  useEffect(() => {
    if (initialPlanId) setPlanId(initialPlanId)
  }, [initialPlanId])

  const {
    data: report,
    isLoading,
    isFetching,
    error
  } = usePlanProgress(planId, !includeOptional)

  const users = useMemo(() => report?.users ?? [], [report])
  const visibleUsers = useMemo(
    () =>
      statusFilter === 'all'
        ? users
        : users.filter((user) => user.status === statusFilter),
    [users, statusFilter]
  )

  const countByStatus = (status: PlanComplianceStatus) =>
    users.filter((user) => user.status === status).length

  const columns = useMemo<MRT_ColumnDef<PlanUserProgress>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Persona',
        size: 230,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' fontWeight={600} noWrap>
              {row.original.nombre}
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              noWrap
              component='div'
            >
              {row.original.email}
            </Typography>
          </Box>
        )
      },
      {
        id: 'destination',
        header: 'Destino',
        size: 200,
        accessorFn: (row) =>
          row.destinations.map(describeDestination).join(' / '),
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {row.original.destinations.map((destination) => (
              <Typography
                key={destination.plan_assignment_id}
                variant='body2'
                color={
                  destination.inherited ? 'text.secondary' : 'text.primary'
                }
              >
                {describeDestination(destination)}
              </Typography>
            ))}
          </Box>
        )
      },
      {
        accessorKey: 'completed_courses',
        header: 'Cursos',
        size: 90,
        Cell: ({ row }) =>
          `${row.original.completed_courses} / ${row.original.total_courses}`
      },
      {
        accessorKey: 'progress_percentage',
        header: 'Avance',
        size: 170,
        Cell: ({ row }) => (
          <ProgressBar value={row.original.progress_percentage} />
        )
      },
      {
        accessorKey: 'overdue_courses',
        header: 'Vencidos',
        size: 100,
        Cell: ({ row }) =>
          row.original.overdue_courses > 0 ? (
            <Chip
              size='small'
              color='error'
              label={row.original.overdue_courses}
            />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              —
            </Typography>
          )
      },
      {
        accessorKey: 'next_deadline',
        header: 'Próxima fecha',
        size: 140,
        Cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.next_deadline
              ? formatPlanDate(row.original.next_deadline)
              : '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'last_activity',
        header: 'Último avance',
        size: 140,
        Cell: ({ row }) => (
          <Typography
            variant='body2'
            color={
              row.original.last_activity ? 'text.primary' : 'text.secondary'
            }
          >
            {row.original.last_activity
              ? formatPlanDate(row.original.last_activity)
              : 'Sin avance'}
          </Typography>
        )
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 140,
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            color={STATUS_META[row.original.status].color}
            label={STATUS_META[row.original.status].label}
          />
        )
      }
    ],
    []
  )

  if (!plansLoading && plans.length === 0) {
    return (
      <Alert severity='info'>
        Aún no hay planes de formación. Créalos en Planes de formación.
      </Alert>
    )
  }

  const statusChips: Array<{
    value: StatusFilter
    label: string
    count: number
  }> = [
    { value: 'all', label: 'Todos', count: users.length },
    {
      value: 'overdue',
      label: 'Con vencidos',
      count: countByStatus('overdue')
    },
    {
      value: 'in_progress',
      label: 'En curso',
      count: countByStatus('in_progress')
    },
    {
      value: 'not_started',
      label: 'Sin comenzar',
      count: countByStatus('not_started')
    },
    {
      value: 'completed',
      label: 'Completados',
      count: countByStatus('completed')
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper
        elevation={0}
        sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center'
          }}
        >
          <Autocomplete
            options={plans}
            loading={plansLoading}
            value={plans.find((plan) => plan.id === planId) ?? null}
            onChange={(_, plan) => {
              setPlanId(plan?.id ?? null)
              setStatusFilter('all')
              onPlanChange?.(plan?.id ?? null)
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 1
                  }}
                >
                  <span>{option.name}</span>
                  {option.assignment_count === 0 && (
                    <Chip size='small' variant='outlined' label='Sin asignar' />
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Plan de formación'
                size='small'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <PlanIcon sx={{ color: PLAN_TEAL, mr: 1 }} />
                }}
              />
            )}
            sx={{ minWidth: { xs: '100%', sm: 340 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={includeOptional}
                onChange={(event) => setIncludeOptional(event.target.checked)}
              />
            }
            label='Incluir cursos no obligatorios'
          />
          <Box sx={{ flex: 1 }} />
          <Button
            variant='outlined'
            size='small'
            startIcon={<DownloadIcon />}
            disabled={!report || visibleUsers.length === 0}
            onClick={() => report && exportPlanCompliance(report, visibleUsers)}
          >
            Exportar
          </Button>
        </Box>

        {report && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center'
            }}
          >
            {statusChips.map((chip) => (
              <Chip
                key={chip.value}
                label={`${chip.label} (${chip.count})`}
                clickable
                onClick={() => setStatusFilter(chip.value)}
                color={statusFilter === chip.value ? 'primary' : 'default'}
                variant={statusFilter === chip.value ? 'filled' : 'outlined'}
              />
            ))}
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ ml: { md: 'auto' } }}
            >
              {report.total_courses} curso(s)
              {report.mandatory_only ? ' obligatorios' : ''}
              {report.mandatory_only && report.excluded_courses > 0
                ? ` · ${report.excluded_courses} no obligatorio(s) fuera del cálculo`
                : ''}
              {' · '}promedio {report.summary.avg_progress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {error ? (
        <Alert severity='error'>
          No se pudo cargar el cumplimiento del plan.
        </Alert>
      ) : report && report.total_courses === 0 ? (
        <Alert severity='info'>
          Este plan no tiene cursos{' '}
          {report.mandatory_only ? 'obligatorios publicados' : 'publicados'}.
          {report.mandatory_only && report.excluded_courses > 0
            ? ' Activa "Incluir cursos no obligatorios" para verlos.'
            : ''}
        </Alert>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            columns={columns}
            data={visibleUsers}
            localization={MRT_Localization_ES}
            getRowId={(row, index) =>
              row?.user_id != null ? String(row.user_id) : `loading-${index}`
            }
            state={{
              isLoading: isLoading && Boolean(planId),
              showProgressBars: isFetching && !isLoading
            }}
            enableColumnFilters={false}
            enableGlobalFilter
            positionGlobalFilter='left'
            muiSearchTextFieldProps={{
              placeholder: 'Buscar persona...',
              sx: { minWidth: { xs: '200px', md: '300px' } },
              variant: 'outlined'
            }}
            renderDetailPanel={({ row }) => (
              <Box sx={{ py: 1, px: { xs: 0, md: 2 } }}>
                {row.original.courses.map((course) => (
                  <Box
                    key={course.course_id}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 0.75,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
                      <Typography variant='body2' fontWeight={600}>
                        {course.title}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {course.source_plan_name
                          ? `Del plan ${course.source_plan_name}`
                          : ''}
                        {course.deadline
                          ? ` · fecha: ${describeDeadlineSource(course.deadline_source) ?? ''}`
                          : ''}
                      </Typography>
                    </Box>
                    <ProgressBar value={course.completion_percentage} />
                    {course.is_completed ? (
                      <Chip
                        size='small'
                        color='success'
                        icon={<DoneIcon />}
                        label='Completado'
                      />
                    ) : course.is_overdue ? (
                      <Chip
                        size='small'
                        color='error'
                        label={`Vencido ${formatPlanDate(course.deadline)}`}
                      />
                    ) : (
                      <Chip
                        size='small'
                        variant='outlined'
                        label={
                          course.deadline
                            ? `Vence ${formatPlanDate(course.deadline)}`
                            : 'Sin fecha límite'
                        }
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}
            renderEmptyRowsFallback={() => (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color='text.secondary'>
                  {users.length === 0
                    ? 'Nadie tiene este plan asignado todavía.'
                    : 'Nadie coincide con el filtro.'}
                </Typography>
              </Box>
            )}
            muiTableProps={{
              sx: {
                '& .MuiTableHead-root .MuiTableCell-root': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 600
                },
                '& .MuiTableBody-root .MuiTableRow-root:hover': {
                  backgroundColor: 'rgba(0, 191, 165, 0.04)'
                }
              }
            }}
            muiTopToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
            muiBottomToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
            muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50, 100] }}
            initialState={{
              density: 'comfortable',
              showGlobalFilter: true,
              pagination: { pageIndex: 0, pageSize: 25 }
            }}
          />
        </Paper>
      )}
    </Box>
  )
}

export default PlanComplianceTab
