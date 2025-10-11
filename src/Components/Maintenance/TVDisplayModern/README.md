# MaintenanceTVDisplayModern

Componente moderno para mostrar tickets de mantenimiento en pantallas de TV. Diseñado con arquitectura modular para mejor mantenibilidad y escalabilidad.

## Arquitectura de Componentes

```
TVDisplayModern/
├── index.tsx                    # Componente principal
├── components/                  # Componentes modulares
│   ├── ModernHeader.tsx         # Header con branding y reloj
│   ├── MetricsDashboard.tsx     # Dashboard de métricas
│   ├── CriticalTicketsSection.tsx # Sección de tickets críticos
│   ├── RegularTicketsGrid.tsx   # Grid de tickets regulares
│   └── PaginationProgress.tsx   # Indicador de progreso
├── hooks/                       # Hooks personalizados
│   └── useModernStyles.tsx      # Sistema de estilos compartido
├── types/                       # Interfaces TypeScript
│   └── index.ts                 # Definiciones de tipos
└── README.md                    # Documentación
```

## Características Principales

### 🎨 Diseño Moderno
- **Fondo blanco limpio** (#ffffff) para mejor legibilidad
- **Color primario de la empresa** (#7bff7f) como acento principal
- **Tipografía de alto contraste** para visualización a distancia
- **Sombras sutiles** y bordes limpios sin saturación excesiva

### 🏗️ Arquitectura Modular
- **Componentes separados** para cada sección funcional
- **Hooks compartidos** para lógica de estilos reutilizable
- **Tipos TypeScript** centralizados para mejor mantenimiento
- **Fácil escalabilidad** y modificación de componentes individuales

### 📱 Responsive y Optimizado
- **Optimizado para pantallas TV** (1920x1080+)
- **Grid responsive** que se adapta automáticamente
- **Paginación inteligente** para grandes conjuntos de datos
- **Actualizaciones en tiempo real** vía WebSocket

## Componentes

### ModernHeader
Header limpio con branding de MetroMedics, indicador de conexión y reloj digital.

**Props:**
- `currentTime`: Fecha y hora actual
- `connectionStatus`: Estado de la conexión WebSocket
- `companyName`: Nombre de la empresa (opcional)
- `showLogo`: Mostrar/ocultar logo (opcional)

### MetricsDashboard
Dashboard de métricas con cards modernas y iconos semánticos.

**Props:**
- `metrics`: Objeto con todas las métricas del sistema
- `colors`: Paleta de colores moderna

### CriticalTicketsSection
Sección especial para tickets críticos con diseño de alta visibilidad.

**Props:**
- `urgentTickets`: Array de tickets urgentes
- `colors`: Paleta de colores
- `getElapsedTime`: Función para calcular tiempo transcurrido

### RegularTicketsGrid
Grid responsive para mostrar tickets regulares con paginación.

**Props:**
- `tickets`: Array de tickets a mostrar
- `gridCalculation`: Configuración del grid responsive
- `colors`: Paleta de colores
- `getElapsedTime`: Función para calcular tiempo transcurrido

### PaginationProgress
Indicador de progreso para la paginación de tickets.

**Props:**
- `slideIndex`: Índice de la página actual
- `totalTickets`: Total de tickets
- `ticketsPerPage`: Tickets por página
- `colors`: Paleta de colores

## Hooks

### useModernStyles
Hook que proporciona el sistema de estilos moderno compartido.

**Retorna:**
- `modernColors`: Paleta completa de colores
- `cardStyles`: Estilos base para cards
- `iconContainerStyles`: Estilos para contenedores de iconos

## Uso

```tsx
import MaintenanceTVDisplayModern from './Components/Maintenance/TVDisplayModern'

function App() {
  return <MaintenanceTVDisplayModern />
}
```

## Personalización

### Colores
Los colores se pueden personalizar modificando el hook `useModernStyles`:

```tsx
const modernColors = {
  primary: '#7bff7f',        // Color primario de la empresa
  background: '#ffffff',     // Fondo principal
  textPrimary: '#212529',    // Texto principal
  // ... más colores
}
```

### Componentes
Cada componente es independiente y puede ser modificado sin afectar otros:

```tsx
// Ejemplo: Personalizar el header
<ModernHeader
  currentTime={currentTime}
  connectionStatus={connectionStatus}
  companyName="Mi Empresa"
  showLogo={false}
/>
```

## Funcionalidades Preservadas

- ✅ **WebSocket en tiempo real** para actualizaciones automáticas
- ✅ **Organización por prioridad** de tickets
- ✅ **Paginación automática** para conjuntos grandes de datos
- ✅ **Cálculo de métricas** en tiempo real
- ✅ **Estados de error y carga** con diseño moderno
- ✅ **Grid responsive** que se adapta al tamaño de pantalla

## Beneficios de la Arquitectura Modular

1. **Mantenibilidad**: Cada componente tiene una responsabilidad específica
2. **Reutilización**: Los componentes pueden ser reutilizados en otros contextos
3. **Testing**: Más fácil hacer pruebas unitarias de componentes individuales
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar el código existente
5. **Colaboración**: Diferentes desarrolladores pueden trabajar en componentes separados
6. **Performance**: Posibilidad de optimizar componentes individuales con React.memo

## Próximos Pasos

- [ ] Agregar tests unitarios para cada componente
- [ ] Implementar Storybook para documentación visual
- [ ] Agregar soporte para temas personalizables
- [ ] Optimizar performance con React.memo y useMemo
- [ ] Agregar animaciones de transición más suaves