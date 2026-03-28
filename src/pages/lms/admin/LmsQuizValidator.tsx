import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Lightbulb as LightbulbIcon,
  Rule as RuleIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import quizService, { type CreateQuizDTO, type Quiz } from '../../../services/quizService'
import { useManageableQuizzes } from './shared/useManageableQuizzes'

type RecommendationLevel = 'good' | 'warning'

interface RecommendationCheck {
  title: string
  message: string
  level: RecommendationLevel
}

const buildQuizDtoFromStoredQuiz = (quiz: Quiz): CreateQuizDTO => ({
  title: quiz.title,
  instructions: quiz.instructions,
  passing_percentage: quiz.passing_percentage,
  max_attempts: quiz.max_attempts,
  cooldown_minutes: quiz.cooldown_minutes,
  show_correct_answers: quiz.show_correct_answers,
  randomize_questions: quiz.randomize_questions,
  shuffle_answers: quiz.shuffle_answers,
  time_limit_minutes: quiz.time_limit_minutes,
  questions: quiz.questions.map((question) => ({
    type: question.type,
    question: question.question,
    options: question.options,
    correct_answers: question.correct_answers,
    points: question.points,
    order_index: question.order_index,
    explanation: question.explanation || undefined
  }))
})

const getRecommendationChecks = (quiz: Quiz): RecommendationCheck[] => {
  const explanationsCount = quiz.questions.filter((question) => Boolean(question.explanation?.trim())).length
  const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0)
  const multiQuestionCount = quiz.questions.filter((question) => question.type === 'multiple').length

  return [
    {
      title: 'Cantidad de preguntas',
      message:
        quiz.questions.length >= 3
          ? `${quiz.questions.length} preguntas: suficiente para una evaluación breve.`
          : `Solo ${quiz.questions.length} pregunta(s): conviene ampliar el quiz si será evaluativo.`,
      level: quiz.questions.length >= 3 ? 'good' : 'warning'
    },
    {
      title: 'Instrucciones visibles',
      message: quiz.instructions.trim()
        ? 'El quiz incluye instrucciones para el estudiante.'
        : 'No hay instrucciones visibles; conviene orientar cómo responder o aprobar.',
      level: quiz.instructions.trim() ? 'good' : 'warning'
    },
    {
      title: 'Explicaciones por pregunta',
      message:
        explanationsCount === quiz.questions.length
          ? 'Todas las preguntas tienen explicación para retroalimentación.'
          : `${explanationsCount} de ${quiz.questions.length} preguntas tienen explicación.`,
      level: explanationsCount === quiz.questions.length ? 'good' : 'warning'
    },
    {
      title: 'Puntaje total',
      message:
        totalPoints > 0
          ? `El quiz suma ${totalPoints} punto(s) en total.`
          : 'El quiz no suma puntos efectivos.',
      level: totalPoints > 0 ? 'good' : 'warning'
    },
    {
      title: 'Complejidad declarada',
      message:
        multiQuestionCount > 0
          ? `Incluye ${multiQuestionCount} pregunta(s) de selección múltiple, lo que puede exigir revisión editorial.`
          : 'No hay preguntas de selección múltiple.',
      level: multiQuestionCount > 0 ? 'warning' : 'good'
    }
  ]
}

const LmsQuizValidator: React.FC = () => {
  const [selectedQuizId, setSelectedQuizId] = useState<number | ''>('')
  const [shouldValidate, setShouldValidate] = useState(false)

  const {
    data: quizOptions = [],
    isLoading: isLoadingOptions,
    error: optionsError
  } = useManageableQuizzes()

  const selectedQuiz = useMemo(
    () => quizOptions.find((quiz) => quiz.id === selectedQuizId) || null,
    [quizOptions, selectedQuizId]
  )

  const {
    data: storedQuiz,
    isLoading: isLoadingQuiz,
    error: quizError
  } = useQuery(
    ['lms-admin', 'quiz-validator', 'detail', selectedQuizId],
    () => quizService.getQuizById(selectedQuizId as number),
    {
      enabled: !!selectedQuizId,
      staleTime: 5 * 60 * 1000
    }
  )

  const validationDto = useMemo(
    () => (storedQuiz ? buildQuizDtoFromStoredQuiz(storedQuiz) : null),
    [storedQuiz]
  )

  const {
    data: validationResult,
    isFetching: isValidating,
    error: validationError
  } = useQuery(
    ['lms-admin', 'quiz-validator', 'contract', selectedQuizId],
    () => quizService.validateQuizConfig(validationDto as CreateQuizDTO),
    {
      enabled: !!validationDto && shouldValidate,
      refetchOnWindowFocus: false,
      staleTime: 0
    }
  )

  const recommendations = useMemo(
    () => (storedQuiz ? getRecommendationChecks(storedQuiz) : []),
    [storedQuiz]
  )

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 1 }}>
            Validador de Quizzes
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Esta pantalla valida un quiz ya guardado contra el contrato técnico del backend y
            además muestra recomendaciones editoriales transparentes. No simula auditorías
            avanzadas que hoy no existen en la API.
          </Typography>
        </Box>

        <Alert severity='info'>
          La validación técnica confirma si el quiz guardado sigue cumpliendo el esquema de
          creación/edición del backend. Las recomendaciones editoriales son heurísticas locales
          para ayudarte a revisar calidad y claridad.
        </Alert>

        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel id='quiz-validator-select-label'>Quiz</InputLabel>
                  <Select
                    labelId='quiz-validator-select-label'
                    value={selectedQuizId}
                    label='Quiz'
                    onChange={(event) => {
                      setSelectedQuizId(event.target.value as number | '')
                      setShouldValidate(false)
                    }}
                    disabled={isLoadingOptions || quizOptions.length === 0}
                  >
                    {quizOptions.map((quiz) => (
                      <MenuItem key={quiz.id} value={quiz.id}>
                        {quiz.courseTitle} / {quiz.lessonTitle} / {quiz.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant='contained'
                  disabled={!validationDto || isValidating}
                  onClick={() => setShouldValidate(true)}
                >
                  Validar Quiz Guardado
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {(isLoadingOptions || isLoadingQuiz) && <LinearProgress />}

        {optionsError ? (
          <Alert severity='error'>
            No se pudo cargar el inventario de quizzes para validar.
          </Alert>
        ) : null}

        {!isLoadingOptions && quizOptions.length === 0 && (
          <Alert severity='warning'>
            Aún no hay quizzes guardados dentro de cursos para validar.
          </Alert>
        )}

        {quizError ? (
          <Alert severity='error'>
            No se pudo cargar el detalle del quiz seleccionado.
          </Alert>
        ) : null}

        {selectedQuiz && (
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant='h6'>{selectedQuiz.title}</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip label={selectedQuiz.courseTitle} />
                  <Chip label={`Lección: ${selectedQuiz.lessonTitle}`} variant='outlined' />
                  <Chip label={`${selectedQuiz.questionCount} preguntas`} color='primary' variant='outlined' />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {shouldValidate && validationResult && (
          <Alert
            severity={validationResult.valid ? 'success' : 'error'}
            icon={validationResult.valid ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
          >
            {validationResult.message}
          </Alert>
        )}

        {validationError ? (
          <Alert severity='error'>
            Ocurrió un error al ejecutar la validación técnica del quiz.
          </Alert>
        ) : null}

        {storedQuiz && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Aprobación
                  </Typography>
                  <Typography variant='h5' sx={{ mt: 1 }}>
                    {storedQuiz.passing_percentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Intentos máximos
                  </Typography>
                  <Typography variant='h5' sx={{ mt: 1 }}>
                    {storedQuiz.max_attempts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Tiempo límite
                  </Typography>
                  <Typography variant='h5' sx={{ mt: 1 }}>
                    {storedQuiz.time_limit_minutes ? `${storedQuiz.time_limit_minutes} min` : 'Sin límite'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {recommendations.length > 0 && (
          <Card>
            <CardContent>
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                <RuleIcon color='primary' />
                <Typography variant='h6'>Revisión editorial</Typography>
              </Stack>
              <List>
                {recommendations.map((item) => (
                  <ListItem key={item.title} alignItems='flex-start'>
                    <ListItemIcon>
                      {item.level === 'good' ? (
                        <CheckCircleIcon color='success' />
                      ) : (
                        <WarningAmberIcon color='warning' />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.message}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {storedQuiz && (
          <Card>
            <CardContent>
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                <LightbulbIcon color='warning' />
                <Typography variant='h6'>Detalle del quiz guardado</Typography>
              </Stack>
              <List>
                {storedQuiz.questions.map((question, index) => (
                  <ListItem key={question.id} alignItems='flex-start'>
                    <ListItemText
                      primary={`Pregunta ${index + 1}: ${question.question}`}
                      secondary={`${question.type} · ${question.points} punto(s) · ${question.options.length} opción(es)`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  )
}

export default LmsQuizValidator
