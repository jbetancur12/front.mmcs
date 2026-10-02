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

## LMS / integración con el backend

- Sigue `../.claude/lms/assignments-integration-analysis.md` al implementar tareas LMS y actualízalo si cambia la integración.
- Registra avances en `../.claude/lms/05-progress-log.md` cuando corresponda.
- Docs: `docs/lms/`, y los análisis en `../.claude/lms/` (`02-frontend-analysis.md`, `03-integration-plan.md`, `04-tasks.md`).

## Verificación

1. `npm run check` y `npm run lint` sin errores.
2. Probar en el navegador en `http://localhost:5173` (login con las credenciales de desarrollo de la sesión/CLAUDE.md) con el backend `api.mmcs` corriendo en `:5050`.
3. Si el cambio toca un contrato de API, coordinar el cambio en `api.mmcs` en la misma tarea.
