# Guía de Migración: Sidebar Legacy → ModernSidebar

Esta guía te ayudará a migrar del sidebar existente al nuevo `ModernSidebar` de manera gradual y sin interrupciones.

## 📋 Checklist de Migración

- [ ] **Paso 1**: Backup del código actual
- [ ] **Paso 2**: Instalar dependencias necesarias
- [ ] **Paso 3**: Configurar el nuevo sidebar
- [ ] **Paso 4**: Migrar la configuración de elementos
- [ ] **Paso 5**: Actualizar los componentes que usan el sidebar
- [ ] **Paso 6**: Migrar el estado y la lógica
- [ ] **Paso 7**: Testing y validación
- [ ] **Paso 8**: Cleanup del código legacy

## 🔄 Migración Paso a Paso

### Paso 1: Backup del Código Actual

Antes de comenzar, haz un backup de los archivos actuales:

```bash
# Crear backup del sidebar actual
cp -r src/Components/Sidebar src/Components/Sidebar.backup
cp -r src/Components/SidebarItem src/Components/SidebarItem.backup
```

### Paso 2: Verificar Dependencias

Asegúrate de que tienes todas las dependencias necesarias:

```json
{
  "dependencies": {
    "@mui/material": "^5.x.x",
    "@mui/icons-material": "^5.x.x",
    "@nanostores/react": "^0.x.x",
    "react-router-dom": "^6.x.x"
  }
}
```

### Paso 3: Configuración Inicial

#### 3.1 Importar el Nuevo Sidebar

```tsx
// En tu componente principal (App.tsx o Layout.tsx)
import { ModernSidebar } from '../Components/ModernSidebar'
```

#### 3.2 Reemplazar el Sidebar Existente

```tsx
// ANTES
import Sidebar from '../Components/Sidebar'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div>
      <Sidebar 
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user.role}
      />
      {/* resto del contenido */}
    </div>
  )
}

// DESPUÉS
import { ModernSidebar } from '../Components/ModernSidebar'

function Layout() {
  return (
    <div style={{ display: 'flex' }}>
      <ModernSidebar 
        onItemClick={(item) => {
          console.log('Navegando a:', item.to)
          // Lógica adicional si es necesaria
        }}
      />
      {/* resto del contenido */}
    </div>
  )
}
```

### Paso 4: Migrar Configuración de Elementos

#### 4.1 Mapear Elementos Existentes

Si tienes elementos personalizados, agrégalos a `config/sidebarItems.ts`:

```tsx
// Ejemplo de migración de elementos
const legacyItems = [
  { name: 'Mi Módulo', path: '/mi-modulo', role: 'admin' }
]

// Convertir a formato ModernSidebar
const newItems: ModernSidebarItem[] = [
  {
    id: 'mi-modulo',
    type: 'link',
    label: 'Mi Módulo',
    icon: sidebarIcons.dashboard, // Seleccionar icono apropiado
    to: '/mi-modulo',
    roles: ['admin'],
    moduleName: 'mi-modulo'
  }
]
```

#### 4.2 Migrar Iconos Personalizados

Si tienes iconos personalizados, agrégalos a `config/icons.ts`:

```tsx
import { MyCustomIcon } from '@mui/icons-material'

export const sidebarIcons = {
  // ... iconos existentes
  myCustomIcon: MyCustomIcon
}
```

### Paso 5: Actualizar Componentes que Usan el Sidebar

#### 5.1 Remover Estado Manual del Sidebar

```tsx
// ANTES - Remover este código
const [sidebarOpen, setSidebarOpen] = useState(false)
const [sidebarMinimized, setSidebarMinimized] = useState(false)

// DESPUÉS - El ModernSidebar maneja su propio estado
// No necesitas estado manual
```

#### 5.2 Actualizar Controles del AppBar

```tsx
// ANTES
import { IconButton } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

function AppBar() {
  return (
    <IconButton onClick={() => setSidebarOpen(true)}>
      <MenuIcon />
    </IconButton>
  )
}

// DESPUÉS
import { useSidebarState } from '../Components/ModernSidebar'

function AppBar() {
  const { actions } = useSidebarState()
  
  return (
    <IconButton onClick={actions.toggleMobile}>
      <MenuIcon />
    </IconButton>
  )
}
```

### Paso 6: Migrar Lógica de Permisos

#### 6.1 Verificar Configuración de Permisos

El nuevo sidebar usa la misma lógica de permisos. Verifica que `userStore` tenga la estructura correcta:

```tsx
// Estructura esperada del userStore
const userStore = {
  rol: 'admin', // o 'biomedico', 'customer'
  name: 'Usuario',
  email: 'usuario@ejemplo.com',
  customer: {
    name: 'Empresa',
    modules: [
      { moduleId: 1, isActive: true },
      { moduleId: 2, isActive: false }
    ]
  }
}
```

#### 6.2 Personalizar Permisos (si es necesario)

Si tienes lógica de permisos personalizada, modifica `hooks/useSidebarPermissions.ts`:

```tsx
const canViewModule = (moduleName: string, userRoles: string[]): boolean => {
  // Tu lógica personalizada aquí
  const customPermissions: Record<string, string[]> = {
    'mi-modulo-personalizado': ['admin', 'custom-role']
  }
  
  // Combinar con permisos existentes
  const rolePermissions = {
    ...defaultPermissions,
    ...customPermissions
  }
  
  // Resto de la lógica...
}
```

### Paso 7: Testing y Validación

#### 7.1 Tests Funcionales

Verifica que todas las funcionalidades trabajen correctamente:

```bash
# Ejecutar tests del ModernSidebar
npm test -- --testPathPattern=ModernSidebar

# Tests de integración
npm test -- --testPathPattern=integration
```

#### 7.2 Checklist de Validación Manual

- [ ] El sidebar se muestra correctamente
- [ ] La navegación funciona
- [ ] Los permisos se respetan
- [ ] El modo móvil funciona
- [ ] La búsqueda funciona
- [ ] Los favoritos se pueden agregar/quitar
- [ ] Las notificaciones se muestran
- [ ] El tema se puede cambiar
- [ ] El estado se persiste entre sesiones

### Paso 8: Cleanup del Código Legacy

Una vez que todo funcione correctamente:

#### 8.1 Remover Archivos Legacy

```bash
# Remover componentes antiguos
rm -rf src/Components/Sidebar.backup
rm -rf src/Components/SidebarItem.backup

# Remover imports no utilizados
# Buscar y remover referencias al sidebar antiguo en el código
```

#### 8.2 Actualizar Imports

Busca y reemplaza todas las referencias al sidebar antiguo:

```bash
# Buscar referencias al sidebar antiguo
grep -r "import.*Sidebar" src/
grep -r "from.*Sidebar" src/

# Reemplazar con el nuevo import
# import { ModernSidebar } from '../Components/ModernSidebar'
```

## 🚨 Problemas Comunes y Soluciones

### Problema: El sidebar no aparece

**Solución**: Verifica que esté envuelto en los providers necesarios:

```tsx
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

<BrowserRouter>
  <ThemeProvider theme={theme}>
    <ModernSidebar />
  </ThemeProvider>
</BrowserRouter>
```

### Problema: Los permisos no funcionan

**Solución**: Verifica la estructura del `userStore`:

```tsx
// Estructura correcta
const user = {
  rol: 'admin', // Debe ser exactamente 'admin', 'biomedico', o 'customer'
  customer: {
    modules: [
      { moduleId: 1, isActive: true } // moduleId debe coincidir con el mapeo
    ]
  }
}
```

### Problema: La navegación no funciona

**Solución**: Asegúrate de que las rutas en `sidebarItems.ts` coincidan con tus rutas de React Router:

```tsx
// En sidebarItems.ts
{
  to: '/dashboard' // Debe coincidir exactamente con la ruta en tu router
}

// En tu router
<Route path="/dashboard" element={<Dashboard />} />
```

### Problema: Los iconos no se muestran

**Solución**: Verifica que los iconos estén importados correctamente en `config/icons.ts`:

```tsx
import { Dashboard as DashboardIcon } from '@mui/icons-material'

export const sidebarIcons = {
  dashboard: DashboardIcon // Debe estar exportado aquí
}
```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa la documentación completa en `README.md`
2. Ejecuta los tests para identificar problemas
3. Verifica los ejemplos en la carpeta `examples/`
4. Consulta los logs de la consola del navegador

## 🎯 Beneficios Post-Migración

Después de completar la migración, tendrás:

- ✅ **Mejor UX**: Diseño moderno y responsivo
- ✅ **Más funcionalidades**: Búsqueda, favoritos, recientes
- ✅ **Mejor rendimiento**: Optimizado con React hooks
- ✅ **Mantenibilidad**: Código más limpio y modular
- ✅ **Accesibilidad**: Cumple estándares WCAG
- ✅ **Testing**: Suite completa de tests
- ✅ **Documentación**: Documentación completa y ejemplos

¡Felicidades por completar la migración! 🎉