import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries } from 'react-query'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  DeleteOutline as DeleteIcon,
  AccountTree as PlanIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material'
import { useCourses, useSaveTrainingPlan, useTrainingPlan, useTrainingPlans } from 'src/hooks/useLms'
import { lmsService } from 'src/services/lmsService'
import type { Course, PlanImpact, SaveTrainingPlanRequest } from 'src/services/lmsService'
import { queryKeys } from 'src/config/queryClient'
import { Toast } from 'src/Components/ExcelManipulation/Utils'
import { getStructuredApiErrorMessage } from 'src/utils/apiError'
import {
  COURSE_STATUS_LABELS,
  PLAN_TEAL,
  PLAN_TEAL_SOFT,
  PlanDialogHeader,
  planDialogPaperProps,
  translateTargetText,
  primaryButtonSx
} from './planUi'

interface PlanFormDialogProps {
  open: boolean
  /** null = crear un plan nuevo */
  planId: number | null
  onClose: () => void
}

interface DraftCourse {
  course_id: number
  deadline_days: number | null
}

interface EffectiveRow {
  course_id: number
  title: string
  source: string | null
}

const PlanFormDialog: React.FC<PlanFormDialogProps> = ({ open, planId, onClose }) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isEdit = Boolean(planId)

  const { data: plan, isLoading: planLoading } = useTrainingPlan(open ? planId : null)
  const { data: plans = [] } = useTrainingPlans({ enabled: open })
  const { data: coursesResponse, isLoading: coursesLoading } = useCourses({ limit: 100 }, { enabled: open })
  const saveMutation = useSaveTrainingPlan()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [courses, setCourses] = useState<DraftCourse[]>([])
  const [includeIds, setIncludeIds] = useState<number[]>([])
  const [impact, setImpact] = useState<PlanImpact | null>(null)
  const [notify, setNotify] = useState(true)
  const [checkingImpact, setCheckingImpact] = useState(false)
  const impactRef = useRef<HTMLDivElement>(null)

  // El impacto queda al final del formulario: llevarlo a la vista al calcularlo
  useEffect(() => {
    if (impact) impactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [impact])

  // Cargar el plan al abrir (o limpiar al crear)
  useEffect(() => {
    if (!open) return
    setImpact(null)
    setNotify(true)
    if (!isEdit) {
      setName('')
      setDescription('')
      setCourses([])
      setIncludeIds([])
    } else if (plan) {
      setName(plan.name)
      setDescription(plan.description ?? '')
      setCourses(plan.courses.map((item) => ({ course_id: item.course_id, deadline_days: item.deadline_days })))
      setIncludeIds(plan.includes.map((item) => item.id))
    }
  }, [open, isEdit, plan])

  const catalog = useMemo(
    () => ((coursesResponse?.courses ?? []) as Course[]).filter((course) => course.audience !== 'client'),
    [coursesResponse]
  )
  const courseById = useMemo(() => new Map(catalog.map((course) => [course.id, course])), [catalog])

  // Planes que no se pueden incluir: el propio y los que ya lo incluyen (evita ciclos obvios)
  const blockedPlanIds = useMemo(() => {
    const blocked = new Set<number>()
    if (planId) blocked.add(planId)
    plan?.included_by.forEach((item) => blocked.add(item.id))
    return blocked
  }, [planId, plan])
  const includeOptions = plans.filter((item) => !blockedPlanIds.has(item.id))

  // Cursos efectivos de los planes incluidos (con su procedencia)
  const includedQueries = useQueries(
    includeIds.map((id) => ({
      queryKey: queryKeys.plans.detail(id),
      queryFn: () => lmsService.getTrainingPlan(id),
      enabled: open,
      staleTime: 30 * 1000
    }))
  )

  const effectiveRows = useMemo<EffectiveRow[]>(() => {
    const seen = new Set<number>()
    const rows: EffectiveRow[] = []
    courses.forEach((item) => {
      if (seen.has(item.course_id)) return
      seen.add(item.course_id)
      rows.push({ course_id: item.course_id, title: courseById.get(item.course_id)?.title ?? `Curso ${item.course_id}`, source: null })
    })
    includedQueries.forEach((query) => {
      query.data?.effective_courses.forEach((course) => {
        if (seen.has(course.course_id)) return
        seen.add(course.course_id)
        rows.push({ course_id: course.course_id, title: course.title ?? `Curso ${course.course_id}`, source: course.source_plan_name })
      })
    })
    return rows
  }, [courses, includedQueries, courseById])

  const draftCourses = courses
    .map((item) => courseById.get(item.course_id))
    .filter((course): course is Course => Boolean(course) && course!.status !== 'published')

  const availableCourses = catalog.filter((course) => !courses.some((item) => item.course_id === course.id))
  const includesLoading = includedQueries.some((query) => query.isLoading)

  const moveCourse = (index: number, direction: -1 | 1) => {
    setCourses((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setImpact(null)
  }

  const updateCourseDays = (courseId: number, value: string) => {
    const days = value === '' ? null : Math.max(1, parseInt(value, 10) || 1)
    setCourses((current) => current.map((item) => (item.course_id === courseId ? { ...item, deadline_days: days } : item)))
    setImpact(null)
  }

  const buildPayload = (): SaveTrainingPlanRequest => ({
    name: name.trim(),
    description: description.trim() || null,
    courses: courses.map((item, index) => ({ course_id: item.course_id, position: index, deadline_days: item.deadline_days })),
    include_plan_ids: includeIds
  })

  const showError = (error: unknown, fallback: string) => {
    Toast.fire({ icon: 'error', title: getStructuredApiErrorMessage(error, fallback) })
  }

  const save = async (withNotify: boolean) => {
    try {
      await saveMutation.mutateAsync({ id: planId ?? undefined, data: { ...buildPayload(), ...(isEdit ? { notify: withNotify } : {}) } })
      Toast.fire({ icon: 'success', title: isEdit ? 'Plan actualizado' : 'Plan creado' })
      onClose()
    } catch (error) {
      showError(error, 'No se pudo guardar el plan.')
    }
  }

  // HU-4: antes de guardar un plan asignado se muestra el impacto
  const handleSave = async () => {
    if (!isEdit || impact) {
      await save(notify)
      return
    }
    setCheckingImpact(true)
    try {
      const result = await lmsService.updateTrainingPlan(planId as number, buildPayload(), true)
      if (result.impact.destinations_count > 0) {
        setImpact(result.impact)
      } else {
        await save(false)
      }
    } catch (error) {
      showError(error, 'No se pudo validar el plan.')
    } finally {
      setCheckingImpact(false)
    }
  }

  const addedCourses = impact ? [...new Set(impact.destinations.flatMap((item) => item.added_course_ids))] : []
  const canSave = name.trim().length > 0 && effectiveRows.length > 0 && !saveMutation.isLoading && !checkingImpact
  const loading = (isEdit && planLoading) || coursesLoading

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth fullScreen={fullScreen} PaperProps={planDialogPaperProps}>
      <PlanDialogHeader
        title={isEdit ? `Editar plan: ${plan?.name ?? ''}` : 'Nuevo plan de formación'}
        subtitle='Agrupa cursos y reutiliza otros planes'
        icon={<PlanIcon />}
        onClose={onClose}
      />
      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PLAN_TEAL }} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={5}>
              <TextField
                label='Nombre del plan'
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 255 }}
                placeholder='Ej.: Inducción Metrólogo'
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                label='Descripción'
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
                placeholder='Para quién es y qué cubre'
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={includeOptions}
                getOptionLabel={(option) => option.name}
                value={plans.filter((item) => includeIds.includes(item.id))}
                onChange={(_, value) => {
                  setIncludeIds(value.map((item) => item.id))
                  setImpact(null)
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Incluye los planes'
                    helperText='Sus cursos se heredan. Máximo 3 niveles y sin ciclos.'
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                Cursos propios ({courses.length})
              </Typography>
              <Autocomplete
                options={availableCourses}
                getOptionLabel={(option) => option.title}
                value={null}
                onChange={(_, course) => {
                  if (!course) return
                  setCourses((current) => [...current, { course_id: course.id, deadline_days: null }])
                  setImpact(null)
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                      <span>{option.title}</span>
                      {option.status !== 'published' && (
                        <Chip size='small' label={COURSE_STATUS_LABELS[option.status] ?? option.status} />
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label='Agregar curso' size='small' />}
                blurOnSelect
                clearOnBlur
                sx={{ mb: 1.5 }}
              />
              <Paper variant='outlined' sx={{ borderRadius: 2, maxHeight: 360, overflow: 'auto' }}>
                {courses.length === 0 ? (
                  <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                    Aún no hay cursos propios. Puedes agregar cursos o solo incluir otros planes.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {courses.map((item, index) => {
                      const course = courseById.get(item.course_id)
                      return (
                        <React.Fragment key={item.course_id}>
                          {index > 0 && <Divider component='li' />}
                          <ListItem sx={{ gap: 1, pr: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <IconButton size='small' aria-label='Subir' disabled={index === 0} onClick={() => moveCourse(index, -1)}>
                                <ArrowUpIcon fontSize='inherit' />
                              </IconButton>
                              <IconButton size='small' aria-label='Bajar' disabled={index === courses.length - 1} onClick={() => moveCourse(index, 1)}>
                                <ArrowDownIcon fontSize='inherit' />
                              </IconButton>
                            </Box>
                            <ListItemText
                              primary={`${index + 1}. ${course?.title ?? `Curso ${item.course_id}`}`}
                              secondary={course && course.status !== 'published' ? COURSE_STATUS_LABELS[course.status] : null}
                              sx={{ minWidth: 0 }}
                            />
                            <Tooltip title='Plazo propio de este curso; si se deja vacío usa el plazo de la asignación del plan'>
                              <TextField
                                size='small'
                                type='number'
                                value={item.deadline_days ?? ''}
                                onChange={(event) => updateCourseDays(item.course_id, event.target.value)}
                                placeholder='General'
                                inputProps={{ min: 1, 'aria-label': 'Días de plazo' }}
                                InputProps={{ endAdornment: <InputAdornment position='end'>días</InputAdornment> }}
                                sx={{ width: 150, flexShrink: 0 }}
                              />
                            </Tooltip>
                            <IconButton
                              size='small'
                              color='error'
                              aria-label='Quitar curso'
                              onClick={() => {
                                setCourses((current) => current.filter((entry) => entry.course_id !== item.course_id))
                                setImpact(null)
                              }}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </ListItem>
                        </React.Fragment>
                      )
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                Cursos efectivos ({effectiveRows.length}) {includesLoading && <CircularProgress size={14} sx={{ ml: 1 }} />}
              </Typography>
              <Paper variant='outlined' sx={{ borderRadius: 2, bgcolor: '#fafafa', maxHeight: 412, overflow: 'auto' }}>
                {effectiveRows.length === 0 ? (
                  <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                    El plan necesita al menos un curso, propio o heredado.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {effectiveRows.map((row, index) => (
                      <React.Fragment key={row.course_id}>
                        {index > 0 && <Divider component='li' />}
                        <ListItem sx={{ gap: 1 }}>
                          <ListItemText primary={row.title} sx={{ minWidth: 0 }} />
                          <Chip
                            size='small'
                            label={row.source ?? 'Propio'}
                            variant={row.source ? 'outlined' : 'filled'}
                            sx={row.source ? { maxWidth: 160 } : { bgcolor: PLAN_TEAL_SOFT, color: '#00695C' }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {draftCourses.length > 0 && (
              <Grid item xs={12}>
                <Alert severity='info'>
                  {draftCourses.length === 1 ? 'El curso' : 'Los cursos'}{' '}
                  {draftCourses.map((course) => `"${course.title}"`).join(', ')}{' '}
                  no {draftCourses.length === 1 ? 'está publicado' : 'están publicados'}: se asignan, pero no serán visibles hasta publicarse.
                </Alert>
              </Grid>
            )}

            {impact && (
              <Grid item xs={12} ref={impactRef}>
                <Alert severity='warning' icon={<WarningIcon />}>
                  <Typography variant='body2' fontWeight={700}>
                    {impact.message}
                  </Typography>
                  <Box component='ul' sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                    {impact.destinations.map((item) => (
                      <li key={item.plan_assignment_id}>
                        <Typography variant='body2'>
                          {item.plan_name} · {translateTargetText(item.target)}: {item.users_count} usuario(s)
                          {item.added_course_ids.length > 0 && ` · +${item.added_course_ids.length} curso(s)`}
                          {item.removed_course_ids.length > 0 && ` · −${item.removed_course_ids.length} curso(s)`}
                          {item.deadline_changed_course_ids.length > 0 && ` · ${item.deadline_changed_course_ids.length} plazo(s) cambiado(s)`}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                  <Typography variant='caption' display='block' sx={{ mt: 0.5 }}>
                    Al quitar cursos solo se retiran las asignaciones que ningún otro plan ni asignación directa sostiene. El progreso y los certificados se conservan.
                  </Typography>
                  {addedCourses.length > 0 && (
                    <FormControlLabel
                      sx={{ mt: 0.5 }}
                      control={<Checkbox checked={notify} onChange={(event) => setNotify(event.target.checked)} />}
                      label='Notificar a los usuarios los cursos agregados'
                    />
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={!canSave}
          sx={primaryButtonSx}
          startIcon={saveMutation.isLoading || checkingImpact ? <CircularProgress size={16} color='inherit' /> : undefined}
        >
          {impact ? 'Confirmar y guardar' : isEdit ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PlanFormDialog
