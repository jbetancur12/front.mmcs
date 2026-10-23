import { useCallback } from 'react'
import Cookies from 'js-cookie'
import { axiosPublic } from './api'

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

const useRefreshToken = () => {
  const refresh = useCallback(async (): Promise<RefreshSessionResponse> => {
    /**
     * This sends a request to the server to get
     * a new access token. the refresh token is valid (if valid)
     * as an httpOnly cookie. so no setup for cookies is required here.
     */
    const response = await axiosPublic.get('/auth/refresh-token', {
      withCredentials: true
    })

    const refreshData: RefreshSessionResponse = response.data

    storeSessionExpiry(refreshData.expiresIn)

    return refreshData
  }, [])
  return refresh
}

export default useRefreshToken
