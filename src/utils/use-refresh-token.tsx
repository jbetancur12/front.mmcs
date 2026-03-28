import { useCallback } from 'react'
import Cookies from 'js-cookie'
import { axiosPublic } from './api'

export interface RefreshSessionResponse {
  accessToken: string
  expiresIn?: number
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

    if (refreshData.expiresIn) {
      const expirationDate = new Date(refreshData.expiresIn)

      Cookies.set('expiresIn', refreshData.expiresIn.toString(), {
        expires: expirationDate,
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        path: '/'
      })
      localStorage.setItem('sessionExpiresAt', refreshData.expiresIn.toString())
    }

    return refreshData
  }, [])
  return refresh
}

export default useRefreshToken
