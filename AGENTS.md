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
npm run check    # tsc --noEmit
npm run lint     # eslint (--max-warnings 0)
npm run build    # tsc + vite build (usa 8GB de heap)
npm run version:patch|minor|major   # scripts/update-version.js (ver VERSIONING.md)
```

`deploy.sh` hace build y copia `dist/` al servidor remoto; no ejecutarlo sin que el usuario lo pida.

## Estructura (`src/`)

| Carpeta | Contenido |
|---|---|
| `main.tsx`, `App.tsx`, `router.tsx` | Entrada, providers, árbol de rutas (lazy + `RequireAuth`) |
| `routes/` | Un archivo `*Routes.tsx` por módulo (Calibration, Maintenance, Lms, Fleet, Iot, ...) que `router.tsx` compone |
| `pages/` | Pantallas por ruta (`pages/lms/{admin,employee,client,course}`, `pages/Admin`, ...) |
| `Components/` | Componentes por dominio (`Maintenance`, `Purchases`, `lms`, `Authentication`, `Table`, ...) + `Layout`, `SideBar` |
| `hooks/` | Hooks de datos/tiempo real (`useLms`, `useMaintenance`, `useCalibrationServices`, `use*WebSocket`...) |
| `services/` | Clientes API puntuales (`lmsService`, `quizService`) |
| `store/` | nanostores (`userStore`, `customerStore`, `deviceStore`, ...) |
| `utils/` | `api.ts` (`axiosPublic`/`axiosPrivate`), `use-axios-private`, `refreshToken`, `roleUtils`, `lmsIdentity`, WebSocket |
| `constants/`, `types/`, `theme/` | Roles/módulos/versión, tipos de dominio, design system |

Alias de imports: `src/...` (baseUrl `.`), `@utils/*`, `@stores/*`, `@hooks/*`, `@services/*`, `@config/*`.

## Convenciones

- Estilo: Prettier estándar (sin `;`, comillas simples, JSX con `'`). `noUnusedLocals/Parameters` están activos: el build falla con imports sobrantes.
- Commits **Conventional Commits** (commitlint + husky); versionado en `VERSIONING.md` / `VERSION_MANAGEMENT.md`.
- Páginas nuevas: `lazy()` en el `*Routes.tsx` del módulo, envuelta en `ProtectedRoute`/guard con los roles correspondientes. Roles del front deben coincidir con los del backend (`../api.mmcs/constants/roles.constants.js`); ver `src/constants/roles.ts`, `src/utils/roleUtils.ts`, `src/utils/lmsIdentity.ts` (`"Training Manager"` con espacio).
- Llamadas a la API: usa `axiosPrivate` (con refresh de token) y react-query (`useQuery`/`useMutation` con query keys estables); no uses `fetch` suelto ni dupliques lógica en componentes — extráela a `hooks/` o `services/`.
- Tablas con filtros persistentes: `usePersistentTableState` (ver `docs/PERSISTENT_TABLE_FILTERS_GUIDE.md`, `src/docs/TableStateManagement.md`).
- Base URL de la API: `src/config.ts` (`api()`); en dev normaliza localhost/IP de red privada. Variables `VITE_*` en `.env.development` / `.env.production` (no imprimir ni commitear secretos).
- UI en español; reutiliza `theme/designSystem.ts` y componentes existentes antes de crear nuevos. Mantén soporte responsive/móvil y accesibilidad (labels, foco, contraste).
- Funcionalidad de mantenimiento bajo feature flags: `src/features/maintenanceFlags.ts`.
- Tests: Jest/Testing Library (`src/test/lms`); archivos `*.test.tsx`.

## Look and feel (obligatorio en cualquier módulo)

Toda pantalla nueva o que se rediseñe, de cualquier módulo (Compras, Calibración, Mantenimiento, Flota, LMS, etc.), usa el mismo estilo del dashboard (`/`) y de `/customers`; no inventes uno propio.

- Encabezado de página: `src/Components/lms/admin/LmsPageHeader.tsx` (ícono en círculo de color, título h4 en negrita, frase corta, acciones a la derecha).
- Indicadores/KPIs: `src/Components/lms/admin/LmsStatCard.tsx` (degradados `blue|green|orange|red|teal`; con `onClick` sirven de filtro o atajo de pestaña). Aunque estén en la carpeta `lms`, son genéricos: impórtalos, no los dupliques.
- Tablas de datos: Material React Table con `MRT_Localization_ES`, búsqueda global visible y acciones fijas a la derecha (`enablePinning`, `columnPinning: { right: ['mrt-row-actions'] }`). Con paginación en servidor: `manualPagination` y `manualFiltering`.
- Paleta: verde azulado `#00BFA5` (hover `#00897B`, fondo suave `#E0F7F4`); éxito `#4caf50 → #00BFA5`.
- Layout: `Container maxWidth='xl'`, sin fondo gris propio, `spacing={3}` entre tarjetas, sin saturación visual y vista móvil revisada.
- Referencia de aplicación: módulo LMS (admin, estudiante, cliente, curso, quiz).

Patrones por tipo de pantalla (extraídos de `/customers`, `/customers/:id` y `/settings`):

- **Listado** (`/customers`, `src/pages/CustomersTable.tsx`): `Container maxWidth='xl' sx={{ py: 3 }}`; encabezado con ícono de 32 px (`primary.main`) + h4 en negrita, o el círculo de `LmsPageHeader`; botón principal `bgcolor #00BFA5` con hover `#00ACC1`; tabla dentro de `Paper elevation={2}` con `borderRadius: 2`; MRT con encabezado `#f5f5f5` (peso 600), hover de fila `rgba(0,191,165,0.04)`, toolbars `#fafafa`, densidad cómoda, búsqueda de ~300 px; primera columna con `Avatar` pequeño `#00BFA5` + nombre en 600 + id en `caption`; datos de contacto con íconos grises de 16 px; estado como `Chip` outlined (`success`/`default`); acciones: ver `#00BFA5`, editar `primary`, borrar `error`.
- **Detalle de una entidad** (`/customers/:id`, `src/Components/ModernCustomerProfile.tsx`): `Container maxWidth='lg'`; banner superior con degradado esmeralda `linear-gradient(135deg, #10b981, #059669)`, `borderRadius: 20px`, círculos decorativos translúcidos, avatar y datos de contacto; debajo, 4 indicadores en tarjetas blancas (`elevation 0`, `borderRadius 16px`, borde `#e5e7eb`) con ícono en cajita pastel de 48 px y número h4 en negrita; pestañas dentro de una tarjeta igual (`fullWidth`, `textTransform: none`, peso 600, indicador `#10b981` de 3 px, alto 64); botones primarios con degradado esmeralda y secundarios con degradado azul `#3b82f6 → #2563eb`.
- **Diálogos de formulario** (`/settings`, `src/Components/TableOwnUsers.tsx`): cabecera con degradado esmeralda, `borderRadius` 16–20 px, títulos centrados.
- Hay dos verdes en uso: turquesa `#00BFA5` (dashboard, listados, LMS) y esmeralda `#10b981`/`#059669` (perfil de entidad y diálogos). Usa turquesa en listados, encabezados y botones; el esmeralda se reserva para el banner de detalle y las cabeceras de diálogo.
- `/settings` (Usuarios y roles) ya sigue el patrón de listado: `Container xl`, `LmsPageHeader`, botón turquesa en el encabezado y foco de búsqueda/hover turquesa. Deuda restante: grises de Tailwind (`#374151`, `#6b7280`) en búsqueda y filtros, y diálogos de crear/editar con cabecera esmeralda; el detalle `/customers/:id` usa `Container lg` mientras el listado usa `xl`.

## LMS / integración con el backend

- Sigue `../.claude/lms/assignments-integration-analysis.md` al implementar tareas LMS y actualízalo si cambia la integración.
- Registra avances en `../.claude/lms/05-progress-log.md` cuando corresponda.
- Docs: `docs/lms/`, y los análisis en `../.claude/lms/` (`02-frontend-analysis.md`, `03-integration-plan.md`, `04-tasks.md`).

## Verificación

1. `npm run check` y `npm run lint` sin errores.
2. Probar en el navegador en `http://localhost:5173` (login con las credenciales de desarrollo de la sesión/CLAUDE.md) con el backend `api.mmcs` corriendo en `:5050`.
3. Si el cambio toca un contrato de API, coordinar el cambio en `api.mmcs` en la misma tarea.
