import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

/** Confirmación de borrado de una hoja de vida. */
export const confirmDeleteDataSheet = (equipmentName: unknown) =>
  MySwal.fire({
    title: `¿Está seguro que desea eliminar la hoja de datos ${equipmentName}?`,
    text: 'No podrá recuperar esta información una vez eliminada',
    showCancelButton: true,
    confirmButtonText: 'Sí'
  })
