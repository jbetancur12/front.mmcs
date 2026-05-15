import { axiosPublic } from '@utils/api'
import Cookies from 'js-cookie'

const refreshToken = async () => {
  try {
    const response = await axiosPublic.get(`/auth/refresh-token`)

    if (response.status !== 200) {
      throw new Error('No se pudo renovar el token')
    }

    const { accessToken, expiresIn } = response.data

    // Almacena los nuevos tokens en localStorage o en el lugar que uses
    localStorage.setItem('accessToken', accessToken)

    if (expiresIn) {
      const expirationDate = new Date(expiresIn)

      Cookies.set('expiresIn', expiresIn.toString(), {
        expires: expirationDate,
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        path: '/'
      })
      localStorage.setItem('sessionExpiresAt', expiresIn.toString())
    }

    return accessToken
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default refreshToken
