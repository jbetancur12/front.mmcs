# Código sin uso en `src/` (pendiente)

Última revisión: 2026-10-23. **Pendiente futuro**: revisar y borrar lo que sea seguro.

## Cómo se detectó

Se recorrió el grafo de importaciones de `src/` (imports estáticos y `import()` dinámicos, con los alias `src/`, `@utils/`, `@hooks/`, `@stores/`, `@services/` y `@config/`) partiendo de `src/main.tsx`. Hay **61 archivos** de `.ts`/`.tsx` que no se alcanzan desde ahí. Ya se borraron 8 del mismo tipo el 2026-10-23 (commit e6a67d5).

## Antes de borrar cualquiera

Que no se alcance desde `main.tsx` no prueba que sobre. Comprueba cada archivo:

- **Referencias fuera del grafo:** scripts (`scripts/`), `vite.config`, `package.json`, tests, `.md` y rutas escritas como texto. Ejemplo: `constants/version.ts` lo pueden leer los scripts de versión (ver `VERSIONING.md`); `App.tsx` es la plantilla de Vite sin uso.
- **Barriles y tipos:** `types/index.ts`, `Components/Templates/index.ts` y similares pueden ser reexportaciones que algo importa por la carpeta.
- **Cadenas muertas:** si un archivo solo lo importa otro muerto, hay que borrar los dos a la vez (`npm run check` avisa si se rompe algo).
- **Código a medio hacer:** `LazyModals`, `ModalSuspense`, `LmsAdminPendingFeature` y los hooks de notificaciones pueden ser trabajo futuro; pregunta antes.

Procedimiento sugerido: borrar por carpeta, `npm run check` después de cada una, abrir en el navegador las pantallas de esa área y un commit por carpeta.

## Archivos

### `(raíz de src)` (1)

- `src/App.tsx`

### `Components` (4)

- `src/Components/ErrorBoundary.tsx`
- `src/Components/Excel.tsx`
- `src/Components/ModalHq.tsx`
- `src/Components/SimpleSidebar.tsx`

### `Components/Dashboard` (1)

- `src/Components/Dashboard/FilterIndicator.tsx`

### `Components/DataSheet` (2)

- `src/Components/DataSheet/common/pdf.tsx`
- `src/Components/DataSheet/common/styles.tsx`

### `Components/Fleet` (2)

- `src/Components/Fleet/CalibrationTimelinePDF.tsx`
- `src/Components/Fleet/TripComponent.back.tsx`

### `Components/Iot` (15)

- `src/Components/Iot/DeviceIotListSidebar.tsx`
- `src/Components/Iot/DeviceIotMap/parts/DeviceMapController.tsx`
- `src/Components/Iot/DeviceIotMap/utils/createDeviceIcon.ts`
- `src/Components/Iot/EventHistory.tsx`
- `src/Components/Iot/Gauge.tsx`
- `src/Components/Iot/GaugeChart.tsx`
- `src/Components/Iot/GraphDrawer/hooks/useSensorConfig.ts`
- `src/Components/Iot/GraphDrawer/parts/ConfigButton.tsx`
- `src/Components/Iot/GraphDrawer/parts/SensorGauge.tsx`
- `src/Components/Iot/GraphDrawer/tabs/EventsTab.tsx`
- `src/Components/Iot/GraphDrawer/tabs/SummaryTab.tsx`
- `src/Components/Iot/GraphDrawerDetails.tsx`
- `src/Components/Iot/helpers.ts`
- `src/Components/Iot/ModuleConfigForm.tsx`
- `src/Components/Iot/TemperatureChart.tsx`

### `Components/Maintenance` (10)

- `src/Components/Maintenance/FilterPresetSelector.tsx`
- `src/Components/Maintenance/FiltersSkeleton.tsx`
- `src/Components/Maintenance/TicketDetailsSkeleton.tsx`
- `src/Components/Maintenance/TVDisplayModern/components/CriticalTicketsSection.tsx`
- `src/Components/Maintenance/TVDisplayModern/components/EnhancedMetricCard.tsx`
- `src/Components/Maintenance/TVDisplayModern/components/EnhancedTimeDisplay.tsx`
- `src/Components/Maintenance/TVDisplayModern/components/RotatingInfo.tsx`
- `src/Components/Maintenance/TVDisplayModern/components/SystemHealthIndicator.tsx`
- `src/Components/Maintenance/TVDisplayModern/config.ts`
- `src/Components/Maintenance/TVDisplayModern/export.ts`

### `Components/Modules` (1)

- `src/Components/Modules/hooks/useModuleForm.ts`

### `Components/Purchases` (1)

- `src/Components/Purchases/purchase-request-modal/utils/formUtils.ts`

### `Components/Templates` (5)

- `src/Components/Templates/index.ts`
- `src/Components/Templates/LazyModals.tsx`
- `src/Components/Templates/LoadingIndicators.tsx`
- `src/Components/Templates/ModalSuspense.tsx`
- `src/Components/Templates/TemplateRow.tsx`

### `Components/lms` (3)

- `src/Components/lms/ErrorBoundary/ApiErrorBoundary.tsx`
- `src/Components/lms/LoadingStates/ProgressIndicators.tsx`
- `src/Components/lms/SecureFileUpload.tsx`

### `constants` (1)

- `src/constants/version.ts`

### `hooks` (7)

- `src/hooks/useDashboardNotifications.ts`
- `src/hooks/useFilterPresets.ts`
- `src/hooks/useHybridNotifications.ts`
- `src/hooks/useLmsWebSocket.ts`
- `src/hooks/useNotificationPolling.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useSecurity.ts`

### `pages/lms` (2)

- `src/pages/lms/admin/shared/LmsAdminPendingFeature.tsx`
- `src/pages/lms/shared/LmsProgressBar.tsx`

### `types` (2)

- `src/types/index.ts`
- `src/types/tableState.ts`

### `utils` (4)

- `src/utils/common.tsx`
- `src/utils/ErrorBoundary.tsx`
- `src/utils/refreshToken.ts`
- `src/utils/useEvents.ts`

