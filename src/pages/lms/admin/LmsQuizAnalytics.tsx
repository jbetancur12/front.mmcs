import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  QuestionAnswer as QuestionIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter
} from 'recharts'



interface QuestionAnalytics {
  questionId: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  totalAttempts: number
  correctAttempts: number
  successRate: number
  averageTimeSpent: number
  difficultyScore: number
  discriminationIndex: number
  distractorAnalysis: {
    optionIndex: number
    optionText: string
    selectionCount: number
    selectionPercentage: number
    isCorrect: boolean
  }[]
  recommendations: string[]
}

interface QuizAnalytics {
  quizId: number
  quizTitle: string
  totalAttempts: number
  uniqueUsers: number
  averageScore: number
  passRate: number
  averageTimeSpent: number
  completionRate: number
  retakeRate: number
  questionAnalytics: QuestionAnalytics[]
  performanceTrends: {
    date: string
    attempts: number
    averageScore: number
    passRate: number
  }[]
  userPerformance: {
    userId: number
    userName: string
    attempts: number
    bestScore: number
    averageScore: number
    totalTimeSpent: number
    status: 'passed' | 'failed' | 'in-progress'
  }[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const LmsQuizAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedQuiz, setSelectedQuiz] = useState<number | ''>('')
  const [dateRange, setDateRange] = useState('30')
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionAnalytics | null>(null)

  // Mock data for demonstration
  const availableQuizzes = [
    { id: 1, title: 'Introducción a JavaScript' },
    { id: 2, title: 'Conceptos de Seguridad' },
    { id: 3, title: 'Geografía Mundial' }
  ]

  useEffect(() => {
    if (selectedQuiz) {
      loadAnalytics()
    }
  }, [selectedQuiz, dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    
    // Mock analytics data
    setTimeout(() => {
      const mockAnalytics: QuizAnalytics = {
        quizId: selectedQuiz as number,
        quizTitle: availableQuizzes.find(q => q.id === selectedQuiz)?.title || '',
        totalAttempts: 156,
        uniqueUsers: 89,
        averageScore: 78.5,
        passRate: 82.1,
        averageTimeSpent: 12.5,
        completionRate: 94.2,
        retakeRate: 23.6,
        questionAnalytics: [
          {
            questionId: 1,
            question: '¿Cuál es la diferencia entre let y var en JavaScript?',
            type: 'single-choice',
            totalAttempts: 156,
            correctAttempts: 134,
            successRate: 85.9,
            averageTimeSpent: 45.2,
            difficultyScore: 0.14, // 0-1 scale, lower is easier
            discriminationIndex: 0.42, // -1 to 1, higher is better
            distractorAnalysis: [
              { optionIndex: 0, optionText: 'No hay diferencia', selectionCount: 12, selectionPercentage: 7.7, isCorrect: false },
              { optionIndex: 1, optionText: 'let tiene scope de bloque, var tiene scope de función', selectionCount: 134, selectionPercentage: 85.9, isCorrect: true },
              { optionIndex: 2, optionText: 'var es más moderno que let', selectionCount: 8, selectionPercentage: 5.1, isCorrect: false },
              { optionIndex: 3, optionText: 'let solo funciona en navegadores nuevos', selectionCount: 2, selectionPercentage: 1.3, isCorrect: false }
            ],
            recommendations: [
              'Pregunta con buen rendimiento general',
              'El distractor "No hay diferencia" podría ser más específico'
            ]
          },
          {
            questionId: 2,
            question: '¿Qué métodos se usan para manipular arrays en JavaScript?',
            type: 'multiple-choice',
            totalAttempts: 156,
            correctAttempts: 89,
            successRate: 57.1,
            averageTimeSpent: 78.3,
            difficultyScore: 0.43,
            discriminationIndex: 0.28,
            distractorAnalysis: [
              { optionIndex: 0, optionText: 'push()', selectionCount: 145, selectionPercentage: 92.9, isCorrect: true },
              { optionIndex: 1, optionText: 'pop()', selectionCount: 132, selectionPercentage: 84.6, isCorrect: true },
              { optionIndex: 2, optionText: 'append()', selectionCount: 67, selectionPercentage: 42.9, isCorrect: false },
              { optionIndex: 3, optionText: 'slice()', selectionCount: 98, selectionPercentage: 62.8, isCorrect: true }
            ],
            recommendations: [
              'Pregunta difícil - considerar simplificar',
              'Muchos estudiantes seleccionan "append()" incorrectamente',
              'Revisar la explicación sobre métodos de array'
            ]
          },
          {
            questionId: 3,
            question: 'JavaScript es un lenguaje compilado',
            type: 'true-false',
            totalAttempts: 156,
            correctAttempts: 148,
            successRate: 94.9,
            averageTimeSpent: 15.7,
            difficultyScore: 0.05,
            discriminationIndex: 0.15,
            distractorAnalysis: [
              { optionIndex: 0, optionText: 'Falso', selectionCount: 148, selectionPercentage: 94.9, isCorrect: true },
              { optionIndex: 1, optionText: 'Verdadero', selectionCount: 8, selectionPercentage: 5.1, isCorrect: false }
            ],
            recommendations: [
              'Pregunta muy fácil - considerar aumentar dificultad',
              'Bajo poder discriminativo - no diferencia bien entre estudiantes'
            ]
          }
        ],
        performanceTrends: [
          { date: '2024-01-01', attempts: 12, averageScore: 75.2, passRate: 75.0 },
          { date: '2024-01-08', attempts: 18, averageScore: 77.8, passRate: 83.3 },
          { date: '2024-01-15', attempts: 25, averageScore: 79.1, passRate: 84.0 },
          { date: '2024-01-22', attempts: 22, averageScore: 78.9, passRate: 81.8 },
          { date: '2024-01-29', attempts: 19, averageScore: 80.2, passRate: 84.2 }
        ],
        userPerformance: [
          { userId: 1, userName: 'Juan Pérez', attempts: 2, bestScore: 95, averageScore: 87.5, totalTimeSpent: 25, status: 'passed' },
          { userId: 2, userName: 'María García', attempts: 1, bestScore: 88, averageScore: 88, totalTimeSpent: 15, status: 'passed' },
          { userId: 3, userName: 'Carlos López', attempts: 3, bestScore: 65, averageScore: 58.3, totalTimeSpent: 45, status: 'failed' },
          { userId: 4, userName: 'Ana Martín', attempts: 1, bestScore: 0, averageScore: 0, totalTimeSpent: 0, status: 'in-progress' }
        ]
      }
      
      setAnalytics(mockAnalytics)
      setLoading(false)
    }, 1000)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const getDifficultyLabel = (score: number) => {
    if (score < 0.2) return { label: 'Muy Fácil', color: 'success' }
    if (score < 0.4) return { label: 'Fácil', color: 'info' }
    if (score < 0.6) return { label: 'Medio', color: 'warning' }
    if (score < 0.8) return { label: 'Difícil', color: 'error' }
    return { label: 'Muy Difícil', color: 'error' }
  }

  const getDiscriminationLabel = (index: number) => {
    if (index >= 0.4) return { label: 'Excelente', color: 'success' }
    if (index >= 0.3) return { label: 'Buena', color: 'info' }
    if (index >= 0.2) return { label: 'Aceptable', color: 'warning' }
    return { label: 'Pobre', color: 'error' }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'in-progress': return 'warning'
      default: return 'default'
    }
  }

  const exportAnalytics = () => {
    if (!analytics) return
    
    const data = {
      quiz: analytics.quizTitle,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAttempts: analytics.totalAttempts,
        uniqueUsers: analytics.uniqueUsers,
        averageScore: analytics.averageScore,
        passRate: analytics.passRate,
        averageTimeSpent: analytics.averageTimeSpent
      },
      questionAnalytics: analytics.questionAnalytics,
      userPerformance: analytics.userPerformance
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `quiz_analytics_${analytics.quizId}_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (!analytics && !selectedQuiz) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AnalyticsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Analíticas de Quiz
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona un quiz para ver sus analíticas detalladas
          </Typography>
          
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Seleccionar Quiz</InputLabel>
            <Select
              value={selectedQuiz}
              label="Seleccionar Quiz"
              onChange={(e) => setSelectedQuiz(e.target.value as number)}
            >
              {availableQuizzes.map(quiz => (
                <MenuItem key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Cargando analíticas...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Analíticas: {analytics.quizTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Período</InputLabel>
                <Select
                  value={dateRange}
                  label="Período"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="7">7 días</MenuItem>
                  <MenuItem value="30">30 días</MenuItem>
                  <MenuItem value="90">90 días</MenuItem>
                  <MenuItem value="365">1 año</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAnalytics}
              >
                Actualizar
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={exportAnalytics}
              >
                Exportar
              </Button>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {analytics.totalAttempts}
                </Typography>
                <Typography variant="body2">Total Intentos</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <PeopleIcon color="info" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {analytics.uniqueUsers}
                </Typography>
                <Typography variant="body2">Usuarios Únicos</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrophyIcon color="success" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {analytics.averageScore.toFixed(1)}
                </Typography>
                <Typography variant="body2">Puntuación Promedio</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <SchoolIcon color="warning" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {analytics.passRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2">Tasa de Aprobación</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Resumen General" icon={<AnalyticsIcon />} />
          <Tab label="Análisis de Preguntas" icon={<QuestionIcon />} />
          <Tab label="Rendimiento de Usuarios" icon={<PeopleIcon />} />
          <Tab label="Tendencias" icon={<TrendingUpIcon />} />
        </Tabs>
      </Box>

      {/* Tab 1: General Overview */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribución de Puntuaciones
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { range: '0-20', count: 8 },
                    { range: '21-40', count: 12 },
                    { range: '41-60', count: 18 },
                    { range: '61-80', count: 45 },
                    { range: '81-100', count: 73 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tiempo de Finalización
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '< 5 min', value: 23, fill: COLORS[0] },
                        { name: '5-10 min', value: 45, fill: COLORS[1] },
                        { name: '10-15 min', value: 52, fill: COLORS[2] },
                        { name: '15-20 min', value: 28, fill: COLORS[3] },
                        { name: '> 20 min', value: 8, fill: COLORS[4] }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Métricas Adicionales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" color="info.main">
                        {analytics.completionRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">Tasa de Finalización</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" color="warning.main">
                        {analytics.retakeRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">Tasa de Reintento</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" color="primary.main">
                        {analytics.averageTimeSpent.toFixed(1)} min
                      </Typography>
                      <Typography variant="body2">Tiempo Promedio</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" color="success.main">
                        {(analytics.totalAttempts / analytics.uniqueUsers).toFixed(1)}
                      </Typography>
                      <Typography variant="body2">Intentos por Usuario</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Question Analysis */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Análisis Detallado de Preguntas
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<LightbulbIcon />}
                    onClick={() => setShowRecommendations(true)}
                  >
                    Ver Recomendaciones
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pregunta</TableCell>
                        <TableCell align="center">Tipo</TableCell>
                        <TableCell align="center">Tasa de Éxito</TableCell>
                        <TableCell align="center">Dificultad</TableCell>
                        <TableCell align="center">Discriminación</TableCell>
                        <TableCell align="center">Tiempo Promedio</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.questionAnalytics.map((question) => {
                        const difficulty = getDifficultyLabel(question.difficultyScore)
                        const discrimination = getDiscriminationLabel(question.discriminationIndex)
                        
                        return (
                          <TableRow key={question.questionId}>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                {question.question.length > 80 
                                  ? `${question.question.substring(0, 80)}...` 
                                  : question.question
                                }
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={question.type === 'true-false' ? 'V/F' : 
                                       question.type === 'single-choice' ? 'Única' : 'Múltiple'} 
                                size="small" 
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={question.successRate}
                                  sx={{ width: 60, height: 8, borderRadius: 4 }}
                                  color={question.successRate >= 70 ? 'success' : question.successRate >= 50 ? 'warning' : 'error'}
                                />
                                <Typography variant="body2">
                                  {question.successRate.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={difficulty.label} 
                                size="small" 
                                color={difficulty.color as any}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={discrimination.label} 
                                size="small" 
                                color={discrimination.color as any}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {question.averageTimeSpent.toFixed(1)}s
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Ver detalles">
                                <IconButton 
                                  size="small" 
                                  onClick={() => setSelectedQuestion(question)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Question Difficulty vs Discrimination Scatter Plot */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Análisis de Dificultad vs Discriminación
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={analytics.questionAnalytics.map(q => ({
                    difficulty: q.difficultyScore,
                    discrimination: q.discriminationIndex,
                    question: q.question.substring(0, 30) + '...'
                  }))}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="difficulty" 
                      name="Dificultad"
                      domain={[0, 1]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="discrimination" 
                      name="Discriminación"
                      domain={[-1, 1]}
                    />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="discrimination" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Interpretación:</strong> Las preguntas ideales tienen dificultad media (0.3-0.7) y alta discriminación (&gt;0.3).
                    Las preguntas en la esquina superior izquierda son fáciles pero discriminan bien.
                    Las preguntas en la esquina inferior derecha son difíciles pero no discriminan bien.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: User Performance */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rendimiento Individual de Usuarios
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell align="center">Intentos</TableCell>
                    <TableCell align="center">Mejor Puntuación</TableCell>
                    <TableCell align="center">Puntuación Promedio</TableCell>
                    <TableCell align="center">Tiempo Total</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.userPerformance.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {user.userName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {user.attempts}
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color={user.bestScore >= 70 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {user.bestScore}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {user.averageScore.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {user.totalTimeSpent} min
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={
                            user.status === 'passed' ? 'Aprobado' :
                            user.status === 'failed' ? 'Reprobado' : 'En Progreso'
                          }
                          size="small"
                          color={getStatusColor(user.status) as any}
                          icon={
                            user.status === 'passed' ? <CheckCircleIcon /> :
                            user.status === 'failed' ? <CancelIcon /> : <TimerIcon />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Trends */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendencias de Rendimiento
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attempts" fill="#8884d8" name="Intentos" />
                    <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#82ca9d" name="Puntuación Promedio" />
                    <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#ffc658" name="Tasa de Aprobación %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Question Detail Dialog */}
      <Dialog
        open={selectedQuestion !== null}
        onClose={() => setSelectedQuestion(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Análisis Detallado de Pregunta
        </DialogTitle>
        <DialogContent>
          {selectedQuestion && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedQuestion.question}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {selectedQuestion.totalAttempts}
                    </Typography>
                    <Typography variant="body2">Total Intentos</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">
                      {selectedQuestion.successRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Tasa de Éxito</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main">
                      {selectedQuestion.averageTimeSpent.toFixed(1)}s
                    </Typography>
                    <Typography variant="body2">Tiempo Promedio</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="info.main">
                      {selectedQuestion.discriminationIndex.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">Índice Discriminación</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Análisis de Distractores
              </Typography>
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Opción</TableCell>
                      <TableCell align="center">Selecciones</TableCell>
                      <TableCell align="center">Porcentaje</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuestion.distractorAnalysis.map((option, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {option.optionText}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {option.selectionCount}
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={option.selectionPercentage}
                            sx={{ width: 60, height: 8, borderRadius: 4, mr: 1, display: 'inline-block' }}
                            color={option.isCorrect ? 'success' : 'error'}
                          />
                          {option.selectionPercentage.toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={option.isCorrect ? 'Correcta' : 'Distractor'}
                            size="small"
                            color={option.isCorrect ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom>
                Recomendaciones
              </Typography>
              <List>
                {selectedQuestion.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedQuestion(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recommendations Dialog */}
      <Dialog
        open={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Recomendaciones de Mejora
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Basado en el análisis de las preguntas, aquí tienes algunas recomendaciones:
          </Typography>
          
          {analytics.questionAnalytics.map((question, index) => (
            <Accordion key={question.questionId}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  Pregunta {index + 1}: {question.question.substring(0, 50)}...
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {question.recommendations.map((rec, recIndex) => (
                    <ListItem key={recIndex}>
                      <ListItemIcon>
                        <LightbulbIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecommendations(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsQuizAnalytics