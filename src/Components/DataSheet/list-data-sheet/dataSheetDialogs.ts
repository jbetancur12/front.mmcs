import { confirmDialog } from 'src/utils/confirm'


/** Confirmación de borrado de una hoja de vida. */
export const confirmDeleteDataSheet = (equipmentName: unknown) =>
  confirmDialog({
    title: `¿Está seguro que desea eliminar la hoja de datos ${equipmentName}?`,
    text: 'No podrá recuperar esta información una vez eliminada',
    confirmLabel: 'Sí'
  })
