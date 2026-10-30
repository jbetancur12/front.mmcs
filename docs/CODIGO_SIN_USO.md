# Código sin uso en `src/`

Última revisión: 2026-10-30. Se borraron **55 archivos** (unas 8.100 líneas) del front en la rama `chore/codigo-sin-uso` (un commit por carpeta, `npm run check` en 0 errores tras cada una y `vite build` correcto). Antes, el 2026-10-23, se habían borrado 8 (commit e6a67d5).

## Cómo se detecta

```bash
npx knip@5 --include files --no-progress
```

`knip` entiende `import()` dinámicos, los alias del `tsconfig` y la configuración de Vite. El 2026-10-30 coincidió con el recorrido manual de imports desde `main.tsx` (los 61 archivos de la lista anterior) y encontró 7 más.

Que un archivo salga en la lista no prueba que sobre. Antes de borrar uno, busca referencias fuera del grafo: `scripts/`, `vite.config`, `package.json`, tests, `.md` y rutas escritas como texto.

## Lo que se dejó a propósito

`knip` sigue listando estos archivos; no se borraron porque pueden ser trabajo a medio hacer. Pregunta antes de borrarlos.

| Archivo | Motivo |
|---|---|
| `src/hooks/useDashboardNotifications.ts` | Nadie lo importa, pero se refactorizó el 2026-10-19; puede ser una campana de notificaciones en camino |
| `src/pages/lms/admin/shared/LmsAdminPendingFeature.tsx` | Pantalla de función pendiente del LMS (marzo de 2026), hoy sin uso |
| `src/utils/apiError.test.ts`, `src/test/lms/LmsCourseManagement.test.tsx` | Son tests; `knip` los marca porque no hay runner configurado |

El 2026-10-30 se borraron además los hooks viejos de notificaciones del LMS (`useNotifications`, `useHybridNotifications`, `useNotificationPolling`, `useLmsWebSocket`), `LazyModals`, `ModalSuspense`, `AutoComplete`, `scripts/build.js` y `scripts/update-version.cjs` (vacío). `src/constants/version.ts` sigue vivo: lo leen los scripts de versión; `knip.json` lo declara como entrada.

## Cómo se borró

Por carpeta: `git rm`, `npm run check` completo y un commit con `HUSKY=0` (el hook `post-commit` despliega a producción en `main`/`staging`, por eso se trabajó en una rama). No se hizo push.
