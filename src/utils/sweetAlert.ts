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
export interface ActivationLinkInfo {
  nombre?: string | null
  email: string
  phone?: string | null
  activationUrl: string
  /** undefined = no aplica (solo se consultó el enlace) */
  emailSent?: boolean
  emailError?: string | null
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Normaliza un teléfono colombiano a formato internacional para wa.me ('' si no es usable)
export const normalizeWhatsappPhone = (phone?: string | null) => {
  const digits = String(phone ?? '').replace(/D/g, '')
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  if (digits.length === 12 && digits.startsWith('57')) return digits
  return digits.length >= 11 ? digits : ''
}

export const buildActivationWhatsappUrl = (info: ActivationLinkInfo) => {
  const saludo = info.nombre ? `Hola ${info.nombre}, ` : 'Hola, '
  const text =
    `${saludo}ya tienes acceso a la plataforma de Metromedics. ` +
    `Activa tu cuenta y crea tu contraseña aquí: ${info.activationUrl}`
  return `https://wa.me/${normalizeWhatsappPhone(info.phone)}?text=${encodeURIComponent(text)}`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback para contextos sin Clipboard API
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

// Diálogo con el enlace de activación: copiar o enviar por WhatsApp.
// Se usa al crear un usuario y al consultar/reenviar la activación de uno pendiente.
export const showActivationLinkDialog = async (info: ActivationLinkInfo) => {
  const emailStatus =
    info.emailSent === true
      ? '<p style="color:#15803d">✔ Se envió el correo de activación a <b>' + escapeHtml(info.email) + '</b>.</p>'
      : info.emailSent === false
        ? '<p style="color:#b45309">⚠ <b>No se pudo enviar el correo</b> a ' + escapeHtml(info.email) +
          (info.emailError ? '<br/><small>' + escapeHtml(info.emailError) + '</small>' : '') + '</p>'
        : ''

  return MySwal.fire({
    title: info.emailSent === false ? 'Usuario sin correo de activación' : 'Enlace de activación',
    icon: info.emailSent === false ? 'warning' : 'info',
    html:
      emailStatus +
      '<p style="font-size:14px">Comparte este enlace con el usuario para que cree su contraseña. ' +
      'Un enlace generado antes para este usuario deja de funcionar.</p>' +
      '<input readonly id="activation-url" style="width:100%;padding:8px;font-size:12px;border:1px solid #ccc;border-radius:6px" value="' +
      escapeHtml(info.activationUrl) + '" onclick="this.select()" />' +
      '<p id="activation-copied" style="color:#15803d;font-size:13px;min-height:18px;margin-top:6px"></p>',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Copiar enlace',
    denyButtonText: 'Enviar por WhatsApp',
    cancelButtonText: 'Cerrar',
    confirmButtonColor: '#3085d6',
    denyButtonColor: '#16a34a',
    // Devolver false mantiene el diálogo abierto tras copiar / abrir WhatsApp
    preConfirm: async () => {
      const ok = await copyToClipboard(info.activationUrl)
      const msg = document.getElementById('activation-copied')
      if (msg) msg.textContent = ok ? '¡Enlace copiado!' : 'No se pudo copiar, selecciónalo manualmente.'
      return false
    },
    preDeny: () => {
      window.open(buildActivationWhatsappUrl(info), '_blank', 'noopener,noreferrer')
      return false
    },
  })
}
