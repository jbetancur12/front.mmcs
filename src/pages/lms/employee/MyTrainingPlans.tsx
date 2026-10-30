import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material'
import {
  AccountTree as PlanIcon,
  CheckCircle as DoneIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon
} from '@mui/icons-material'
import type {
  DeadlineSource,
  MyPlan,
  MyPlanCourse,
  MyPlansResponse
} from 'src/services/lmsService'
import {
  PLAN_TEAL,
  PLAN_TEAL_SOFT,
  describeDeadlineSource,
  formatPlanDate
} from 'src/Components/lms/admin/plans/planUi'

interface MyTrainingPlansProps {
  data?: MyPlansResponse
  isLoading: boolean
  error: unknown
}

const daysUntil = (value: string) =>
  Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

const DeadlineChip: React.FC<{ course: MyPlanCourse }> = ({ course }) => {
  if (course.is_completed)
    return (
      <Chip
        size='small'
        color='success'
        icon={<DoneIcon />}
        label='Completado'
      />
    )
  if (!course.deadline)
    return <Chip size='small' variant='outlined' label='Sin fecha límite' />
  const days = daysUntil(course.deadline)
  if (course.is_overdue)
    return (
      <Chip
        size='small'
        color='error'
        label={`Vencido hace ${Math.abs(days)} d`}
      />
    )
  if (days <= 7)
    return <Chip size='small' color='warning' label={`Vence en ${days} d`} />
  return (
    <Chip
      size='small'
      variant='outlined'
      label={`Vence ${formatPlanDate(course.deadline)}`}
    />
  )
}

/** Origen del plazo solo si no es este mismo plan (evita repetir el nombre en cada fila). */
const externalSource = (plan: MyPlan, source?: DeadlineSource | null) =>
  source && !(source.type === 'plan' && source.plan_id === plan.id)
    ? describeDeadlineSource(source)
    : null

const PlanCard: React.FC<{ plan: MyPlan }> = ({ plan }) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const sourceLabel = externalSource(plan, plan.next_deadline_source)

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: PLAN_TEAL_SOFT,
              color: '#00695C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <PlanIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant='h6' fontWeight={700}>
              {plan.name}
            </Typography>
            {plan.description && (
              <Typography variant='body2' color='text.secondary'>
                {plan.description}
              </Typography>
            )}
          </Box>
          {plan.overdue_courses > 0 && (
            <Chip
              size='small'
              color='error'
              label={`${plan.overdue_courses} vencido${plan.overdue_courses === 1 ? '' : 's'}`}
            />
          )}
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.75,
              gap: 1,
              flexWrap: 'wrap'
            }}
          >
            <Typography variant='body2' fontWeight={600}>
              {plan.completed_courses} de {plan.total_courses} cursos
              completados
            </Typography>
            <Typography
              variant='body2'
              fontWeight={700}
              sx={{ color: PLAN_TEAL }}
            >
              {plan.progress_percentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={plan.progress_percentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#e0f2f1',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: PLAN_TEAL
              }
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 2,
            flexWrap: 'wrap'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              color: 'text.secondary'
            }}
          >
            <EventIcon fontSize='small' />
            <Typography variant='body2'>
              {plan.next_deadline ? (
                <>
                  Próxima fecha: <b>{formatPlanDate(plan.next_deadline)}</b>
                  {sourceLabel ? ` (${sourceLabel})` : ''}
                </>
              ) : plan.completed_courses === plan.total_courses &&
                plan.total_courses > 0 ? (
                '¡Plan completado!'
              ) : (
                'Sin fechas próximas'
              )}
            </Typography>
          </Box>
          <Button
            size='small'
            onClick={() => setExpanded((value) => !value)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ color: '#00897B', textTransform: 'none', fontWeight: 600 }}
            aria-expanded={expanded}
          >
            {expanded ? 'Ocultar cursos' : 'Ver cursos'}
          </Button>
        </Box>

        <Collapse in={expanded} unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <List disablePadding>
            {plan.courses.map((course, index) => (
              <React.Fragment key={course.course_id}>
                {index > 0 && <Divider component='li' />}
                <ListItem
                  sx={{
                    px: 0,
                    gap: 1.5,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}
                >
                  <ListItemText
                    primary={course.title}
                    secondary={
                      <>
                        {course.completed_lessons} de {course.total_lessons}{' '}
                        lecciones
                        {course.inherited && course.source_plan_name
                          ? ` · Del plan ${course.source_plan_name}`
                          : ''}
                        {course.deadline &&
                        !course.is_completed &&
                        externalSource(plan, course.deadline_source)
                          ? ` · Fecha según: ${externalSource(plan, course.deadline_source)}`
                          : ''}
                      </>
                    }
                    sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: 1 } }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      ml: 'auto',
                      flexShrink: 0
                    }}
                  >
                    <DeadlineChip course={course} />
                    <Button
                      size='small'
                      variant={course.is_completed ? 'outlined' : 'contained'}
                      onClick={() =>
                        navigate(`/lms/course/${course.course_id}`)
                      }
                      sx={
                        course.is_completed
                          ? {
                              borderColor: PLAN_TEAL,
                              color: '#00897B',
                              flexShrink: 0
                            }
                          : {
                              bgcolor: PLAN_TEAL,
                              '&:hover': { bgcolor: '#00897B' },
                              flexShrink: 0
                            }
                      }
                    >
                      {course.is_completed
                        ? 'Repasar'
                        : course.completed_lessons > 0
                          ? 'Retomar'
                          : 'Comenzar'}
                    </Button>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  )
}

/** HU-6: planes del empleado con progreso agrupado y fecha límite más próxima. */
const MyTrainingPlans: React.FC<MyTrainingPlansProps> = ({
  data,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <SignalLoader />
      </Box>
    )
  }

  if (error)
    return (
      <Alert severity='error'>
        No se pudieron cargar tus planes de formación.
      </Alert>
    )

  const plans = data?.plans ?? []
  if (plans.length === 0) {
    return (
      <Alert severity='info'>
        Aún no tienes planes de formación asignados.
      </Alert>
    )
  }

  const unique = data?.unique_courses
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {plans.length > 1 && unique && (
        <Typography variant='body2' color='text.secondary'>
          En total llevas{' '}
          <b>
            {unique.completed_courses} de {unique.total_courses}
          </b>{' '}
          cursos distintos de tus planes
          {unique.total_courses > 0 ? ` (${unique.progress_percentage}%)` : ''}.
          Un curso que está en varios planes cuenta una sola vez.
        </Typography>
      )}
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </Box>
  )
}

export default MyTrainingPlans
