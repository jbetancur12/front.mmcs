import axios from 'axios'

/** Mensajes en español para los códigos estables que devuelve la API de /rbac. */
const MESSAGES: Record<string, string> = {
  SENSITIVE_PERMISSION:
    'Solo un super administrador puede otorgar o quitar capacidades sensibles.',
  SELF_ESCALATION:
    'No puedes otorgarte capacidades que no tienes a través de uno de tus propios roles.',
  LAST_RBAC_MANAGER:
    'Es el último rol activo que puede gestionar permisos: si se quita, nadie podría volver a hacerlo.',
  SYSTEM_ROLE: 'Los roles de sistema no se pueden desactivar.',
  ROLE_EXISTS: 'Ya existe un rol con ese nombre.',
  ROLE_NOT_FOUND: 'El rol ya no existe. Actualiza la pantalla.',
  INVALID_ROLE_NAME:
    'El nombre debe empezar con una letra minúscula y usar solo minúsculas, números y guiones bajos (3 a 50 caracteres).',
  UNKNOWN_PERMISSION:
    'Hay capacidades que ya no existen en el catálogo. Actualiza la pantalla.',
  CONFLICTING_CHANGES: 'Una capacidad no puede otorgarse y quitarse a la vez.'
}

export interface RbacApiError {
  status?: number
  code?: string
  message: string
  details?: { keys?: string[] }
}

/** Convierte cualquier error de la API de permisos en algo que se pueda mostrar. */
export const parseRbacError = (error: unknown): RbacApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; code?: string; details?: { keys?: string[] } }
      | undefined
    const code = data?.code
    return {
      status: error.response?.status,
      code,
      details: data?.details,
      message:
        (code && MESSAGES[code]) ||
        data?.error ||
        (error.response?.status === 403
          ? 'No tienes permiso para realizar este cambio.'
          : 'No se pudo completar la operación. Intenta de nuevo.')
    }
  }
  return { message: 'No se pudo completar la operación. Intenta de nuevo.' }
}

export const rbacErrorMessage = (error: unknown): string =>
  parseRbacError(error).message
