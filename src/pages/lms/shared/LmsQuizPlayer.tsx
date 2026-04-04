import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  Button,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepButton
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Flag as FlagIcon,
  Warning as WarningIcon
} from '@mui/icons-material'

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correctAnswer: number | number[]
  explanation?: string
  points: number
  originalOptionIndices?: number[]
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

interface QuizAttempt {
  attemptNumber: number
  startedAt: Date
  answers: (number | number[])[]
  timeSpent: number
  questionIds?: number[]
  score?: number
  totalPoints?: number
  passed?: boolean
}

interface LmsQuizPlayerProps {
  quizConfig: QuizConfiguration
  userAttempts?: QuizAttempt[]
  onComplete?: (attempt: QuizAttempt) => void
  onSaveProgress?: (answers: (number | number[])[]) => void
  isPreview?: boolean
}

const LmsQuizPlayer: React.FC<LmsQuizPlayerProps> = ({
  quizConfig,
  userAttempts = [],
  onComplete,
  onSaveProgress,
  isPreview = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | number[])[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  const [canStartQuiz, setCanStartQuiz] = useState(true)
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([])

  // Initialize quiz
  useEffect(() => {
    setCanStartQuiz(true)
    setCooldownEndTime(null)
    setShowResults(false)
    setShowInstructions(true)
    setCurrentQuestionIndex(0)
    setCurrentAttempt(null)
    setStartTime(null)
    setTimeRemaining(null)
    setFlaggedQuestions(new Set())

    // Check if user can start quiz (cooldown and max attempts)
    if (!isPreview && userAttempts.length > 0) {
      const lastAttempt = userAttempts[userAttempts.length - 1]
      const lastAttemptTime = new Date(lastAttempt.startedAt)
      const cooldownEnd = new Date(lastAttemptTime.getTime() + quizConfig.cooldownMinutes * 60000)
      
      if (userAttempts.length >= quizConfig.maxAttempts) {
        setCanStartQuiz(false)
      } else if (quizConfig.cooldownMinutes > 0 && new Date() < cooldownEnd) {
        setCanStartQuiz(false)
        setCooldownEndTime(cooldownEnd)
      }
    }

    // Prepare questions (shuffle if needed)
    let questions = [...quizConfig.questions]
    if (quizConfig.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }
    
    // Shuffle answers if needed
    if (quizConfig.shuffleAnswers) {
      questions = questions.map(q => {
        if (q.type === 'true-false') return q
        
        const shuffledOptions = [...q.options]
        const originalIndices = shuffledOptions.map((_, index) => index)
        
        // Fisher-Yates shuffle
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
          ;[originalIndices[i], originalIndices[j]] = [originalIndices[j], originalIndices[i]]
        }
        
        // Update correct answers based on new positions
        let newCorrectAnswer: number | number[]
        if (Array.isArray(q.correctAnswer)) {
          newCorrectAnswer = q.correctAnswer.map(oldIndex => 
            originalIndices.findIndex(newIndex => newIndex === oldIndex)
          )
        } else {
          newCorrectAnswer = originalIndices.findIndex(newIndex => newIndex === q.correctAnswer)
        }
        
        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswer,
          originalOptionIndices: originalIndices
        }
      })
    }
    
    setShuffledQuestions(questions)
    setUserAnswers(new Array(questions.length).fill(undefined))
  }, [quizConfig, userAttempts, isPreview])

  // Timer effect
  useEffect(() => {
    if (startTime && quizConfig.timeLimitMinutes && timeRemaining !== null) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [startTime, quizConfig.timeLimitMinutes, timeRemaining])

  // Cooldown timer
  useEffect(() => {
    if (cooldownEndTime) {
      const timer = setInterval(() => {
        if (new Date() >= cooldownEndTime) {
          setCanStartQuiz(true)
          setCooldownEndTime(null)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownEndTime])

  const handleStartQuiz = () => {
    setShowInstructions(false)
    setStartTime(new Date())
    
    if (quizConfig.timeLimitMinutes) {
      setTimeRemaining(quizConfig.timeLimitMinutes * 60)
    }
    
    const attempt: QuizAttempt = {
      attemptNumber: userAttempts.length + 1,
      startedAt: new Date(),
      answers: [],
      timeSpent: 0
    }
    setCurrentAttempt(attempt)
  }

  const handleTimeUp = useCallback(() => {
    if (!showResults) {
      handleSubmitQuiz(true)
    }
  }, [showResults])

  const handleAnswerChange = (value: number | number[]) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = value
    setUserAnswers(newAnswers)
    
    // Auto-save progress
    if (onSaveProgress) {
      onSaveProgress(newAnswers)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleFlagQuestion = () => {
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(currentQuestionIndex)) {
      newFlagged.delete(currentQuestionIndex)
    } else {
      newFlagged.add(currentQuestionIndex)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleSubmitQuiz = (timeUp = false) => {
    if (!timeUp && quizConfig.allowReview) {
      setShowReviewDialog(true)
      return
    }
    
    finishQuiz()
  }

  const finishQuiz = () => {
    const endTime = new Date()
    const timeSpent = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0
    
    // Calculate score
    let totalScore = 0
    let totalPossiblePoints = 0

    shuffledQuestions.forEach((question, index) => {
      totalPossiblePoints += question.points

      const userAnswer = userAnswers[index]
      if (userAnswer !== undefined) {
        if (question.type === 'multiple-choice') {
          const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
          const correctArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]

          if (
            userArray.length === correctArray.length &&
            userArray.every((answer) => correctArray.includes(answer))
          ) {
            totalScore += question.points
          }
        } else {
          if (userAnswer === question.correctAnswer) {
            totalScore += question.points
          }
        }
      }
    })

    const passed = (totalScore / totalPossiblePoints) * 100 >= quizConfig.passingPercentage

    const submissionAnswers = userAnswers.map((answer, index) => {
      const question = shuffledQuestions[index]
      if (answer === undefined || !question?.originalOptionIndices) {
        return answer
      }

      const toOriginalIndex = (selectedIndex: number) =>
        question.originalOptionIndices?.[selectedIndex] ?? selectedIndex

      if (Array.isArray(answer)) {
        return answer.map(toOriginalIndex)
      }

      return toOriginalIndex(answer)
    })
    
    const completedAttempt: QuizAttempt = {
      ...currentAttempt!,
      answers: submissionAnswers,
      questionIds: shuffledQuestions.map((question) => question.id),
      timeSpent,
      score: totalScore,
      totalPoints: totalPossiblePoints,
      passed
    }

    setCurrentAttempt(completedAttempt)
    setShowResults(true)
    setShowReviewDialog(false)

    if (onComplete) {
      onComplete(completedAttempt)
    }
  }

  const isAnswerCorrect = (questionIndex: number) => {
    const question = shuffledQuestions[questionIndex]
    const userAnswer = userAnswers[questionIndex]

    if (userAnswer === undefined) return null

    if (question.type === 'multiple-choice') {
      const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      const correctArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]
      return (
        userArray.length === correctArray.length &&
        userArray.every((answer) => correctArray.includes(answer))
      )
    } else {
      return userAnswer === question.correctAnswer
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'true-false': return 'Verdadero o Falso'
      case 'single-choice': return 'Selección Única'
      case 'multiple-choice': return 'Selección Múltiple'
      default: return 'Pregunta'
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    return userAnswers.filter(answer => answer !== undefined).length
  }

  // Show cooldown message
  if (!canStartQuiz && cooldownEndTime) {
    const remainingTime = Math.max(0, Math.ceil((cooldownEndTime.getTime() - new Date().getTime()) / 1000))
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <TimerIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Tiempo de Espera
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Debes esperar {formatTime(remainingTime)} antes de poder intentar el quiz nuevamente.
          </Typography>
          <Alert severity="info">
            Tiempo de espera configurado: {quizConfig.cooldownMinutes} minutos entre intentos
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Show max attempts reached
  if (!canStartQuiz && userAttempts.length >= quizConfig.maxAttempts) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <WarningIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Intentos Agotados
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Has alcanzado el número máximo de intentos permitidos para este quiz.
          </Typography>
          <Alert severity="error">
            Intentos realizados: {userAttempts.length}/{quizConfig.maxAttempts}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Show instructions
  if (showInstructions) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {quizConfig.title}
          </Typography>
          
          {quizConfig.instructions && (
            <Typography variant="body1" sx={{ mb: 3 }}>
              {quizConfig.instructions}
            </Typography>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del Quiz
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Preguntas</Typography>
                <Typography variant="h6">{shuffledQuestions.length}</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Puntos Totales</Typography>
                <Typography variant="h6">{shuffledQuestions.reduce((sum, q) => sum + q.points, 0)}</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Para Aprobar</Typography>
                <Typography variant="h6">{quizConfig.passingPercentage}%</Typography>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Intentos Restantes</Typography>
                <Typography variant="h6">{quizConfig.maxAttempts - userAttempts.length}</Typography>
              </Paper>
              {quizConfig.timeLimitMinutes && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">Tiempo Límite</Typography>
                  <Typography variant="h6">{quizConfig.timeLimitMinutes} min</Typography>
                </Paper>
              )}
            </Box>
          </Box>
          
          {userAttempts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Intentos Anteriores
              </Typography>

              {/* Best attempt summary */}
              {(() => {
                const bestAttempt = userAttempts.reduce((best, current) =>
                  (current.score! / current.totalPoints!) > (best.score! / best.totalPoints!) ? current : best
                )
                const bestPercentage = Math.round((bestAttempt.score! / bestAttempt.totalPoints!) * 100)

                return (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      mb: 2,
                      backgroundColor: bestAttempt.passed ? '#e8f5e9' : '#fff3e0',
                      border: 2,
                      borderColor: bestAttempt.passed ? 'success.main' : 'warning.main'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {bestAttempt.passed ? (
                        <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      ) : (
                        <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                      )}
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {bestAttempt.passed ? '¡Quiz Aprobado!' : 'Quiz No Aprobado'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Mejor resultado: {bestAttempt.score}/{bestAttempt.totalPoints} puntos ({bestPercentage}%)
                        </Typography>
                      </Box>
                    </Box>

                    {bestAttempt.passed && (
                      <Alert severity="success" sx={{ mb: 1 }}>
                        Has completado este quiz exitosamente. Puedes volver a intentarlo para mejorar tu puntuación.
                      </Alert>
                    )}

                    {!bestAttempt.passed && quizConfig.maxAttempts - userAttempts.length > 0 && (
                      <Alert severity="info">
                        Tienes {quizConfig.maxAttempts - userAttempts.length} intentos restantes. ¡Sigue intentando!
                      </Alert>
                    )}
                  </Paper>
                )
              })()}

              {/* All attempts list */}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Historial de {userAttempts.length} intento{userAttempts.length > 1 ? 's' : ''}:
              </Typography>
              {userAttempts.slice().reverse().map((attempt, index) => (
                <Alert
                  key={index}
                  severity={attempt.passed ? 'success' : 'error'}
                  sx={{ mb: 1 }}
                  icon={attempt.passed ? <CheckIcon /> : <CancelIcon />}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <strong>Intento #{attempt.attemptNumber}</strong>: {attempt.score}/{attempt.totalPoints} puntos
                      ({Math.round((attempt.score! / attempt.totalPoints!) * 100)}%)
                    </Box>
                    <Chip
                      label={attempt.passed ? 'Aprobado' : 'No aprobado'}
                      color={attempt.passed ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Alert>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartQuiz}
              disabled={!canStartQuiz}
              color={userAttempts.length > 0 ? 'primary' : 'primary'}
            >
              {userAttempts.length > 0 ? 'Reintentar Quiz' : 'Comenzar Quiz'}
            </Button>
          </Box>

          {!canStartQuiz && userAttempts.length >= quizConfig.maxAttempts && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Has alcanzado el número máximo de intentos ({quizConfig.maxAttempts}) para este quiz.
            </Alert>
          )}

          {!canStartQuiz && cooldownEndTime && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Debes esperar hasta {cooldownEndTime.toLocaleTimeString()} para poder reintentar este quiz.
            </Alert>
          )}
          
          {isPreview && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Modo Preview:</strong> Este es un modo de prueba. Los resultados no se guardarán.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show results
  if (showResults && currentAttempt) {
    const achievedPercentage = Math.round((currentAttempt.score! / currentAttempt.totalPoints!) * 100)
    const attemptsRemaining = Math.max(0, quizConfig.maxAttempts - userAttempts.length - 1)

    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Resultados del Quiz
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
              <TrophyIcon color={currentAttempt.passed ? 'success' : 'error'} sx={{ fontSize: 40 }} />
              <Typography variant="h4">
                {currentAttempt.score}/{currentAttempt.totalPoints} puntos
              </Typography>
            </Box>
            <Typography variant="h6" color={currentAttempt.passed ? 'success.main' : 'error.main'}>
              {achievedPercentage}% -
              {currentAttempt.passed ? ' ¡Aprobado!' : ' No aprobado'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tiempo empleado: {formatTime(currentAttempt.timeSpent)}
            </Typography>
          </Box>

          <Alert severity={currentAttempt.passed ? 'success' : 'warning'} sx={{ mb: 3 }}>
            <Typography variant="body2">
              {currentAttempt.passed ? (
                <>
                  Superaste el puntaje mínimo de <strong>{quizConfig.passingPercentage}%</strong>.
                  Vuelve a la lección para continuar con el siguiente paso del curso.
                </>
              ) : (
                <>
                  Necesitas <strong>{quizConfig.passingPercentage}%</strong> para aprobar.
                  {attemptsRemaining > 0
                    ? ` Todavía puedes reintentar ${attemptsRemaining} vez${attemptsRemaining === 1 ? '' : 'es'}.`
                    : ' Ya no quedan más intentos disponibles en este quiz.'}
                </>
              )}
            </Typography>
          </Alert>

          {quizConfig.showCorrectAnswers && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Revisión de Respuestas
              </Typography>
              
              {shuffledQuestions.map((question, index) => {
                const isCorrect = isAnswerCorrect(index)
                const userAnswer = userAnswers[index]

                return (
                  <Box key={question.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">Pregunta {index + 1}:</Typography>
                      <Chip label={getQuestionTypeLabel(question.type)} size="small" color="primary" variant="outlined" />
                      {isCorrect !== null && (
                        isCorrect ? <CheckIcon color="success" /> : <CancelIcon color="error" />
                      )}
                      {flaggedQuestions.has(index) && <FlagIcon color="warning" />}
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {question.question}
                    </Typography>

                    <Box sx={{ ml: 2 }}>
                      {question.options.map((option, optionIndex) => {
                        let isSelected = false
                        let isCorrectOption = false

                        if (question.type === 'multiple-choice') {
                          const userArray = Array.isArray(userAnswer) ? userAnswer : []
                          const correctArray = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
                          isSelected = userArray.includes(optionIndex)
                          isCorrectOption = correctArray.includes(optionIndex)
                        } else {
                          isSelected = userAnswer === optionIndex
                          isCorrectOption = question.correctAnswer === optionIndex
                        }

                        return (
                          <Box
                            key={optionIndex}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: isSelected
                                ? isCorrectOption ? 'success.light' : 'error.light'
                                : isCorrectOption ? 'success.light' : 'transparent'
                            }}
                          >
                            {question.type === 'multiple-choice' ? (
                              <Checkbox
                                checked={isSelected}
                                disabled
                                color={isCorrectOption ? 'success' : 'error'}
                              />
                            ) : (
                              <Radio
                                checked={isSelected}
                                disabled
                                color={isCorrectOption ? 'success' : 'error'}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: isSelected
                                  ? isCorrectOption ? 'success.dark' : 'error.dark'
                                  : isCorrectOption ? 'success.dark' : 'text.primary'
                              }}
                            >
                              {option}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>

                    {question.explanation && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Explicación:</strong> {question.explanation}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )
              })}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex]
  if (!currentQuestion) {
    return (
      <Alert severity="error">
        No hay preguntas disponibles para este quiz.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header with timer and progress */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {quizConfig.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {timeRemaining !== null && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerIcon color={timeRemaining < 300 ? 'error' : 'primary'} />
                  <Typography 
                    variant="h6" 
                    color={timeRemaining < 300 ? 'error.main' : 'primary.main'}
                  >
                    {formatTime(timeRemaining)}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary">
                {getAnsweredCount()}/{shuffledQuestions.length} respondidas
              </Typography>
            </Box>
          </Box>
          
          {quizConfig.showProgressBar && (
            <LinearProgress
              variant="determinate"
              value={(getAnsweredCount() / shuffledQuestions.length) * 100}
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Question navigation stepper - responsive design */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          {/* Mobile: Compact navigation */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Pregunta {currentQuestionIndex + 1} de {shuffledQuestions.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowReviewDialog(true)}
                >
                  Ver Todas
                </Button>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Desktop: Full stepper */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Stepper nonLinear activeStep={currentQuestionIndex}>
              {shuffledQuestions.map((_, index) => (
                <Step key={index} completed={userAnswers[index] !== undefined}>
                  <StepButton onClick={() => handleGoToQuestion(index)}>
                    <Box sx={{ position: 'relative' }}>
                      {flaggedQuestions.has(index) && (
                        <FlagIcon 
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8, 
                            fontSize: 16, 
                            color: 'warning.main' 
                          }} 
                        />
                      )}
                    </Box>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Box>
        </CardContent>
      </Card>

      {/* Main question card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Pregunta {currentQuestionIndex + 1} de {shuffledQuestions.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={getQuestionTypeLabel(currentQuestion.type)} color="primary" size="small" />
              <Chip label={`${currentQuestion.points} pts`} variant="outlined" size="small" />
              <Tooltip title={flaggedQuestions.has(currentQuestionIndex) ? "Quitar marca" : "Marcar para revisar"}>
                <IconButton size="small" onClick={handleFlagQuestion}>
                  <FlagIcon color={flaggedQuestions.has(currentQuestionIndex) ? 'warning' : 'disabled'} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mb: 3 }}>
            {currentQuestion.question}
          </Typography>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            {currentQuestion.type === 'multiple-choice' ? (
              <Box>
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={
                          Array.isArray(userAnswers[currentQuestionIndex])
                            ? (userAnswers[currentQuestionIndex] as number[]).includes(index)
                            : false
                        }
                        onChange={(e) => {
                          const currentAnswers = Array.isArray(userAnswers[currentQuestionIndex])
                            ? (userAnswers[currentQuestionIndex] as number[])
                            : []

                          if (e.target.checked) {
                            handleAnswerChange([...currentAnswers, index])
                          } else {
                            handleAnswerChange(currentAnswers.filter((i) => i !== index))
                          }
                        }}
                      />
                    }
                    label={option}
                    sx={{
                      display: 'block',
                      mb: 1,
                      p: { xs: 1.5, sm: 1 },
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' },
                      '& .MuiFormControlLabel-label': {
                        fontSize: { xs: '0.95rem', sm: '0.875rem' },
                        lineHeight: 1.4
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <RadioGroup
                value={userAnswers[currentQuestionIndex] ?? ''}
                onChange={(e) => handleAnswerChange(Number(e.target.value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index}
                    control={<Radio />}
                    label={option}
                    sx={{
                      display: 'block',
                      mb: 1,
                      p: { xs: 1.5, sm: 1 },
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' },
                      '& .MuiFormControlLabel-label': {
                        fontSize: { xs: '0.95rem', sm: '0.875rem' },
                        lineHeight: 1.4
                      }
                    }}
                  />
                ))}
              </RadioGroup>
            )}
          </FormControl>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Button
              variant="outlined"
              startIcon={<PrevIcon />}
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Anterior
            </Button>

            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              {currentQuestionIndex === shuffledQuestions.length - 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleSubmitQuiz()}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Finalizar Quiz
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<NextIcon />}
                  onClick={handleNextQuestion}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>

          {isPreview && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Modo Preview:</strong> Este es un modo de prueba. Los resultados no se guardarán.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onClose={() => setShowReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Revisar Respuestas</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Revisa tus respuestas antes de enviar el quiz. Las preguntas sin responder aparecen marcadas.
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 1 }}>
            {shuffledQuestions.map((_, index) => (
              <Button
                key={index}
                variant={userAnswers[index] !== undefined ? 'contained' : 'outlined'}
                color={flaggedQuestions.has(index) ? 'warning' : 'primary'}
                size="small"
                onClick={() => {
                  setCurrentQuestionIndex(index)
                  setShowReviewDialog(false)
                }}
              >
                {index + 1}
                {flaggedQuestions.has(index) && <FlagIcon sx={{ ml: 0.5, fontSize: 16 }} />}
              </Button>
            ))}
          </Box>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            Preguntas sin responder: {shuffledQuestions.length - getAnsweredCount()}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>
            Continuar Editando
          </Button>
          <Button onClick={finishQuiz} variant="contained" color="success">
            Enviar Quiz Final
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsQuizPlayer
