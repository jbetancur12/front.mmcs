import { getApiErrorReason } from './apiError'
import { notify } from './notify'
import { busyDialog, confirmDialog } from './confirm'

// Antes eran diálogos de SweetAlert; ahora usan confirmDialog / notify / busyDialog (ver utils/confirm.tsx
// y utils/notify.tsx). Se conservan los nombres para no tocar a quienes los llaman.

export const showDeleteConfirmation = (userName: string) =>
  confirmDialog({
    title: '¿Estás seguro?',
    text: `¿Deseas eliminar el usuario "${userName}"? Esta acción no se puede deshacer.`,
    confirmLabel: 'Sí, eliminar',
    cancelLabel: 'Cancelar',
    tone: 'danger'
  })

export const showSuccessAlert = async (message: string) => {
  notify.success(message)
}

export const showErrorAlert = async (message: string) => {
  notify.error(message)
}

export const showLoadingAlert = (message?: string) => {
  busyDialog.show(message ?? 'Procesando...')
}

export const showNetworkErrorAlert = async () => {
  notify.error(
    'Error de conexión',
    'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.'
  )
}

export const showTimeoutAlert = async () => {
  notify.warning(
    'Tiempo agotado',
    'La operación tardó demasiado. Inténtalo de nuevo.'
  )
}

export const showServerErrorAlert = async () => {
  notify.error(
    'Error del servidor',
    'Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.'
  )
}

// Enhanced error handler that determines the appropriate alert based on error type
export const handleErrorWithAlert = async (error: unknown): Promise<string> => {
  let errorMessage = 'Error desconocido'
  
  if (error instanceof Error) {
    // Handle Axios errors
    if ('isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as any
      
      if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
        await showNetworkErrorAlert()
        return 'Error de conexión. Verifique su conexión a internet.'
      } else if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        await showTimeoutAlert()
        return 'Tiempo de espera agotado. Intente nuevamente.'
      } else if (axiosError.response?.status === 400) {
        errorMessage =
          'Datos inválidos: ' +
          (getApiErrorReason(error) ?? 'Verifique los datos ingresados')
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 404) {
        errorMessage = getApiErrorReason(error) ?? 'Recurso no encontrado'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 403) {
        errorMessage =
          getApiErrorReason(error) ??
          'No tiene permisos para realizar esta acción'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 409) {
        errorMessage = getApiErrorReason(error) ?? 'El recurso ya existe'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status >= 500) {
        await showServerErrorAlert()
        return 'Error del servidor. Intente nuevamente más tarde.'
      } else {
        errorMessage = getApiErrorReason(error) ?? 'Error desconocido'
        await showErrorAlert(errorMessage)
        return errorMessage
      }
    } else {
      // Handle other types of errors
      errorMessage = error.message || 'Error desconocido'
      await showErrorAlert(errorMessage)
      return errorMessage
    }
  } else {
    // Handle non-Error objects
    errorMessage = String(error)
    await showErrorAlert(errorMessage)
    return errorMessage
  }
}

// Close any open loading alerts
export const closeLoadingAlert = () => {
  busyDialog.hide()
}

// El enlace de activación ya no es un SweetAlert: vive en su propio diálogo.
export type { ActivationLinkInfo } from './activationLink'
export {
  buildActivationWhatsappUrl,
  normalizeWhatsappPhone
} from './activationLink'
export { showActivationLinkDialog } from './activationLinkDialog'
