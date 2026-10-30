# AGENTS.md — front.mmcs (Frontend Metromedics)

SPA de Metromedics (calibración, mantenimiento, compras, IoT/laboratorio, flota, LMS, etc.). Backend asociado: `../api.mmcs`.

## Stack

- React 18 + TypeScript (strict) + Vite 4
- UI: MUI 5 (+ data-grid, date-pickers, lab), Tailwind 3 (`darkMode: 'class'`), material-react-table, emotion
- Estado: **nanostores** (`src/store`), datos de servidor con **react-query v3** (`src/config/queryClient.ts`, staleTime 5 min)
- Formularios: Formik + Yup · HTTP: axios · Router: react-router-dom v6 · Notificaciones: notistack / react-toastify / SweetAlert2
- Mapas: leaflet · Gráficas: recharts, victory · PDF/Excel: @react-pdf/renderer, jspdf, xlsx · Sentry, PostHog

## Comandos

```bash
npm run dev      # Vite, http://localhost:5173
npm run check    # tsc --noEmit incremental (caché en node_modules/.cache/tsc; bórrala si cambias tsconfig o TypeScript)
npm run check:full  # tsc --noEmit sin caché
npm run lint     # eslint (--max-warnings 0)
npm run build    # tsc + vite build (usa 8GB de heap)
npm run version:patch|minor|major   # scripts/update-version.js (ver VERSIONING.md)
```

`deploy.sh` hace build y copia `dist/` al servidor remoto; no ejecutarlo sin que el usuario lo pida.

## Estructura (`src/`)

| Carpeta | Contenido |
|---|---|
| `main.tsx`, `router.tsx` | Entrada, providers, árbol de rutas (lazy + `RequireAuth`) |
| `routes/` | Un archivo `*Routes.tsx` por módulo (Calibration, Maintenance, Lms, Fleet, Iot, ...) que `router.tsx` compone |
| `pages/` | Pantallas por ruta (`pages/lms/{admin,employee,client,course}`, `pages/Admin`, ...) |
| `Components/` | Componentes por dominio (`Maintenance`, `Purchases`, `lms`, `Authentication`, `Table`, ...) + `Layout`, `SideBar` |
| `hooks/` | Hooks de datos/tiempo real (`useLms`, `useMaintenance`, `useCalibrationServices`, `use*WebSocket`...) |
| `services/` | Clientes API puntuales (`lmsService`, `quizService`) |
| `store/` | nanostores (`userStore`, `customerStore`, `deviceStore`, ...) |
| `utils/` | `api.ts` (`axiosPublic`/`axiosPrivate`), `use-axios-private`, `roleUtils`, `lmsIdentity`, WebSocket |
| `constants/`, `types/`, `theme/` | Roles/módulos/versión, tipos de dominio, design system |

Alias de imports: `src/...` (baseUrl `.`), `@utils/*`, `@stores/*`, `@hooks/*`, `@services/*`, `@config/*`.

## Convenciones

- Estilo: Prettier con `prettier-config-standard` (clave `"prettier"` de `package.json`, la única configuración: 80 columnas, sin `;`, comillas simples, JSX con `'`). El hook de lint-staged está desactivado y el repo está mezclado, así que formatea a mano solo los archivos nuevos o reescritos (`npx prettier --write <archivo>`); en archivos existentes con cambios pequeños respeta el formato que ya tienen para no meter diffs de solo formato. `noUnusedLocals/Parameters` están activos: el build falla con imports sobrantes.
- Commits **Conventional Commits** (commitlint + husky); versionado en `VERSIONING.md` / `VERSION_MANAGEMENT.md`.
- Páginas nuevas: `lazy()` en el `*Routes.tsx` del módulo, envuelta en `ProtectedRoute`/guard con los roles correspondientes. Roles del front deben coincidir con los del backend (`../api.mmcs/constants/roles.constants.js`); ver `src/constants/roles.ts`, `src/utils/roleUtils.ts`, `src/utils/lmsIdentity.ts` (`"Training Manager"` con espacio).
- Errores del API: el backend responde en varios formatos (`{ error: { code, message, details } }`, `{ error: "texto" }`, `{ message: "texto" }`). Léelos siempre con `getApiErrorReason(error)` / `parseApiError(error)` de `src/utils/apiError.ts` (`getApiErrorMessage` para "texto base + motivo"); una regla ESLint prohíbe `response.data.error|message` a mano. Plan de unificación en `plans/estandarizar-errores-api.md`.
- Llamadas a la API: usa `axiosPrivate` (con refresh de token) y react-query (`useQuery`/`useMutation` con query keys estables); no uses `fetch` suelto ni dupliques lógica en componentes — extráela a `hooks/` o `services/`.
- Tablas con filtros persistentes: `usePersistentTableState` (ver `docs/PERSISTENT_TABLE_FILTERS_GUIDE.md`, `src/docs/TableStateManagement.md`).
- Base URL de la API: `src/config.ts` (`api()`); en dev normaliza localhost/IP de red privada. Variables `VITE_*` en `.env.development` / `.env.production` (no imprimir ni commitear secretos).
- UI en español; reutiliza `theme/designSystem.ts` y componentes existentes antes de crear nuevos. Mantén soporte responsive/móvil y accesibilidad (labels, foco, contraste).
- Funcionalidad de mantenimiento bajo feature flags: `src/features/maintenanceFlags.ts`.
- Tests: Jest/Testing Library (`src/test/lms`); archivos `*.test.tsx`.
- Trampas de MUI: un `TextField select` con valor vacío (`''`, p. ej. "Todas las sedes") no muestra la opción si falta `SelectProps={{ displayEmpty: true }}` e `InputLabelProps={{ shrink: true }}`. Un grid de tarjetas debe usar `minmax(0, 1fr)` (no `1fr`) para que los botones o textos largos no lo desborden en móvil. Con Material React Table, las celdas con desestructuración (`Cell: ({ row })`) se tipan (`MRT_Row`, `MRT_Cell`) para no disparar `react/prop-types`.
- Si cambias qué capacidades usa una pantalla o una ruta, regenera `src/constants/permissionScreens.ts` con `npm run permission-screens` (el test `generatedDocs` del api lo exige); `permissions.ts` también se regenera con script, nunca a mano ni con Prettier.

## Look and feel (obligatorio en cualquier módulo)

Toda pantalla nueva o que se rediseñe, de cualquier módulo (Compras, Calibración, Mantenimiento, Flota, LMS, etc.), usa el mismo estilo del dashboard (`/`) y de `/customers`; no inventes uno propio.

- Encabezado de página: `src/Components/lms/admin/LmsPageHeader.tsx` (ícono en círculo de color, título h4 en negrita, frase corta, acciones a la derecha).
- Indicadores/KPIs: `src/Components/lms/admin/LmsStatCard.tsx` (tarjeta blanca con el color en el número; tono por significado: `red` vencido, `orange` pendiente, `green` correcto, `blue` información, `teal` totales; en 0 queda gris sola; con `onClick` sirven de filtro, y si la tabla ya muestra el total no se agrega tarjeta "Todas"). Aunque estén en la carpeta `lms`, son genéricos: impórtalos, no los dupliques.
- Tablas de datos: Material React Table con `MRT_Localization_ES`, búsqueda global visible y acciones fijas a la derecha (`enablePinning`, `columnPinning: { right: ['mrt-row-actions'] }`). Con paginación en servidor: `manualPagination` y `manualFiltering`.
- Paleta: verde azulado `#00BFA5` (hover `#00897B`, fondo suave `#E0F7F4`); éxito `#4caf50 → #00BFA5`.
- Layout: `Container maxWidth='xl'`, sin fondo gris propio, `spacing={3}` entre tarjetas, sin saturación visual y vista móvil revisada.
- Referencia de aplicación: módulo LMS (admin, estudiante, cliente, curso, quiz).

Patrones por tipo de pantalla (extraídos de `/customers`, `/customers/:id` y `/settings`):

- **Listado** (`/customers`, `src/pages/CustomersTable.tsx`): `Container maxWidth='xl' sx={{ py: 3 }}`; encabezado con ícono de 32 px (`primary.main`) + h4 en negrita, o el círculo de `LmsPageHeader`; botón principal `bgcolor #00BFA5` con hover `#00ACC1`; tabla con `src/Components/Common/DataTable.tsx` (buscador con conteo, encabezados limpios, acciones fijas, grises `#f3f4f6`/`#f9fafb`/`#e5e7eb`; las tablas viejas migran según https://claude.ai/artifact/YXL2nQpSi8rfuWSck24Yyp); primera columna con `Avatar` pequeño `#00BFA5` + nombre en 600 + id en `caption`; datos de contacto con íconos grises de 16 px; estado como `Chip` outlined (`success`/`default`); acciones: ver `#00695C`, editar `#2563eb`, borrar `error`, cada una con `aria-label`.
- **Detalle de una entidad** (`/customers/:id`, `src/Components/ModernCustomerProfile.tsx`): `Container maxWidth='xl'` (con `lg` sobraba la mitad de la pantalla en monitores grandes); banner superior con degradado esmeralda `linear-gradient(135deg, #10b981, #059669)`, `borderRadius: 20px`, círculos decorativos translúcidos, avatar y datos de contacto; debajo, 4 indicadores en tarjetas blancas (`elevation 0`, `borderRadius 16px`, borde `#e5e7eb`) con ícono en cajita pastel de 48 px y número h4 en negrita; pestañas dentro de una tarjeta igual (`fullWidth`, `textTransform: none`, peso 600, indicador `#10b981` de 3 px, alto 64); botones primarios con degradado esmeralda y secundarios con degradado azul `#3b82f6 → #2563eb`.
- **Diálogos de formulario**: siempre `src/Components/Common/FormDialog.tsx` (cabecera blanca con título y X, campos con contorno y foco turquesa, botón principal turquesa). Con varios grupos de campos, `maxWidth='md'` y `FormDialogSection`. Ejemplos: `CustomerFormDialog`, crear/editar usuario en `/settings`. Nada de cabeceras de color, degradados ni emojis.
- **Campos y archivos dentro de un `FormDialog`**: búsqueda con opciones del servidor (cliente, equipo, tipo) con `src/Components/Common/AsyncSelectField.tsx` (Autocomplete de MUI con espera de 350 ms y opciones iniciales; no uses `react-select` suelto). Subir un archivo con `src/Components/Common/FileDropZone.tsx` (borde punteado gris que se vuelve turquesa al arrastrar, muestra nombre y tamaño, valida tipo y peso, se maneja con teclado). Ejemplo: `CreateFileModal` (subir certificado en `/customers/:id`).
- **Formularios de página completa** (formularios largos que no caben en un diálogo, p. ej. nuevo reporte en `/non-conform-work-reports`, `NonConformWorkReportForm`): `src/Components/Common/FormPage.tsx` (encabezado con `LmsPageHeader`, secciones y barra inferior fija con Cancelar / botón turquesa `#00BFA5`; props `title, subtitle, icon, onSubmit, onCancel, submitLabel, loading, notices`). Piezas, todas en `Components/Common/`:
  - `FormSection` (tarjeta blanca con borde `#e5e7eb`, `title`, `description?`, cuadrícula de 1 a 3 columnas según el ancho, mínimo 300 px por campo), `FormSubsection` (4.1, 4.2... dentro de una sección) y `FormGridItem` (hijo que ocupa todo el ancho, para textos largos).
  - `FormikField` (texto, número, selector con `options`, `multiline`; resuelve `value`, `onChange`, `error` y `helperText` desde Formik) y `FormCheckboxField` (casilla con check turquesa).
  - `FormDateField` (fecha en español, valor `yyyy-MM-dd` en hora local, sin el desfase de `toISOString`).
  - `ScoreSelect` y `ScoreSummary` (calificaciones 1/5 o 1/3/5 con su leyenda y franja de totales calculados).
  - `RiskBadge` (Chip outlined por significado: Crítico/Alta rojo, Alto naranja, Media azul, Baja/Muy Baja verde) en lugar de cajas con colores propios.
  - `FormTabs` (pestañas con ícono y contador naranja de campos con error; se pasa a `FormPage` en `tabs`). Úsalas cuando el formulario tiene más de unas 5 secciones o se llena en momentos distintos; al guardar con errores, salta a la primera pestaña con errores.
  - `FormErrorSummary` (Alert outlined sin emojis cuando se envía con campos inválidos).
  - Guardar va en un hook con `useMutation` (`useSaveNonConformWorkReport`), no con `axiosPrivate` en el componente. Nada de títulos centrados en `secondary.main`, fondos grises propios, `alert()` ni emojis.
- **Listado con búsqueda y paginación en el servidor**: `DataTable` con `manualFiltering`, `manualPagination`, `rowCount` y `state={{ globalFilter, pagination }}`, sin ordenar (`enableSorting={false}`); los botones de la pantalla (Exportar, Subir) van a la derecha vía `renderToolbarInternalActions`. Ejemplo: `EquipmentTable` en `/customers/:id`. Los equipos y registros se muestran como filas, no como tarjetas, y borrar siempre pide confirmación con `ConfirmDialog`.
- **Avisos breves (toast)**: usa `notify.success()` / `error()` / `info()` / `warning()` de `src/utils/notify.tsx` con una frase corta, sin emojis. Los muestra el `<AppToaster />` (`Components/Common/AppToaster.tsx`) montado **una sola vez en `main.tsx`**: no montes un `<Toaster />` propio en una pantalla (cada aviso saldría doble). Estilo: tarjeta blanca, borde `#e5e7eb`, radio 12 px, ícono turquesa en éxito y rojo en error, arriba a la derecha. Si hace falta una decisión (confirmar, cancelar) usa `ConfirmDialog`, no un aviso. Ya no queda SweetAlert, `Snackbar`, `notistack`, `react-toastify` ni `alert()`: no los vuelvas a agregar.
- **Confirmaciones y esperas desde código** (`src/utils/confirm.tsx`, con el `DialogHost` montado en `main.tsx`): `await confirmDialog({ title, text, confirmLabel, tone })` devuelve `{ isConfirmed }` como lo hacía SweetAlert; `promptDialog` pide un texto o un número; `busyDialog.show()/hide()` muestra una espera (ciérrala en el `finally`). `choiceDialog` pide escoger una opción (radio). Si la pantalla ya tiene estado, usa `ConfirmDialog`.
- **Cargando** (`src/Components/Common/SignalLoader.tsx`): señal biomédica tipo ECG en turquesa `#00BFA5` sobre tarjeta con cuadrícula gris, SVG + CSS (sin Lottie), respeta `prefers-reduced-motion`. Props `message`, `size` (`small|medium|large`), `fullPage`. Úsalo como `fallback` de `Suspense` y en esperas de página o bloque; es el **único** loader de espera: no uses `CircularProgress`, `Skeleton`, `LinearProgress` indeterminado, `Loader2` con spinner gris ni textos "Cargando..." sueltos (el `PDFViewer`, el `busyDialog` y los `Suspense` también lo usan). Los spinners dentro de botones siguen siendo `CircularProgress` pequeño.
- **Búsqueda rápida** (`src/Components/Common/CommandPalette.tsx`, montada en `SideBar.tsx`): `Ctrl+K` (o el campo "Búsqueda rápida" arriba del menú) abre un diálogo que busca entre las pantallas del menú que el usuario puede ver (mismas reglas de rol, capacidad, módulo y LMS que el menú: `canSeeItem` y `searchEntries` en `SideBar`). Ignora tildes, resalta la coincidencia en turquesa suave, muestra la ruta "Compras › Órdenes de compra" y, sin texto, "Más usadas" (hasta 4, con 2 o más visitas; cada 14 días una visita vale la mitad) y "Recientes" (hasta 5). El uso se cuenta por usuario en `localStorage` (`src/utils/quickSearchUsage.ts`) con **toda** la navegación, no solo la del buscador: `SideBar` registra cada ruta que coincide con una opción (los detalles suman a su listado). PostHog recibe `quick_search_opened` (`source`: `shortcut`/`button`) y `quick_search_selected` (`path`, `source`: `search`/`frequent`/`recent`) para medir si las sugerencias se usan. Una pantalla con ítem de menú se encuentra sola; una que se abre desde un botón o pestaña (p. ej. `/datasheets/devices-on-loan`) se registra en `src/constants/quickSearchPages.ts` con su permiso, su grupo y sinónimos sin tildes (`keywords`). `npm run quick-search:check` falla si una ruta fija no está en el menú ni en el registro, o si el menú/registro apuntan a una ruta que no existe; si una ruta no debe buscarse (redirección, alias), va en `IGNORED` de `scripts/check-quick-search.mjs` con su motivo. Córrelo al agregar o quitar rutas.
- **Sesiones**: máximo 3 por cuenta. El aviso del login (`ActiveSessionDialog`), la lista del menú de usuario (`ActiveSessionsListDialog`) y `SessionDeviceRow` están en `Components/Authentication/`; el aviso de que otro equipo cerró la sesión llega por `useSessionGuard` (en el `Header`).
- Hay dos verdes en uso: turquesa `#00BFA5` (dashboard, listados, LMS) y esmeralda `#10b981`/`#059669` (perfil de entidad). Usa turquesa en listados, encabezados, botones y diálogos; el esmeralda se reserva para el banner de las fichas de detalle.
- `/settings` (Usuarios y roles) ya sigue el patrón de listado: `Container xl`, `LmsPageHeader`, botón turquesa en el encabezado y foco de búsqueda/hover turquesa. Deuda restante: grises de Tailwind (`#374151`, `#6b7280`) en búsqueda y filtros. Pantallas que aún usan `Container` angosto (`lg`/`md`) y desaprovechan pantallas grandes: `Certificates`, `Profile`, `MaintenanceTracking`, `CalibrationChamberView`.

## LMS / integración con el backend

- Sigue `../.claude/lms/assignments-integration-analysis.md` al implementar tareas LMS y actualízalo si cambia la integración.
- Registra avances en `../.claude/lms/05-progress-log.md` cuando corresponda.
- Docs: `docs/lms/`, y los análisis en `../.claude/lms/` (`02-frontend-analysis.md`, `03-integration-plan.md`, `04-tasks.md`).

## Verificación

1. `npm run check` y `npm run lint` sin errores.
2. Probar en el navegador en `http://localhost:5173` (login con las credenciales de desarrollo de la sesión/CLAUDE.md) con el backend `api.mmcs` corriendo en `:5050`.
3. Si el cambio toca un contrato de API, coordinar el cambio en `api.mmcs` en la misma tarea.
