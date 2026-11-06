# Módulo LMS (Learning Management System)

Este módulo replica la funcionalidad del `lms-frontend` pero adaptado al proyecto `front.mmcs` usando Material UI v5, React Query y el hook `axiosPrivate`.

## Estructura del Módulo

```
src/pages/lms/
├── LmsDashboard.tsx          # Dashboard principal que redirige según el rol
├── admin/
│   ├── LmsAdmin.tsx         # Dashboard de administrador
│   ├── LmsCourseManagement.tsx  # Gestión de cursos
│   ├── LmsUserManagement.tsx    # Gestión de usuarios
│   └── LmsAnalytics.tsx     # Analíticas del sistema
├── employee/
│   └── LmsEmployee.tsx      # Dashboard de empleado
├── client/
│   └── LmsClient.tsx        # Dashboard de cliente
└── README.md                # Esta documentación
```

## Rutas

El módulo está configurado con las siguientes rutas:

- `/lms` - Dashboard principal (redirige según rol)
- `/lms/admin` - Dashboard de administrador
- `/lms/employee` - Dashboard de empleado
- `/lms/client` - Dashboard de cliente
- `/lms/admin/courses` - Gestión de cursos
- `/lms/admin/users` - Gestión de usuarios
- `/lms/admin/analytics` - Analíticas del sistema

## Roles y Permisos

### Administrador

- Acceso completo al sistema
- Gestión de cursos, usuarios y analíticas
- Estadísticas detalladas del sistema

### Empleado

- Acceso a cursos internos
- Seguimiento de progreso personal
- Certificados obtenidos

### Cliente

- Acceso a cursos públicos
- Progreso limitado
- Certificados básicos

## Características Implementadas

### ✅ Completado

- [x] Estructura de rutas y navegación
- [x] Dashboards para cada rol
- [x] Gestión de cursos (CRUD)
- [x] Gestión de usuarios (CRUD)
- [x] Analíticas básicas
- [x] Integración con Material UI v5
- [x] Uso de React Query para manejo de estado
- [x] Uso del hook axiosPrivate para API calls
- [x] Diseño responsive
- [x] Mock data para demostración

### 🔄 En Desarrollo

- [ ] Integración con API real
- [ ] Sistema de autenticación específico para LMS
- [ ] Gestión de contenido de cursos
- [ ] Sistema de certificados
- [ ] Notificaciones
- [ ] Reportes avanzados

## Tecnologías Utilizadas

- **Material UI v5** - Componentes de UI
- **React Query v3** - Manejo de estado y cache
- **axiosPrivate** - Cliente HTTP con autenticación
- **React Router** - Navegación
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Utilidades CSS (complementario)

## Uso

### Para Administradores

1. Navegar a `/lms/admin`
2. Gestionar cursos desde `/lms/admin/courses`
3. Gestionar usuarios desde `/lms/admin/users`
4. Ver analíticas desde `/lms/admin/analytics`

### Para Empleados

1. Navegar a `/lms/employee`
2. Ver progreso en cursos
3. Acceder a certificados

### Para Clientes

1. Navegar a `/lms/client`
2. Explorar cursos públicos
3. Seguir progreso personal

## Integración con el Sistema Principal

El módulo se integra con el sistema principal de `front.mmcs`:

- Usa el mismo sistema de autenticación
- Comparte el hook `axiosPrivate`
- Utiliza el store de usuario existente
- Sigue los patrones de diseño establecidos

## API Endpoints (Futuro)

Cuando se implemente la API real, se esperan estos endpoints:

```
GET    /lms/courses          # Listar cursos
POST   /lms/courses          # Crear curso
PUT    /lms/courses/:id      # Actualizar curso
DELETE /lms/courses/:id      # Eliminar curso

GET    /lms/users            # Listar usuarios
POST   /lms/users            # Crear usuario
PUT    /lms/users/:id        # Actualizar usuario
DELETE /lms/users/:id        # Eliminar usuario

GET    /lms/analytics        # Obtener analíticas
GET    /lms/analytics/:timeRange  # Analíticas por período
```

## Desarrollo

Para agregar nuevas funcionalidades:

1. Crear el componente en la carpeta correspondiente
2. Agregar la ruta en `LmsRoutes.tsx`
3. Implementar la lógica con React Query
4. Usar axiosPrivate para las llamadas a la API
5. Seguir los patrones de Material UI v5

## Notas

- Actualmente usa mock data para demostración
- Los componentes están preparados para integrar con API real
- El diseño es responsive y accesible
- Se mantiene consistencia con el resto del proyecto
