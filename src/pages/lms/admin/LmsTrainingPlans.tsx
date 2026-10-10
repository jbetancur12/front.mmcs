import React, { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  AccountTree as PlanIcon,
  CheckCircle as AssignedIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  GroupAdd as AssignIcon,
  Groups as DestinationsIcon,
  HourglassEmpty as UnassignedIcon,
  Hub as TargetsIcon
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import PlanFormDialog from 'src/Components/lms/admin/plans/PlanFormDialog'
import PlanAssignDialog from 'src/Components/lms/admin/plans/PlanAssignDialog'
import PlanDestinationsDialog from 'src/Components/lms/admin/plans/PlanDestinationsDialog'
import { PLAN_TEAL, formatPlanDate, primaryButtonSx } from 'src/Components/lms/admin/plans/planUi'
import { useDeleteTrainingPlan, useTrainingPlans } from 'src/hooks/useLms'
import type { TrainingPlanSummary } from 'src/services/lmsService'
import { Toast } from 'src/Components/ExcelManipulation/Utils'
import { getApiErrorCode, getStructuredApiErrorMessage } from 'src/utils/apiError'

type PlanFilter = 'all' | 'assigned' | 'unassigned'

const LmsTrainingPlans: React.FC = () => {
  const { data: plans = [], isLoading, isFetching, error } = useTrainingPlans()
  const deleteMutation = useDeleteTrainingPlan()

  const [filter, setFilter] = useState<PlanFilter>('all')
  const [formPlanId, setFormPlanId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [assignPlan, setAssignPlan] = useState<TrainingPlanSummary | null>(null)
  const [destinations, setDestinations] = useState<{ plan: TrainingPlanSummary; tab: 0 | 1 } | null>(null)

  const stats = useMemo(() => ({
    total: plans.length,
    assigned: plans.filter((plan) => plan.assignment_count > 0).length,
    unassigned: plans.filter((plan) => plan.assignment_count === 0).length,
    targets: plans.reduce((sum, plan) => sum + plan.assignment_count, 0)
  }), [plans])

  const visiblePlans = useMemo(() => {
    if (filter === 'assigned') return plans.filter((plan) => plan.assignment_count > 0)
    if (filter === 'unassigned') return plans.filter((plan) => plan.assignment_count === 0)
    return plans
  }, [plans, filter])

  const openForm = (planId: number | null) => {
    setFormPlanId(planId)
    setFormOpen(true)
  }

  const handleDelete = async (plan: TrainingPlanSummary) => {
    if (plan.included_by_count > 0) {
      Toast.fire({ icon: 'warning', title: 'Este plan está incluido en otros planes. Quítalo de ellos antes de eliminarlo.' })
      return
    }

    const assigned = plan.assignment_count > 0
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: `¿Eliminar "${plan.name}"?`,
      html: assigned
        ? `El plan está asignado a <b>${plan.assignment_count}</b> destino(s). Se desasignará en todos y luego se eliminará.<br/>Se conservan las asignaciones directas, el progreso y los certificados.`
        : 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: assigned ? 'Desasignar y eliminar' : 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f'
    })
    if (!confirmation.isConfirmed) return

    try {
      await deleteMutation.mutateAsync({ id: plan.id, cascade: assigned })
      Toast.fire({ icon: 'success', title: 'Plan eliminado' })
    } catch (deleteError) {
      const message = getApiErrorCode(deleteError) === 'PLAN_IS_INCLUDED'
        ? 'Este plan está incluido en otros planes. Quítalo de ellos antes de eliminarlo.'
        : getStructuredApiErrorMessage(deleteError, 'No se pudo eliminar el plan.')
      Toast.fire({ icon: 'error', title: message })
    }
  }

  const columns = useMemo<MRT_ColumnDef<TrainingPlanSummary>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Plan',
      size: 280,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{ bgcolor: PLAN_TEAL, width: 32, height: 32 }}>
            <PlanIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' fontWeight={600} noWrap>
              {row.original.name}
            </Typography>
            {row.original.description && (
              <Typography variant='caption' color='text.secondary' noWrap component='div' sx={{ maxWidth: 320 }}>
                {row.original.description}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      accessorKey: 'effective_course_count',
      header: 'Cursos',
      size: 120,
      Cell: ({ row }) => {
        const { effective_course_count: effective, own_course_count: own } = row.original
        const inherited = (effective ?? own) - own
        return (
          <Box>
            <Typography variant='body2' fontWeight={600}>{effective ?? '—'}</Typography>
            {inherited > 0 && (
              <Typography variant='caption' color='text.secondary'>
                {own} propios · {inherited} heredados
              </Typography>
            )}
          </Box>
        )
      }
    },
    {
      accessorKey: 'include_count',
      header: 'Composición',
      size: 160,
      Cell: ({ row }) => {
        const { include_count: includes, included_by_count: includedBy } = row.original
        if (!includes && !includedBy) return <Typography variant='body2' color='text.secondary'>Independiente</Typography>
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {includes > 0 && <Chip size='small' variant='outlined' label={`Incluye ${includes}`} />}
            {includedBy > 0 && <Chip size='small' variant='outlined' color='info' label={`En ${includedBy} plan(es)`} />}
          </Box>
        )
      }
    },
    {
      accessorKey: 'assignment_count',
      header: 'Destinos',
      size: 120,
      Cell: ({ row }) => row.original.assignment_count > 0
        ? (
          <Chip
            size='small'
            clickable
            onClick={() => setDestinations({ plan: row.original, tab: 0 })}
            label={`${row.original.assignment_count} destino(s)`}
            sx={{ bgcolor: '#E0F7F4', color: '#00695C', fontWeight: 600 }}
          />
          )
        : <Chip size='small' variant='outlined' label='Sin asignar' />
    },
    {
      accessorKey: 'updated_at',
      header: 'Actualizado',
      size: 130,
      Cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>{formatPlanDate(row.original.updated_at)}</Typography>
      )
    }
  ], [])

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Planes de formación'
        subtitle='Agrupa cursos por cargo y asígnalos de una sola vez'
        icon={<PlanIcon />}
        actions={
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => openForm(null)} sx={primaryButtonSx}>
            Nuevo plan
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Planes' value={stats.total} icon={<PlanIcon />} tone='teal' active={filter === 'all'} onClick={() => setFilter('all')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Asignados' value={stats.assigned} icon={<AssignedIcon />} tone='green' active={filter === 'assigned'} onClick={() => setFilter('assigned')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Sin asignar' value={stats.unassigned} icon={<UnassignedIcon />} tone='orange' active={filter === 'unassigned'} onClick={() => setFilter('unassigned')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Destinos activos' value={stats.targets} icon={<TargetsIcon />} tone='blue' />
        </Grid>
      </Grid>

      {error ? (
        <Alert severity='error'>No se pudieron cargar los planes. Intenta de nuevo.</Alert>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            columns={columns}
            data={visiblePlans}
            localization={MRT_Localization_ES}
            // Mientras carga, MRT crea filas de relleno sin id: deben tener clave única
            getRowId={(row, index) => (row?.id != null ? String(row.id) : `loading-${index}`)}
            state={{ isLoading, showProgressBars: isFetching && !isLoading }}
            enableColumnFilters={false}
            enableGlobalFilter
            positionGlobalFilter='left'
            muiSearchTextFieldProps={{
              placeholder: 'Buscar plan...',
              sx: { minWidth: { xs: '200px', md: '300px' } },
              variant: 'outlined'
            }}
            enableRowActions
            positionActionsColumn='last'
            displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 190 } }}
            renderRowActions={({ row }) => (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                <Tooltip title='Asignar plan'>
                  <IconButton size='small' sx={{ color: PLAN_TEAL }} onClick={() => setAssignPlan(row.original)}>
                    <AssignIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Destinos y cumplimiento'>
                  <IconButton size='small' color='info' onClick={() => setDestinations({ plan: row.original, tab: 0 })}>
                    <DestinationsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Editar plan'>
                  <IconButton size='small' color='primary' onClick={() => openForm(row.original.id)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar plan'>
                  <IconButton size='small' color='error' onClick={() => handleDelete(row.original)} disabled={deleteMutation.isLoading}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            renderEmptyRowsFallback={() => (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color='text.secondary'>
                  {filter === 'all' ? 'Aún no hay planes de formación.' : 'Ningún plan coincide con el filtro.'}
                </Typography>
                {filter === 'all' && (
                  <Button variant='contained' startIcon={<AddIcon />} onClick={() => openForm(null)} sx={{ ...primaryButtonSx, mt: 2 }}>
                    Crear el primer plan
                  </Button>
                )}
              </Box>
            )}
            muiTableProps={{
              sx: {
                '& .MuiTableHead-root .MuiTableCell-root': { backgroundColor: '#f5f5f5', fontWeight: 600 },
                '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: 'rgba(0, 191, 165, 0.04)' }
              }
            }}
            muiTopToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
            muiBottomToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
            muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50] }}
            enablePinning
            initialState={{
              density: 'comfortable',
              showGlobalFilter: true,
              pagination: { pageIndex: 0, pageSize: 10 },
              columnPinning: { right: ['mrt-row-actions'] }
            }}
          />
        </Paper>
      )}

      <PlanFormDialog open={formOpen} planId={formPlanId} onClose={() => setFormOpen(false)} />
      <PlanAssignDialog open={Boolean(assignPlan)} plan={assignPlan} onClose={() => setAssignPlan(null)} />
      <PlanDestinationsDialog
        open={Boolean(destinations)}
        plan={destinations?.plan ?? null}
        initialTab={destinations?.tab ?? 0}
        onClose={() => setDestinations(null)}
        onAssign={() => {
          const plan = destinations?.plan ?? null
          setDestinations(null)
          setAssignPlan(plan)
        }}
      />
    </Container>
  )
}

export default LmsTrainingPlans
