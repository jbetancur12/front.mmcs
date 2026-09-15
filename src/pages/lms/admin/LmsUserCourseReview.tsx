import { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Button,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
  EmojiEvents as AwardIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { lmsService } from 'src/services/lmsService'

const lessonStatusLabel = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'Completada'
    case 'in_progress':
      return 'En progreso'
    default:
      return 'Sin iniciar'
  }
}

const lessonStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'warning'
    default:
      return 'default'
  }
}

const StatTile = ({ label, value, color = 'text.primary' }: { label: string; value: string; color?: string }) => (
  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="h5" fontWeight="bold" color={color}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Paper>
)

const LmsUserCourseReview = () => {
  const { userId, courseId } = useParams()
  const navigate = useNavigate()
  const [selectedAttempt, setSelectedAttempt] = useState<Record<number, number>>({})

  const { data, isLoading, error } = useQuery(
    ['lms-course-review', userId, courseId],
    () => lmsService.getCourseReviewForAdmin(Number(userId), Number(courseId)),
    { enabled: Boolean(userId && courseId) }
  )

  const stats = useMemo(() => {
    if (!data) return { quizzes: 0, attempts: 0, bestAverage: 0 }
    let quizzes = 0
    let attempts = 0
    const bests: number[] = []
    data.modules.forEach((module: any) =>
      module.lessons.forEach((lesson: any) => {
        if (!lesson.quiz) return
        quizzes++
        attempts += lesson.quiz.attempts.length
        const best = lesson.quiz.attempts.reduce((max: number, a: any) => Math.max(max, a.percentage), 0)
        if (lesson.quiz.attempts.length > 0) bests.push(best)
      })
    )
    const bestAverage = bests.length ? Math.round(bests.reduce((s, v) => s + v, 0) / bests.length) : 0
    return { quizzes, attempts, bestAverage }
  }, [data])

  if (isLoading) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No se pudo cargar el avance del usuario.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Volver
      </Button>

      {/* Encabezado */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 260 }}>
            <Typography variant="h5" fontWeight="bold">
              {data.user.name || `Usuario #${data.user.id}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.user.email || `ID ${data.user.id}`}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Curso: <strong>{data.course.title}</strong>
            </Typography>
          </Box>
          <Chip
            icon={data.progress.isCompleted ? <CheckCircleIcon /> : <SchoolIcon />}
            label={data.progress.isCompleted ? 'Curso completado' : 'En progreso'}
            color={data.progress.isCompleted ? 'success' : 'primary'}
          />
        </Box>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={data.progress.progressPercentage}
            sx={{ height: 10, borderRadius: 5, flexGrow: 1 }}
          />
          <Typography variant="h6" fontWeight="bold">
            {data.progress.progressPercentage}%
          </Typography>
        </Box>
      </Paper>

      {/* Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Lecciones completadas"
            value={`${data.progress.completedLessons}/${data.progress.totalLessons}`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile label="Quizzes" value={`${stats.quizzes}`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile label="Intentos de quiz" value={`${stats.attempts}`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Mejor nota (prom.)"
            value={`${stats.bestAverage}%`}
            color={stats.bestAverage >= 70 ? 'success.main' : 'warning.main'}
          />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 3 }}>
        En las respuestas de quiz: <strong>verde</strong> = opción correcta, <strong>rojo</strong> = opción
        incorrecta que eligió el usuario.
      </Alert>

      {/* Módulos */}
      {data.modules.map((module: any) => (
        <Paper key={module.id} variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography fontWeight="medium" sx={{ flexGrow: 1 }}>
              {module.title}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              label={`${module.lessons.filter((l: any) => l.progress?.status === 'completed').length}/${module.lessons.length} completadas`}
            />
          </Box>

          <Divider />

          {module.lessons.map((lesson: any, index: number) => {
            const quizAttempts = lesson.quiz?.attempts || []
            const activeId =
              selectedAttempt[lesson.quiz?.id] ??
              (quizAttempts.length ? quizAttempts[quizAttempts.length - 1].id : null)
            const active = quizAttempts.find((a: any) => a.id === activeId)

            return (
              <Box key={lesson.id} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 22 }}>
                    {index + 1}.
                  </Typography>
                  <Typography fontWeight="medium" sx={{ flexGrow: 1 }}>
                    {lesson.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={lessonStatusLabel(lesson.progress?.status)}
                    color={lessonStatusColor(lesson.progress?.status) as any}
                  />
                </Box>

                {lesson.quiz && (
                  <Box sx={{ mt: 2, pl: { xs: 0, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Quiz: {lesson.quiz.title}
                      </Typography>
                      <Chip size="small" variant="outlined" label={`Aprobación: ${lesson.quiz.passing_percentage}%`} />
                      {quizAttempts.length > 0 ? (
                        <>
                          <Chip
                            size="small"
                            color={quizAttempts.some((a: any) => a.passed) ? 'success' : 'error'}
                            label={quizAttempts.some((a: any) => a.passed) ? 'Aprobado' : 'No aprobado'}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Mejor intento: ${Math.max(...quizAttempts.map((a: any) => a.percentage))}%`}
                          />
                        </>
                      ) : (
                        <Chip size="small" variant="outlined" label="Sin intentos" />
                      )}
                    </Box>

                    {quizAttempts.length > 0 && (
                      <>
                        <Typography variant="overline" color="text.secondary">
                          Intentos ({quizAttempts.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          {quizAttempts.map((attempt: any) => (
                            <Button
                              key={attempt.id}
                              size="small"
                              variant={attempt.id === activeId ? 'contained' : 'outlined'}
                              color={attempt.passed ? 'success' : 'error'}
                              onClick={() =>
                                setSelectedAttempt((prev) => ({ ...prev, [lesson.quiz.id]: attempt.id }))
                              }
                            >
                              Intento {attempt.attempt_number} · {attempt.percentage}%
                            </Button>
                          ))}
                        </Box>

                        {active && (
                          <Accordion variant="outlined" disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <AwardIcon color={active.passed ? 'success' : 'disabled'} />
                                <Typography variant="body2" fontWeight="medium">
                                  Respuestas del Intento {active.attempt_number}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={`${active.score}/${active.total_points} pts · ${active.percentage}%`}
                                />
                                <Chip
                                  size="small"
                                  color={active.passed ? 'success' : 'error'}
                                  label={active.passed ? 'Aprobado' : 'No aprobado'}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>

                            {lesson.quiz.questions.map((question: any, questionIndex: number) => {
                              const answer = active.answers.find((a: any) => a.question_id === question.id)
                              const chosen = answer?.chosen || []
                              const toLetter = (index: number) => String.fromCharCode(65 + index)
                              const typeLabel =
                                question.type === 'multiple'
                                  ? 'Selección múltiple'
                                  : question.type === 'boolean'
                                    ? 'Verdadero / Falso'
                                    : 'Selección única'
                              const chosenLetters = chosen.map(toLetter).join(', ') || '—'
                              const correctLetters = question.correct_answers.map(toLetter).join(', ') || '—'

                              return (
                                <Paper key={question.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                                    <Chip size="small" color="primary" label={`Pregunta ${questionIndex + 1}`} />
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="subtitle1" fontWeight="medium">
                                        {question.question}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {typeLabel} · {question.points} punto(s)
                                      </Typography>
                                    </Box>
                                    <Chip
                                      size="small"
                                      color={answer?.is_correct ? 'success' : 'error'}
                                      icon={answer?.is_correct ? <CheckCircleIcon /> : <CancelIcon />}
                                      label={answer?.is_correct ? 'Correcta' : 'Incorrecta'}
                                    />
                                  </Box>

                                  <Typography variant="overline" color="text.secondary">
                                    Opciones de respuesta
                                  </Typography>

                                  {question.options.map((option: string, optionIndex: number) => {
                                    const isCorrect = question.correct_answers.includes(optionIndex)
                                    const isPicked = chosen.includes(optionIndex)
                                    const borderColor = isCorrect
                                      ? 'success.main'
                                      : isPicked
                                        ? 'error.main'
                                        : 'divider'
                                    const bg = isCorrect
                                      ? 'success.light'
                                      : isPicked
                                        ? 'error.light'
                                        : 'transparent'

                                    return (
                                      <Box
                                        key={optionIndex}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1.5,
                                          px: 1.5,
                                          py: 0.75,
                                          mb: 0.75,
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor,
                                          bgcolor: bg
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            border: '1px solid',
                                            borderColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: 13,
                                            flexShrink: 0
                                          }}
                                        >
                                          {toLetter(optionIndex)}
                                        </Box>
                                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                          {option}
                                        </Typography>
                                        {isPicked && (
                                          <Chip
                                            size="small"
                                            color={isCorrect ? 'success' : 'error'}
                                            label="Tu respuesta"
                                          />
                                        )}
                                        {isCorrect && !isPicked && (
                                          <Chip size="small" color="success" variant="outlined" label="Correcta" />
                                        )}
                                      </Box>
                                    )
                                  })}

                                  <Box sx={{ mt: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Typography variant="body2">
                                      Tu respuesta: <strong>{chosenLetters}</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                      Respuesta correcta: <strong>{correctLetters}</strong>
                                    </Typography>
                                  </Box>

                                  {question.explanation && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ mt: 1, display: 'block' }}
                                    >
                                      {question.explanation}
                                    </Typography>
                                  )}
                                </Paper>
                              )
                            })}
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )
          })}
        </Paper>
      ))}
    </Box>
  )
}

export default LmsUserCourseReview
