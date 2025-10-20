# Quiz Phase 2: Backend Analysis & Integration Plan

**Fecha:** 2025-10-18
**Objetivo:** Mapear backend existente vs frontend y definir plan de integración para Phase 2

---

## 📊 RESUMEN EJECUTIVO

### ✅ Lo que YA EXISTE en el Backend (100% COMPLETO)

El backend tiene un sistema de quizzes **completamente funcional y robusto**, con:
- **3 Modelos** de base de datos (Quiz, Question, Attempt)
- **12+ Endpoints** REST para CRUD, taking, analytics
- **1 Service** completo con validaciones, anti-fraud, scoring
- **1 Controller** con todas las operaciones
- **Seguridad** integrada (rate limiting, auth, sanitization)

### 🎯 Lo que NECESITA el Frontend (LmsQuizManagement.tsx)

El frontend tiene un sistema completo con:
- **Mock data** simulando quizzes reales
- **4 tabs**: Configuración, Banco de Preguntas, Vista Previa, Analíticas
- **Componente embebible** ya integrado en content editor (Phase 1 ✅)
- **Interfaces TypeScript** que necesitan conectarse a API real

### 🔧 FASE 2: Trabajo a Realizar

**NO necesitamos crear backend** - solo **CONECTAR** frontend a backend existente:
1. Crear `quizService.ts` en frontend para consumir API
2. Reemplazar mock data con React Query hooks
3. Mapear interfaces TypeScript ↔ Modelos backend
4. Ajustar componentes para usar datos reales
5. Implementar manejo de errores y loading states

---

## 🗄️ BACKEND: Arquitectura Existente

### 1. Database Models

#### `lmsQuiz.cjs` (Tabla: `lms_quizzes`)
```javascript
{
  id: INTEGER (PK, auto-increment),
  lesson_id: INTEGER (FK → lms_course_lessons.id),
  title: STRING (1-255 chars, required),
  instructions: TEXT (optional),
  passing_percentage: INTEGER (0-100, default: 70),
  max_attempts: INTEGER (1-50, default: 10),
  cooldown_minutes: INTEGER (≥0, default: 0),
  show_correct_answers: BOOLEAN (default: true),
  randomize_questions: BOOLEAN (default: false),
  shuffle_answers: BOOLEAN (default: false),
  time_limit_minutes: INTEGER (≥1, optional, null allowed),
  created_at: DATE,
  updated_at: DATE
}

// Associations:
- belongsTo: lmsCourseLesson (lesson_id)
- hasMany: lmsQuizQuestion (CASCADE DELETE)
- hasMany: lmsQuizAttempt (CASCADE DELETE)
```

#### `lmsQuizQuestion.cjs` (Tabla: `lms_quiz_questions`)
```javascript
{
  id: INTEGER (PK, auto-increment),
  quiz_id: INTEGER (FK → lms_quizzes.id),
  type: ENUM('single', 'multiple', 'boolean'),
  question: TEXT (required, not empty),
  options: JSON (array, min 2 items, required),
  correct_answers: JSON (array of indices, min 1, required),
  points: INTEGER (≥1, default: 1),
  order_index: INTEGER (≥0, default: 0),
  explanation: TEXT (optional),
  created_at: DATE,
  updated_at: DATE
}

// Associations:
- belongsTo: lmsQuiz (quiz_id)
```

#### `lmsQuizAttempt.cjs` (Tabla: `lms_quiz_attempts`)
```javascript
{
  id: INTEGER (PK, auto-increment),
  user_id: INTEGER (FK → users.id),
  quiz_id: INTEGER (FK → lms_quizzes.id),
  answers: JSON (object: {questionId: [indices]}),
  score: INTEGER (≥0, calculated),
  total_points: INTEGER (≥0, calculated),
  passed: BOOLEAN (score/total >= passing_percentage),
  attempt_number: INTEGER (≥1, sequential),
  started_at: DATE (required),
  completed_at: DATE (optional initially, required on submit),
  created_at: DATE
}

// Associations:
- belongsTo: user (user_id)
- belongsTo: lmsQuiz (quiz_id)
```

---

### 2. API Routes (`quizzes.routes.js`)

**Base:** `/api/lms/quizzes`

| Method | Endpoint | Descripción | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| **Quiz Management (Admin/Training Manager)** |
| POST | `/lessons/:lessonId/quiz` | Create quiz for lesson | ✅ authorizeCourseManagement | courseManagementLimiter |
| GET | `/:quizId/manage` | Get quiz with questions (editing) | ✅ authorizeCourseManagement | - |
| PUT | `/:quizId` | Update quiz + questions | ✅ authorizeCourseManagement | courseManagementLimiter |
| DELETE | `/:quizId` | Delete quiz (CASCADE) | ✅ authorizeCourseManagement | - |
| GET | `/:quizId/preview` | Preview quiz (with answers) | ✅ authorizeCourseManagement | - |
| **Quiz Taking (All authenticated users)** |
| GET | `/:quizId` | Get quiz for taking (NO answers) | ✅ authorizeCourseAccess | - |
| POST | `/:quizId/start` | Start quiz session (timing) | ✅ authorizeCourseAccess | - |
| POST | `/:quizId/attempt` | Submit quiz attempt | ✅ authorizeCourseAccess | - |
| GET | `/:quizId/attempts` | Get user's attempts | ✅ authorizeCourseAccess | - |
| GET | `/:quizId/attempts/:attemptId` | Get attempt details | ✅ authorizeCourseAccess | - |
| **Analytics (Admin/Training Manager)** |
| GET | `/:quizId/statistics` | Get quiz stats (attempts, pass rate, avg score) | ✅ authorizeCourseManagement | - |
| GET | `/:quizId/analytics` | Get detailed analytics (question-level) | ✅ authorizeCourseManagement | - |
| **Utilities** |
| POST | `/validate-config` | Validate quiz config without saving | ✅ authorizeCourseManagement | - |

**Security Middlewares Applied:**
- `authenticateLMS`: All routes require JWT auth
- `sanitizeUserInput`: Sanitizes title, instructions, question text
- `sanitizeHtmlContent`: Sanitizes HTML in explanations
- Rate limiting per endpoint category

---

### 3. Service Layer (`QuizService.js`)

#### Core Methods

**Quiz CRUD:**
- `createQuiz(lessonId, quizData, userId)`: Transaction-safe, validates lesson, creates quiz + questions
- `getQuizById(quizId)`: Returns quiz with questions ordered by `order_index`
- `updateQuiz(quizId, updateData, userId)`: Updates quiz info + replaces questions
- `deleteQuiz(quizId, userId)`: Soft delete with CASCADE

**Question Management:**
- `createQuestions(quizId, questions, transaction)`: Bulk create with validation
- `updateQuestions(quizId, questions, transaction)`: Delete old + create new (replace pattern)

**Quiz Taking:**
- `submitQuizAttempt(quizId, userId, answers, startedAt)`:
  - Validates attempt eligibility (max attempts, cooldown)
  - Validates timing (time limit check with 1 min grace period)
  - **Anti-fraud detection** (too fast, identical answers, sequential patterns)
  - Calculates score with type-specific logic (single, multiple, boolean)
  - Records attempt with timing metadata
  - Returns results + correct answers (if enabled)

**Analytics:**
- `getUserQuizAttempts(quizId, userId)`: User's attempt history
- `getQuizStatistics(quizId)`:
  - Total attempts, unique users
  - Average score, pass rate
  - Average time, suspicious attempts count

**Validation:**
- `validateQuizData(quizData)`: Validates config (percentages, limits, times)
- `validateQuestionData(questionData)`: Validates question structure, options, answers
- `validateQuizAttempt(quizId, userId, transaction)`: Checks attempts left, cooldown
- `validateAnswerPatterns(quiz, answers, startedAt, completedAt)`: Anti-fraud

**Scoring:**
- `calculateScore(quiz, answers)`: Type-specific answer checking
  - `single`: Exactly 1 correct, 1 selected, must match
  - `multiple`: All correct selected, no extras
  - `boolean`: Same as single (2 options only)
- `getCorrectAnswers(quiz)`: Returns map of {questionId: {correct_answers, explanation}}

#### Anti-Fraud Features
- **Timing validation**: Min 30 seconds per question
- **Pattern detection**: All same answers, sequential patterns (0,1,2,3...)
- **Logging**: Suspicious attempts logged for review (not blocked)

---

### 4. Controller Layer (`QuizController.js`)

**Highlights:**

**`getQuizForTaking`** (líneas 62-130):
- Removes `correct_answers` from questions (security)
- Applies `randomize_questions` if enabled
- Applies `shuffle_answers` if enabled (with `shuffleMap` for reverse mapping)
- Returns user info: attempts used, max attempts, cooldown remaining, best score

**`startQuizSession`** (líneas 135-189):
- Validates user can start (attempts, cooldown)
- Returns session data with `startedAt`, `expiresAt` (for client-side timer)
- Prevents starting if cooldown active or max attempts reached

**`submitQuizAttempt`** (líneas 194-231):
- Validates `answers` object format
- Parses `startedAt` timestamp (required for time limit enforcement)
- Calls service to process attempt
- Returns full results: score, percentage, time spent, correct answers (if enabled)

**`getQuizAnalytics`** (líneas 309-344):
- Returns quiz stats + question-level analytics
- **NOTE**: Question analytics are placeholder (TODO: implement answer pattern analysis)

---

## 🎨 FRONTEND: Estado Actual (LmsQuizManagement.tsx)

### Componente Principal

**Props Interface:**
```typescript
interface LmsQuizManagementProps {
  courseId?: number          // From parent (LmsCourseContentEditor)
  moduleId?: string          // From parent (selected module)
  initialQuizId?: number     // If editing existing quiz
  onQuizSaved?: (quizId: number) => void  // Callback on save
  embedded?: boolean         // True when in Dialog, false when standalone
}
```

**Estado:**
- `quizConfig`: QuizConfig (configuración del quiz)
- `questionBank`: Question[] (banco de preguntas disponibles)
- `previewQuestions`: Question[] (preguntas seleccionadas para este quiz)
- `activeTab`: 0-3 (Configuración, Banco, Vista Previa, Analíticas)

### Tab 1: Configuración del Quiz

**Interface `QuizConfig`:**
```typescript
interface QuizConfig {
  title: string                    // → quiz.title
  instructions: string             // → quiz.instructions
  passingPercentage: number        // → quiz.passing_percentage
  maxAttempts: number              // → quiz.max_attempts
  cooldownMinutes: number          // → quiz.cooldown_minutes
  showCorrectAnswers: boolean      // → quiz.show_correct_answers
  randomizeQuestions: boolean      // → quiz.randomize_questions
  shuffleAnswers: boolean          // → quiz.shuffle_answers
  hasTimeLimit: boolean            // Frontend flag
  timeLimitMinutes: number | null  // → quiz.time_limit_minutes
}
```

**Validaciones (frontend):**
- Title: 3-200 chars
- Passing percentage: 0-100
- Max attempts: 1-99
- Cooldown: 0-1440 minutes
- Time limit: 1-999 minutes (if enabled)

**Mapeo a Backend:**
```typescript
// Frontend → Backend (al guardar)
const backendQuizData = {
  title: quizConfig.title,
  instructions: quizConfig.instructions,
  passing_percentage: quizConfig.passingPercentage,
  max_attempts: quizConfig.maxAttempts,
  cooldown_minutes: quizConfig.cooldownMinutes,
  show_correct_answers: quizConfig.showCorrectAnswers,
  randomize_questions: quizConfig.randomizeQuestions,
  shuffle_answers: quizConfig.shuffleAnswers,
  time_limit_minutes: quizConfig.hasTimeLimit ? quizConfig.timeLimitMinutes : null,
  questions: previewQuestions.map(q => ({
    type: q.type,
    question: q.question,
    options: q.options,
    correct_answers: q.correctAnswers,
    points: q.points,
    order_index: q.id,  // Usar orden actual
    explanation: q.explanation || null
  }))
}
```

### Tab 2: Banco de Preguntas

**Interface `Question`:**
```typescript
interface Question {
  id: number                       // Temporal (Date.now()) → quiz_question.id (backend genera)
  type: 'single' | 'multiple' | 'boolean'  // → quiz_question.type
  question: string                 // → quiz_question.question
  options: string[]                // → quiz_question.options
  correctAnswers: number[]         // → quiz_question.correct_answers
  points: number                   // → quiz_question.points
  explanation?: string             // → quiz_question.explanation
  tags?: string[]                  // Frontend only (no persiste en backend)
  difficulty?: 'easy' | 'medium' | 'hard'  // Frontend only
}
```

**Funcionalidad:**
- CRUD completo de preguntas en banco local (mock data)
- Filters: tipo, dificultad, búsqueda por texto
- Add to Quiz: Mueve preguntas al preview

**Backend Integration Needed:**
- **OPCIÓN A (Simple)**: Preguntas solo existen dentro de quizzes (sin banco global)
  - Keep mock banco para crear preguntas
  - Al guardar quiz, send questions array con cada quiz
  - No persistir banco separado

- **OPCIÓN B (Avanzado - FUTURO)**: Crear tabla `lms_question_bank`
  - Preguntas reutilizables entre quizzes
  - Relación N:N con `lms_quizzes`
  - **NO implementar en Phase 2** (complejidad innecesaria ahora)

**Recomendación para Phase 2:** Opción A (simple)

### Tab 3: Vista Previa

**Componente:** `QuizPreview.tsx`

Muestra:
- Lista de preguntas seleccionadas con puntos
- Preview interactivo (radio/checkbox según tipo)
- Answers correctas marcadas
- Explicaciones si existen
- Total points calculado

**No requiere backend** - solo usa `previewQuestions` del estado local

### Tab 4: Analíticas

**Componente:** Muestra stats del quiz

**Mock Data Actual:**
```typescript
{
  totalAttempts: 45,
  averageScore: 78,
  passRate: 68,
  completionRate: 82,
  averageTimeMinutes: 12
}
```

**Backend Mapping:**
```typescript
// GET /api/lms/quizzes/:quizId/statistics
{
  totalAttempts: number,
  uniqueUsers: number,
  averageScore: number,        // Ya en porcentaje (0-100)
  passRate: number,            // Ya en porcentaje (0-100)
  averageTimeMinutes: number,
  suspiciousAttempts: number
}

// Frontend adiciona:
completionRate: (uniqueUsers / totalEligibleUsers) * 100  // Requiere endpoint adicional
```

**Gráficos:**
- Score distribution (histogram)
- Question difficulty analysis
- Time distribution

**Backend Support:**
- `GET /quizzes/:quizId/analytics` tiene datos pero implementación placeholder
- **TODO en backend:** Implementar question-level analytics completo

---

## 🔗 PHASE 2: Plan de Integración

### PASO 1: Crear Quiz Service (Frontend)

**File:** `front.mmcs/src/services/quizService.ts`

```typescript
import axios from 'axios'

const API_BASE = '/api/lms/quizzes'

export interface CreateQuizDTO {
  title: string
  instructions: string
  passing_percentage: number
  max_attempts: number
  cooldown_minutes: number
  show_correct_answers: boolean
  randomize_questions: boolean
  shuffle_answers: boolean
  time_limit_minutes: number | null
  questions: QuestionDTO[]
}

export interface QuestionDTO {
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
  correct_answers: number[]
  points: number
  order_index: number
  explanation?: string
}

export interface Quiz {
  id: number
  lesson_id: number
  title: string
  instructions: string
  passing_percentage: number
  max_attempts: number
  cooldown_minutes: number
  show_correct_answers: boolean
  randomize_questions: boolean
  shuffle_answers: boolean
  time_limit_minutes: number | null
  created_at: string
  updated_at: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
  correct_answers: number[]
  points: number
  order_index: number
  explanation: string | null
  created_at: string
  updated_at: string
}

export interface QuizStatistics {
  totalAttempts: number
  uniqueUsers: number
  averageScore: number
  passRate: number
  averageTimeMinutes: number
  suspiciousAttempts: number
}

class QuizService {
  // Quiz CRUD
  async createQuiz(lessonId: number, quizData: CreateQuizDTO): Promise<Quiz> {
    const response = await axios.post(`${API_BASE}/lessons/${lessonId}/quiz`, quizData)
    return response.data.data
  }

  async getQuizById(quizId: number): Promise<Quiz> {
    const response = await axios.get(`${API_BASE}/${quizId}/manage`)
    return response.data.data
  }

  async updateQuiz(quizId: number, quizData: CreateQuizDTO): Promise<Quiz> {
    const response = await axios.put(`${API_BASE}/${quizId}`, quizData)
    return response.data.data
  }

  async deleteQuiz(quizId: number): Promise<void> {
    await axios.delete(`${API_BASE}/${quizId}`)
  }

  async previewQuiz(quizId: number): Promise<Quiz> {
    const response = await axios.get(`${API_BASE}/${quizId}/preview`)
    return response.data.data
  }

  // Analytics
  async getQuizStatistics(quizId: number): Promise<QuizStatistics> {
    const response = await axios.get(`${API_BASE}/${quizId}/statistics`)
    return response.data.data
  }

  async getQuizAnalytics(quizId: number): Promise<any> {
    const response = await axios.get(`${API_BASE}/${quizId}/analytics`)
    return response.data.data
  }

  // Validation
  async validateQuizConfig(quizData: CreateQuizDTO): Promise<boolean> {
    try {
      await axios.post(`${API_BASE}/validate-config`, quizData)
      return true
    } catch (error) {
      return false
    }
  }
}

export default new QuizService()
```

---

### PASO 2: Integrar React Query en LmsQuizManagement.tsx

**Imports:**
```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import quizService from '../../../services/quizService'
```

**Hooks a Implementar:**

#### 2.1. Load Quiz (si `initialQuizId` existe)
```typescript
const { data: loadedQuiz, isLoading: isLoadingQuiz } = useQuery(
  ['quiz', initialQuizId],
  () => quizService.getQuizById(initialQuizId!),
  {
    enabled: !!initialQuizId,
    onSuccess: (quiz) => {
      // Mapear quiz del backend al estado local
      setQuizConfig({
        title: quiz.title,
        instructions: quiz.instructions,
        passingPercentage: quiz.passing_percentage,
        maxAttempts: quiz.max_attempts,
        cooldownMinutes: quiz.cooldown_minutes,
        showCorrectAnswers: quiz.show_correct_answers,
        randomizeQuestions: quiz.randomize_questions,
        shuffleAnswers: quiz.shuffle_answers,
        hasTimeLimit: quiz.time_limit_minutes !== null,
        timeLimitMinutes: quiz.time_limit_minutes
      })

      // Mapear questions del backend al preview
      const mappedQuestions = quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswers: q.correct_answers,
        points: q.points,
        explanation: q.explanation || undefined
      }))
      setPreviewQuestions(mappedQuestions)
    }
  }
)
```

#### 2.2. Create/Update Quiz Mutation
```typescript
const queryClient = useQueryClient()

const saveQuizMutation = useMutation(
  async () => {
    if (!courseId || !moduleId) {
      throw new Error('Missing courseId or moduleId')
    }

    // Primero necesitamos el lessonId del módulo
    // Obtener lecciones del módulo
    const lessonsResponse = await axiosPrivate.get(`/lms/content/modules/${moduleId}/lessons`)
    const lessons = lessonsResponse.data.data || lessonsResponse.data || []

    if (lessons.length === 0) {
      throw new Error('Module has no lessons')
    }

    const lessonId = lessons[0].id  // Usar la primera lección

    // Preparar quiz data
    const quizData: CreateQuizDTO = {
      title: quizConfig.title,
      instructions: quizConfig.instructions,
      passing_percentage: quizConfig.passingPercentage,
      max_attempts: quizConfig.maxAttempts,
      cooldown_minutes: quizConfig.cooldownMinutes,
      show_correct_answers: quizConfig.showCorrectAnswers,
      randomize_questions: quizConfig.randomizeQuestions,
      shuffle_answers: quizConfig.shuffleAnswers,
      time_limit_minutes: quizConfig.hasTimeLimit ? quizConfig.timeLimitMinutes : null,
      questions: previewQuestions.map((q, index) => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correct_answers: q.correctAnswers,
        points: q.points,
        order_index: index,
        explanation: q.explanation
      }))
    }

    // Create or Update
    if (initialQuizId) {
      return await quizService.updateQuiz(initialQuizId, quizData)
    } else {
      return await quizService.createQuiz(lessonId, quizData)
    }
  },
  {
    onSuccess: (quiz) => {
      queryClient.invalidateQueries(['quiz', quiz.id])
      queryClient.invalidateQueries(['lms-course', courseId])

      // Callback to parent
      if (onQuizSaved) {
        onQuizSaved(quiz.id)
      }

      alert(`Quiz ${initialQuizId ? 'actualizado' : 'creado'} exitosamente`)
    },
    onError: (error: any) => {
      console.error('Error saving quiz:', error)
      alert('Error al guardar el quiz. Por favor, inténtalo de nuevo.')
    }
  }
)
```

#### 2.3. Load Quiz Statistics
```typescript
const { data: quizStats, isLoading: isLoadingStats } = useQuery(
  ['quiz-stats', initialQuizId],
  () => quizService.getQuizStatistics(initialQuizId!),
  {
    enabled: !!initialQuizId && activeTab === 3,  // Solo cargar si está en tab Analytics
    refetchInterval: 30000  // Refresh cada 30 segundos
  }
)
```

#### 2.4. Update handleSaveQuiz
```typescript
const handleSaveQuiz = () => {
  const errors = validateQuizConfig()
  if (errors.length > 0) {
    alert('Errores de validación:\n' + errors.join('\n'))
    return
  }

  if (previewQuestions.length === 0) {
    alert('Debes agregar al menos una pregunta al quiz')
    return
  }

  // Trigger mutation
  saveQuizMutation.mutate()
}
```

---

### PASO 3: Actualizar LmsCourseContentEditor.tsx

**Problema Actual:** El editor guarda `quizId` en `module.content.quizId`, pero:
- `lesson_id` es lo que el backend necesita para crear/obtener quiz
- Quiz pertenece a Lesson, no a Module directamente

**Solución:**

**Opción A (Recomendada):** Mantener `quizId` en `module.content`
- Al abrir LmsQuizManagement, pasar `initialQuizId` = `module.content.quizId`
- LmsQuizManagement se encarga de obtener el quiz completo por ID
- Cuando se guarda, actualizar `module.content.quizId` con el nuevo ID

**Opción B:** Almacenar `lessonId` en `module.content`
- Cambiar de `quizId` a `lessonId` en content
- Más alineado con arquitectura backend
- Requiere buscar quiz por `lesson_id` (no hay endpoint directo para esto)

**Implementación Opción A (Actual):**

Ya está implementado en Phase 1 ✅:
```typescript
// LmsContentEditor.tsx (líneas 1001-1018)
<LmsQuizManagement
  courseId={courseId ? parseInt(courseId) : undefined}
  moduleId={selectedModule?.id}
  initialQuizId={selectedModule?.content.quizId}
  onQuizSaved={(quizId) => {
    if (selectedModule) {
      updateModuleContent(selectedModule.id, {
        ...selectedModule.content,
        quizId
      })
    }
    setOpenQuizManagement(false)
  }}
  embedded={true}
/>
```

**Ajuste Necesario:** Necesitamos endpoint para obtener quiz por `lesson_id`

---

### PASO 4: Agregar Endpoint Backend (OPCIONAL)

**Problema:** No hay endpoint `GET /lessons/:lessonId/quiz`

**Solución:** Agregar en `quizzes.routes.js`:

```javascript
// Get quiz by lesson ID (convenience endpoint)
router.get('/lessons/:lessonId/quiz',
  authorizeCourseAccess,
  ...lessonIdParamSchema,
  handleValidationErrors,
  QuizController.getQuizByLessonId
);
```

**Controller Method:**
```javascript
getQuizByLessonId = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const quiz = await QuizService.getQuizByLessonId(parseInt(lessonId));

  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'QUIZ_NOT_FOUND',
        message: 'No quiz found for this lesson'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: quiz
  });
});
```

**Service Method:**
```javascript
async getQuizByLessonId(lessonId) {
  try {
    const quiz = await LmsQuiz.findOne({
      where: { lesson_id: lessonId },
      include: [{
        model: LmsQuizQuestion,
        as: 'questions',
        order: [['order_index', 'ASC']]
      }]
    });

    return quiz;  // Puede ser null si no hay quiz
  } catch (error) {
    logger.error('Error fetching quiz by lesson ID:', error);
    throw new AppError('Failed to fetch quiz', 500);
  }
}
```

**Uso en Frontend:**
```typescript
// quizService.ts
async getQuizByLessonId(lessonId: number): Promise<Quiz | null> {
  try {
    const response = await axios.get(`${API_BASE}/lessons/${lessonId}/quiz`)
    return response.data.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null  // No quiz exists yet
    }
    throw error
  }
}
```

**Alternativa (sin nuevo endpoint):** Buscar en frontend
```typescript
// En LmsQuizManagement, si initialQuizId no existe pero moduleId sí:
useEffect(() => {
  if (!initialQuizId && moduleId) {
    // Get lesson ID from module
    axiosPrivate.get(`/lms/content/modules/${moduleId}/lessons`)
      .then(res => {
        const lessons = res.data.data || res.data || []
        if (lessons.length > 0 && lessons[0].quiz) {
          // Si la lesson tiene quiz, cargar el quiz
          setInitialQuizId(lessons[0].quiz.id)
        }
      })
  }
}, [moduleId, initialQuizId])
```

---

### PASO 5: Manejo de Estados y UX

**Loading States:**
```typescript
if (isLoadingQuiz) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Cargando quiz...</Typography>
    </Box>
  )
}
```

**Save Button State:**
```typescript
<Button
  variant="contained"
  onClick={handleSaveQuiz}
  disabled={saveQuizMutation.isLoading}
>
  {saveQuizMutation.isLoading ? 'Guardando...' : 'Guardar Quiz'}
</Button>
```

**Error Handling:**
```typescript
{saveQuizMutation.isError && (
  <Alert severity="error" sx={{ mb: 2 }}>
    Error al guardar el quiz. Por favor, verifica los datos e inténtalo de nuevo.
  </Alert>
)}

{saveQuizMutation.isSuccess && (
  <Alert severity="success" sx={{ mb: 2 }}>
    Quiz guardado exitosamente
  </Alert>
)}
```

---

### PASO 6: Tab Analytics - Backend Integration

**Actualizar componente de analytics:**

```typescript
// En tab Analytics (activeTab === 3)
const AnalyticsTab = () => {
  if (!initialQuizId) {
    return (
      <Alert severity="info">
        Guarda el quiz primero para ver las analíticas
      </Alert>
    )
  }

  if (isLoadingStats) {
    return <CircularProgress />
  }

  if (!quizStats) {
    return (
      <Alert severity="warning">
        No hay datos de intentos todavía
      </Alert>
    )
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total de Intentos</Typography>
            <Typography variant="h3">{quizStats.totalAttempts}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Promedio de Calificación</Typography>
            <Typography variant="h3">{quizStats.averageScore}%</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Tasa de Aprobación</Typography>
            <Typography variant="h3">{quizStats.passRate}%</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Usuarios Únicos</Typography>
            <Typography variant="h3">{quizStats.uniqueUsers}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Tiempo Promedio</Typography>
            <Typography variant="h3">{quizStats.averageTimeMinutes} min</Typography>
          </CardContent>
        </Card>
      </Grid>

      {quizStats.suspiciousAttempts > 0 && (
        <Grid item xs={12}>
          <Alert severity="warning">
            {quizStats.suspiciousAttempts} intentos sospechosos detectados (completados muy rápido)
          </Alert>
        </Grid>
      )}
    </Grid>
  )
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend (OPCIONAL - Sistema ya completo)
- [ ] Agregar endpoint `GET /lessons/:lessonId/quiz` (QuizController, QuizService)
- [ ] Validar que todos los endpoints funcionen con Postman/Insomnia
- [ ] Verificar rate limiting y auth en todos los endpoints

### Frontend (REQUERIDO)

**Servicios:**
- [ ] Crear `quizService.ts` con todos los métodos
- [ ] Crear interfaces TypeScript para DTOs y responses
- [ ] Configurar axios instance con auth headers

**Componente LmsQuizManagement.tsx:**
- [ ] Agregar React Query hooks (useQuery para load, useMutation para save)
- [ ] Implementar `saveQuizMutation` con mapeo de datos
- [ ] Actualizar `handleSaveQuiz` para usar mutation
- [ ] Agregar loading states (isLoading, isSuccess, isError)
- [ ] Implementar error handling con alerts/toasts
- [ ] Actualizar tab Analytics para usar datos reales
- [ ] Manejar caso "nuevo quiz" vs "editar quiz existente"
- [ ] Validar que `previewQuestions` no esté vacío antes de guardar

**Banco de Preguntas:**
- [ ] **Decisión:** ¿Mantener mock banco o implementar banco global?
  - **Opción A (Simple):** Mock banco, questions solo en quizzes → **RECOMENDADO**
  - **Opción B (Futuro):** Crear tabla `lms_question_bank` y endpoints

**Testing:**
- [ ] Crear quiz nuevo desde cero
- [ ] Editar quiz existente
- [ ] Agregar/eliminar preguntas
- [ ] Validar configuración (límites, porcentajes)
- [ ] Ver analytics después de intentos
- [ ] Verificar que quizId se guarda en module.content
- [ ] Test con diferentes tipos de preguntas (single, multiple, boolean)
- [ ] Test con time limit enabled/disabled
- [ ] Test con randomize/shuffle enabled/disabled

**Error Handling:**
- [ ] 404 cuando quiz no existe
- [ ] 400 cuando validación falla
- [ ] 403 cuando usuario no tiene permisos
- [ ] Network errors (timeout, offline)
- [ ] Show user-friendly messages

**UX Improvements:**
- [ ] Auto-save draft cada X minutos (opcional)
- [ ] Confirm before closing with unsaved changes
- [ ] Show "Guardando..." spinner during save
- [ ] Success toast on save
- [ ] Disable save button mientras se guarda
- [ ] Keyboard shortcuts (Ctrl+S to save)

---

## 📋 RESUMEN DE CAMBIOS

### Archivos a CREAR
1. `front.mmcs/src/services/quizService.ts` - API client para quizzes

### Archivos a MODIFICAR
1. `front.mmcs/src/pages/lms/admin/LmsQuizManagement.tsx`
   - Agregar React Query hooks
   - Replace mock data con real API calls
   - Implement save/load logic
   - Update analytics tab

2. `api.mmcs/routes/lms/quizzes.routes.js` (OPCIONAL)
   - Agregar `GET /lessons/:lessonId/quiz`

3. `api.mmcs/controllers/lms/QuizController.js` (OPCIONAL)
   - Agregar `getQuizByLessonId` method

4. `api.mmcs/services/lms/QuizService.js` (OPCIONAL)
   - Agregar `getQuizByLessonId` method

### Archivos a PROBAR
1. Todos los endpoints existentes con Postman
2. Flujo completo: crear módulo → crear quiz → editar quiz → ver analytics

---

## 🚀 ESTIMACIÓN DE TIEMPO

**Backend (OPCIONAL):** 30-60 minutos
- Agregar endpoint `GET /lessons/:lessonId/quiz`: 30 min
- Testing: 30 min

**Frontend (CORE):** 3-4 horas
- quizService.ts: 1 hora
- LmsQuizManagement integration: 2 horas
- Testing: 1 hora

**Total:** 4-5 horas

---

## 🎯 SIGUIENTE PASO INMEDIATO

**Comenzar con:**
1. Crear `quizService.ts` con interfaces y métodos básicos
2. Implementar `useQuery` para cargar quiz existente
3. Implementar `useMutation` para guardar quiz
4. Testing básico: crear quiz nuevo

**Después:**
5. Tab Analytics con datos reales
6. Error handling y UX polish
7. Full testing suite

---

## 📝 NOTAS IMPORTANTES

### Arquitectura Backend
- ✅ **COMPLETO y ROBUSTO** - No necesita modificaciones
- ✅ Anti-fraud detection implementado
- ✅ Security middleware completo
- ✅ Validaciones comprehensivas
- ✅ Transaction-safe operations

### Decisiones de Diseño
- **Banco de Preguntas:** Mock local (no global database) - suficiente para MVP
- **Quiz Storage:** Quiz ID en `module.content.quizId` - simple y funcional
- **Question IDs:** Backend genera IDs reales, reemplazar temporales del frontend

### Limitaciones Actuales
- **Question Analytics:** Backend tiene placeholder, necesita implementación completa
- **Banco Global:** No existe, todas las questions son específicas de cada quiz
- **Question Reuse:** No soportado sin banco global

### Mejoras Futuras (Post Phase 2)
- [ ] Implementar question bank global (tabla `lms_question_bank`)
- [ ] Question-level analytics detallado
- [ ] Question difficulty auto-calculation (based on correct answer rate)
- [ ] Quiz templates reutilizables
- [ ] Bulk import de preguntas (CSV, JSON)
- [ ] AI-generated questions (GPT integration)
- [ ] Advanced anti-fraud (browser fingerprinting, tab switching detection)

---

**Documento creado:** 2025-10-18
**Última actualización:** 2025-10-18
**Autor:** Claude (Backend Analysis Agent)
**Status:** ✅ COMPLETE - Ready for Phase 2 implementation
