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
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as AssessmentIcon,
  HelpOutline as HelpOutlineIcon,
  Quiz as QuizIcon,
  Timer as TimerIcon
} from '@mui/icons-material'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import quizService from '../../../services/quizService'
import { useManageableQuizzes } from './shared/useManageableQuizzes'

const formatPercent = (value: number) => `${Number(value || 0).toFixed(1)}%`
const formatMinutes = (value: number) => `${Number(value || 0).toFixed(1)} min`

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'single':
      return 'Selección única'
    case 'multiple':
      return 'Selección múltiple'
    case 'boolean':
      return 'Verdadero/Falso'
    default:
      return type
  }
}

export const LmsQuizAnalyticsPanel: React.FC = () => {
  const navigate = useNavigate()
  const [selectedQuizId, setSelectedQuizId] = useState<number | ''>('')

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
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useQuery(
    ['lms-admin', 'quiz-analytics', selectedQuizId],
    () => quizService.getQuizAnalytics(selectedQuizId as number),
    {
      enabled: !!selectedQuizId,
      staleTime: 2 * 60 * 1000
    }
  )

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 1 }}>
            Analíticas de quizzes
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Esta pantalla usa métricas reales del backend. Hoy muestra estadísticas por quiz y
            el detalle básico de sus preguntas, sin fingir tendencias o distractores que aún no
            existen en la API.
          </Typography>
        </Box>

        <Alert severity='info' icon={<HelpOutlineIcon />}>
          Disponible hoy: intentos, usuarios únicos, puntaje promedio, tasa de aprobación,
          tiempo promedio y listado real de preguntas. Pendiente: tendencias temporales,
          análisis de opciones distractoras y recomendaciones automáticas por pregunta.
        </Alert>

        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel id='quiz-analytics-select-label'>Quiz</InputLabel>
                  <Select
                    labelId='quiz-analytics-select-label'
                    value={selectedQuizId}
                    label='Quiz'
                    onChange={(event) => setSelectedQuizId(event.target.value as number | '')}
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
                <Stack direction='row' spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button
                    variant='outlined'
                    disabled={!selectedQuiz}
                    onClick={() =>
                      selectedQuiz &&
                      navigate(`/lms/admin/courses/${selectedQuiz.courseId}/content`)
                    }
                  >
                    Abrir contenido
                  </Button>
                  <Button
                    variant='contained'
                    endIcon={<ArrowForwardIcon />}
                    disabled={!selectedQuiz}
                    onClick={() =>
                      selectedQuiz && navigate(`/lms/course/${selectedQuiz.courseId}/preview`)
                    }
                  >
                    Vista previa
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {optionsError ? (
          <Alert severity='error'>
            No se pudieron cargar los quizzes disponibles para análisis.
          </Alert>
        ) : null}

        {!isLoadingOptions && quizOptions.length === 0 && (
          <Alert severity='warning'>
            Aún no hay quizzes guardados dentro de cursos para analizar.
          </Alert>
        )}

        {selectedQuiz && (
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant='h6'>{selectedQuiz.title}</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip icon={<QuizIcon />} label={selectedQuiz.courseTitle} />
                  <Chip label={`Módulo: ${selectedQuiz.moduleTitle}`} variant='outlined' />
                  <Chip label={`Lección: ${selectedQuiz.lessonTitle}`} variant='outlined' />
                  <Chip label={`${selectedQuiz.questionCount} preguntas`} color='primary' variant='outlined' />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {(isLoadingOptions || isLoadingAnalytics) && <LinearProgress />}

        {analyticsError ? (
          <Alert severity='error'>
            No se pudieron cargar las métricas del quiz seleccionado.
          </Alert>
        ) : null}

        {analytics && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <AssessmentIcon color='primary' />
                      <Typography variant='h4'>{analytics.statistics.totalAttempts}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Intentos totales
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <AnalyticsIcon color='success' />
                      <Typography variant='h4'>{formatPercent(analytics.statistics.averageScore)}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Puntaje promedio
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <QuizIcon color='warning' />
                      <Typography variant='h4'>{formatPercent(analytics.statistics.passRate)}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tasa de aprobación
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <TimerIcon color='info' />
                      <Typography variant='h4'>{formatMinutes(analytics.statistics.averageTimeMinutes)}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tiempo promedio
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Usuarios únicos
                    </Typography>
                    <Typography variant='h5' sx={{ mt: 1 }}>
                      {analytics.statistics.uniqueUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Intentos atípicos
                    </Typography>
                    <Typography variant='h5' sx={{ mt: 1 }}>
                      {analytics.statistics.suspiciousAttempts}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant='subtitle2' color='text.secondary'>
                      Total de preguntas
                    </Typography>
                    <Typography variant='h5' sx={{ mt: 1 }}>
                      {analytics.quiz.totalQuestions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Preguntas incluidas
                </Typography>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pregunta</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align='center'>Puntos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.questionAnalytics.map((question) => (
                        <TableRow key={question.questionId} hover>
                          <TableCell>{question.question}</TableCell>
                          <TableCell>{getQuestionTypeLabel(question.type)}</TableCell>
                          <TableCell align='center'>{question.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  )
}

const LmsQuizAnalytics: React.FC = () => (
  <Navigate to='/lms/admin/analytics?tab=quizzes' replace />
)

export default LmsQuizAnalytics
