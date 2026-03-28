import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse
} from '@mui/material'
import {
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorOutlineIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { LmsDashboardScope } from '../../../utils/lmsIdentity'


// Modern color palette
const colors = {
  primary: '#10b981',
  primaryLight: '#f0fdf4',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937'
  }
}

// Difficulty color mapping for heatmap
const getDifficultyColor = (successRate: number) => {
  if (successRate >= 80) return colors.success
  if (successRate >= 60) return colors.primary
  if (successRate >= 40) return colors.warning
  return colors.error
}



interface QuizAnalytics {
  totalQuizzes?: number
  averageScore?: number
  averageAttempts?: number
  passRate?: number
  difficultQuestions?: Array<{
    questionId: number
    questionText: string
    successRate: number
    courseTitle: string
    quizTitle: string
    totalAttempts: number
    averageTimeSpent: number
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'very_hard'
  }>
  timeSpentAnalysis?: {
    average: number
    median: number
    distribution: number[]
  }
  trendsData?: Array<{
    date: string
    passRate: number
    failRate: number
    averageScore: number
    totalAttempts: number
  }>
  retryPatterns?: {
    averageRetries: number
    retrySuccessRate: number
    retryDistribution: Array<{
      attemptNumber: number
      count: number
      successRate: number
    }>
  }
  questionDifficultyHeatmap?: Array<{
    questionId: number
    questionText: string
    successRate: number
    totalAttempts: number
    averageTimeSpent: number
    courseTitle: string
    quizTitle: string
  }>
  recommendations?: Array<{
    type: 'question_review' | 'content_improvement' | 'time_adjustment' | 'difficulty_balance'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    actionItems: string[]
    affectedQuestions?: number[]
  }>
}

interface QuizPerformanceDashboardProps {
  data?: QuizAnalytics
  loading?: boolean
  error?: string
  onViewDetails?: () => void
  onQuestionClick?: (questionId: number) => void
  scope?: LmsDashboardScope
  userRole?: string
  department?: string
}

const QuizPerformanceDashboard: React.FC<QuizPerformanceDashboardProps> = ({
  data,
  loading = false,
  error,
  onViewDetails,
  onQuestionClick
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [expandedRecommendations, setExpandedRecommendations] = useState<number[]>([])

  if (loading) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.error}` }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color={colors.error}>
            Error loading quiz performance data
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const performanceLevel = (data.averageScore || 0) >= 80 ? 'excellent' : 
                          (data.averageScore || 0) >= 70 ? 'good' : 
                          (data.averageScore || 0) >= 60 ? 'average' : 'needs_improvement'

  const performanceColor = performanceLevel === 'excellent' ? colors.success :
                          performanceLevel === 'good' ? colors.primary :
                          performanceLevel === 'average' ? colors.warning : colors.error

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const toggleRecommendation = (index: number) => {
    setExpandedRecommendations(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // Render Question Difficulty Heatmap
  const renderDifficultyHeatmap = () => {
    if (!data.questionDifficultyHeatmap || data.questionDifficultyHeatmap.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color={colors.gray[500]}>
            No hay datos de dificultad disponibles
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Mapa de Calor - Dificultad de Preguntas
        </Typography>
        <Grid container spacing={1}>
          {data.questionDifficultyHeatmap.map((question) => (
            <Grid item xs={12} sm={6} md={4} key={question.questionId}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: getDifficultyColor(question.successRate),
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3
                  }
                }}
                onClick={() => onQuestionClick?.(question.questionId)}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {question.questionText.length > 40 ? 
                    `${question.questionText.substring(0, 40)}...` : 
                    question.questionText}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">
                    {question.courseTitle}
                  </Typography>
                  <Chip
                    label={`${question.successRate}%`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  />
                </Box>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">
                    {question.totalAttempts} intentos
                  </Typography>
                  <Typography variant="caption">
                    {question.averageTimeSpent}min prom.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  // Render Pass/Fail Trends Chart
  const renderTrendsChart = () => {
    if (!data.trendsData || data.trendsData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color={colors.gray[500]}>
            No hay datos de tendencias disponibles
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Tendencias de Aprobación/Reprobación
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.trendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="passRate" 
              stroke={colors.success} 
              strokeWidth={3}
              name="Tasa de Aprobación (%)"
            />
            <Line 
              type="monotone" 
              dataKey="failRate" 
              stroke={colors.error} 
              strokeWidth={3}
              name="Tasa de Reprobación (%)"
            />
            <Line 
              type="monotone" 
              dataKey="averageScore" 
              stroke={colors.info} 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Score Promedio"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    )
  }

  // Render Retry Patterns Analysis
  const renderRetryPatterns = () => {
    if (!data.retryPatterns) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color={colors.gray[500]}>
            No hay datos de patrones de reintento disponibles
          </Typography>
        </Box>
      )
    }

    const retryData = data.retryPatterns.retryDistribution || []

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Patrones de Reintento
        </Typography>
        
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: colors.primaryLight }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                {data.retryPatterns.averageRetries.toFixed(1)}
              </Typography>
              <Typography variant="body2" color={colors.primary}>
                Reintentos Promedio
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f9ff' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
                {data.retryPatterns.retrySuccessRate}%
              </Typography>
              <Typography variant="body2" color={colors.info}>
                Éxito en Reintentos
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Retry Distribution Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={retryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="attemptNumber" 
              label={{ value: 'Número de Intento', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Cantidad de Usuarios', angle: -90, position: 'insideLeft' }}
            />
            <RechartsTooltip 
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => `Intento ${label}`}
            />
            <Bar 
              dataKey="count" 
              fill={colors.primary} 
              name="Cantidad de Usuarios"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Success Rate by Attempt */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
            Tasa de Éxito por Intento
          </Typography>
          {retryData.map((attempt) => (
            <Box key={attempt.attemptNumber} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  Intento {attempt.attemptNumber}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {attempt.successRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={attempt.successRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: colors.gray[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: attempt.successRate >= 70 ? colors.success : 
                            attempt.successRate >= 50 ? colors.warning : colors.error,
                    borderRadius: 3
                  }
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  // Render Recommendations
  const renderRecommendations = () => {
    if (!data.recommendations || data.recommendations.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LightbulbIcon sx={{ fontSize: 48, color: colors.gray[300], mb: 2 }} />
          <Typography variant="body2" color={colors.gray[500]}>
            No hay recomendaciones disponibles
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recomendaciones de Mejora
        </Typography>
        <List>
          {data.recommendations.map((recommendation, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <Paper sx={{ width: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                     onClick={() => toggleRecommendation(index)}>
                  <ListItemIcon>
                    <LightbulbIcon sx={{ 
                      color: recommendation.priority === 'high' ? colors.error :
                             recommendation.priority === 'medium' ? colors.warning : colors.info
                    }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {recommendation.title}
                        </Typography>
                        <Chip
                          label={recommendation.priority.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: recommendation.priority === 'high' ? colors.error :
                                   recommendation.priority === 'medium' ? colors.warning : colors.info,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    }
                    secondary={recommendation.description}
                  />
                  <ListItemSecondaryAction>
                    {expandedRecommendations.includes(index) ? 
                      <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemSecondaryAction>
                </Box>
                
                <Collapse in={expandedRecommendations.includes(index)}>
                  <Box sx={{ mt: 2, pl: 6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Acciones Recomendadas:
                    </Typography>
                    <List dense>
                      {recommendation.actionItems.map((action, actionIndex) => (
                        <ListItem key={actionIndex} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                • {action}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    {recommendation.affectedQuestions && recommendation.affectedQuestions.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color={colors.gray[600]}>
                          Preguntas afectadas: {recommendation.affectedQuestions.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Box>
    )
  }

  return (
    <>
      <Card sx={{
        borderRadius: '16px',
        border: `1px solid ${colors.gray[200]}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          borderColor: '#8b5cf6',
          boxShadow: `0 8px 25px rgba(139, 92, 246, 0.15)`,
          transform: 'translateY(-2px)'
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              mr: 2,
              width: 48,
              height: 48
            }}>
              <QuizIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                Performance de Quizzes
              </Typography>
              <Typography variant="body2" color={colors.gray[500]}>
                Análisis avanzado de dificultad y rendimiento
              </Typography>
            </Box>
            <Tooltip title="Ver análisis detallado">
              <IconButton onClick={() => setDetailsOpen(true)} size="small">
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ver análisis completo">
              <IconButton onClick={onViewDetails} size="small">
                <AssessmentIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                  {data.totalQuizzes || 0}
                </Typography>
                <Typography variant="body2" color={colors.gray[500]}>
                  Quizzes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e8ff', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                  {data.averageScore || 0}
                </Typography>
                <Typography variant="body2" color="#8b5cf6">
                  Score Prom.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.primaryLight, borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                  {data.passRate || 0}%
                </Typography>
                <Typography variant="body2" color={colors.primary}>
                  Aprobación
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
                  {data.retryPatterns?.averageRetries?.toFixed(1) || data.averageAttempts || 0}
                </Typography>
                <Typography variant="body2" color={colors.info}>
                  Reintentos
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Performance Indicator */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700] }}>
                Rendimiento General
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {(data.averageScore || 0) >= 75 ? 
                  <TrendingUpIcon sx={{ color: colors.success, fontSize: 16, mr: 0.5 }} /> :
                  <TrendingDownIcon sx={{ color: colors.error, fontSize: 16, mr: 0.5 }} />
                }
                <Chip
                  label={performanceLevel === 'excellent' ? 'Excelente' :
                        performanceLevel === 'good' ? 'Bueno' :
                        performanceLevel === 'average' ? 'Promedio' : 'Necesita Mejora'}
                  size="small"
                  sx={{
                    bgcolor: performanceColor,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={data.averageScore || 0}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colors.gray[200],
                '& .MuiLinearProgress-bar': {
                  bgcolor: performanceColor,
                  borderRadius: 4
                }
              }}
            />
          </Box>

          {/* Quick Insights */}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
                <CheckCircleIcon sx={{ color: colors.success, fontSize: 24, mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: colors.success }}>
                  {Math.round(data.passRate || 0)}%
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Aprobación
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
                <ErrorOutlineIcon sx={{ color: colors.warning, fontSize: 24, mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: colors.warning }}>
                  {data.difficultQuestions?.length || 0}
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Preguntas Difíciles
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
                <AccessTimeIcon sx={{ color: colors.info, fontSize: 24, mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: colors.info }}>
                  {data.timeSpentAnalysis?.average || 0}min
                </Typography>
                <Typography variant="caption" color={colors.gray[500]}>
                  Tiempo Prom.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Analytics Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                mr: 2,
                width: 40,
                height: 40
              }}>
                <QuizIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Análisis Detallado de Quizzes
                </Typography>
                <Typography variant="body2" color={colors.gray[500]}>
                  Visualizaciones avanzadas y recomendaciones
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab 
              icon={<BarChartIcon />} 
              label="Mapa de Dificultad" 
              iconPosition="start"
            />
            <Tab 
              icon={<TimelineIcon />} 
              label="Tendencias" 
              iconPosition="start"
            />
            <Tab 
              icon={<RefreshIcon />} 
              label="Patrones de Reintento" 
              iconPosition="start"
            />
            <Tab 
              icon={<LightbulbIcon />} 
              label="Recomendaciones" 
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ minHeight: 400 }}>
            {activeTab === 0 && renderDifficultyHeatmap()}
            {activeTab === 1 && renderTrendsChart()}
            {activeTab === 2 && renderRetryPatterns()}
            {activeTab === 3 && renderRecommendations()}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailsOpen(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={onViewDetails}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              }
            }}
          >
            Ver Análisis Completo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default QuizPerformanceDashboard
