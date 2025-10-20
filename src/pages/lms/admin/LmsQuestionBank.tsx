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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Autocomplete,
  LinearProgress
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ImportExport as ImportIcon,
  GetApp as ExportIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  ToggleOn as ToggleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material'

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correct_answer: number | number[]
  explanation?: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  usageCount: number
  successRate: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isFavorite?: boolean
}

interface QuestionFilters {
  search: string
  category: string
  difficulty: string
  type: string
  tags: string[]
  minSuccessRate: number
  maxUsageCount: number
  createdBy: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

const LmsQuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy] = useState<keyof QuizQuestion>('updatedAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [filters, setFilters] = useState<QuestionFilters>({
    search: '',
    category: '',
    difficulty: '',
    type: '',
    tags: [],
    minSuccessRate: 0,
    maxUsageCount: 1000,
    createdBy: '',
    dateRange: { start: null, end: null }
  })

  const [newQuestion, setNewQuestion] = useState<Partial<QuizQuestion>>({
    question: '',
    type: 'single-choice',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    points: 1,
    difficulty: 'medium',
    category: '',
    tags: []
  })

  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')

  // Mock data for demonstration


  // Apply filters
  useEffect(() => {
    let filtered = [...questions]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.category.toLowerCase().includes(searchLower) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        q.createdBy.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(q => q.category === filters.category)
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty)
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(q => q.type === filters.type)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(q => 
        filters.tags.some(tag => q.tags.includes(tag))
      )
    }

    // Success rate filter
    filtered = filtered.filter(q => q.successRate >= filters.minSuccessRate)

    // Usage count filter
    filtered = filtered.filter(q => q.usageCount <= filters.maxUsageCount)

    // Created by filter
    if (filters.createdBy) {
      filtered = filtered.filter(q => q.createdBy.includes(filters.createdBy))
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(q => q.createdAt >= filters.dateRange.start!)
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(q => q.createdAt <= filters.dateRange.end!)
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (aValue === undefined || bValue === undefined) return 0
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredQuestions(filtered)
    setPage(0) // Reset to first page when filters change
  }, [questions, filters, sortBy, sortOrder])

  const handleAddQuestion = () => {
    if (!newQuestion.question?.trim()) return

    const question: QuizQuestion = {
      id: Date.now(),
      question: newQuestion.question,
      type: newQuestion.type || 'single-choice',
      options: newQuestion.options?.filter(opt => opt.trim() !== '') || [],
      correct_answer: newQuestion.correct_answer || 0,
      explanation: newQuestion.explanation,
      points: newQuestion.points || 1,
      difficulty: newQuestion.difficulty || 'medium',
      category: newQuestion.category || '',
      tags: newQuestion.tags || [],
      usageCount: 0,
      successRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user@example.com', // This would come from auth context
      isFavorite: false
    }

    setQuestions(prev => [...prev, question])
    
    // Update categories and tags
    if (question.category && !availableCategories.includes(question.category)) {
      setAvailableCategories(prev => [...prev, question.category])
    }
    question.tags.forEach(tag => {
      if (!availableTags.includes(tag)) {
        setAvailableTags(prev => [...prev, tag])
      }
    })
    
    resetQuestionForm()
    setOpenQuestionDialog(false)
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setNewQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options],
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      points: question.points,
      difficulty: question.difficulty,
      category: question.category,
      tags: [...question.tags]
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
      correct_answer: newQuestion.correct_answer || editingQuestion.correct_answer,
      explanation: newQuestion.explanation,
      points: newQuestion.points || editingQuestion.points,
      difficulty: newQuestion.difficulty || editingQuestion.difficulty,
      category: newQuestion.category || editingQuestion.category,
      tags: newQuestion.tags || editingQuestion.tags,
      updatedAt: new Date()
    }

    setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQuestion : q))
    
    setEditingQuestion(null)
    resetQuestionForm()
    setOpenQuestionDialog(false)
  }

  const handleDeleteQuestion = (questionId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      setSelectedQuestions(prev => prev.filter(id => id !== questionId))
    }
  }

  const handleDuplicateQuestion = (question: QuizQuestion) => {
    const duplicated: QuizQuestion = {
      ...question,
      id: Date.now(),
      question: `${question.question} (Copia)`,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setQuestions(prev => [...prev, duplicated])
  }

  const handleToggleFavorite = (questionId: number) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isFavorite: !q.isFavorite } : q
    ))
  }

  const handleBulkAction = () => {
    if (!bulkAction || selectedQuestions.length === 0) return

    switch (bulkAction) {
      case 'delete':
        if (window.confirm(`¿Eliminar ${selectedQuestions.length} pregunta(s)?`)) {
          setQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)))
          setSelectedQuestions([])
        }
        break
      case 'favorite':
        setQuestions(prev => prev.map(q => 
          selectedQuestions.includes(q.id) ? { ...q, isFavorite: true } : q
        ))
        break
      case 'unfavorite':
        setQuestions(prev => prev.map(q => 
          selectedQuestions.includes(q.id) ? { ...q, isFavorite: false } : q
        ))
        break
      case 'export':
        handleExportQuestions(selectedQuestions)
        break
    }
    
    setBulkAction('')
  }

  const handleExportQuestions = (questionIds: number[]) => {
    const questionsToExport = questions.filter(q => questionIds.includes(q.id))
    const dataStr = JSON.stringify(questionsToExport, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `questions_export_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const resetQuestionForm = () => {
    setNewQuestion({
      question: '',
      type: 'single-choice',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 1,
      difficulty: 'medium',
      category: '',
      tags: []
    })
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'true-false': return <ToggleIcon />
      case 'single-choice': return <RadioIcon />
      case 'multiple-choice': return <CheckboxIcon />
      default: return null
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success'
      case 'medium': return 'warning'
      case 'hard': return 'error'
      default: return 'default'
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'success'
    if (rate >= 60) return 'warning'
    return 'error'
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Banco de Preguntas</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ImportIcon />}
                onClick={() => {/* Handle import */}}
              >
                Importar
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleExportQuestions(questions.map(q => q.id))}
              >
                Exportar Todo
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenQuestionDialog(true)}
              >
                Nueva Pregunta
              </Button>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar preguntas..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtros
                </Button>
                {selectedQuestions.length > 0 && (
                  <>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Acción</InputLabel>
                      <Select
                        value={bulkAction}
                        label="Acción"
                        onChange={(e) => setBulkAction(e.target.value)}
                      >
                        <MenuItem value="favorite">Marcar favoritas</MenuItem>
                        <MenuItem value="unfavorite">Quitar favoritas</MenuItem>
                        <MenuItem value="export">Exportar</MenuItem>
                        <MenuItem value="delete">Eliminar</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                    >
                      Aplicar ({selectedQuestions.length})
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          {showFilters && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>Filtros Avanzados</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={filters.category}
                      label="Categoría"
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {availableCategories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dificultad</InputLabel>
                    <Select
                      value={filters.difficulty}
                      label="Dificultad"
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="easy">Fácil</MenuItem>
                      <MenuItem value="medium">Medio</MenuItem>
                      <MenuItem value="hard">Difícil</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={filters.type}
                      label="Tipo"
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="true-false">Verdadero/Falso</MenuItem>
                      <MenuItem value="single-choice">Selección Única</MenuItem>
                      <MenuItem value="multiple-choice">Selección Múltiple</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={availableTags}
                    value={filters.tags}
                    onChange={(_, newValue) => setFilters(prev => ({ ...prev, tags: newValue }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Etiquetas" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Tasa de éxito mínima (%)"
                    value={filters.minSuccessRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSuccessRate: Number(e.target.value) }))}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Creado por"
                    value={filters.createdBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{questions.length}</Typography>
                <Typography variant="body2">Total</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{filteredQuestions.length}</Typography>
                <Typography variant="body2">Filtradas</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {questions.filter(q => q.isFavorite).length}
                </Typography>
                <Typography variant="body2">Favoritas</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {Math.round(questions.reduce((sum, q) => sum + q.successRate, 0) / questions.length) || 0}%
                </Typography>
                <Typography variant="body2">Éxito Promedio</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Switch
                      checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(filteredQuestions.map(q => q.id))
                        } else {
                          setSelectedQuestions([])
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Pregunta</TableCell>
                  <TableCell align="center">Tipo</TableCell>
                  <TableCell align="center">Dificultad</TableCell>
                  <TableCell align="center">Categoría</TableCell>
                  <TableCell align="center">Uso</TableCell>
                  <TableCell align="center">Éxito</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((question) => (
                    <TableRow key={question.id} hover>
                      <TableCell padding="checkbox">
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
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              {question.question.length > 100 
                                ? `${question.question.substring(0, 100)}...` 
                                : question.question
                              }
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {question.tags.map((tag, index) => (
                                <Chip key={index} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                          {question.isFavorite && (
                            <StarIcon color="warning" fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getQuestionTypeIcon(question.type)}
                          <Typography variant="caption">
                            {question.type === 'true-false' ? 'V/F' : 
                             question.type === 'single-choice' ? 'Única' : 'Múltiple'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={question.difficulty} 
                          size="small" 
                          color={getDifficultyColor(question.difficulty) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={question.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2">{question.usageCount}</Typography>
                          {question.usageCount > 20 && <TrendingUpIcon fontSize="small" color="success" />}
                          {question.usageCount === 0 && <WarningIcon fontSize="small" color="warning" />}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={question.successRate}
                            sx={{ width: 40, height: 6, borderRadius: 3 }}
                            color={getSuccessRateColor(question.successRate) as any}
                          />
                          <Typography variant="body2" color={`${getSuccessRateColor(question.successRate)}.main`}>
                            {question.successRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={question.isFavorite ? "Quitar de favoritas" : "Agregar a favoritas"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleFavorite(question.id)}
                            >
                              {question.isFavorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicar">
                            <IconButton size="small" onClick={() => handleDuplicateQuestion(question)}>
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditQuestion(question)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredQuestions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

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
                      correct_answer: type === 'multiple-choice' ? [] : 0
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
              <Autocomplete
                freeSolo
                options={availableCategories}
                value={newQuestion.category || ''}
                onChange={(_, newValue) => setNewQuestion(prev => ({ ...prev, category: newValue || '' }))}
                renderInput={(params) => <TextField {...params} label="Categoría" />}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={availableTags}
                value={newQuestion.tags || []}
                onChange={(_, newValue) => setNewQuestion(prev => ({ ...prev, tags: newValue }))}
                renderInput={(params) => <TextField {...params} label="Etiquetas" />}
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

export default LmsQuestionBank