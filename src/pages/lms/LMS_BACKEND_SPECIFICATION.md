# LMS Backend Specification

## 📋 Tabla de Contenidos
- [Modelos de Base de Datos](#modelos-de-base-de-datos)
- [Relaciones](#relaciones)
- [Endpoints API](#endpoints-api)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Estructura de Respuestas](#estructura-de-respuestas)

---

## 🗄️ Modelos de Base de Datos

### 1. **courses** - Tabla principal de cursos
```sql
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    instructor_id BIGINT NOT NULL,
    duration VARCHAR(50),
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    audience_employees BOOLEAN DEFAULT false,
    audience_clients BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_lessons INT DEFAULT 0,
    enrolled_students INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);
```

### 2. **course_units** - Unidades de contenido del curso
```sql
CREATE TABLE course_units (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('video', 'text', 'quiz') NOT NULL,
    duration VARCHAR(50),
    order_index INT NOT NULL,
    is_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

### 3. **unit_content** - Contenido específico de cada unidad
```sql
CREATE TABLE unit_content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    unit_id BIGINT NOT NULL,
    content_type ENUM('video', 'text', 'quiz') NOT NULL,
    video_url VARCHAR(500),
    video_transcript TEXT,
    text_content LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES course_units(id) ON DELETE CASCADE
);
```

### 4. **quiz_questions** - Preguntas de quiz
```sql
CREATE TABLE quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    unit_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    type ENUM('true-false', 'single-choice', 'multiple-choice') NOT NULL,
    points INT DEFAULT 1,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES course_units(id) ON DELETE CASCADE
);
```

### 5. **question_options** - Opciones de respuesta
```sql
CREATE TABLE question_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_id BIGINT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);
```

### 6. **user_course_enrollments** - Inscripciones de usuarios a cursos
```sql
CREATE TABLE user_course_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id)
);
```

### 7. **user_unit_progress** - Progreso de usuarios en unidades
```sql
CREATE TABLE user_unit_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP NULL,
    score DECIMAL(5,2) NULL,
    max_score DECIMAL(5,2) NULL,
    time_spent INT DEFAULT 0, -- en segundos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES course_units(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (user_id, unit_id)
);
```

### 8. **user_quiz_answers** - Respuestas de usuarios en quizzes
```sql
CREATE TABLE user_quiz_answers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_options JSON, -- Array de IDs de opciones seleccionadas
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0.00,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);
```

### 9. **course_categories** - Categorías de cursos
```sql
CREATE TABLE course_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976d2', -- Color en formato HEX
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 10. **course_ratings** - Calificaciones de cursos
```sql
CREATE TABLE course_ratings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rating (user_id, course_id)
);
```

---

## 🔗 Relaciones

### Relaciones Principales:
- **users** → **courses** (1:N) - Un instructor puede crear múltiples cursos
- **courses** → **course_units** (1:N) - Un curso tiene múltiples unidades
- **course_units** → **unit_content** (1:1) - Cada unidad tiene un contenido específico
- **course_units** → **quiz_questions** (1:N) - Una unidad puede tener múltiples preguntas
- **quiz_questions** → **question_options** (1:N) - Cada pregunta tiene múltiples opciones

### Relaciones de Usuario:
- **users** → **user_course_enrollments** (1:N) - Un usuario puede estar inscrito en múltiples cursos
- **users** → **user_unit_progress** (1:N) - Un usuario tiene progreso en múltiples unidades
- **users** → **user_quiz_answers** (1:N) - Un usuario puede responder múltiples preguntas
- **users** → **course_ratings** (1:N) - Un usuario puede calificar múltiples cursos

### Relaciones de Categorización:
- **course_categories** → **courses** (1:N) - Una categoría puede tener múltiples cursos

---

## 🌐 Endpoints API

### 🔐 Autenticación
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### 📚 Gestión de Cursos

#### **Cursos (Admin)**
```
GET    /api/lms/admin/courses              # Listar todos los cursos
POST   /api/lms/admin/courses              # Crear nuevo curso
GET    /api/lms/admin/courses/{id}         # Obtener curso específico
PUT    /api/lms/admin/courses/{id}         # Actualizar curso
DELETE /api/lms/admin/courses/{id}         # Eliminar curso
GET    /api/lms/admin/courses/{id}/stats   # Estadísticas del curso
```

#### **Cursos (Estudiantes)**
```
GET    /api/lms/courses                    # Listar cursos disponibles
GET    /api/lms/courses/{id}               # Obtener curso específico
POST   /api/lms/courses/{id}/enroll        # Inscribirse en curso
GET    /api/lms/courses/{id}/progress      # Progreso del usuario en el curso
```

#### **Contenido de Cursos**
```
GET    /api/lms/admin/courses/{id}/units           # Listar unidades del curso
POST   /api/lms/admin/courses/{id}/units           # Crear nueva unidad
PUT    /api/lms/admin/courses/{id}/units/{unitId}  # Actualizar unidad
DELETE /api/lms/admin/courses/{id}/units/{unitId}  # Eliminar unidad
POST   /api/lms/admin/courses/{id}/units/reorder   # Reordenar unidades
```

#### **Contenido de Unidades**
```
GET    /api/lms/admin/units/{unitId}/content      # Obtener contenido de unidad
PUT    /api/lms/admin/units/{unitId}/content      # Actualizar contenido de unidad
POST   /api/lms/admin/units/{unitId}/content/video # Subir video
```

#### **Quizzes**
```
GET    /api/lms/admin/units/{unitId}/questions    # Listar preguntas del quiz
POST   /api/lms/admin/units/{unitId}/questions    # Crear nueva pregunta
PUT    /api/lms/admin/units/{unitId}/questions/{questionId} # Actualizar pregunta
DELETE /api/lms/admin/units/{unitId}/questions/{questionId} # Eliminar pregunta
POST   /api/lms/admin/units/{unitId}/questions/reorder # Reordenar preguntas
```

#### **Progreso de Usuarios**
```
GET    /api/lms/user/progress                      # Progreso general del usuario
GET    /api/lms/user/courses/{courseId}/progress   # Progreso en curso específico
POST   /api/lms/user/units/{unitId}/complete      # Marcar unidad como completada
POST   /api/lms/user/units/{unitId}/quiz/answers  # Enviar respuestas del quiz
GET    /api/lms/user/units/{unitId}/quiz/results  # Obtener resultados del quiz
```

#### **Inscripciones**
```
GET    /api/lms/user/enrollments                  # Cursos en los que está inscrito
POST   /api/lms/user/enrollments                  # Inscribirse en curso
DELETE /api/lms/user/enrollments/{enrollmentId}   # Cancelar inscripción
```

#### **Calificaciones y Reseñas**
```
GET    /api/lms/courses/{id}/ratings              # Obtener calificaciones del curso
POST   /api/lms/courses/{id}/ratings              # Calificar curso
PUT    /api/lms/courses/{id}/ratings              # Actualizar calificación
DELETE /api/lms/courses/{id}/ratings              # Eliminar calificación
```

#### **Categorías**
```
GET    /api/lms/categories                        # Listar categorías
POST   /api/lms/admin/categories                  # Crear categoría
PUT    /api/lms/admin/categories/{id}             # Actualizar categoría
DELETE /api/lms/admin/categories/{id}             # Eliminar categoría
```

#### **Analíticas (Admin)**
```
GET    /api/lms/admin/analytics/overview          # Resumen general
GET    /api/lms/admin/analytics/courses           # Estadísticas de cursos
GET    /api/lms/admin/analytics/users             # Estadísticas de usuarios
GET    /api/lms/admin/analytics/enrollments       # Estadísticas de inscripciones
GET    /api/lms/admin/analytics/completions       # Estadísticas de completado
```

#### **Gestión de Usuarios (Admin)**
```
GET    /api/lms/admin/users                       # Listar usuarios
GET    /api/lms/admin/users/{id}                  # Obtener usuario específico
PUT    /api/lms/admin/users/{id}                  # Actualizar usuario
DELETE /api/lms/admin/users/{id}                  # Eliminar usuario
GET    /api/lms/admin/users/{id}/progress         # Progreso de usuario específico
```

---

## 🔐 Autenticación y Autorización

### Roles de Usuario:
- **admin**: Acceso completo a todas las funcionalidades
- **employee**: Puede inscribirse en cursos para empleados
- **client**: Puede inscribirse en cursos públicos

### Middleware de Autorización:
```javascript
// Ejemplo de middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    next();
  };
};

// Uso en rutas
router.get('/admin/courses', authorizeRole(['admin']), getCourses);
router.get('/courses', authorizeRole(['admin', 'employee', 'client']), getAvailableCourses);
```

---

## 📊 Estructura de Respuestas

### Respuesta de Éxito:
```json
{
  "success": true,
  "data": {
    // Datos de la respuesta
  },
  "message": "Operación exitosa"
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": {
      // Detalles específicos del error
    }
  }
}
```

### Paginación:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## 🗂️ Estructura de Archivos del Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── CourseController.js
│   │   ├── UnitController.js
│   │   ├── QuizController.js
│   │   ├── ProgressController.js
│   │   ├── EnrollmentController.js
│   │   └── AnalyticsController.js
│   ├── models/
│   │   ├── Course.js
│   │   ├── CourseUnit.js
│   │   ├── UnitContent.js
│   │   ├── QuizQuestion.js
│   │   ├── QuestionOption.js
│   │   ├── UserEnrollment.js
│   │   ├── UserProgress.js
│   │   └── CourseRating.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── courses.js
│   │   ├── units.js
│   │   ├── quizzes.js
│   │   └── progress.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorization.js
│   │   └── validation.js
│   ├── services/
│   │   ├── CourseService.js
│   │   ├── ProgressService.js
│   │   └── AnalyticsService.js
│   └── utils/
│       ├── database.js
│       └── helpers.js
├── migrations/
│   ├── 001_create_courses.js
│   ├── 002_create_course_units.js
│   ├── 003_create_unit_content.js
│   ├── 004_create_quiz_questions.js
│   ├── 005_create_question_options.js
│   ├── 006_create_user_enrollments.js
│   ├── 007_create_user_progress.js
│   ├── 008_create_quiz_answers.js
│   ├── 009_create_categories.js
│   └── 010_create_ratings.js
└── seeds/
    ├── categories.js
    ├── sample_courses.js
    └── sample_quizzes.js
```

---

## 🚀 Implementación Recomendada

### 1. **Base de Datos**
- Usar MySQL o PostgreSQL
- Implementar migraciones para versionado de esquema
- Crear índices para optimizar consultas frecuentes

### 2. **API REST**
- Usar Express.js o Fastify
- Implementar validación con Joi o Yup
- Usar middleware para autenticación y autorización

### 3. **Seguridad**
- Implementar rate limiting
- Validar entrada de datos
- Usar HTTPS en producción
- Implementar CORS apropiadamente

### 4. **Performance**
- Implementar caché con Redis
- Optimizar consultas de base de datos
- Usar paginación en listas grandes
- Implementar lazy loading para contenido pesado

### 5. **Monitoreo**
- Logging de errores
- Métricas de performance
- Monitoreo de base de datos
- Alertas automáticas

---

## 📝 Notas de Implementación

### Prioridades de Desarrollo:
1. **Fase 1**: Modelos básicos y CRUD de cursos
2. **Fase 2**: Sistema de unidades y contenido
3. **Fase 3**: Sistema de quizzes
4. **Fase 4**: Progreso de usuarios y inscripciones
5. **Fase 5**: Analíticas y reportes

### Consideraciones Técnicas:
- Usar transacciones para operaciones complejas
- Implementar soft deletes para datos importantes
- Considerar escalabilidad desde el inicio
- Documentar API con Swagger/OpenAPI

### Integración con Frontend:
- Los endpoints deben coincidir con las llamadas del frontend
- Implementar CORS para desarrollo local
- Usar tokens JWT para autenticación
- Mantener consistencia en formato de respuestas 