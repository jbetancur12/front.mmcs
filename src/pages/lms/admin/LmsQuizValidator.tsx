import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Assessment as AssessmentIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Accessibility as AccessibilityIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Lightbulb as LightbulbIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material'

interface ValidationRule {
  id: string
  category: 'structure' | 'content' | 'accessibility' | 'performance' | 'security'
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  check: (quiz: QuizConfiguration) => ValidationResult
}

interface ValidationResult {
  passed: boolean
  message: string
  details?: string[]
  suggestions?: string[]
}

interface QuizConfiguration {
  id: number
  title: string
  instructions: string
  passingPercentage: number
  maxAttempts: number
  cooldownMinutes: number
  showCorrectAnswers: boolean
  randomizeQuestions: boolean
  shuffleAnswers: boolean
  timeLimitMinutes?: number
  allowReview: boolean
  showProgressBar: boolean
  questions: QuizQuestion[]
}

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correctAnswer: number | number[]
  explanation?: string
  points: number
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  tags?: string[]
}

interface ValidationReport {
  quizId: number
  quizTitle: string
  validatedAt: Date
  overallScore: number
  totalRules: number
  passedRules: number
  warningRules: number
  errorRules: number
  results: {
    rule: ValidationRule
    result: ValidationResult
  }[]
  recommendations: string[]
}

const LmsQuizValidator: React.FC = () => {
  const [selectedQuiz, setSelectedQuiz] = useState<number | ''>('')
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | false>(false)

  // Mock quiz data
  const availableQuizzes = [
    { id: 1, title: 'Introducción a JavaScript' },
    { id: 2, title: 'Conceptos de Seguridad' },
    { id: 3, title: 'Geografía Mundial' }
  ]

  // Validation rules
  const validationRules: ValidationRule[] = [
    // Structure Rules
    {
      id: 'quiz-title',
      category: 'structure',
      severity: 'error',
      title: 'Título del Quiz',
      description: 'El quiz debe tener un título descriptivo',
      check: (quiz) => ({
        passed: quiz.title.trim().length >= 5,
        message: quiz.title.trim().length >= 5 
          ? 'Título válido' 
          : 'El título debe tener al menos 5 caracteres',
        suggestions: quiz.title.trim().length < 5 
          ? ['Proporciona un título más descriptivo que explique el contenido del quiz']
          : undefined
      })
    },
    {
      id: 'quiz-instructions',
      category: 'structure',
      severity: 'warning',
      title: 'Instrucciones del Quiz',
      description: 'Se recomienda incluir instrucciones claras',
      check: (quiz) => ({
        passed: quiz.instructions.trim().length > 0,
        message: quiz.instructions.trim().length > 0 
          ? 'Instrucciones proporcionadas' 
          : 'No se han proporcionado instrucciones',
        suggestions: quiz.instructions.trim().length === 0 
          ? ['Agrega instrucciones que expliquen cómo completar el quiz', 'Incluye información sobre el tiempo límite si aplica']
          : undefined
      })
    },
    {
      id: 'minimum-questions',
      category: 'structure',
      severity: 'error',
      title: 'Número Mínimo de Preguntas',
      description: 'El quiz debe tener al menos 3 preguntas',
      check: (quiz) => ({
        passed: quiz.questions.length >= 3,
        message: quiz.questions.length >= 3 
          ? `${quiz.questions.length} preguntas encontradas` 
          : `Solo ${quiz.questions.length} pregunta(s) encontrada(s)`,
        suggestions: quiz.questions.length < 3 
          ? ['Agrega más preguntas para crear una evaluación más completa']
          : undefined
      })
    },
    {
      id: 'passing-percentage',
      category: 'structure',
      severity: 'warning',
      title: 'Porcentaje de Aprobación',
      description: 'El porcentaje de aprobación debe estar entre 60% y 80%',
      check: (quiz) => ({
        passed: quiz.passingPercentage >= 60 && quiz.passingPercentage <= 80,
        message: quiz.passingPercentage >= 60 && quiz.passingPercentage <= 80
          ? `Porcentaje de aprobación apropiado: ${quiz.passingPercentage}%`
          : `Porcentaje de aprobación: ${quiz.passingPercentage}%`,
        suggestions: quiz.passingPercentage < 60 
          ? ['Considera aumentar el porcentaje de aprobación para asegurar competencia']
          : quiz.passingPercentage > 80
          ? ['Considera reducir el porcentaje de aprobación para evitar frustración']
          : undefined
      })
    },

    // Content Rules
    {
      id: 'question-content',
      category: 'content',
      severity: 'error',
      title: 'Contenido de Preguntas',
      description: 'Todas las preguntas deben tener contenido válido',
      check: (quiz) => {
        const emptyQuestions = quiz.questions.filter(q => !q.question.trim())
        return {
          passed: emptyQuestions.length === 0,
          message: emptyQuestions.length === 0 
            ? 'Todas las preguntas tienen contenido' 
            : `${emptyQuestions.length} pregunta(s) sin contenido`,
          suggestions: emptyQuestions.length > 0 
            ? ['Completa el texto de todas las preguntas']
            : undefined
        }
      }
    },
    {
      id: 'question-options',
      category: 'content',
      severity: 'error',
      title: 'Opciones de Respuesta',
      description: 'Las preguntas de opción múltiple deben tener al menos 2 opciones',
      check: (quiz) => {
        const invalidQuestions = quiz.questions.filter(q => 
          q.type !== 'true-false' && q.options.filter(opt => opt.trim()).length < 2
        )
        return {
          passed: invalidQuestions.length === 0,
          message: invalidQuestions.length === 0 
            ? 'Todas las preguntas tienen opciones suficientes' 
            : `${invalidQuestions.length} pregunta(s) con opciones insuficientes`,
          suggestions: invalidQuestions.length > 0 
            ? ['Asegúrate de que cada pregunta tenga al menos 2 opciones válidas']
            : undefined
        }
      }
    },
    {
      id: 'correct-answers',
      category: 'content',
      severity: 'error',
      title: 'Respuestas Correctas',
      description: 'Todas las preguntas deben tener respuestas correctas definidas',
      check: (quiz) => {
        const invalidQuestions = quiz.questions.filter(q => {
          if (q.type === 'multiple-choice') {
            return !Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0
          }
          return q.correctAnswer === undefined || q.correctAnswer === null
        })
        return {
          passed: invalidQuestions.length === 0,
          message: invalidQuestions.length === 0 
            ? 'Todas las preguntas tienen respuestas correctas' 
            : `${invalidQuestions.length} pregunta(s) sin respuesta correcta`,
          suggestions: invalidQuestions.length > 0 
            ? ['Define la respuesta correcta para todas las preguntas']
            : undefined
        }
      }
    },
    {
      id: 'question-variety',
      category: 'content',
      severity: 'info',
      title: 'Variedad de Preguntas',
      description: 'Se recomienda usar diferentes tipos de preguntas',
      check: (quiz) => {
        const types = new Set(quiz.questions.map(q => q.type))
        return {
          passed: types.size > 1,
          message: types.size > 1 
            ? `${types.size} tipos de preguntas utilizados` 
            : 'Solo se utiliza un tipo de pregunta',
          suggestions: types.size === 1 
            ? ['Considera agregar diferentes tipos de preguntas para mayor variedad']
            : undefined
        }
      }
    },

    // Accessibility Rules
    {
      id: 'question-length',
      category: 'accessibility',
      severity: 'warning',
      title: 'Longitud de Preguntas',
      description: 'Las preguntas no deben ser excesivamente largas',
      check: (quiz) => {
        const longQuestions = quiz.questions.filter(q => q.question.length > 200)
        return {
          passed: longQuestions.length === 0,
          message: longQuestions.length === 0 
            ? 'Longitud de preguntas apropiada' 
            : `${longQuestions.length} pregunta(s) muy larga(s)`,
          suggestions: longQuestions.length > 0 
            ? ['Considera acortar las preguntas largas para mejorar la legibilidad']
            : undefined
        }
      }
    },
    {
      id: 'explanations',
      category: 'accessibility',
      severity: 'info',
      title: 'Explicaciones',
      description: 'Se recomienda incluir explicaciones para las respuestas',
      check: (quiz) => {
        const questionsWithExplanations = quiz.questions.filter(q => q.explanation?.trim())
        const percentage = (questionsWithExplanations.length / quiz.questions.length) * 100
        return {
          passed: percentage >= 50,
          message: `${percentage.toFixed(1)}% de preguntas tienen explicaciones`,
          suggestions: percentage < 50 
            ? ['Agrega explicaciones para ayudar a los estudiantes a entender las respuestas correctas']
            : undefined
        }
      }
    },

    // Performance Rules
    {
      id: 'time-limit',
      category: 'performance',
      severity: 'warning',
      title: 'Límite de Tiempo',
      description: 'El límite de tiempo debe ser apropiado para el número de preguntas',
      check: (quiz) => {
        if (!quiz.timeLimitMinutes) {
          return {
            passed: true,
            message: 'Sin límite de tiempo establecido',
            suggestions: ['Considera establecer un límite de tiempo apropiado']
          }
        }
        const recommendedTime = quiz.questions.length * 2 // 2 minutos por pregunta
        const isAppropriate = quiz.timeLimitMinutes >= recommendedTime * 0.5 && 
                             quiz.timeLimitMinutes <= recommendedTime * 2
        return {
          passed: isAppropriate,
          message: isAppropriate 
            ? `Límite de tiempo apropiado: ${quiz.timeLimitMinutes} minutos` 
            : `Límite de tiempo: ${quiz.timeLimitMinutes} minutos (recomendado: ${recommendedTime} minutos)`,
          suggestions: !isAppropriate 
            ? [`Considera ajustar el límite de tiempo a aproximadamente ${recommendedTime} minutos`]
            : undefined
        }
      }
    },

    // Security Rules
    {
      id: 'attempt-limits',
      category: 'security',
      severity: 'warning',
      title: 'Límites de Intentos',
      description: 'Se recomienda limitar el número de intentos',
      check: (quiz) => ({
        passed: quiz.maxAttempts <= 5,
        message: quiz.maxAttempts <= 5 
          ? `Límite de intentos apropiado: ${quiz.maxAttempts}` 
          : `Límite de intentos alto: ${quiz.maxAttempts}`,
        suggestions: quiz.maxAttempts > 5 
          ? ['Considera reducir el número máximo de intentos para mantener la integridad del quiz']
          : undefined
      })
    },
    {
      id: 'question-randomization',
      category: 'security',
      severity: 'info',
      title: 'Aleatorización de Preguntas',
      description: 'La aleatorización ayuda a prevenir trampas',
      check: (quiz) => ({
        passed: quiz.randomizeQuestions || quiz.shuffleAnswers,
        message: quiz.randomizeQuestions || quiz.shuffleAnswers 
          ? 'Aleatorización habilitada' 
          : 'Sin aleatorización',
        suggestions: !quiz.randomizeQuestions && !quiz.shuffleAnswers 
          ? ['Considera habilitar la aleatorización de preguntas o respuestas']
          : undefined
      })
    }
  ]

  const validateQuiz = async () => {
    if (!selectedQuiz) return

    setLoading(true)

    // Mock quiz data
    const mockQuiz: QuizConfiguration = {
      id: selectedQuiz as number,
      title: availableQuizzes.find(q => q.id === selectedQuiz)?.title || '',
      instructions: 'Completa este quiz para evaluar tus conocimientos.',
      passingPercentage: 70,
      maxAttempts: 3,
      cooldownMinutes: 5,
      showCorrectAnswers: true,
      randomizeQuestions: false,
      shuffleAnswers: true,
      timeLimitMinutes: 15,
      allowReview: true,
      showProgressBar: true,
      questions: [
        {
          id: 1,
          question: '¿Cuál es la diferencia entre let y var en JavaScript?',
          type: 'single-choice',
          options: ['No hay diferencia', 'let tiene scope de bloque, var tiene scope de función', 'var es más moderno', 'let solo funciona en navegadores nuevos'],
          correctAnswer: 1,
          explanation: 'let tiene scope de bloque mientras que var tiene scope de función.',
          points: 1,
          difficulty: 'medium',
          category: 'JavaScript',
          tags: ['variables', 'scope']
        },
        {
          id: 2,
          question: '¿Qué métodos se usan para manipular arrays?',
          type: 'multiple-choice',
          options: ['push()', 'pop()', 'append()', 'slice()'],
          correctAnswer: [0, 1, 3],
          explanation: 'push(), pop() y slice() son métodos nativos de arrays en JavaScript.',
          points: 2,
          difficulty: 'medium',
          category: 'JavaScript',
          tags: ['arrays', 'métodos']
        },
        {
          id: 3,
          question: 'JavaScript es un lenguaje compilado',
          type: 'true-false',
          options: ['Falso', 'Verdadero'],
          correctAnswer: 0,
          explanation: 'JavaScript es un lenguaje interpretado, no compilado.',
          points: 1,
          difficulty: 'easy',
          category: 'JavaScript',
          tags: ['conceptos básicos']
        }
      ]
    }

    // Run validation
    setTimeout(() => {
      const results = validationRules.map(rule => ({
        rule,
        result: rule.check(mockQuiz)
      }))

      const passedRules = results.filter(r => r.result.passed).length
      const warningRules = results.filter(r => !r.result.passed && r.rule.severity === 'warning').length
      const errorRules = results.filter(r => !r.result.passed && r.rule.severity === 'error').length

      const overallScore = Math.round((passedRules / validationRules.length) * 100)

      const recommendations = [
        ...results.filter(r => !r.result.passed && r.rule.severity === 'error')
                 .map(r => `🔴 ${r.rule.title}: ${r.result.message}`),
        ...results.filter(r => !r.result.passed && r.rule.severity === 'warning')
                 .map(r => `🟡 ${r.rule.title}: ${r.result.message}`),
        ...results.filter(r => !r.result.passed && r.rule.severity === 'info')
                 .map(r => `🔵 ${r.rule.title}: ${r.result.message}`)
      ]

      const report: ValidationReport = {
        quizId: mockQuiz.id,
        quizTitle: mockQuiz.title,
        validatedAt: new Date(),
        overallScore,
        totalRules: validationRules.length,
        passedRules,
        warningRules,
        errorRules,
        results,
        recommendations
      }

      setValidationReport(report)
      setLoading(false)
    }, 1500)
  }

  const exportReport = () => {
    if (!validationReport) return

    const reportData = {
      ...validationReport,
      results: validationReport.results.map(r => ({
        category: r.rule.category,
        severity: r.rule.severity,
        title: r.rule.title,
        description: r.rule.description,
        passed: r.result.passed,
        message: r.result.message,
        suggestions: r.result.suggestions
      }))
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `quiz_validation_${validationReport.quizId}_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure': return <AssessmentIcon />
      case 'content': return <QuestionIcon />
      case 'accessibility': return <AccessibilityIcon />
      case 'performance': return <SpeedIcon />
      case 'security': return <SecurityIcon />
      default: return <InfoIcon />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'structure': return 'primary'
      case 'content': return 'secondary'
      case 'accessibility': return 'info'
      case 'performance': return 'warning'
      case 'security': return 'error'
      default: return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <ErrorIcon color="error" />
      case 'warning': return <WarningIcon color="warning" />
      case 'info': return <InfoIcon color="info" />
      default: return <CheckIcon color="success" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  const groupedResults = validationReport?.results.reduce((acc, result) => {
    const category = result.rule.category
    if (!acc[category]) acc[category] = []
    acc[category].push(result)
    return acc
  }, {} as Record<string, typeof validationReport.results>)

  return (
    <Box sx={{ width: '100%' }}>
      {!validationReport ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <BugIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Validador de Quiz
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Valida la calidad y configuración de tus quizzes
            </Typography>
            
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
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
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={validateQuiz}
              disabled={!selectedQuiz || loading}
            >
              {loading ? 'Validando...' : 'Iniciar Validación'}
            </Button>
            
            {loading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ejecutando {validationRules.length} reglas de validación...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Reporte de Validación: {validationReport.quizTitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={validateQuiz}
                  >
                    Re-validar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={exportReport}
                  >
                    Exportar
                  </Button>
                </Box>
              </Box>

              {/* Overall Score */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h3" color={`${getScoreColor(validationReport.overallScore)}.main`}>
                      {validationReport.overallScore}
                    </Typography>
                    <Typography variant="body2">Puntuación General</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={validationReport.overallScore}
                      color={getScoreColor(validationReport.overallScore) as any}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CheckIcon color="success" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h4" color="success.main">
                          {validationReport.passedRules}
                        </Typography>
                        <Typography variant="body2">Aprobadas</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <WarningIcon color="warning" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h4" color="warning.main">
                          {validationReport.warningRules}
                        </Typography>
                        <Typography variant="body2">Advertencias</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <ErrorIcon color="error" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h4" color="error.main">
                          {validationReport.errorRules}
                        </Typography>
                        <Typography variant="body2">Errores</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <AssessmentIcon color="primary" sx={{ fontSize: 30, mb: 1 }} />
                        <Typography variant="h4" color="primary.main">
                          {validationReport.totalRules}
                        </Typography>
                        <Typography variant="body2">Total Reglas</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* Quick Recommendations */}
              {validationReport.recommendations.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recomendaciones Principales:
                  </Typography>
                  <List dense>
                    {validationReport.recommendations.slice(0, 3).map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <Typography variant="body2">{rec}</Typography>
                      </ListItem>
                    ))}
                  </List>
                  {validationReport.recommendations.length > 3 && (
                    <Button size="small" onClick={() => setShowDetails(true)}>
                      Ver todas las recomendaciones
                    </Button>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results by Category */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultados Detallados por Categoría
              </Typography>
              
              {Object.entries(groupedResults || {}).map(([category, results]) => (
                <Accordion 
                  key={category}
                  expanded={expandedCategory === category}
                  onChange={(_, isExpanded) => setExpandedCategory(isExpanded ? category : false)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Chip
                        icon={getCategoryIcon(category)}
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        color={getCategoryColor(category) as any}
                        variant="outlined"
                      />
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(results.filter(r => r.result.passed).length / results.length) * 100}
                          color={getCategoryColor(category) as any}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {results.filter(r => r.result.passed).length}/{results.length}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {results.map((result, index) => (
                        <ListItem key={index} divider={index < results.length - 1}>
                          <ListItemIcon>
                            {result.result.passed 
                              ? <CheckIcon color="success" />
                              : getSeverityIcon(result.rule.severity)
                            }
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2">
                                  {result.rule.title}
                                </Typography>
                                <Chip
                                  label={result.rule.severity}
                                  size="small"
                                  color={
                                    result.rule.severity === 'error' ? 'error' :
                                    result.rule.severity === 'warning' ? 'warning' : 'info'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {result.rule.description}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color={result.result.passed ? 'success.main' : 'error.main'}
                                  sx={{ mt: 0.5 }}
                                >
                                  {result.result.message}
                                </Typography>
                                {result.result.suggestions && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Sugerencias:
                                    </Typography>
                                    <List dense>
                                      {result.result.suggestions.map((suggestion, suggestionIndex) => (
                                        <ListItem key={suggestionIndex} sx={{ py: 0, pl: 2 }}>
                                          <ListItemIcon sx={{ minWidth: 20 }}>
                                            <LightbulbIcon fontSize="small" color="warning" />
                                          </ListItemIcon>
                                          <ListItemText>
                                            <Typography variant="caption">
                                              {suggestion}
                                            </Typography>
                                          </ListItemText>
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Detailed Recommendations Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Todas las Recomendaciones
        </DialogTitle>
        <DialogContent>
          <List>
            {validationReport?.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <LightbulbIcon color="warning" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsQuizValidator