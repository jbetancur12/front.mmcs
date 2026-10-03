import { axiosPrivate } from '@utils/api'
import type { ActivationLinkInfo } from './sweetAlert'

// Genera un enlace de activación nuevo (invalida el anterior) para un usuario pendiente
export const fetchActivationLink = async (userId: number): Promise<ActivationLinkInfo> => {
  const { data } = await axiosPrivate.post(`/auth/${userId}/activation-link`)
  return data
}

// Genera un enlace nuevo y reenvía el correo de activación
export const resendActivationEmail = async (userId: number): Promise<ActivationLinkInfo> => {
  const { data } = await axiosPrivate.post(`/auth/${userId}/resend-activation`)
  return data
}
