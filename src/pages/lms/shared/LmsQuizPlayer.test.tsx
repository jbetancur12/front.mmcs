import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LmsQuizPlayer from './LmsQuizPlayer'

const quizConfig = {
  id: 1,
  title: 'Quiz con tiempo',
  instructions: 'Responde',
  passingPercentage: 50,
  maxAttempts: 3,
  cooldownMinutes: 0,
  showCorrectAnswers: false,
  randomizeQuestions: false,
  shuffleAnswers: false,
  timeLimitMinutes: 1,
  allowReview: true,
  showProgressBar: false,
  questions: [
    {
      id: 10,
      question: 'Pregunta uno',
      type: 'single-choice' as const,
      options: ['Incorrecta', 'Correcta'],
      correctAnswer: 1,
      points: 1
    }
  ]
}

// El componente reinicia su estado si 'userAttempts' cambia de referencia
const noAttempts: never[] = []

describe('LmsQuizPlayer: se agota el tiempo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('califica las respuestas actuales, no las del render viejo', () => {
    const onComplete = vi.fn()
    render(
      <LmsQuizPlayer
        quizConfig={quizConfig}
        userAttempts={noAttempts}
        onComplete={onComplete}
      />
    )

    fireEvent.click(screen.getByText('Comenzar Quiz'))
    // Responde después de arrancar el temporizador
    fireEvent.click(screen.getByLabelText('Correcta'))

    // Un segundo por vez, como en el navegador (React renderiza entre ticks)
    for (let second = 0; second < 62; second++) {
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    const attempt = onComplete.mock.calls[0][0]
    expect(attempt.answers[0]).toBe(1)
    expect(attempt.score).toBe(1)
  })
})
