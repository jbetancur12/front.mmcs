import { useCallback } from 'react'
import Cookies from 'js-cookie'
import type { AxiosError } from 'axios'
import { axiosPublic } from './api'
import { promptDialog } from './confirm'
import { notify } from './notify'
import { isReauthRequired } from './sessionEnd'

export interface RefreshSessionResponse {
  accessToken: string
  expiresIn?: number
}

/** Guarda cuándo vence la sesión (lo usa el aviso de vencimiento). */
export const storeSessionExpiry = (expiresIn?: number) => {
  if (!expiresIn) return
  Cookies.set('expiresIn', expiresIn.toString(), {
    expires: new Date(expiresIn),
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
    path: '/'
  })
  localStorage.setItem('sessionExpiresAt', expiresIn.toString())
}

const MAX_REAUTH_TRIES = 3

/**
 * La sesión cumplió su tope de días: se pide la contraseña sin salir de la pantalla.
 * Devuelve la respuesta de renovación, o null si cancela, falla tres veces o está bloqueado.
 */
const askPasswordToContinue =
  async (): Promise<RefreshSessionResponse | null> => {
    for (let attempt = 0; attempt < MAX_REAUTH_TRIES; attempt += 1) {
      const answer = await promptDialog({
        title: 'Confirma tu contraseña',
        label: 'Contraseña',
        type: 'password',
        helperText:
          'Por seguridad la sesión la pide cada cierto tiempo. No pierdes lo que estás haciendo.',
        confirmLabel: 'Continuar'
      })
      if (!answer.isConfirmed || !answer.value) return null

      try {
        const response = await axiosPublic.post(
          '/auth/reauthenticate',
          { contraseña: answer.value },
          { withCredentials: true }
        )
        return response.data as RefreshSessionResponse
      } catch (error) {
        if ((error as AxiosError)?.response?.status !== 401) return null
        notify.error('Contraseña incorrecta')
      }
    }
    return null
  }

const useRefreshToken = () => {
  const refresh = useCallback(async (): Promise<RefreshSessionResponse> => {
    /**
     * This sends a request to the server to get
     * a new access token. the refresh token is valid (if valid)
     * as an httpOnly cookie. so no setup for cookies is required here.
     */
    let refreshData: RefreshSessionResponse
    try {
      const response = await axiosPublic.get('/auth/refresh-token', {
        withCredentials: true
      })
      refreshData = response.data
    } catch (error) {
      // Tope de días de la sesión: se confirma con la contraseña desde cualquier
      // pantalla que renueve (cargar la página, el aviso de vencimiento, un 401)
      if (!isReauthRequired(error)) throw error
      const confirmed = await askPasswordToContinue()
      if (!confirmed) throw error
      refreshData = confirmed
    }

    storeSessionExpiry(refreshData.expiresIn)

    return refreshData
  }, [])
  return refresh
}

export default useRefreshToken
