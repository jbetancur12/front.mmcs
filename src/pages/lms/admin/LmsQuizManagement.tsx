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
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Badge
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Help as HelpIcon,
  CheckCircle as CheckIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  ToggleOn as ToggleIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  Shuffle as ShuffleIcon,
  Visibility as VisibilityIcon,
  QuestionAnswer as QuestionIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import LmsQuizComponent from '../components/LmsQuizComponent'

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
  timeLimitMinutes?: number
  allowReview: boolean
  showProgressBar: boolean
  questions: QuizQuestion[]
}

interface QuizAttemptStats {
  totalAttempts: number
  averageScore: number
  passRate: number
  averageTimeSpent: number
  questionStats: {
    questionId: number
    correctAnswers: number
    totalAnswers: number
    averageTime: number
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
      id={`quiz-tabpanel-${index}`}
      aria-labelledby={`quiz-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const LmsQuizManagement: React.FC = () => {
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
    timeLimitMinutes: undefined,
    allowReview: true,
    showProgressBar: true,
    questions: []
  })
  
  const [questionBank, setQuestionBank] = useState<QuizQuestion[]>([])
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [quizStats, setQuizStats] = useState<QuizAttemptStats | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')

  const [newQuestion, setNewQuestion] = useState<Partial<QuizQuestion>>({
    question: '',
    type: 'single-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 1,
    difficulty: 'medium',
    category: '',
    tags: []
  })

  // Mock data for demonstration
  useEffect(() => {
    // Load existing question bank
    const mockQuestionBank: QuizQuestion[] = [
      {
        id: 1,
        question: '¿Cuál es la capital de Francia?',
        type: 'single-choice',
        options: ['Londres', 'París', 'Madrid', 'Roma'],
        correctAnswer: 1,
        explanation: 'París es la capital y ciudad más poblada de Francia.',
        points: 1,
        difficulty: 'easy',
        category: 'Geografía',
        tags: ['europa', 'capitales'],
        usageCount: 15,
        successRate: 85
      },
      {
        id: 2,
        question: '¿Cuáles de los siguientes son lenguajes de programación?',
        type: 'multiple-choice',
        options: ['JavaScript', 'HTML', 'Python', 'CSS'],
        correctAnswer: [0, 2],
        explanation: 'JavaScript y Python son lenguajes de programación, mientras que HTML y CSS son lenguajes de marcado y estilo.',
        points: 2,
        difficulty: 'medium',
        category: 'Programación',
        tags: ['tecnología', 'desarrollo'],
        usageCount: 8,
        successRate: 65
      }
    ]
    setQuestionBank(mockQuestionBank)

    // Mock quiz stats
    setQuizStats({
      totalAttempts: 45,
      averageScore: 78.5,
      passRate: 82.2,
      averageTimeSpent: 12.5,
      questionStats: [
        { questionId: 1, correctAnswers: 38, totalAnswers: 45, averageTime: 2.3 },
        { questionId: 2, correctAnswers: 29, totalAnswers: 45, averageTime: 4.7 }
      ]
    })
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleQuizConfigChange = (field: keyof QuizConfiguration, value: any) => {
    setQuizConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleAddQuestion = () => {
    if (!newQuestion.question?.trim()) return

    const question: QuizQuestion = {
      id: Date.now(),
      question: newQuestion.question,
      type: newQuestion.type || 'single-choice',
      options: newQuestion.options?.filter(opt => opt.trim() !== '') || [],
      correctAnswer: newQuestion.correctAnswer || 0,
      explanation: newQuestion.explanation,
      points: newQuestion.points || 1,
      difficulty: newQuestion.difficulty || 'medium',
      category: newQuestion.category || '',
      tags: newQuestion.tags || [],
      usageCount: 0,
      successRate: 0
    }

    setQuestionBank(prev => [...prev, question])
    resetQuestionForm()
    setOpenQuestionDialog(false)
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setNewQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
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

    const updatedQuestion: QuizQuestion = {
      ...editingQuestion,
      question: newQuestion.question,
      type: newQuestion.type || editingQuestion.type,
      options: newQuestion.options?.filter(opt => opt.trim() !== '') || editingQuestion.options,
      correctAnswer: newQuestion.correctAnswer || editingQuestion.correctAnswer,
      explanation: newQuestion.explanation,
      points: newQuestion.points || editingQuestion.points,
      difficulty: newQuestion.difficulty || editingQuestion.difficulty,
      category: newQuestion.category || editingQuestion.category,
      tags: newQuestion.tags || editingQuestion.tags
    }

    setQuestionBank(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion : q))
    setQuizConfig(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q)
    }))
    
    setEditingQuestion(null)
    resetQuestionForm()
    setOpenQuestionDialog(false)
  }

  const handleDeleteQuestion = (questionId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      setQuestionBank(prev => prev.filter(q => q.id !== questionId))
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
      type: 'single-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
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

  const handleSaveQuiz = () => {
    const errors = validateQuizConfig()
    if (errors.length > 0) {
      alert('Errores de validación:\n' + errors.join('\n'))
      return
    }
    
    // Here you would save the quiz configuration to the backend
    console.log('Saving quiz configuration:', quizConfig)
    alert('Quiz guardado exitosamente')
  }

  return (
    <Box sx={{ width: '100%' }}>
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Preguntas:</strong> {quizConfig.questions.length}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Puntos totales:</strong> {quizConfig.questions.reduce((sum, q) => sum + q.points, 0)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Puntos para aprobar:</strong> {Math.ceil((quizConfig.questions.reduce((sum, q) => sum + q.points, 0) * quizConfig.passingPercentage) / 100)}
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveQuiz}
                  sx={{ mt: 2 }}
                  disabled={validateQuizConfig().length > 0}
                >
                  Guardar Quiz
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
            
            {quizConfig.questions.length === 0 ? (
              <Alert severity="warning">
                No hay preguntas en el quiz para mostrar la vista previa.
              </Alert>
            ) : previewMode ? (
              <LmsQuizComponent
                questions={quizConfig.questions}
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
          </Grid>
          
          {quizStats && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {quizStats.totalAttempts}
                    </Typography>
                    <Typography variant="body2">Total de Intentos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {quizStats.averageScore.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">Puntuación Promedio</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {quizStats.passRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Tasa de Aprobación</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {quizStats.averageTimeSpent.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">Tiempo Promedio (min)</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Análisis por Pregunta
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Pregunta</TableCell>
                            <TableCell align="center">Respuestas Correctas</TableCell>
                            <TableCell align="center">Total Respuestas</TableCell>
                            <TableCell align="center">Tasa de Éxito</TableCell>
                            <TableCell align="center">Tiempo Promedio</TableCell>
                            <TableCell align="center">Dificultad</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {quizStats.questionStats.map((stat) => {
                            const question = quizConfig.questions.find(q => q.id === stat.questionId)
                            const successRate = (stat.correctAnswers / stat.totalAnswers) * 100
                            
                            return (
                              <TableRow key={stat.questionId}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                    {question?.question || `Pregunta ${stat.questionId}`}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">{stat.correctAnswers}</TableCell>
                                <TableCell align="center">{stat.totalAnswers}</TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={successRate}
                                      sx={{ width: 60, height: 8, borderRadius: 4 }}
                                      color={successRate >= 70 ? 'success' : successRate >= 50 ? 'warning' : 'error'}
                                    />
                                    <Typography variant="body2">
                                      {successRate.toFixed(1)}%
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {stat.averageTime.toFixed(1)}s
                                </TableCell>
                                <TableCell align="center">
                                  {successRate < 50 && (
                                    <Tooltip title="Pregunta difícil - considera revisar">
                                      <WarningIcon color="warning" />
                                    </Tooltip>
                                  )}
                                  {successRate >= 90 && (
                                    <Tooltip title="Pregunta muy fácil - considera aumentar dificultad">
                                      <TrendingUpIcon color="info" />
                                    </Tooltip>
                                  )}
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
                  value={newQuestion.type || 'single-choice'}
                  label="Tipo de pregunta"
                  onChange={(e) => {
                    const type = e.target.value as 'true-false' | 'single-choice' | 'multiple-choice'
                    setNewQuestion(prev => ({
                      ...prev,
                      type,
                      options: type === 'true-false' ? ['Falso', 'Verdadero'] : ['', '', '', ''],
                      correctAnswer: type === 'multiple-choice' ? [] : 0
                    }))
                  }}
                >
                  <MenuItem value="true-false">Verdadero/Falso</MenuItem>
                  <MenuItem value="single-choice">Selección Única</MenuItem>
                  <MenuItem value="multiple-choice">Selección Múltiple</MenuItem>
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
              <TextField
                fullWidth
                label="Categoría"
                value={newQuestion.category || ''}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
              />
            </Grid>
            
            {newQuestion.type !== 'true-false' && (
              <Grid item xs={12}>
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