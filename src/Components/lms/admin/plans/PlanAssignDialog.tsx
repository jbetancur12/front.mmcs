import React, { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  GroupAdd as AssignIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material'
import { useAssignTrainingPlan, useInternalUsers } from 'src/hooks/useLms'
import { lmsService } from 'src/services/lmsService'
import type { PlanAssignmentInput, PlanAssignmentPreview, PlanCourseAction, PlanTargetType } from 'src/services/lmsService'
import { getRoleLabelEs } from 'src/constants/roles'
import { Toast } from 'src/Components/ExcelManipulation/Utils'
import { getStructuredApiErrorMessage } from 'src/utils/apiError'
import {
  PLAN_ROLE_OPTIONS,
  PLAN_TEAL_SOFT,
  PlanDialogHeader,
  SKIP_REASON_LABELS,
  describePlanDeadline,
  planDialogPaperProps,
  primaryButtonSx,
  translateTargetText
} from './planUi'

interface PlanAssignDialogProps {
  open: boolean
  plan: { id: number; name: string } | null
  onClose: () => void
}

const ACTION_CHIP: Record<PlanCourseAction, { label: string; sx: object }> = {
  crear: { label: 'Se crea', sx: { bgcolor: PLAN_TEAL_SOFT, color: '#00695C' } },
  reutilizar: { label: 'Ya asignado', sx: { bgcolor: '#E3F2FD', color: '#1565C0' } },
  omitir: { label: 'Se omite', sx: { bgcolor: '#FFF3E0', color: '#E65100' } }
}

const PlanAssignDialog: React.FC<PlanAssignDialogProps> = ({ open, plan, onClose }) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { data: users = [] } = useInternalUsers({ enabled: open })
  const assignMutation = useAssignTrainingPlan()

  const [targetType, setTargetType] = useState<PlanTargetType>('role')
  const [role, setRole] = useState('')
  const [userIds, setUserIds] = useState<number[]>([])
  const [deadlineDays, setDeadlineDays] = useState('')
  const [fixedDate, setFixedDate] = useState('')
  const [notify, setNotify] = useState(true)
  const [preview, setPreview] = useState<PlanAssignmentPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    if (!open) return
    setTargetType('role')
    setRole('')
    setUserIds([])
    setDeadlineDays('')
    setFixedDate('')
    setNotify(true)
    setPreview(null)
    setShowUsers(false)
  }, [open, plan?.id])

  // La vista previa es obligatoria: cualquier cambio la invalida
  const invalidate = () => setPreview(null)

  const buildInput = (): PlanAssignmentInput => ({
    ...(targetType === 'role' ? { role } : {}),
    ...(targetType === 'all' ? { all_employees: true } : {}),
    ...(targetType === 'users' ? { user_ids: userIds } : {}),
    deadline_days: deadlineDays ? parseInt(deadlineDays, 10) : null,
    // Fin del día local para no vencer antes de tiempo por zona horaria
    deadline: fixedDate ? new Date(`${fixedDate}T23:59:59`).toISOString() : null
  })

  const targetReady =
    (targetType === 'role' && role) || targetType === 'all' || (targetType === 'users' && userIds.length > 0)

  const handlePreview = async () => {
    if (!plan) return
    setPreviewLoading(true)
    try {
      setPreview(await lmsService.previewPlanAssignment(plan.id, buildInput()))
    } catch (error) {
      Toast.fire({ icon: 'error', title: getStructuredApiErrorMessage(error, 'No se pudo calcular la vista previa.') })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!plan || !preview) return
    try {
      const result = await assignMutation.mutateAsync({ id: plan.id, data: { ...buildInput(), send_notification: notify } })
      Toast.fire({
        icon: 'success',
        title: 'Plan asignado',
        text: `${result.summary.created} asignaciones nuevas, ${result.summary.reused} reutilizadas · ${result.affected_users_count} usuario(s)`
      })
      onClose()
    } catch (error) {
      Toast.fire({ icon: 'error', title: getStructuredApiErrorMessage(error, 'No se pudo asignar el plan.') })
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth fullScreen={fullScreen} PaperProps={planDialogPaperProps}>
      <PlanDialogHeader title={`Asignar plan: ${plan?.name ?? ''}`} subtitle='Elige el destino y el plazo; revisa la vista previa antes de confirmar' icon={<AssignIcon />} onClose={onClose} />
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2.5} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id='plan-target-type'>Asignar a</InputLabel>
              <Select
                labelId='plan-target-type'
                label='Asignar a'
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value as PlanTargetType)
                  invalidate()
                }}
              >
                <MenuItem value='role'>Un rol (cargo)</MenuItem>
                <MenuItem value='all'>Todos los empleados</MenuItem>
                <MenuItem value='users'>Usuarios concretos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={7}>
            {targetType === 'role' && (
              <FormControl fullWidth>
                <InputLabel id='plan-target-role'>Rol</InputLabel>
                <Select
                  labelId='plan-target-role'
                  label='Rol'
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value)
                    invalidate()
                  }}
                >
                  {PLAN_ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {getRoleLabelEs(option)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {targetType === 'all' && (
              <Alert severity='info' sx={{ height: '100%', alignItems: 'center' }}>
                Reemplaza las asignaciones de este plan por rol.
              </Alert>
            )}
            {targetType === 'users' && (
              <Autocomplete
                multiple
                options={users}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                value={users.filter((user) => userIds.includes(user.id))}
                onChange={(_, value) => {
                  setUserIds(value.map((user) => user.id))
                  invalidate()
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label='Usuarios' placeholder='Buscar por nombre o correo' />}
              />
            )}
          </Grid>

          <Grid item xs={12} sm={5}>
            <TextField
              label='Días de plazo'
              type='number'
              value={deadlineDays}
              onChange={(event) => {
                setDeadlineDays(event.target.value)
                invalidate()
              }}
              fullWidth
              inputProps={{ min: 1 }}
              helperText='Contados desde la asignación de cada persona'
            />
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField
              label='Fecha fija (opcional)'
              type='date'
              value={fixedDate}
              onChange={(event) => {
                setFixedDate(event.target.value)
                invalidate()
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
              helperText='Solo para quienes ya tienen el cargo; sin días ni fecha, no vence'
            />
          </Grid>
        </Grid>

        {preview && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            {preview.already_assigned && (
              <Alert severity='error' sx={{ mb: 2 }}>
                Este destino ya tiene asignado el plan. Para cambiarlo, desasígnalo primero desde Destinos.
              </Alert>
            )}
            {preview.replaces.length > 0 && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Se reemplazará: {preview.replaces.map((item) => translateTargetText(item.target)).join(', ')}.
              </Alert>
            )}
            {preview.warnings.map((warning) => (
              <Alert key={`${warning.code}-${warning.course_id ?? ''}`} severity='info' sx={{ mb: 1 }}>
                {warning.message}
              </Alert>
            ))}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', my: 2 }}>
              <Chip label={`${preview.summary.create} se crean`} sx={ACTION_CHIP.crear.sx} />
              <Chip label={`${preview.summary.reuse} ya asignados`} sx={ACTION_CHIP.reutilizar.sx} />
              {preview.summary.skip > 0 && <Chip label={`${preview.summary.skip} se omiten`} sx={ACTION_CHIP.omitir.sx} />}
              <Chip
                variant='outlined'
                clickable
                onClick={() => setShowUsers((value) => !value)}
                label={`${preview.affected_users.count} usuario(s) afectado(s)`}
              />
              <Typography variant='body2' color='text.secondary' sx={{ ml: { sm: 'auto' } }}>
                Plazo: {describePlanDeadline(preview.deadline, preview.deadline_days)}
              </Typography>
            </Box>

            <Collapse in={showUsers}>
              <Paper variant='outlined' sx={{ borderRadius: 2, p: 1.5, mb: 2, maxHeight: 160, overflow: 'auto' }}>
                {preview.affected_users.count === 0 ? (
                  <Typography variant='body2' color='text.secondary'>Hoy nadie tiene este destino; quienes lo reciban después verán el plan.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {preview.affected_users.users.map((user) => (
                      <Chip key={user.id} size='small' label={user.nombre || user.email} />
                    ))}
                  </Box>
                )}
              </Paper>
            </Collapse>

            <Paper variant='outlined' sx={{ borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
              <List dense disablePadding>
                {preview.courses.map((course, index) => (
                  <React.Fragment key={course.course_id}>
                    {index > 0 && <Divider component='li' />}
                    <ListItem sx={{ gap: 1 }}>
                      <ListItemText
                        primary={course.title ?? `Curso ${course.course_id}`}
                        secondary={[
                          course.inherited ? `De ${course.source_plan_name}` : null,
                          course.deadline_days ? `${course.deadline_days} días propios` : null,
                          course.reason ? SKIP_REASON_LABELS[course.reason] ?? course.reason : null,
                          course.warning === 'NOT_PUBLISHED' ? 'No publicado' : null
                        ].filter(Boolean).join(' · ') || null}
                        sx={{ minWidth: 0 }}
                      />
                      <Chip
                        size='small'
                        label={
                          course.action === 'reutilizar'
                            ? course.existing_is_manual ? 'Ya asignado (directo)' : 'Ya en otro plan'
                            : ACTION_CHIP[course.action].label
                        }
                        sx={ACTION_CHIP[course.action].sx}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            <FormControlLabel
              sx={{ mt: 1.5 }}
              control={<Checkbox checked={notify} onChange={(event) => setNotify(event.target.checked)} />}
              label='Enviar un aviso resumen a cada persona'
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        {!preview ? (
          <Button
            variant='contained'
            onClick={handlePreview}
            disabled={!targetReady || previewLoading}
            startIcon={previewLoading ? <CircularProgress size={16} color='inherit' /> : <PreviewIcon />}
            sx={primaryButtonSx}
          >
            Ver vista previa
          </Button>
        ) : (
          <Button
            variant='contained'
            onClick={handleAssign}
            disabled={preview.already_assigned || preview.summary.create + preview.summary.reuse === 0 || assignMutation.isLoading}
            startIcon={assignMutation.isLoading ? <CircularProgress size={16} color='inherit' /> : <AssignIcon />}
            sx={{ ...primaryButtonSx, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
          >
            Asignar plan
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default PlanAssignDialog
