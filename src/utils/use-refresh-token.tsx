import { axiosPublic } from './api'

const useRefreshToken = () => {
  const refresh = async (): Promise<any> => {
    /**
     * This sends a request to the server to get
     * a new access token. the refresh token is valid (if valid)
     * as an httpOnly cookie. so no setup for cookies is required here.
     */
    const response = await axiosPublic.get('/auth/refresh-token', {
      withCredentials: true
    })

    return response.data.accessToken
  }
  return refresh
}

export default useRefreshToken
