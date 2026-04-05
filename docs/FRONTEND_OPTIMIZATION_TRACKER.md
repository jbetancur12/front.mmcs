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

### Carga diferida de exports XLSX
- Se reemplazaron imports estáticos de `xlsx` por imports dinámicos en flujos de exportación y lectura puntual.
- Esto evita que varias vistas administrativas y analíticas arrastren `excel-utils` desde el arranque.

Componentes tocados:
- `src/pages/Customer.tsx`
- `src/Components/ModernCustomerProfile.tsx`
- `src/pages/maintenance/MaintenanceAnalytics.tsx`
- `src/Components/Dashboard/DashboardCustomer.tsx`
- `src/Components/SelectedHq.tsx`
- `src/pages/Zip.tsx`
- `src/Components/Excel.tsx`

Probar:
- `/customers/:id`
- perfil moderno de cliente
- `/maintenance/analytics`
- dashboard de cliente con certificados por vencer
- flujo de sede seleccionada
- `/zip`

Validar:
- Botones de exportar Excel
- Lectura de archivos Excel dentro de ZIP
- Descarga con nombre correcto
- Sin errores de import dinámico en consola

### Vista previa PDF bajo demanda
- Las pantallas de cotización y hoja de vida de datasheet ya no montan el stack de `@react-pdf/renderer` apenas entra la ruta.
- Ahora muestran una acción explícita para cargar la vista previa, mejorando la entrada inicial de esas pantallas.

Componentes tocados:
- `src/pages/Quote.tsx`
- `src/Components/DataSheet/DataSheetDetails.tsx`

Probar:
- `/quotes/:id`
- `/datasheets/:id`

Validar:
- La pantalla cargue sin montar el visor de inmediato
- El botón `Ver PDF` cargue la vista previa correctamente
- El botón `Ocultar vista previa` vuelva al estado liviano en datasheets
- Sin errores de chunks o fallback en consola

### Reducción de trabajo innecesario en `excel-populate`
- `Repository` ya no rehidrata archivos de Excel con `xlsx-populate` para abrirlos o descargarlos si basta con el blob original.
- `Zip` ahora carga `AnalyzeExcelComponent` con `lazy`, así que el flujo pesado de análisis no entra hasta que el usuario realmente lo usa.

Componentes tocados:
- `src/Components/Repository.tsx`
- `src/pages/Zip.tsx`

Probar:
- `/repository`
- `/zip`

Validar:
- Descargar archivo desde repositorio
- Abrir archivo del repositorio en nueva pestaña
- Entrar a `/zip` sin iniciar análisis
- Cargar el analizador al procesar archivo o usar modo `file`

### Simplificación de `subir-excel`
- Se conservó `calibraciones/subir-excel` como flujo real de negocio.
- Se eliminó el acceso duplicado `/zip` desde rutas generales.
- La pantalla `Zip` quedó reducida al modo `Archivo`, que es el único flujo activo; el modo `Directorio` estaba desactivado y solo aportaba código muerto.

Componentes tocados:
- `src/routes/OtherRoutes.tsx`
- `src/pages/Zip.tsx`

Probar:
- `/calibraciones/subir-excel`
- menú lateral en `Calibraciones`

Validar:
- carga de Excel y PDF asociado
- apertura del modal de contraseñas
- que `/zip` ya no sea una entrada pública necesaria

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

### Estado observado después de diferir `xlsx`
- `index`: ~382.69 kB
- `excel-utils`: ~429.60 kB
- `Customer`: ~13.08 kB
- `ModernCustomer`: ~29.71 kB
- `DashboardCustomer`: ~19.10 kB
- `MaintenanceAnalytics`: ~12.26 kB
- `Zip`: ~18.46 kB

Conclusión:
- `excel-utils` no bajó de forma material como chunk global.
- Sí mejoró el aislamiento: las vistas cliente, mantenimiento y ZIP ya no cargan `xlsx` en su chunk base.

### Estado observado después de diferir la vista previa PDF
- `pdf-renderer`: ~1,404.93 kB
- `Quote`: la ruta ya no monta el visor PDF apenas entra
- `DataSheetDetails`: la ruta ya no monta el visor PDF apenas entra

Conclusión:
- El chunk `pdf-renderer` mantiene su peso global.
- Sí mejora el comportamiento de entrada: cotizaciones y datasheets ahora pagan ese costo solo cuando el usuario pide la vista previa.

### Vista previa PDF bajo demanda en flota
- La hoja de vida de vehículos ya no importa el renderer PDF pesado en el chunk base de la ruta.
- `VehicleDataSheetPDF` quedó como contenedor liviano y `VehicleDataSheetPreview` se carga con `lazy` solo cuando el usuario pulsa `Ver PDF`.

Componentes tocados:
- `src/Components/Fleet/VehicleDataSheetPDF.tsx`
- `src/Components/Fleet/VehicleDataSheetPreview.tsx`

Probar:
- `/fleet/:id/data-sheet`

Validar:
- La ruta abra rápido sin montar el visor de inmediato
- El botón `Ver PDF` cargue correctamente la hoja de vida
- El botón `Ocultar vista previa` vuelva al estado liviano
- La navegación de regreso a documentos siga funcionando

### Estado observado tras aislar mejor `excel-populate`
- `index`: ~382.36 kB
- `excel-populate`: ~1,004.30 kB
- `Repository`: ~4.66 kB
- `Zip`: ~6.44 kB
- `AnalyzeExcelComponent`: ~12.87 kB

Conclusión:
- `excel-populate` mantiene su peso global porque sigue siendo necesario en los flujos pesados.
- Sí mejoró el aislamiento: `Repository` dejó de depender de `xlsx-populate` para abrir/descargar y `Zip` ya no carga el analizador hasta que realmente se usa.

### Estado observado tras simplificar `subir-excel`
- `index`: ~382.12 kB
- `Zip`: ~4.06 kB
- `AnalyzeExcelComponent`: ~12.87 kB
- `excel-populate`: ~1,004.23 kB

Conclusión:
- El flujo útil `calibraciones/subir-excel` se mantiene.
- La pantalla quedó alineada con el uso real: solo modo `Archivo`.
- Se eliminó el acceso duplicado `/zip` y el chunk base de `Zip` bajó aún más.

### Estado observado tras diferir la vista previa PDF en flota
- `index`: ~382.06 kB
- `VehicleDataSheetPDF`: ~2.14 kB
- `VehicleDataSheetPreview`: ~10.71 kB
- `pdf-renderer`: ~1,404.96 kB

Conclusión:
- El chunk `pdf-renderer` se mantiene globalmente pesado.
- La ruta de flota ya no paga ese costo al entrar: primero carga un contenedor muy liviano y solo trae el preview pesado bajo demanda.
- Flota queda alineado con la misma estrategia ya aplicada en cotizaciones y datasheets.

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
- volver desde la hoja de vida de flota a documentos
- `/maintenance/analytics`
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
- `5673769` `docs: add frontend optimization tracker`
- `c3d01e8` `refactor: simplify excel upload route`
