# Customer Legacy Cleanup

## Candidatos seguros para eliminar

Estos son los cambios que se ven seguros si queremos retirar la vista legacy de cliente:

1. Eliminar la ruta legacy `'/customers/:id/legacy'` en `src/routes/CustomerRoutes.tsx`.
2. Eliminar el import lazy de `Customer` en `src/routes/CustomerRoutes.tsx`.
3. Eliminar el archivo `src/pages/Customer.tsx`.

## Evidencia revisada

- La ruta principal `'/customers/:id'` usa `src/pages/ModernCustomer.tsx`.
- `src/pages/ModernCustomer.tsx` solo renderiza `src/Components/ModernCustomerProfile.tsx`.
- La única referencia encontrada a `src/pages/Customer.tsx` está en `src/routes/CustomerRoutes.tsx`.
- No encontré otras referencias de uso para la ruta `:id/legacy`.

## Limpieza opcional, pero no estrictamente legacy

Esto no es legacy en sí, pero podría simplificarse después:

1. Evaluar si `src/pages/ModernCustomer.tsx` se puede eliminar y apuntar la ruta `'/customers/:id'` directo a `ModernCustomerProfile`.

## Cosas que no borraría en esta pasada

Encontré varias apariciones de la palabra `legacy`, pero no parecen ser la vieja vista de cliente:

1. Comentarios o compatibilidad en mantenimiento:
   - `src/hooks/useMaintenancePublic.ts`
   - `src/types/maintenance.ts`
   - `src/pages/maintenance/MaintenanceAnalytics.tsx`
2. Compatibilidad o migración en LMS:
   - `src/pages/lms/shared/LmsContentEditor.tsx`
   - `src/pages/lms/admin/LmsCertificateTemplates.tsx`
3. Documentación y tipos del sidebar moderno:
   - `src/Components/ModernSidebar/MIGRATION.md`
   - `src/Components/ModernSidebar/types/sidebar.types.ts`

## Propuesta de borrado concreto

Si validas este documento, la siguiente pasada haría:

1. Editar `src/routes/CustomerRoutes.tsx` para quitar `Customer` y `':id/legacy'`.
2. Borrar `src/pages/Customer.tsx`.
3. Correr `npm run check`.

