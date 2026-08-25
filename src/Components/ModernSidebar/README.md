# ModernSidebar

Un componente de sidebar moderno y completo para la aplicación MetroMedics, construido con Material-UI y TypeScript.

## 🚀 Características

- **Diseño Responsivo**: Adaptable a dispositivos móviles y desktop
- **Modo Minimizado**: Sidebar colapsable con tooltips informativos
- **Búsqueda Inteligente**: Búsqueda en tiempo real con resaltado de coincidencias
- **Sistema de Favoritos**: Gestión de elementos favoritos con persistencia
- **Elementos Recientes**: Seguimiento automático de elementos visitados
- **Notificaciones**: Sistema de badges para notificaciones
- **Temas**: Soporte para tema claro y oscuro
- **Permisos**: Integración completa con el sistema de permisos existente
- **Persistencia**: Estado guardado en localStorage
- **Accesibilidad**: Cumple con estándares WCAG

## 📦 Instalación

El componente ya está integrado en el proyecto. Para usarlo:

```tsx
import { ModernSidebar } from '../Components/ModernSidebar'

function App() {
  return (
    <div>
      <ModernSidebar onItemClick={(item) => console.log('Clicked:', item)} />
      {/* Resto de tu aplicación */}
    </div>
  )
}
```

## 🎯 Props

### ModernSidebar

| Prop | Tipo | Descripción | Requerido |
|------|------|-------------|-----------|
| `onItemClick` | `(item: ModernSidebarItem) => void` | Callback cuando se hace click en un elemento | No |

## 🔧 Hooks Disponibles

### useSidebarState

Maneja el estado completo del sidebar con persistencia.

```tsx
import { useSidebarState } from '../Components/ModernSidebar'

function MyComponent() {
  const { state, actions } = useSidebarState()
  
  return (
    <button onClick={actions.toggleMinimized}>
      {state.isMinimized ? 'Expandir' : 'Minimizar'}
    </button>
  )
}
```

**Estado disponible:**
- `isMinimized`: boolean - Si el sidebar está minimizado
- `isMobileOpen`: boolean - Si el sidebar móvil está abierto
- `searchTerm`: string - Término de búsqueda actual
- `favorites`: string[] - IDs de elementos favoritos
- `recentItems`: string[] - IDs de elementos recientes
- `theme`: 'light' | 'dark' - Tema actual
- `notifications`: Record<string, number> - Notificaciones por módulo

**Acciones disponibles:**
- `toggleMinimized()` - Alternar estado minimizado
- `toggleMobile()` - Alternar sidebar móvil
- `closeMobile()` - Cerrar sidebar móvil
- `setSearchTerm(term: string)` - Establecer término de búsqueda
- `toggleTheme()` - Alternar tema
- `addToFavorites(itemId: string)` - Agregar a favoritos
- `removeFromFavorites(itemId: string)` - Quitar de favoritos
- `addToRecent(itemId: string)` - Agregar a recientes
- `updateNotifications(notifications: Record<string, number>)` - Actualizar notificaciones
- `clearNotification(moduleId: string)` - Limpiar notificación específica

### useSidebarPermissions

Maneja los permisos del sidebar basado en el usuario actual.

```tsx
import { useSidebarPermissions } from '../Components/ModernSidebar'

function MyComponent() {
  const permissions = useSidebarPermissions()
  
  const canView = permissions.canViewModule('dashboard', ['admin'])
  const hasAccess = permissions.hasModuleAccess('traceability', customerModules)
  
  return <div>{canView ? 'Puede ver' : 'No puede ver'}</div>
}
```

### useSidebarSearch

Proporciona funcionalidad de búsqueda avanzada.

```tsx
import { useSidebarSearch } from '../Components/ModernSidebar'

function SearchComponent({ items }) {
  const [searchTerm, setSearchTerm] = useState('')
  const { searchResults, filteredItems, hasResults } = useSidebarSearch(items, searchTerm)
  
  return (
    <div>
      <input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      {hasResults && (
        <div>
          {searchResults.map(result => (
            <div key={result.item.id}>{result.item.label}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 🎨 Personalización

### Agregar Nuevos Elementos

Para agregar nuevos elementos al sidebar, edita `config/sidebarItems.ts`:

```tsx
export const sidebarItems: ModernSidebarItem[] = [
  // ... elementos existentes
  {
    id: 'mi-nuevo-modulo',
    type: 'link',
    label: 'Mi Nuevo Módulo',
    icon: sidebarIcons.dashboard, // Usa un icono existente o agrega uno nuevo
    to: '/mi-nuevo-modulo',
    roles: ['admin', 'user'], // Roles que pueden ver este elemento
    moduleName: 'mi-nuevo-modulo'
  }
]
```

### Agregar Nuevos Iconos

Para agregar nuevos iconos, edita `config/icons.ts`:

```tsx
import { NewIcon } from '@mui/icons-material'

export const sidebarIcons = {
  // ... iconos existentes
  newIcon: NewIcon
}
```

### Personalizar Permisos

Los permisos se configuran en `hooks/useSidebarPermissions.ts`. Puedes modificar la lógica según tus necesidades:

```tsx
const canViewModule = (moduleName: string, userRoles: string[]): boolean => {
  const rolePermissions: Record<string, string[]> = {
    // ... permisos existentes
    'mi-nuevo-modulo': ['admin', 'user']
  }
  
  const allowedRoles = rolePermissions[moduleName]
  if (!allowedRoles) return false
  
  return userRoles.some(role => allowedRoles.includes(role))
}
```

## 🔄 Migración desde el Sidebar Anterior

### Paso 1: Reemplazar el Componente

```tsx
// Antes
import Sidebar from '../Components/Sidebar'

// Después
import { ModernSidebar } from '../Components/ModernSidebar'
```

### Paso 2: Actualizar Props

```tsx
// Antes
<Sidebar 
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  userRole={user.role}
/>

// Después
<ModernSidebar 
  onItemClick={(item) => {
    console.log('Navegando a:', item.to)
    // Lógica adicional si es necesaria
  }}
/>
```

### Paso 3: Remover Estado Manual

El nuevo sidebar maneja su propio estado, por lo que puedes remover:

```tsx
// Ya no necesitas esto
const [sidebarOpen, setSidebarOpen] = useState(false)
const [sidebarMinimized, setSidebarMinimized] = useState(false)
```

## 🧪 Testing

El componente incluye tests completos. Para ejecutarlos:

```bash
npm test -- --testPathPattern=ModernSidebar
```

### Tests Incluidos

- **useSidebarState.test.ts**: Tests para el hook de estado
- **useSidebarSearch.test.ts**: Tests para el hook de búsqueda
- **ModernSidebar.test.tsx**: Tests para el componente principal

## 📱 Responsive Design

El sidebar se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop (≥960px)**: Sidebar permanente con opción de minimizar
- **Tablet/Mobile (<960px)**: Sidebar tipo drawer que se superpone al contenido

## 🎯 Accesibilidad

El componente cumple con estándares de accesibilidad:

- **Navegación por teclado**: Soporte completo para Tab, Enter, Escape
- **Screen readers**: Labels ARIA apropiados
- **Contraste**: Colores que cumplen con WCAG AA
- **Focus management**: Indicadores visuales claros

## 🐛 Troubleshooting

### El sidebar no aparece

Verifica que el componente esté envuelto en los providers necesarios:

```tsx
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

<BrowserRouter>
  <ThemeProvider theme={theme}>
    <ModernSidebar />
  </ThemeProvider>
</BrowserRouter>
```

### Los permisos no funcionan

Asegúrate de que el `userStore` esté configurado correctamente:

```tsx
// Verifica que userStore tenga la estructura esperada
const user = {
  rol: 'admin', // o 'biomedico', 'customer'
  customer: {
    modules: [
      { moduleId: 1, isActive: true }
    ]
  }
}
```

### La búsqueda no encuentra elementos

Verifica que los elementos tengan las propiedades `label` y `moduleName` correctas en `sidebarItems.ts`.

## 🤝 Contribuir

Para contribuir al componente:

1. Crea una rama para tu feature
2. Implementa los cambios
3. Agrega tests si es necesario
4. Actualiza la documentación
5. Crea un pull request

## 📄 Licencia

Este componente es parte del proyecto MetroMedics y sigue la misma licencia del proyecto principal.