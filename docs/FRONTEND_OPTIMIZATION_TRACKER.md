# Frontend Optimization Tracker

## Objetivo
Dejar trazabilidad de las optimizaciones de frontend, qué impacto tuvieron y qué rutas o componentes conviene probar manualmente después de cada cambio.

## Estado actual
- Fecha base: 2026-04-04
- Build de verificación: `npm run build`
- Estado: build pasando

## Cambios aplicados

### Alertas de datasheets
- Backend dedicado para alertas y payload más liviano.
- Pantalla de alertas usando endpoint específico.
- Contadores corregidos y permisos visibles alineados.

Probar:
- `/datasheets/alerts`
- Header con campana de alertas
- Sidebar para `admin` y `metrologist`

Validar:
- Conteo de alertas
- Filtro de búsqueda
- Refresh manual
- Navegación al detalle del equipo

### Split de vendors pesados
- Se agregaron `manualChunks` en Vite para separar React, MUI, charts, Excel, PDF y Monaco.

Probar:
- Navegación inicial luego de login
- Dashboard
- Cambio entre módulos grandes

Validar:
- La carga inicial no se rompa
- No haya errores de import dinámico en consola

### Limpieza de MinIO en frontend
- Se reemplazó el SDK de `minio` en lectores directos por URLs de objeto y `fetch`.
- Se creó `src/utils/minio.ts` para centralizar URL y descarga de blobs.

Componentes tocados:
- `src/Components/PDFViewer.tsx`
- `src/Components/IMGViewer.tsx`
- `src/Components/Fleet/DocumentViewPDF.tsx`
- `src/Components/DataSheet/DataSheetPDF.tsx`
- `src/Components/Fleet/VehicleDataSheetPDF.tsx`
- `src/pages/Profiles.tsx`
- `src/Components/Repository.tsx`
- `src/Components/ExcelManipulation/ExcelManipulation.tsx`

Probar:
- `/profiles`
- `/profiles/:id`
- `/fleet/:id/documents/:docId`
- repositorio de archivos
- generación de Excel

Validar:
- Imágenes de perfil
- PDF e imágenes almacenadas en MinIO
- Descarga de plantillas
- Apertura de archivos en nueva pestaña

### Visor PDF liviano
- Se reemplazó el visor genérico basado en `react-pdf` por `<object>` nativo.
- Se eliminó `react-pdf` de dependencias.

Rutas/componentes a probar:
- `/profiles/:id`
- `/traceability`
- certificados en detalle de equipo
- vistas que usan `src/Components/PDFViewer.tsx`

Validar:
- Vista previa de PDF
- Botón abrir
- Botón descargar
- Fallback en móvil o navegador sin visor embebido

### Carga diferida de vistas PDF
- `Quote.tsx` ahora carga `QuotePDFGenerator` con `lazy`.
- `DataSheetDetails.tsx` ahora carga `DataSheetPDF` con `lazy`.

Probar:
- `/quotes/:id`
- `/datasheets/:id`

Validar:
- Loader mientras se monta la vista
- PDF renderizado correcto
- Sin errores de chunks faltantes

## Métricas observadas

### Antes de esta ronda
- `index`: ~1.18 MB
- `minio`: chunk pesado
- `react-pdf-viewer`: presente y muy pesado

### Estado más reciente observado
- `index`: ~382.92 kB
- `excel-utils`: ~424.80 kB
- `excel-populate`: ~1,004.30 kB
- `mui`: ~1,013.95 kB
- `pdf-renderer`: ~1,404.93 kB
- `react-pdf-viewer`: eliminado
- `minio`: residual

## Pendientes de mayor impacto

### 1. `pdf-renderer`
Sigue siendo el chunk más pesado.

Posibles caminos:
- Mover generación PDF al backend para documentos grandes.
- Ofrecer descarga directa en vez de render embebido donde no sea imprescindible.
- Separar vistas PDF por dominio si terminan en el mismo chunk por compartir dependencias.

Rutas a revisar:
- `/datasheets/:id`
- `/fleet/:id/data-sheet`
- `/quotes/:id`

### 2. `excel-populate`
Todavía es costoso, aunque ya carga bajo demanda.

Posibles caminos:
- Mover generación pesada de Excel a backend.
- Evaluar si algunas pantallas pueden usar solo `xlsx`.

Rutas a revisar:
- módulo de repositorio
- módulo de manipulación/generación Excel
- carga de análisis de Excel

### 3. `mui`
Peso alto pero transversal.

Posibles caminos:
- Revisar imports de `@mui/icons-material`
- Identificar componentes de baja frecuencia que ya puedan entrar por `lazy`

## Checklist de prueba manual rápida
- Login y navegación inicial
- `/datasheets/alerts`
- `/datasheets/:id`
- `/profiles`
- `/profiles/:id`
- `/traceability`
- `/quotes/:id`
- `/fleet/:id/documents/:docId`
- `/fleet/:id/data-sheet`
- repositorio de archivos
- generación de Excel

## Checklist de validación técnica
- Ejecutar `npm run build`
- Revisar que no aparezcan errores en consola por imports dinámicos
- Confirmar que los PDF se vean o descarguen
- Confirmar que MinIO responda para imágenes y blobs
- Confirmar que downloads sigan funcionando

## Últimos commits relacionados
- `8dea062` `refactor: remove minio sdk from frontend readers`
- `65f491a` `build: split pdf viewer bundles more cleanly`
- `44ab9ed` `build: defer excel processing libraries`
- `b5beac2` `refactor: replace heavy pdf preview runtime`
- `9afd09e` `chore: remove unused react-pdf dependency`
- `db7c1be` `perf: lazy load pdf document views`

