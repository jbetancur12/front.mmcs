import React, { useState } from 'react'
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
  Divider
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material'

interface QuizQuestion {
  id: number
  question: string
  type: 'true-false' | 'single-choice' | 'multiple-choice'
  options: string[]
  correctAnswer: number | number[]
  explanation?: string
  points: number
}

interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete?: (score: number, totalPoints: number) => void
  isPreview?: boolean
}

const LmsQuizComponent: React.FC<QuizComponentProps> = ({
  questions,
  onComplete,
  isPreview = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | number[])[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerChange = (value: number | number[]) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = value
    setUserAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calcular puntuación
      let totalScore = 0
      let totalPossiblePoints = 0

      questions.forEach((question, index) => {
        totalPossiblePoints += question.points

        const userAnswer = userAnswers[index]
        if (userAnswer !== undefined) {
          if (question.type === 'multiple-choice') {
            const userArray = Array.isArray(userAnswer)
              ? userAnswer
              : [userAnswer]
            const correctArray = Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer]

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

      setScore(totalScore)
      setTotalPoints(totalPossiblePoints)
      setShowResults(true)

      if (onComplete) {
        onComplete(totalScore, totalPossiblePoints)
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const isAnswerCorrect = (questionIndex: number) => {
    const question = questions[questionIndex]
    const userAnswer = userAnswers[questionIndex]

    if (userAnswer === undefined) return null

    if (question.type === 'multiple-choice') {
      const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      const correctArray = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer]
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
      case 'true-false':
        return 'Verdadero o Falso'
      case 'single-choice':
        return 'Selección Única'
      case 'multiple-choice':
        return 'Selección Múltiple'
      default:
        return 'Pregunta'
    }
  }

  if (showResults) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant='h5' gutterBottom>
              Resultados del Quiz
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}
            >
              <TrophyIcon color='primary' sx={{ fontSize: 40 }} />
              <Typography variant='h4'>
                {score}/{totalPoints} puntos
              </Typography>
            </Box>
            <Typography variant='h6' color='text.secondary'>
              {Math.round((score / totalPoints) * 100)}% de aciertos
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {questions.map((question, index) => {
            const isCorrect = isAnswerCorrect(index)
            const userAnswer = userAnswers[index]

            return (
              <Box key={question.id} sx={{ mb: 3 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography variant='h6'>Pregunta {index + 1}:</Typography>
                  <Chip
                    label={getQuestionTypeLabel(question.type)}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                  {isCorrect !== null &&
                    (isCorrect ? (
                      <CheckIcon color='success' />
                    ) : (
                      <CancelIcon color='error' />
                    ))}
                </Box>

                <Typography variant='body1' sx={{ mb: 2 }}>
                  {question.question}
                </Typography>

                <Box sx={{ ml: 2 }}>
                  {question.options.map((option, optionIndex) => {
                    let isSelected = false
                    let isCorrectOption = false

                    if (question.type === 'multiple-choice') {
                      const userArray = Array.isArray(userAnswer)
                        ? userAnswer
                        : []
                      const correctArray = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer
                        : []
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
                            ? isCorrectOption
                              ? 'success.light'
                              : 'error.light'
                            : isCorrectOption
                              ? 'success.light'
                              : 'transparent'
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
                          variant='body2'
                          sx={{
                            color: isSelected
                              ? isCorrectOption
                                ? 'success.dark'
                                : 'error.dark'
                              : isCorrectOption
                                ? 'success.dark'
                                : 'text.primary'
                          }}
                        >
                          {option}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>

                {question.explanation && (
                  <Alert severity='info' sx={{ mt: 1 }}>
                    <Typography variant='body2'>
                      <strong>Explicación:</strong> {question.explanation}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <Alert severity='error'>
        No hay preguntas disponibles para este quiz.
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography variant='h6'>
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </Typography>
          <Chip
            label={getQuestionTypeLabel(currentQuestion.type)}
            color='primary'
            size='small'
          />
        </Box>

        <Typography variant='h6' sx={{ mb: 3 }}>
          {currentQuestion.question}
        </Typography>

        <FormControl component='fieldset' sx={{ width: '100%' }}>
          {currentQuestion.type === 'multiple-choice' ? (
            <Box>
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={
                        Array.isArray(userAnswers[currentQuestionIndex])
                          ? (
                              userAnswers[currentQuestionIndex] as number[]
                            ).includes(index)
                          : false
                      }
                      onChange={(e) => {
                        const currentAnswers = Array.isArray(
                          userAnswers[currentQuestionIndex]
                        )
                          ? (userAnswers[currentQuestionIndex] as number[])
                          : []

                        if (e.target.checked) {
                          handleAnswerChange([...currentAnswers, index])
                        } else {
                          handleAnswerChange(
                            currentAnswers.filter((i) => i !== index)
                          )
                        }
                      }}
                    />
                  }
                  label={option}
                  sx={{
                    display: 'block',
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              ))}
            </Box>
          ) : (
            <RadioGroup
              value={userAnswers[currentQuestionIndex] || ''}
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
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              ))}
            </RadioGroup>
          )}
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant='outlined'
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </Button>

          <Button
            variant='contained'
            onClick={handleNextQuestion}
            disabled={userAnswers[currentQuestionIndex] === undefined}
          >
            {currentQuestionIndex === questions.length - 1
              ? 'Finalizar Quiz'
              : 'Siguiente'}
          </Button>
        </Box>

        {isPreview && (
          <Alert severity='info' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              <strong>Modo Preview:</strong> Este es un modo de prueba. Los
              resultados no se guardarán.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default LmsQuizComponent
