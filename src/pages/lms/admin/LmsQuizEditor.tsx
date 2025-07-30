import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  Switch,
  FormControlLabel
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
  ToggleOn as ToggleIcon
} from '@mui/icons-material'

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correctAnswer: number | number[] // Para single-choice es un número, para multiple-choice es un array
  explanation?: string
  points: number
}

interface QuizEditorProps {
  questions: QuizQuestion[]
  onQuestionsChange: (questions: QuizQuestion[]) => void
}

const LmsQuizEditor: React.FC<QuizEditorProps> = ({
  questions,
  onQuestionsChange
}) => {
  const [openDialog, setOpenDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null
  )
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'single-choice' as 'true-false' | 'single-choice' | 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 1
  })

  const handleAddQuestion = () => {
    const question: QuizQuestion = {
      id: Date.now(),
      ...newQuestion,
      options: newQuestion.options.filter((opt) => opt.trim() !== ''),
      correctAnswer:
        newQuestion.type === 'multiple-choice'
          ? (newQuestion.correctAnswer as number[]) || []
          : newQuestion.correctAnswer
    }

    onQuestionsChange([...questions, question])
    resetForm()
    setOpenDialog(false)
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setNewQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options, '', '', '', ''].slice(0, 4),
      correctAnswer: Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0] || 0
        : question.correctAnswer,
      explanation: question.explanation || '',
      points: question.points
    })
    setOpenDialog(true)
  }

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return

    const updatedQuestion: QuizQuestion = {
      ...editingQuestion,
      ...newQuestion,
      options: newQuestion.options.filter((opt) => opt.trim() !== ''),
      correctAnswer:
        newQuestion.type === 'multiple-choice'
          ? (newQuestion.correctAnswer as number[]) || []
          : newQuestion.correctAnswer
    }

    onQuestionsChange(
      questions.map((q) => (q.id === editingQuestion.id ? updatedQuestion : q))
    )
    setEditingQuestion(null)
    resetForm()
    setOpenDialog(false)
  }

  const handleDeleteQuestion = (questionId: number) => {
    if (
      window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')
    ) {
      onQuestionsChange(questions.filter((q) => q.id !== questionId))
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options]
    newOptions[index] = value
    setNewQuestion({ ...newQuestion, options: newOptions })
  }

  const handleCorrectAnswerChange = (value: number | number[]) => {
    setNewQuestion({ ...newQuestion, correctAnswer: value })
  }

  const resetForm = () => {
    setNewQuestion({
      question: '',
      type: 'single-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1
    })
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'true-false':
        return <ToggleIcon />
      case 'single-choice':
        return <RadioIcon />
      case 'multiple-choice':
        return <CheckboxIcon />
      default:
        return <HelpIcon />
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'true-false':
        return 'Verdadero/Falso'
      case 'single-choice':
        return 'Selección Única'
      case 'multiple-choice':
        return 'Selección Múltiple'
      default:
        return 'Desconocido'
    }
  }

  const getCorrectAnswerText = (question: QuizQuestion) => {
    if (question.type === 'true-false') {
      return question.correctAnswer === 0 ? 'Falso' : 'Verdadero'
    } else if (question.type === 'single-choice') {
      return question.options[question.correctAnswer as number] || 'No definida'
    } else if (question.type === 'multiple-choice') {
      const correctAnswers = (question.correctAnswer as number[])
        .map((index) => question.options[index])
        .filter(Boolean)
      return correctAnswers.length > 0
        ? correctAnswers.join(', ')
        : 'No definida'
    }
    return 'No definida'
  }

  const validateForm = () => {
    if (!newQuestion.question.trim()) return false
    if (newQuestion.type === 'true-false') return true
    if (newQuestion.options.filter((opt) => opt.trim() !== '').length < 2)
      return false
    if (newQuestion.type === 'single-choice') {
      return (
        newQuestion.correctAnswer >= 0 &&
        newQuestion.correctAnswer < newQuestion.options.length
      )
    }
    if (newQuestion.type === 'multiple-choice') {
      return (
        Array.isArray(newQuestion.correctAnswer) &&
        newQuestion.correctAnswer.length > 0
      )
    }
    return false
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h6'>Preguntas del Quiz</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Agregar Pregunta
        </Button>
      </Box>

      {questions.length === 0 ? (
        <Alert severity='info'>
          No hay preguntas creadas. Agrega tu primera pregunta para comenzar.
        </Alert>
      ) : (
        <List>
          {questions.map((question, index) => (
            <Card key={question.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 120
                    }}
                  >
                    <DragIcon sx={{ color: 'text.disabled' }} />
                    <Typography variant='caption' color='text.secondary'>
                      Pregunta {index + 1}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1
                      }}
                    >
                      {getQuestionTypeIcon(question.type)}
                      <Chip
                        label={getQuestionTypeLabel(question.type)}
                        size='small'
                        color='primary'
                      />
                      <Chip
                        label={`${question.points} punto${question.points !== 1 ? 's' : ''}`}
                        size='small'
                        variant='outlined'
                      />
                    </Box>

                    <Typography variant='body1' sx={{ mb: 1 }}>
                      {question.question}
                    </Typography>

                    {question.type !== 'true-false' && (
                      <Box sx={{ ml: 2 }}>
                        {question.options.map((option, optIndex) => (
                          <Typography
                            key={optIndex}
                            variant='body2'
                            color='text.secondary'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.includes(optIndex)
                                  ? 'success.main'
                                  : 'text.secondary'
                                : question.correctAnswer === optIndex
                                  ? 'success.main'
                                  : 'text.secondary'
                            }}
                          >
                            {question.type === 'multiple-choice' ? (
                              <CheckboxIcon fontSize='small' />
                            ) : (
                              <RadioIcon fontSize='small' />
                            )}
                            {option}
                            {(Array.isArray(question.correctAnswer) &&
                              question.correctAnswer.includes(optIndex)) ||
                            (!Array.isArray(question.correctAnswer) &&
                              question.correctAnswer === optIndex) ? (
                              <CheckIcon fontSize='small' color='success' />
                            ) : null}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {question.type === 'true-false' && (
                      <Box sx={{ ml: 2 }}>
                        <Typography
                          variant='body2'
                          sx={{
                            color:
                              question.correctAnswer === 0
                                ? 'success.main'
                                : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <ToggleIcon fontSize='small' />
                          Falso
                          {question.correctAnswer === 0 && (
                            <CheckIcon fontSize='small' color='success' />
                          )}
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            color:
                              question.correctAnswer === 1
                                ? 'success.main'
                                : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <ToggleIcon fontSize='small' />
                          Verdadero
                          {question.correctAnswer === 1 && (
                            <CheckIcon fontSize='small' color='success' />
                          )}
                        </Typography>
                      </Box>
                    )}

                    {question.explanation && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: 'grey.50',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          <strong>Explicación:</strong> {question.explanation}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => handleEditQuestion(question)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
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
      )}

      {/* Dialog para agregar/editar pregunta */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Pregunta'
                value={newQuestion.question}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, question: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de pregunta</InputLabel>
                <Select
                  value={newQuestion.type}
                  label='Tipo de pregunta'
                  onChange={(e) => {
                    const type = e.target.value as
                      | 'true-false'
                      | 'single-choice'
                      | 'multiple-choice'
                    setNewQuestion({
                      ...newQuestion,
                      type,
                      correctAnswer: type === 'multiple-choice' ? [] : 0,
                      options:
                        type === 'true-false'
                          ? ['Falso', 'Verdadero']
                          : ['', '', '', '']
                    })
                  }}
                >
                  <MenuItem value='true-false'>Verdadero/Falso</MenuItem>
                  <MenuItem value='single-choice'>Selección Única</MenuItem>
                  <MenuItem value='multiple-choice'>
                    Selección Múltiple
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='number'
                label='Puntos'
                value={newQuestion.points}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    points: parseInt(e.target.value) || 1
                  })
                }
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            {newQuestion.type !== 'true-false' && (
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Opciones:
                </Typography>
                {newQuestion.options.map((option, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    label={`Opción ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Grid>
            )}

            {newQuestion.type === 'true-false' && (
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Respuesta correcta:
                </Typography>
                <FormControl component='fieldset'>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newQuestion.correctAnswer === 1}
                        onChange={(e) =>
                          handleCorrectAnswerChange(e.target.checked ? 1 : 0)
                        }
                      />
                    }
                    label={
                      newQuestion.correctAnswer === 1 ? 'Verdadero' : 'Falso'
                    }
                  />
                </FormControl>
              </Grid>
            )}

            {newQuestion.type === 'single-choice' && (
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Respuesta correcta:
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      handleCorrectAnswerChange(e.target.value as number)
                    }
                  >
                    {newQuestion.options.map((option, index) => (
                      <MenuItem
                        key={index}
                        value={index}
                        disabled={!option.trim()}
                      >
                        {option || `Opción ${index + 1}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {newQuestion.type === 'multiple-choice' && (
              <Grid item xs={12}>
                <Typography variant='subtitle2' gutterBottom>
                  Respuestas correctas:
                </Typography>
                {newQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Switch
                        checked={(
                          newQuestion.correctAnswer as number[]
                        ).includes(index)}
                        onChange={(e) => {
                          const currentAnswers =
                            newQuestion.correctAnswer as number[]
                          const newAnswers = e.target.checked
                            ? [...currentAnswers, index]
                            : currentAnswers.filter((i) => i !== index)
                          handleCorrectAnswerChange(newAnswers)
                        }}
                        disabled={!option.trim()}
                      />
                    }
                    label={option || `Opción ${index + 1}`}
                  />
                ))}
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='Explicación (opcional)'
                value={newQuestion.explanation}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    explanation: e.target.value
                  })
                }
                helperText='Explicación que se mostrará después de responder la pregunta'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false)
              setEditingQuestion(null)
              resetForm()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
            variant='contained'
            disabled={!validateForm()}
          >
            {editingQuestion ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsQuizEditor
