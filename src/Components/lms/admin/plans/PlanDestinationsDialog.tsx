import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  FactCheck as ComplianceIcon,
  GroupAdd as AssignIcon,
  Groups as DestinationsIcon,
  LinkOff as UnassignIcon,
  ManageAccounts as EditUsersIcon,
  MergeType as MergeIcon
} from '@mui/icons-material'
import {
  useInternalUsers,
  useMergePlanAssignments,
  useMergeablePlanAssignments,
  usePlanAssignments,
  useUnassignTrainingPlan
} from 'src/hooks/useLms'
import type { PlanAssignmentRow } from 'src/services/lmsService'
import PlanAssignmentUsersDialog from './PlanAssignmentUsersDialog'
import { notify } from 'src/utils/notify'
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
  onClose: () => void
  onAssign: () => void
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string
  )

const ProgressCell: React.FC<{ value: number }> = ({ value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
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
    <Typography variant='body2' sx={{ width: 40, textAlign: 'right' }}>
      {value}%
    </Typography>
  </Box>
)

const PlanDestinationsDialog: React.FC<PlanDestinationsDialogProps> = ({
  open,
  plan,
  onClose,
  onAssign
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const planId = open && plan ? plan.id : null

  const { data: assignments = [], isLoading } = usePlanAssignments(planId)
  const { data: internalUsers = [] } = useInternalUsers({ enabled: open })
  const unassignMutation = useUnassignTrainingPlan()
  const { data: mergeable } = useMergeablePlanAssignments(planId)
  const mergeMutation = useMergePlanAssignments()
  const mergeGroups = mergeable?.groups ?? []

  // Destinos de usuarios con el mismo plazo creados por separado: se unen en uno
  const handleMerge = async () => {
    if (!plan || mergeGroups.length === 0) return
    const detail = mergeGroups
      .map((group) => {
        const plazo = describePlanDeadline(
          group.plazo.deadline,
          group.plazo.deadline_days
        )
        return `<li><b>${escapeHtml(plazo)}</b>: ${group.merged_ids.length + 1} destinos → 1 con ${group.total_users} persona(s)</li>`
      })
      .join('')
    const confirmation = await Swal.fire({
      icon: 'question',
      title: '¿Unificar destinos?',
      html: `<ul style="text-align:left">${detail}</ul>Cada persona conserva sus cursos, su fecha límite, su progreso y sus certificados.`,
      showCancelButton: true,
      confirmButtonText: 'Unificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00BFA5'
    })
    if (!confirmation.isConfirmed) return

    try {
      await mergeMutation.mutateAsync(plan.id)
      notify.success('Destinos unificados')
    } catch (error) {
      notify.error(
        getStructuredApiErrorMessage(
          error,
          'No se pudieron unificar los destinos.'
        )
      )
    }
  }
  const [editing, setEditing] = useState<PlanAssignmentRow | null>(null)

  const userNames = useMemo(
    () => new Map(internalUsers.map((user) => [user.id, user.name])),
    [internalUsers]
  )
  const namesOf = (row: PlanAssignmentRow) =>
    (row.target.user_ids ?? []).map(
      (id) => userNames.get(id) ?? `Usuario ${id}`
    )

  /** Usuarios concretos: los nombres; rol o todos: la etiqueta y cuántas personas. */
  const describeForConfirm = (row: PlanAssignmentRow) => {
    if (row.target.type === 'users') {
      const names = namesOf(row)
      const shown = names.slice(0, 6).map(escapeHtml).join(', ')
      return names.length > 6 ? `${shown} y ${names.length - 6} más` : shown
    }
    return `${escapeHtml(describeTarget(row.target))} (${row.stats.users} persona${row.stats.users === 1 ? '' : 's'})`
  }

  const handleUnassign = async (row: PlanAssignmentRow) => {
    const id = row.id
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Desasignar el plan?',
      html: `Se retirará <b>${escapeHtml(plan?.name ?? '')}</b> de <b>${describeForConfirm(row)}</b>.<br/>Se conservan las asignaciones directas, las de otros planes, el progreso y los certificados.`,
      showCancelButton: true,
      confirmButtonText: 'Desasignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f'
    })
    if (!confirmation.isConfirmed) return

    try {
      await unassignMutation.mutateAsync(id)
      notify.success('Plan desasignado')
    } catch (error) {
      notify.error(
        getStructuredApiErrorMessage(error, 'No se pudo desasignar el plan.')
      )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      fullScreen={fullScreen}
      PaperProps={planDialogPaperProps}
    >
      <PlanDialogHeader
        title={plan?.name ?? ''}
        subtitle='Destinos del plan'
        icon={<DestinationsIcon />}
        onClose={onClose}
      />
      <DialogContent sx={{ pt: 2.5, minHeight: 300 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            mb: 2
          }}
        >
          <Typography variant='subtitle1' fontWeight={700}>
            Destinos ({assignments.length})
          </Typography>
          {plan && (
            <Button
              size='small'
              variant='outlined'
              startIcon={<ComplianceIcon />}
              onClick={() =>
                navigate(`/lms/admin/compliance?tab=plan&planId=${plan.id}`)
              }
              sx={{ borderColor: PLAN_TEAL, color: '#00897B' }}
            >
              Ver cumplimiento por persona
            </Button>
          )}
        </Box>
        {mergeGroups.length > 0 && (
          <Alert
            severity='info'
            sx={{ mb: 2 }}
            action={
              <Button
                color='inherit'
                size='small'
                startIcon={<MergeIcon />}
                onClick={handleMerge}
                disabled={mergeMutation.isLoading}
              >
                Unificar destinos
              </Button>
            }
          >
            Hay destinos de usuarios con el mismo plazo creados por separado.
            Puedes unirlos en uno solo; nadie pierde cursos ni cambia su fecha
            límite.
          </Alert>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PLAN_TEAL }} />
          </Box>
        ) : assignments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography color='text.secondary' gutterBottom>
              Este plan aún no está asignado.
            </Typography>
            <Button
              variant='contained'
              startIcon={<AssignIcon />}
              sx={primaryButtonSx}
              onClick={onAssign}
            >
              Asignar plan
            </Button>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            variant='outlined'
            sx={{ borderRadius: 2 }}
          >
            <Table size='small'>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Destino</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plazo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='center'>
                    Personas
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((row) => {
                  const label = describeTarget(row.target)
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {label}
                        </Typography>
                        {row.target.type === 'users' && (
                          <Typography variant='body2' color='text.secondary'>
                            {(() => {
                              const names = namesOf(row)
                              return names.length > 3
                                ? `${names.slice(0, 3).join(', ')} y ${names.length - 3} más`
                                : names.join(', ')
                            })()}
                          </Typography>
                        )}
                        <Typography variant='caption' color='text.secondary'>
                          Desde {formatPlanDate(row.created_at)}
                          {row.creator ? ` · ${row.creator.nombre}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {describePlanDeadline(
                            row.deadline,
                            row.deadline_days
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='body2'>
                          {row.stats.users}
                        </Typography>
                        {row.stats.users_with_overdue > 0 && (
                          <Chip
                            size='small'
                            color='error'
                            variant='outlined'
                            label={`${row.stats.users_with_overdue} con vencidos`}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <ProgressCell value={row.stats.avg_progress} />
                        <Typography variant='caption' color='text.secondary'>
                          {row.stats.completed_users} de {row.stats.users}{' '}
                          completaron
                        </Typography>
                      </TableCell>
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {row.target.type === 'users' && (
                          <Tooltip title='Editar usuarios'>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => setEditing(row)}
                            >
                              <EditUsersIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title='Desasignar'>
                          <span>
                            <IconButton
                              color='error'
                              size='small'
                              disabled={unassignMutation.isLoading}
                              onClick={() => handleUnassign(row)}
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
        )}
      </DialogContent>
      <PlanAssignmentUsersDialog
        open={Boolean(editing)}
        planName={plan?.name ?? ''}
        planAssignmentId={editing?.id ?? null}
        userIds={editing?.target.user_ids ?? []}
        onClose={() => setEditing(null)}
      />
    </Dialog>
  )
}

export default PlanDestinationsDialog
