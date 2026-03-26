import { axiosPublic } from '@utils/api'

const refreshToken = async () => {
  try {
    const response = await axiosPublic.get(`/auth/refresh-token`)

    if (response.status !== 200) {
      throw new Error('No se pudo renovar el token')
    }

    const { accessToken } = response.data

    // Almacena los nuevos tokens en localStorage o en el lugar que uses
    localStorage.setItem('accessToken', accessToken)

    return accessToken
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default refreshToken
