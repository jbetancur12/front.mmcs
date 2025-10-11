# Guía de Integración - MaintenanceTVDisplayModern

Esta guía te ayudará a integrar el nuevo componente moderno de TV Display en tu aplicación.

## 🚀 Integración Rápida

### 1. Importar el Componente

```tsx
// Opción 1: Importación directa
import MaintenanceTVDisplayModern from './Components/Maintenance/TVDisplayModern'

// Opción 2: Usando el archivo de exportación
import { MaintenanceTVDisplayModern } from './Components/Maintenance/TVDisplayModern/export'
```

### 2. Uso Básico

```tsx
function App() {
  return (
    <div>
      <MaintenanceTVDisplayModern />
    </div>
  )
}
```

### 3. Configuración de Rutas (React Router)

```tsx
import { Routes, Route } from 'react-router-dom'
import MaintenanceTVDisplayModern from './Components/Maintenance/TVDisplayModern'

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta para el nuevo TV Display moderno */}
      <Route 
        path="/maintenance/tv-display-modern" 
        element={<MaintenanceTVDisplayModern />} 
      />
      
      {/* Mantener la ruta anterior para compatibilidad */}
      <Route 
        path="/maintenance/tv-display" 
        element={<MaintenanceTVDisplayPublic />} 
      />
    </Routes>
  )
}
```

## 🎨 Personalización

### Colores de la Empresa

```tsx
import { createCustomConfig } from './Components/Maintenance/TVDisplayModern/config'

const customConfig = createCustomConfig({
  colors: {
    primary: '#your-brand-color', // Cambiar por el color de tu empresa
    background: '#ffffff',
    textPrimary: '#212529'
  },
  company: {
    name: 'Tu Empresa',
    displayName: 'Centro de Mantenimiento'
  }
})
```

### Configuración para Diferentes Pantallas

```tsx
const tvConfig = createCustomConfig({
  tv: {
    containerMaxWidth: false, // Usar ancho completo
    metricsColumns: 5,        // 5 columnas de métricas
    regularTicketsColumns: 4   // 4 columnas de tickets
  }
})
```

## 🔄 Migración desde el Componente Anterior

### Diferencias Principales

| Aspecto | Componente Anterior | Componente Moderno |
|---------|-------------------|-------------------|
| **Tema** | Oscuro (#1a1a1a) | Blanco (#ffffff) |
| **Color Principal** | #2FB158 | #7bff7f (configurable) |
| **Arquitectura** | Monolítico | Modular |
| **Tamaño del Archivo** | ~800 líneas | ~200 líneas (principal) |
| **Mantenibilidad** | Difícil | Fácil |
| **Personalización** | Limitada | Altamente configurable |

### Pasos de Migración

1. **Backup del Componente Actual**
   ```bash
   # Crear backup del componente actual
   cp MaintenanceTVDisplayPublic.tsx MaintenanceTVDisplayPublic.backup.tsx
   ```

2. **Probar el Nuevo Componente**
   - Usar una ruta diferente inicialmente
   - Verificar que todos los datos se muestren correctamente
   - Probar en diferentes resoluciones de pantalla

3. **Actualizar Referencias**
   ```tsx
   // Cambiar todas las importaciones
   // De:
   import MaintenanceTVDisplayPublic from './MaintenanceTVDisplayPublic'
   
   // A:
   import MaintenanceTVDisplayModern from './TVDisplayModern'
   ```

4. **Verificar Funcionalidad**
   - ✅ WebSocket en tiempo real
   - ✅ Paginación automática
   - ✅ Organización por prioridad
   - ✅ Métricas en tiempo real
   - ✅ Estados de error y carga

## 🧪 Testing

### Verificaciones Básicas

```tsx
// Test de renderizado básico
import { render } from '@testing-library/react'
import MaintenanceTVDisplayModern from './TVDisplayModern'

test('renders without crashing', () => {
  render(<MaintenanceTVDisplayModern />)
})
```

### Verificaciones de Funcionalidad

1. **Conexión WebSocket**: Verificar que se conecte correctamente
2. **Datos en Tiempo Real**: Confirmar que los datos se actualicen
3. **Responsive Design**: Probar en diferentes tamaños de pantalla
4. **Estados de Error**: Simular errores de conexión
5. **Performance**: Verificar que no haya memory leaks

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error de Importación de Componentes
```
Error: Cannot resolve './MaintenancePriorityBadge'
```
**Solución**: Verificar que los componentes de badges existan en la ruta correcta.

#### 2. Hooks No Encontrados
```
Error: Cannot resolve '../../hooks/useMaintenancePublic'
```
**Solución**: Verificar que los hooks estén en la ruta correcta relativa al nuevo componente.

#### 3. Tipos TypeScript
```
Error: Property 'ticketCode' does not exist on type...
```
**Solución**: Verificar que los tipos de datos coincidan con la API.

### Logs de Debug

```tsx
// Agregar logs para debug
console.log('TV Display Data:', tvDisplayData)
console.log('Connection Status:', connectionStatus)
console.log('Organized Tickets:', organizedTickets)
```

## 📱 Configuración para Diferentes Dispositivos

### TV 1920x1080 (Recomendado)
```tsx
const tvConfig = {
  metricsColumns: 5,
  criticalTicketsColumns: 2,
  regularTicketsColumns: 4
}
```

### TV 4K (3840x2160)
```tsx
const tv4kConfig = {
  metricsColumns: 6,
  criticalTicketsColumns: 3,
  regularTicketsColumns: 6
}
```

### Pantalla Más Pequeña (1366x768)
```tsx
const smallScreenConfig = {
  metricsColumns: 4,
  criticalTicketsColumns: 2,
  regularTicketsColumns: 3
}
```

## 🚀 Deployment

### Variables de Entorno

```env
# Configuración del TV Display
REACT_APP_TV_DISPLAY_PRIMARY_COLOR=#7bff7f
REACT_APP_TV_DISPLAY_COMPANY_NAME=MetroMedics
REACT_APP_TV_DISPLAY_SLIDE_INTERVAL=30
```

### Build para Producción

```bash
# Build optimizado
npm run build

# Verificar tamaño del bundle
npm run analyze
```

## 📞 Soporte

Si encuentras algún problema durante la integración:

1. **Revisar la documentación** en `README.md`
2. **Verificar los tipos** en `types/index.ts`
3. **Consultar ejemplos** en los componentes individuales
4. **Revisar la configuración** en `config.ts`

## ✅ Checklist de Integración

- [ ] Componente importado correctamente
- [ ] Rutas configuradas
- [ ] WebSocket funcionando
- [ ] Datos mostrándose correctamente
- [ ] Responsive design verificado
- [ ] Estados de error probados
- [ ] Performance optimizada
- [ ] Colores de empresa aplicados
- [ ] Testing completado
- [ ] Documentación actualizada

¡Listo! Tu nuevo TV Display moderno está integrado y funcionando. 🎉