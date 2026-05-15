import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

// Create MySwal instance with React content support
export const MySwal = withReactContent(Swal)

// SweetAlert configuration types
export interface SweetAlertConfig {
  title: string
  text?: string
  icon: 'warning' | 'success' | 'error' | 'info'
  showCancelButton?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonColor?: string
  cancelButtonColor?: string
}

// Pre-configured alert configurations
export const alertConfigs = {
  deleteConfirm: (userName: string): SweetAlertConfig => ({
    title: '¿Estás seguro?',
    text: `¿Deseas eliminar el usuario "${userName}"? Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }),

  success: (message: string): SweetAlertConfig => ({
    title: '¡Éxito!',
    text: message,
    icon: 'success',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#3085d6',
  }),

  error: (message: string): SweetAlertConfig => ({
    title: 'Error',
    text: message,
    icon: 'error',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#d33',
  }),

  loading: (message: string = 'Procesando...') => ({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    }
  }),

  networkError: (): SweetAlertConfig => ({
    title: 'Error de Conexión',
    text: 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.',
    icon: 'error',
    confirmButtonText: 'Reintentar',
    confirmButtonColor: '#3085d6',
  }),

  timeout: (): SweetAlertConfig => ({
    title: 'Tiempo Agotado',
    text: 'La operación tardó demasiado tiempo. Por favor, intente nuevamente.',
    icon: 'warning',
    confirmButtonText: 'Reintentar',
    confirmButtonColor: '#3085d6',
  }),

  serverError: (): SweetAlertConfig => ({
    title: 'Error del Servidor',
    text: 'Ocurrió un error en el servidor. Por favor, intente nuevamente más tarde.',
    icon: 'error',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#d33',
  }),
}

// Helper functions for common alerts
export const showDeleteConfirmation = async (userName: string) => {
  return await MySwal.fire(alertConfigs.deleteConfirm(userName))
}

export const showSuccessAlert = async (message: string) => {
  return await MySwal.fire(alertConfigs.success(message))
}

export const showErrorAlert = async (message: string) => {
  return await MySwal.fire(alertConfigs.error(message))
}

export const showLoadingAlert = (message?: string) => {
  return MySwal.fire(alertConfigs.loading(message))
}

export const showNetworkErrorAlert = async () => {
  return await MySwal.fire(alertConfigs.networkError())
}

export const showTimeoutAlert = async () => {
  return await MySwal.fire(alertConfigs.timeout())
}

export const showServerErrorAlert = async () => {
  return await MySwal.fire(alertConfigs.serverError())
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
        errorMessage = 'Datos inválidos: ' + (axiosError.response?.data?.error || 'Verifique los datos ingresados')
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'Recurso no encontrado'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status === 409) {
        errorMessage = 'El recurso ya existe'
        await showErrorAlert(errorMessage)
        return errorMessage
      } else if (axiosError.response?.status >= 500) {
        await showServerErrorAlert()
        return 'Error del servidor. Intente nuevamente más tarde.'
      } else {
        errorMessage = axiosError.response?.data?.error || 'Error desconocido'
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
  MySwal.close()
}