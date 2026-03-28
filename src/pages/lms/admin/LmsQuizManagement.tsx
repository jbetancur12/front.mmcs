import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  RadioGroup,
  Radio,
  Checkbox,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Help as HelpIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  ToggleOn as ToggleIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Analytics as AnalyticsIcon,
  QuestionAnswer as QuestionIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import quizService from '../../../services/quizService'
import LmsQuizComponent from '../components/LmsQuizComponent'
import Swal from 'sweetalert2'

interface QuizQuestion {
  id: number
  question: string
  type: 'single' | 'multiple' | 'boolean'  // Backend types
  options: string[]
  correct_answers: number[]  // Always array for consistency
  explanation?: string
  points: number
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  tags?: string[]
  usageCount?: number
  successRate?: number
}

interface QuizConfiguration {
  id?: number
  title: string
  instructions: string
  passingPercentage: number
  maxAttempts: number
  cooldownMinutes: number
  showCorrectAnswers: boolean
  randomizeQuestions: boolean
  shuffleAnswers: boolean
  hasTimeLimit: boolean  // Frontend flag
  timeLimitMinutes: number | null
  allowReview: boolean  // Frontend only (not in backend)
  showProgressBar: boolean  // Frontend only (not in backend)
  questions: QuizQuestion[]
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
      id={`quiz-tabpanel-${index}`}
      aria-labelledby={`quiz-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface LmsQuizManagementProps {
  courseId?: number
  moduleId?: string
  initialQuizId?: number
  onQuizSaved?: (quizId: number) => void
  embedded?: boolean
}

const LmsQuizManagement: React.FC<LmsQuizManagementProps> = ({
  courseId,
  moduleId,
  initialQuizId,
  onQuizSaved
}) => {
  const questionCategorySuggestions = ['Seguridad', 'Calidad', 'Cumplimiento', 'Inducción', 'Evaluación técnica']
  const queryClient = useQueryClient()
  const axiosPrivate = useAxiosPrivate()

  const [activeTab, setActiveTab] = useState(0)
  const [quizConfig, setQuizConfig] = useState<QuizConfiguration>({
    title: '',
    instructions: '',
    passingPercentage: 70,
    maxAttempts: 3,
    cooldownMinutes: 0,
    showCorrectAnswers: true,
    randomizeQuestions: false,
    shuffleAnswers: false,
    hasTimeLimit: false,
    timeLimitMinutes: null,
    allowReview: true,
    showProgressBar: true,
    questions: []
  })

  const [questionBank, setQuestionBank] = useState<QuizQuestion[]>([])
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')

  const [newQuestion, setNewQuestion] = useState<Partial<QuizQuestion>>({
    question: '',
    type: 'single',
    options: ['', '', '', ''],
    correct_answers: [0],
    explanation: '',
    points: 1,
    difficulty: 'medium',
    category: '',
    tags: []
  })

  // ============================================================================
  // React Query Hooks
  // ============================================================================

  // Load existing quiz if initialQuizId is provided
  const {
    data: loadedQuiz,
    isLoading: isLoadingQuiz,
    error: quizLoadError
  } = useQuery(
    ['quiz', initialQuizId],
    () => quizService.getQuizById(initialQuizId!),
    {
      enabled: !!initialQuizId,
      refetchOnMount: 'always',
      retry: 1,
      onSuccess: (quiz) => {
        console.log('✅ Quiz loaded from backend:', quiz)

        // Map backend quiz to frontend state
        setQuizConfig({
          id: quiz.id,
          title: quiz.title,
          instructions: quiz.instructions,
          passingPercentage: quiz.passing_percentage,
          maxAttempts: quiz.max_attempts,
          cooldownMinutes: quiz.cooldown_minutes,
          showCorrectAnswers: quiz.show_correct_answers,
          randomizeQuestions: quiz.randomize_questions,
          shuffleAnswers: quiz.shuffle_answers,
          hasTimeLimit: quiz.time_limit_minutes !== null,
          timeLimitMinutes: quiz.time_limit_minutes,
          allowReview: true,
          showProgressBar: true,
          questions: quiz.questions.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correct_answers: q.correct_answers,
            points: q.points,
            explanation: q.explanation || undefined
          }))
        })
      },
      onError: (error: any) => {
        console.error('❌ Error loading quiz:', error)
      }
    }
  )

  // Load quiz statistics for analytics tab
  const {
    data: quizStats,
    isLoading: isLoadingStats,
    error: statsLoadError
  } = useQuery(
    ['quiz-stats', initialQuizId],
    () => quizService.getQuizStatistics(initialQuizId!),
    {
      enabled: !!initialQuizId && activeTab === 3,
      retry: 1,
      refetchInterval: 30000, // Refresh every 30 seconds when on analytics tab
      onError: (error: any) => {
        console.error('❌ Error loading quiz stats:', error)
      }
    }
  )

  // Save quiz mutation (create or update)
  const saveQuizMutation = useMutation(
    async () => {
      if (!moduleId) {
        throw new Error('Module ID is required')
      }


      // Get lesson ID from module
      const lessonsResponse = await axiosPrivate.get(`/lms/content/modules/${moduleId}/lessons`)
      const lessons = lessonsResponse.data.data || lessonsResponse.data || []

      if (lessons.length === 0) {
        throw new Error('Este módulo no tiene lecciones. Por favor, crea una lección primero.')
      }

      const lessonId = lessons[0].id

      // Build quiz DTO
      console.log("🚀 ~ LmsQuizManagement ~ quizConfig:", quizConfig) 
      const quizDTO = quizService.buildQuizDTO(quizConfig, quizConfig.questions)

      console.log('📤 Sending quiz to backend:', { lessonId, quizDTO })

      // Create or Update
      if (initialQuizId) {
        return await quizService.updateQuiz(initialQuizId, quizDTO)
      } else {
        return await quizService.createQuiz(lessonId, quizDTO)
      }
    },
    {
      onSuccess: (quiz) => {
        console.log('✅ Quiz saved successfully:', quiz)

        // Invalidate queries
        queryClient.invalidateQueries(['quiz', quiz.id])
        queryClient.invalidateQueries(['lms-course', courseId])

        // Callback to parent component
        if (onQuizSaved) {
          onQuizSaved(quiz.id)
        }
      },
      onError: (error: any) => {
        console.error('❌ Error saving quiz:', error)
      }
    }
  )

  // ============================================================================
  // Question Bank API Integration
  // ============================================================================

  // Fetch question bank from API
  const { data: questionBankData } = useQuery(
    ['questionBank', searchTerm, filterCategory, filterDifficulty],
    async () => {
      const params = new URLSearchParams()
      if (filterDifficulty) params.append('difficulty', filterDifficulty)
      if (filterCategory) params.append('category', filterCategory)
      if (searchTerm) params.append('search', searchTerm)

      const response = await axiosPrivate.get(`/lms/question-bank?${params.toString()}`)
      return response.data
    },
    {
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchOnMount: 'always', // <--- fuerza re-fetch cada vez que el componente monta
      onSuccess: (data) => {
        console.log('✅ Question bank loaded from API:', data)
        setQuestionBank(data.data || [])
      },
      onError: (error: any) => {
        console.error('❌ Error loading question bank:', error)
        Swal.fire('Error', 'Error al cargar el banco de preguntas', 'error')
      }
    }
  )

  // Sync questionBankData with questionBank state
  useEffect(() => {
    if (questionBankData?.data) {
      console.log('🔄 Syncing question bank data:', questionBankData.data)
      setQuestionBank(questionBankData.data)
    }
  }, [questionBankData])

   useEffect(() => {
    if (!loadedQuiz) return

    const quiz = loadedQuiz
    console.log('✅ Quiz (effect) loaded:', quiz)

    setQuizConfig({
      id: quiz.id,
      title: quiz.title,
      instructions: quiz.instructions,
      passingPercentage: quiz.passing_percentage,
      maxAttempts: quiz.max_attempts,
      cooldownMinutes: quiz.cooldown_minutes,
      showCorrectAnswers: quiz.show_correct_answers,
      randomizeQuestions: quiz.randomize_questions,
      shuffleAnswers: quiz.shuffle_answers,
      hasTimeLimit: quiz.time_limit_minutes !== null,
      timeLimitMinutes: quiz.time_limit_minutes,
      allowReview: true,
      showProgressBar: true,
      questions: quiz.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correct_answers: q.correct_answers,
        points: q.points,
        explanation: q.explanation || undefined
      }))
    })
  }, [loadedQuiz])

  // Create question mutation
  const createQuestionMutation = useMutation(
    async (questionData: Partial<QuizQuestion>) => {
      const response = await axiosPrivate.post('/lms/question-bank', questionData)
      return response.data
    },
    {
      onSuccess: (data) => {
        console.log('✅ Question created:', data)
        Swal.fire('Éxito', 'Pregunta creada exitosamente', 'success')
        queryClient.invalidateQueries(['questionBank'])
        // Close modal and reset form after successful creation
        resetQuestionForm()
        setOpenQuestionDialog(false)
      },
      onError: (error: any) => {
        console.error('❌ Error creating question:', error)
        Swal.fire('Error', error.response?.data?.error?.message || 'Error al crear la pregunta', 'error')
      }
    }
  )

  // Update question mutation
  const updateQuestionMutation = useMutation(
    async ({ id, data, updateQuiz }: { id: number; data: Partial<QuizQuestion>; updateQuiz?: { isInQuiz: boolean; updatedQuestion: QuizQuestion } }) => {
      const response = await axiosPrivate.put(`/lms/question-bank/${id}`, data)
      return { response: response.data, updateQuiz }
    },
    {
      onSuccess: ({ response, updateQuiz }) => {
        console.log('✅ Question updated:', response)
        Swal.fire('Éxito', 'Pregunta actualizada exitosamente', 'success')
        queryClient.invalidateQueries(['questionBank'])

        // Update quiz questions if this question is in the quiz
        if (updateQuiz?.isInQuiz && updateQuiz.updatedQuestion) {
          setQuizConfig(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === updateQuiz.updatedQuestion.id ? updateQuiz.updatedQuestion : q)
          }))
        }

        // Close modal and reset form after successful update
        setEditingQuestion(null)
        resetQuestionForm()
        setOpenQuestionDialog(false)
      },
      onError: (error: any) => {
        console.error('❌ Error updating question:', error)
        Swal.fire('Error', error.response?.data?.error?.message || 'Error al actualizar la pregunta', 'error')
      }
    }
  )

  // Delete question mutation
  const deleteQuestionMutation = useMutation(
    async (id: number) => {
      const response = await axiosPrivate.delete(`/lms/question-bank/${id}`)
      return response.data
    },
    {
      onSuccess: () => {
        console.log('✅ Question deleted')
        Swal.fire('Éxito', 'Pregunta eliminada exitosamente', 'success')
        queryClient.invalidateQueries(['questionBank'])
      },
      onError: (error: any) => {
        console.error('❌ Error deleting question:', error)
        Swal.fire('Error', error.response?.data?.error?.message || 'Error al eliminar la pregunta', 'error')
      }
    }
  )

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleQuizConfigChange = (field: keyof QuizConfiguration, value: any) => {
    setQuizConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleAddQuestion = () => {
    if (!newQuestion.question?.trim()) return

    const questionData = {
      question: newQuestion.question,
      type: newQuestion.type || 'single',
      options: newQuestion.options?.filter(opt => opt.trim() !== '') || [],
      correct_answers: newQuestion.correct_answers || [0],
      explanation: newQuestion.explanation,
      points: newQuestion.points || 1,
      difficulty: newQuestion.difficulty || 'medium',
      category: newQuestion.category || '',
      tags: newQuestion.tags || []
    }

    createQuestionMutation.mutate(questionData)
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setNewQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options],
      correct_answers: question.correct_answers,
      explanation: question.explanation,
      points: question.points,
      difficulty: question.difficulty,
      category: question.category,
      tags: question.tags
    })
    setOpenQuestionDialog(true)
  }

  const handleUpdateQuestion = () => {
    if (!editingQuestion || !newQuestion.question?.trim()) return

    const questionData = {
      question: newQuestion.question,
      type: newQuestion.type || editingQuestion.type,
      options: newQuestion.options?.filter(opt => opt.trim() !== '') || editingQuestion.options,
      correct_answers: newQuestion.correct_answers || editingQuestion.correct_answers,
      explanation: newQuestion.explanation,
      points: newQuestion.points || editingQuestion.points,
      difficulty: newQuestion.difficulty || editingQuestion.difficulty,
      category: newQuestion.category || editingQuestion.category,
      tags: newQuestion.tags || editingQuestion.tags
    }

    // Check if this question is in the quiz
    const isInQuiz = quizConfig.questions.some(q => q.id === editingQuestion.id)
    const updatedQuestion: QuizQuestion = {
      ...editingQuestion,
      ...questionData,
      correct_answers: questionData.correct_answers
    }

    updateQuestionMutation.mutate({
      id: editingQuestion.id,
      data: questionData,
      updateQuiz: isInQuiz ? { isInQuiz, updatedQuestion } : undefined
    })
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      await deleteQuestionMutation.mutateAsync(questionId)

      // Also remove from quiz if present
      setQuizConfig(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId)
      }))
    }
  }

  const handleAddQuestionsToQuiz = () => {
    const questionsToAdd = questionBank.filter(q => selectedQuestions.includes(q.id))
    setQuizConfig(prev => ({
      ...prev,
      questions: [...prev.questions, ...questionsToAdd.filter(q => !prev.questions.find(existing => existing.id === q.id))]
    }))
    setSelectedQuestions([])
  }

  const handleRemoveQuestionFromQuiz = (questionId: number) => {
    setQuizConfig(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  const resetQuestionForm = () => {
    setNewQuestion({
      question: '',
      type: 'single',
      options: ['', '', '', ''],
      correct_answers: [0],
      explanation: '',
      points: 1,
      difficulty: 'medium',
      category: '',
      tags: []
    })
  }

  const getFilteredQuestions = () => {
    return questionBank.filter(question => {
      const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = !filterCategory || question.category === filterCategory
      const matchesDifficulty = !filterDifficulty || question.difficulty === filterDifficulty
      
      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'true-false': return <ToggleIcon />
      case 'single-choice': return <RadioIcon />
      case 'multiple-choice': return <CheckboxIcon />
      default: return <HelpIcon />
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'success'
      case 'medium': return 'warning'
      case 'hard': return 'error'
      default: return 'default'
    }
  }

  const validateQuizConfig = () => {
    const errors: string[] = []
    
    if (!quizConfig.title.trim()) errors.push('El título es requerido')
    if (quizConfig.questions.length === 0) errors.push('Debe agregar al menos una pregunta')
    if (quizConfig.passingPercentage < 1 || quizConfig.passingPercentage > 100) {
      errors.push('El porcentaje de aprobación debe estar entre 1 y 100')
    }
    if (quizConfig.maxAttempts < 1 || quizConfig.maxAttempts > 10) {
      errors.push('Los intentos máximos deben estar entre 1 y 10')
    }
    
    return errors
  }

  const applyQuestionCategorySuggestion = (value: string) => {
    setNewQuestion((prev) => ({ ...prev, category: value }))
  }

  const quizValidationErrors = validateQuizConfig()
  const totalPoints = quizConfig.questions.reduce((sum, q) => sum + q.points, 0)
  const pointsToPass = Math.ceil((totalPoints * quizConfig.passingPercentage) / 100)
  const hasBasicSetup = Boolean(quizConfig.title.trim())
  const hasQuestions = quizConfig.questions.length > 0
  const canPreviewQuiz = hasBasicSetup && hasQuestions
  const canReviewAnalytics = Boolean(initialQuizId)

  const guidedSteps = [
    {
      label: 'Configura el quiz',
      description: hasBasicSetup
        ? 'El título ya está listo; puedes afinar reglas e instrucciones.'
        : 'Define al menos el título y las reglas básicas.',
      complete: hasBasicSetup,
      tab: 0
    },
    {
      label: 'Agrega preguntas',
      description: hasQuestions
        ? `${quizConfig.questions.length} pregunta(s) agregada(s).`
        : 'Usa el banco de preguntas o crea una nueva.',
      complete: hasQuestions,
      tab: 1
    },
    {
      label: 'Prueba la experiencia',
      description: canPreviewQuiz
        ? 'Ya puedes ejecutar una vista previa del quiz.'
        : 'Necesitas configuración básica y al menos una pregunta.',
      complete: previewMode || false,
      tab: 2
    },
    {
      label: 'Guarda y mide resultados',
      description: canReviewAnalytics
        ? 'El quiz ya existe y puede mostrar métricas reales.'
        : 'Primero guarda el quiz para habilitar analíticas.',
      complete: canReviewAnalytics,
      tab: 3
    }
  ]

  const firstIncompleteStep = guidedSteps.find((step) => !step.complete)
  const activeGuidedStep = firstIncompleteStep ? guidedSteps.indexOf(firstIncompleteStep) : guidedSteps.length - 1

  const handleSaveQuiz = () => {
    if (quizValidationErrors.length > 0) {
      alert('Errores de validación:\n' + quizValidationErrors.join('\n'))
      return
    }

    if (quizConfig.questions.length === 0) {
      alert('Debes agregar al menos una pregunta al quiz antes de guardar')
      return
    }

    // Trigger save mutation
    saveQuizMutation.mutate()
  }

  // ============================================================================
  // Loading States
  // ============================================================================
  if (isLoadingQuiz) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress size={60} />
        <Typography sx={{ ml: 3 }} variant="h6">
          Cargando quiz...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Error Messages */}
      {quizLoadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar el quiz. Por favor, inténtalo de nuevo.
        </Alert>
      )}

      {saveQuizMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al guardar el quiz: {(saveQuizMutation.error as any)?.message || 'Error desconocido'}
        </Alert>
      )}

      {saveQuizMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Quiz guardado exitosamente
        </Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Constructor de Quiz
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sigue este flujo: configura, agrega preguntas, prueba la experiencia y luego guarda para medir resultados.
                </Typography>
              </Box>
              <Chip
                color={quizValidationErrors.length === 0 && hasQuestions ? 'success' : 'warning'}
                icon={quizValidationErrors.length === 0 && hasQuestions ? <CheckCircleIcon /> : <WarningIcon />}
                label={
                  quizValidationErrors.length === 0 && hasQuestions
                    ? 'Listo para guardar'
                    : 'Configuración incompleta'
                }
              />
            </Box>

            <Stepper activeStep={activeGuidedStep} alternativeLabel>
              {guidedSteps.map((step) => (
                <Step key={step.label} completed={step.complete}>
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Grid container spacing={2}>
              {guidedSteps.map((step, index) => (
                <Grid item xs={12} md={6} key={step.label}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      height: '100%',
                      borderColor: index === activeGuidedStep ? 'primary.main' : 'divider',
                      bgcolor: step.complete ? 'success.50' : 'background.paper'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {step.label}
                      </Typography>
                      <Chip
                        size="small"
                        color={step.complete ? 'success' : index === activeGuidedStep ? 'primary' : 'default'}
                        label={step.complete ? 'Hecho' : index === activeGuidedStep ? 'Siguiente' : 'Pendiente'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                    <Button
                      size="small"
                      variant={index === activeGuidedStep ? 'contained' : 'outlined'}
                      onClick={() => setActiveTab(step.tab)}
                    >
                      Ir a este paso
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Alert severity={quizValidationErrors.length === 0 ? 'info' : 'warning'} icon={<AutoAwesomeIcon />}>
              <AlertTitle>Recomendación de flujo</AlertTitle>
              {quizValidationErrors.length === 0
                ? 'La configuración base está consistente. Si ya agregaste preguntas, prueba la vista previa antes de guardar.'
                : 'Empieza por completar el título y agregar al menos una pregunta. El editor técnico sigue disponible abajo.'}
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Configuración" icon={<AssessmentIcon />} />
          <Tab label="Banco de Preguntas" icon={<QuestionIcon />} />
          <Tab label="Vista Previa" icon={<PreviewIcon />} />
          <Tab label="Analíticas" icon={<AnalyticsIcon />} />
        </Tabs>
      </Box>

      {/* Tab 1: Quiz Configuration */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración General del Quiz
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Paso 1 de 4. Define las reglas mínimas para que el quiz quede claro y evaluable.
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título del Quiz"
                      value={quizConfig.title}
                      onChange={(e) => handleQuizConfigChange('title', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Instrucciones"
                      value={quizConfig.instructions}
                      onChange={(e) => handleQuizConfigChange('instructions', e.target.value)}
                      helperText="Instrucciones que verán los estudiantes antes de comenzar"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Porcentaje de Aprobación (%)"
                      value={quizConfig.passingPercentage}
                      onChange={(e) => handleQuizConfigChange('passingPercentage', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 100 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Intentos Máximos"
                      value={quizConfig.maxAttempts}
                      onChange={(e) => handleQuizConfigChange('maxAttempts', parseInt(e.target.value))}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Tiempo de Espera (minutos)"
                      value={quizConfig.cooldownMinutes}
                      onChange={(e) => handleQuizConfigChange('cooldownMinutes', parseInt(e.target.value))}
                      inputProps={{ min: 0 }}
                      helperText="Tiempo de espera entre intentos"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Límite de Tiempo (minutos)"
                      value={quizConfig.timeLimitMinutes || ''}
                      onChange={(e) => handleQuizConfigChange('timeLimitMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                      inputProps={{ min: 1 }}
                      helperText="Opcional - Dejar vacío para sin límite"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Opciones Avanzadas
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizConfig.showCorrectAnswers}
                        onChange={(e) => handleQuizConfigChange('showCorrectAnswers', e.target.checked)}
                      />
                    }
                    label="Mostrar respuestas correctas"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizConfig.randomizeQuestions}
                        onChange={(e) => handleQuizConfigChange('randomizeQuestions', e.target.checked)}
                      />
                    }
                    label="Aleatorizar preguntas"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizConfig.shuffleAnswers}
                        onChange={(e) => handleQuizConfigChange('shuffleAnswers', e.target.checked)}
                      />
                    }
                    label="Mezclar opciones de respuesta"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizConfig.allowReview}
                        onChange={(e) => handleQuizConfigChange('allowReview', e.target.checked)}
                      />
                    }
                    label="Permitir revisar respuestas"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quizConfig.showProgressBar}
                        onChange={(e) => handleQuizConfigChange('showProgressBar', e.target.checked)}
                      />
                    }
                    label="Mostrar barra de progreso"
                  />
                </Box>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen del Quiz
                </Typography>

                <Alert severity={quizValidationErrors.length === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {quizValidationErrors.length === 0
                    ? 'La configuración actual es válida.'
                    : `Faltan ${quizValidationErrors.length} ajuste(s) para poder guardar.`}
                </Alert>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Preguntas:</strong> {quizConfig.questions.length}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Puntos totales:</strong> {totalPoints}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Puntos para aprobar:</strong> {pointsToPass}
                  </Typography>
                </Box>

                {quizValidationErrors.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {quizValidationErrors.map((error) => (
                        <Typography key={error} variant="body2" color="warning.main">
                          • {error}
                        </Typography>
                      ))}
                    </Stack>
                  </>
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={saveQuizMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveQuiz}
                  sx={{ mt: 2 }}
                  disabled={quizValidationErrors.length > 0 || saveQuizMutation.isLoading}
                >
                  {saveQuizMutation.isLoading ? 'Guardando...' : (initialQuizId ? 'Actualizar Quiz' : 'Guardar Quiz')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Current Quiz Questions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Preguntas del Quiz ({quizConfig.questions.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setActiveTab(1)}
                  >
                    Agregar desde Banco
                  </Button>
                </Box>
                
                {quizConfig.questions.length === 0 ? (
                  <Alert severity="info">
                    No hay preguntas en este quiz. Ve al banco de preguntas para agregar algunas.
                  </Alert>
                ) : (
                  <List>
                    {quizConfig.questions.map((question, index) => (
                      <Card key={question.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                              <DragIcon sx={{ color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">
                                Pregunta {index + 1}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getQuestionTypeIcon(question.type)}
                                <Chip label={question.type} size="small" color="primary" />
                                <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                                {question.difficulty && (
                                  <Chip 
                                    label={question.difficulty} 
                                    size="small" 
                                    color={getDifficultyColor(question.difficulty) as any}
                                  />
                                )}
                              </Box>
                              
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {question.question}
                              </Typography>
                              
                              {question.category && (
                                <Chip label={question.category} size="small" variant="outlined" sx={{ mr: 1 }} />
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" onClick={() => handleEditQuestion(question)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleRemoveQuestionFromQuiz(question.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Question Bank */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Banco de Preguntas</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenQuestionDialog(true)}
                  >
                    Nueva Pregunta
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Paso 2 de 4. Selecciona preguntas existentes o crea nuevas y luego agrégalas al quiz.
                </Typography>
                
                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Buscar preguntas"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={filterCategory}
                        label="Categoría"
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="Geografía">Geografía</MenuItem>
                        <MenuItem value="Programación">Programación</MenuItem>
                        <MenuItem value="Historia">Historia</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Dificultad</InputLabel>
                      <Select
                        value={filterDifficulty}
                        label="Dificultad"
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="easy">Fácil</MenuItem>
                        <MenuItem value="medium">Medio</MenuItem>
                        <MenuItem value="hard">Difícil</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                {selectedQuestions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography>
                        {selectedQuestions.length} pregunta(s) seleccionada(s)
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddQuestionsToQuiz}
                      >
                        Agregar al Quiz
                      </Button>
                    </Alert>
                  </Box>
                )}
                
                {/* Question List */}
                <List>
                  {getFilteredQuestions().map((question) => (
                    <Card key={question.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={selectedQuestions.includes(question.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedQuestions(prev => [...prev, question.id])
                                  } else {
                                    setSelectedQuestions(prev => prev.filter(id => id !== question.id))
                                  }
                                }}
                              />
                            }
                            label=""
                          />
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {getQuestionTypeIcon(question.type)}
                              <Chip label={question.type} size="small" color="primary" />
                              <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                              {question.difficulty && (
                                <Chip 
                                  label={question.difficulty} 
                                  size="small" 
                                  color={getDifficultyColor(question.difficulty) as any}
                                />
                              )}
                              {question.usageCount !== undefined && (
                                <Chip label={`Usado ${question.usageCount} veces`} size="small" variant="outlined" />
                              )}
                              {question.successRate !== undefined && (
                                <Chip 
                                  label={`${question.successRate}% éxito`} 
                                  size="small" 
                                  color={question.successRate >= 70 ? 'success' : question.successRate >= 50 ? 'warning' : 'error'}
                                />
                              )}
                            </Box>
                            
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {question.question}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {question.category && (
                                <Chip label={question.category} size="small" variant="outlined" />
                              )}
                              {question.tags?.map((tag, index) => (
                                <Chip key={index} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleEditQuestion(question)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Preview */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Vista Previa del Quiz</Typography>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Salir de Vista Previa' : 'Iniciar Vista Previa'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paso 3 de 4. Usa esta vista para validar el orden, las preguntas y la dificultad antes de guardar.
            </Typography>
            
            {quizConfig.questions.length === 0 ? (
              <Alert severity="warning">
                No hay preguntas en el quiz para mostrar la vista previa.
              </Alert>
            ) : previewMode ? (
              <LmsQuizComponent
                questions={quizConfig.questions.map(q => ({
                  ...q,
                  type: q.type === 'single' ? 'single-choice' : q.type === 'multiple' ? 'multiple-choice' : 'true-false',
                  correctAnswer: q.type === 'single' || q.type === 'boolean' ? q.correct_answers[0] : q.correct_answers
                }))}
                isPreview={true}
                onComplete={(score, totalPoints) => {
                  alert(`Vista previa completada: ${score}/${totalPoints} puntos (${Math.round((score/totalPoints)*100)}%)`)
                  setPreviewMode(false)
                }}
              />
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {quizConfig.title || 'Quiz sin título'}
                </Typography>
                
                {quizConfig.instructions && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {quizConfig.instructions}
                  </Typography>
                )}
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {quizConfig.questions.length}
                      </Typography>
                      <Typography variant="body2">Preguntas</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {quizConfig.questions.reduce((sum, q) => sum + q.points, 0)}
                      </Typography>
                      <Typography variant="body2">Puntos Totales</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {quizConfig.passingPercentage}%
                      </Typography>
                      <Typography variant="body2">Para Aprobar</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {quizConfig.maxAttempts}
                      </Typography>
                      <Typography variant="body2">Intentos Máx.</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Alert severity="info">
                  Haz clic en "Iniciar Vista Previa" para probar el quiz como lo verían los estudiantes.
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Analytics */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Analíticas del Quiz
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Paso 4 de 4. Esta pestaña muestra resultados reales una vez que el quiz ya fue guardado y usado por estudiantes.
            </Typography>
          </Grid>

          {/* No quiz saved yet */}
          {!initialQuizId && (
            <Grid item xs={12}>
              <Alert severity="info">
                Debes guardar el quiz primero para ver las analíticas de intentos
              </Alert>
            </Grid>
          )}

          {/* Loading stats */}
          {isLoadingStats && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando estadísticas...</Typography>
              </Box>
            </Grid>
          )}

          {/* Error loading stats */}
          {statsLoadError && (
            <Grid item xs={12}>
              <Alert severity="warning">
                No se pudieron cargar las estadísticas. Puede que aún no haya intentos registrados.
              </Alert>
            </Grid>
          )}

          {/* Stats loaded and available */}
          {quizStats && !isLoadingStats && (
            <>
              {/* Main Stats Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {quizStats.totalAttempts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Intentos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {quizStats.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Puntuación Promedio
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {quizStats.passRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasa de Aprobación
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {quizStats.averageTimeMinutes.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tiempo Promedio (min)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Additional Stats */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {quizStats.uniqueUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usuarios Únicos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={quizStats.suspiciousAttempts > 0 ? "error" : "success.main"}>
                      {quizStats.suspiciousAttempts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Intentos Sospechosos
                    </Typography>
                    {quizStats.suspiciousAttempts > 0 && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Completados demasiado rápido
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* No attempts yet */}
              {quizStats.totalAttempts === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Aún no hay intentos registrados para este quiz. Las estadísticas aparecerán cuando los usuarios comiencen a tomar el quiz.
                  </Alert>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </TabPanel>

      {/* Question Dialog */}
      <Dialog
        open={openQuestionDialog}
        onClose={() => {
          setOpenQuestionDialog(false)
          setEditingQuestion(null)
          resetQuestionForm()
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Pregunta"
                value={newQuestion.question || ''}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de pregunta</InputLabel>
                <Select
                  value={newQuestion.type || 'single'}
                  label="Tipo de pregunta"
                  onChange={(e) => {
                    const type = e.target.value as 'single' | 'multiple' | 'boolean'
                    setNewQuestion(prev => ({
                      ...prev,
                      type,
                      options: type === 'boolean' ? ['Falso', 'Verdadero'] : ['', '', '', ''],
                      correct_answers: type === 'multiple' ? [] : [0]
                    }))
                  }}
                >
                  <MenuItem value="boolean">Verdadero/Falso</MenuItem>
                  <MenuItem value="single">Selección Única</MenuItem>
                  <MenuItem value="multiple">Selección Múltiple</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Puntos"
                value={newQuestion.points || 1}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={newQuestion.difficulty || 'medium'}
                  label="Dificultad"
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                >
                  <MenuItem value="easy">Fácil</MenuItem>
                  <MenuItem value="medium">Medio</MenuItem>
                  <MenuItem value="hard">Difícil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={newQuestion.category || ''}
                  label="Categoría"
                  onChange={(e) => applyQuestionCategorySuggestion(e.target.value)}
                >
                  <MenuItem value=''>
                    <em>Sin categoría</em>
                  </MenuItem>
                  {questionCategorySuggestions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {newQuestion.type !== 'boolean' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Completa primero las opciones que realmente usarás. Las vacías no se enviarán al backend.
                </Alert>
                <Typography variant="subtitle2" gutterBottom>
                  Opciones:
                </Typography>
                {(newQuestion.options || ['', '', '', '']).map((option, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`Opción ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(newQuestion.options || ['', '', '', ''])]
                      newOptions[index] = e.target.value
                      setNewQuestion(prev => ({ ...prev, options: newOptions }))
                    }}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Grid>
            )}

            {/* Correct Answer Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                Respuesta(s) Correcta(s):
              </Typography>

              {newQuestion.type === 'boolean' && (
                <RadioGroup
                  value={newQuestion.correct_answers?.[0] ?? 0}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, correct_answers: [parseInt(e.target.value)] }))}
                >
                  <FormControlLabel
                    value={0}
                    control={<Radio />}
                    label="Falso"
                  />
                  <FormControlLabel
                    value={1}
                    control={<Radio />}
                    label="Verdadero"
                  />
                </RadioGroup>
              )}

              {newQuestion.type === 'single' && (
                <RadioGroup
                  value={newQuestion.correct_answers?.[0] ?? 0}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, correct_answers: [parseInt(e.target.value)] }))}
                >
                  {(newQuestion.options || ['', '', '', '']).map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={index}
                      control={<Radio />}
                      label={option || `Opción ${index + 1}`}
                      disabled={!option?.trim()}
                    />
                  ))}
                </RadioGroup>
              )}

              {newQuestion.type === 'multiple' && (
                <Box>
                  {(newQuestion.options || ['', '', '', '']).map((option, index) => (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
                          checked={newQuestion.correct_answers?.includes(index) || false}
                          onChange={(e) => {
                            const currentCorrect = newQuestion.correct_answers || []
                            const newCorrect = e.target.checked
                              ? [...currentCorrect, index]
                              : currentCorrect.filter(i => i !== index)
                            setNewQuestion(prev => ({ ...prev, correct_answers: newCorrect }))
                          }}
                          disabled={!option?.trim()}
                        />
                      }
                      label={option || `Opción ${index + 1}`}
                    />
                  ))}
                </Box>
              )}

              {newQuestion.type === 'multiple' && (!newQuestion.correct_answers || newQuestion.correct_answers.length === 0) && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Debe seleccionar al menos una respuesta correcta
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Explicación (opcional)"
                value={newQuestion.explanation || ''}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                helperText="Explicación que se mostrará después de responder"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenQuestionDialog(false)
              setEditingQuestion(null)
              resetQuestionForm()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
            variant="contained"
            disabled={!newQuestion.question?.trim()}
          >
            {editingQuestion ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsQuizManagement
