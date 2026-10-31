# Estrategia de tests del front

Estado a 2026-10-31: 4 archivos de test (`libraryFlags`, `apiError`, `clientErrors` y `LmsCourseManagement`), 35 pasan y no hay omitidos (se borraron 8 obsoletos de `LmsCourseManagement`; siguen en el historial de git). Los checks que hoy protegen de verdad son `npm run check` (TypeScript estricto) y `npm run lint`.

La meta **no** es un porcentaje de cobertura. Es cubrir lo que duele cuando falla y cambia poco.

## Dónde sí vale la pena

Lógica pura, rápida de probar y estable. Un error ahí es silencioso y llega al usuario.

| Prioridad | Archivo | Por qué |
|---|---|---|
| 1 | `src/utils/roleUtils.ts`, `src/constants/roles.ts` | Un error muestra u oculta pantallas por rol. Ya hubo un saneamiento de roles (RBAC). Probar sobre todo `normalizeRole` y las comprobaciones de acceso, con `"Training Manager"` (con espacio) como caso. |
| 1 | `src/utils/lmsIdentity.ts`, `src/utils/lmsAudience.ts` | Decide qué ve cada tipo de usuario en el LMS. |
| 2 | `src/utils/lmsProgress.ts` | Cálculo de avance; un error cambia reportes y certificados. |
| 2 | `src/utils/dateOnly.ts` | Fechas sin desfase de zona horaria (el error clásico de `toISOString`). |
| 2 | `src/utils/passwordPolicy.ts`, `src/utils/rbacErrors.ts`, `src/utils/sessionEnd.ts` | Reglas pequeñas con casos límite claros. |
| 3 | `src/utils/quickSearchUsage.ts` | Conteo de visitas con decaimiento a 14 días. |
| 3 | `src/utils/tableStateUtils.ts` | Estado persistente de las tablas. |

Ya cubiertos: `apiError.ts`, `clientErrors.ts`, `features/libraryFlags.ts`.

Cada archivo de esta lista se prueba con un `*.test.ts` junto al código, sin renderizar nada y sin mocks de la API.

## Flujos críticos de punta a punta

Los más valiosos, pero los más caros. Un puñado, no cientos, y en navegador (Playwright), no como tests de componente: iniciar sesión, crear una cotización, subir un certificado. Aún no existen; se hacen cuando haya tiempo, no antes que lo de arriba.

## Dónde no vale la pena

- **Tests de componentes de pantallas que cambian seguido.** Se rompen con cada rediseño y cuestan más de lo que protegen. Ejemplo: 8 tests de `LmsCourseManagement.test.tsx` quedaron obsoletos al cambiar la pantalla y se borraron. Si se vuelve a trabajar esa pantalla, escribir tests nuevos junto con el cambio.
- **Perseguir un porcentaje de cobertura.** Un 80 % con tests vacíos no protege nada.
- **Llamadas reales a la API** en los tests: se simulan (`vi.mock('src/utils/api', ...)`, ver `LmsCourseManagement.test.tsx`).

## Regla para crecer sin proyecto aparte

Cada vez que se arregle un bug, agregar el test que lo habría detectado. La cobertura crece justo donde falla.

## Cómo escribirlos

- Vitest + Testing Library (jsdom), `npm test`. Archivos `*.test.ts(x)` junto al código o en `src/test/`.
- Mocks con `vi.mock` / `vi.hoisted`, no `jest.*`.
- `src/test/setup.ts` ya simula el canvas de jsdom (si no, `SignaturePad` llena el log de errores).
- Tras tocar un test, correr `npm test`, `npm run check` y `npm run lint` completos.
