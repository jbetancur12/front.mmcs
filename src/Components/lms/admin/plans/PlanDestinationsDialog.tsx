import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  GroupAdd as AssignIcon,
  Groups as DestinationsIcon,
  LinkOff as UnassignIcon
} from '@mui/icons-material'
import { usePlanAssignments, usePlanProgress, useUnassignTrainingPlan } from 'src/hooks/useLms'
import { Toast } from 'src/Components/ExcelManipulation/Utils'
import { getStructuredApiErrorMessage } from 'src/utils/apiError'
import {
  PLAN_TEAL,
  PlanDialogHeader,
  describePlanDeadline,
  describeTarget,
  formatPlanDate,
  planDialogPaperProps,
  primaryButtonSx
} from './planUi'

interface PlanDestinationsDialogProps {
  open: boolean
  plan: { id: number; name: string } | null
  initialTab?: 0 | 1
  onClose: () => void
  onAssign: () => void
}

const ProgressCell: React.FC<{ value: number }> = ({ value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
    <LinearProgress
      variant='determinate'
      value={value}
      sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#e0f2f1', '& .MuiLinearProgress-bar': { bgcolor: PLAN_TEAL } }}
    />
    <Typography variant='body2' sx={{ width: 40, textAlign: 'right' }}>
      {value}%
    </Typography>
  </Box>
)

const PlanDestinationsDialog: React.FC<PlanDestinationsDialogProps> = ({ open, plan, initialTab = 0, onClose, onAssign }) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [tab, setTab] = useState<0 | 1>(initialTab)
  const planId = open && plan ? plan.id : null

  const { data: assignments = [], isLoading } = usePlanAssignments(planId)
  const { data: progress, isLoading: progressLoading } = usePlanProgress(planId && tab === 1 ? planId : null)
  const unassignMutation = useUnassignTrainingPlan()

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  const handleUnassign = async (id: number, label: string, users: number) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Desasignar el plan?',
      html: `Se retirará <b>${plan?.name}</b> de <b>${label}</b> (${users} usuario(s)).<br/>Se conservan las asignaciones directas, las de otros planes, el progreso y los certificados.`,
      showCancelButton: true,
      confirmButtonText: 'Desasignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f'
    })
    if (!confirmation.isConfirmed) return

    try {
      await unassignMutation.mutateAsync(id)
      Toast.fire({ icon: 'success', title: 'Plan desasignado' })
    } catch (error) {
      Toast.fire({ icon: 'error', title: getStructuredApiErrorMessage(error, 'No se pudo desasignar el plan.') })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth fullScreen={fullScreen} PaperProps={planDialogPaperProps}>
      <PlanDialogHeader title={plan?.name ?? ''} subtitle='Destinos y cumplimiento del plan' icon={<DestinationsIcon />} onClose={onClose} />
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant='fullWidth'
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .MuiTabs-indicator': { bgcolor: '#10b981', height: 3 }
        }}
      >
        <Tab label={`Destinos (${assignments.length})`} />
        <Tab label='Cumplimiento por persona' />
      </Tabs>
      <DialogContent sx={{ pt: 2.5, minHeight: 300 }}>
        {tab === 0 && (
          isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: PLAN_TEAL }} />
            </Box>
          ) : assignments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color='text.secondary' gutterBottom>
                Este plan aún no está asignado.
              </Typography>
              <Button variant='contained' startIcon={<AssignIcon />} sx={primaryButtonSx} onClick={onAssign}>
                Asignar plan
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
              <Table size='small'>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Destino</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plazo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='center'>Personas</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Avance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((row) => {
                    const label = describeTarget(row.target)
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>{label}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Desde {formatPlanDate(row.created_at)}{row.creator ? ` · ${row.creator.nombre}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{describePlanDeadline(row.deadline, row.deadline_days)}</Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2'>{row.stats.users}</Typography>
                          {row.stats.users_with_overdue > 0 && (
                            <Chip size='small' color='error' variant='outlined' label={`${row.stats.users_with_overdue} con vencidos`} sx={{ mt: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <ProgressCell value={row.stats.avg_progress} />
                          <Typography variant='caption' color='text.secondary'>
                            {row.stats.completed_users} de {row.stats.users} completaron
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Tooltip title='Desasignar'>
                            <span>
                              <IconButton
                                color='error'
                                size='small'
                                disabled={unassignMutation.isLoading}
                                onClick={() => handleUnassign(row.id, label, row.stats.users)}
                              >
                                <UnassignIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {tab === 1 && (
          progressLoading || !progress ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: PLAN_TEAL }} />
            </Box>
          ) : progress.users.length === 0 ? (
            <Alert severity='info'>Nadie tiene este plan asignado todavía.</Alert>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label={`${progress.summary.users} personas`} />
                <Chip label={`${progress.total_courses} cursos publicados`} />
                <Chip color='success' variant='outlined' label={`${progress.summary.completed_users} completaron`} />
                {progress.summary.users_with_overdue > 0 && (
                  <Chip color='error' variant='outlined' label={`${progress.summary.users_with_overdue} con vencidos`} />
                )}
                <Chip variant='outlined' label={`Promedio ${progress.summary.avg_progress}%`} />
              </Box>
              <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2, maxHeight: 420 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Persona</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Cursos</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Avance</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Vencidos</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>Último avance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {progress.users.map((user) => (
                      <TableRow key={user.user_id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>{user.nombre}</Typography>
                          <Typography variant='caption' color='text.secondary'>{user.email}</Typography>
                        </TableCell>
                        <TableCell>{user.completed_courses} / {user.total_courses}</TableCell>
                        <TableCell><ProgressCell value={user.progress_percentage} /></TableCell>
                        <TableCell>
                          {user.overdue_courses > 0
                            ? <Chip size='small' color='error' label={user.overdue_courses} />
                            : <Typography variant='body2' color='text.secondary'>—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{user.last_activity ? formatPlanDate(user.last_activity) : 'Sin avance'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PlanDestinationsDialog
