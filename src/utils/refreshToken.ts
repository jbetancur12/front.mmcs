import { axiosPrivate } from '@utils/api'

const refreshToken = async () => {
  try {
    const response = await axiosPrivate.get(`/auth/refresh-token`, {
      withCredentials: true
    })

    if (response.status !== 200) {
      throw new Error('No se pudo renovar el token')
    }

    const { accessToken } = response.data

    // Almacena los nuevos tokens en localStorage o en el lugar que uses
    localStorage.setItem('accessToken', accessToken)

    return accessToken
  } catch (error) {
    console.error(error)
    // Manejo de errores
    return null
  }
}

export default refreshToken
