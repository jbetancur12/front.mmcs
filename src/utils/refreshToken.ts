import axios from 'axios'
import { customAxios } from '@utils/api'
import { api } from 'src/config'

customAxios.interceptors.response.use(
  (response) => {
    return response
  },
  async function (error) {
    const originalRequest = error.config

    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const resp = await refreshToken()
        const accessToken = resp.accessToken

        localStorage.setItem('accessToken', accessToken)
        customAxios.defaults.headers.common['Authorization'] =
          `Bearer ${accessToken}`
        return customAxios(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
    }
    return Promise.reject(error)
  }
)

const refreshToken = async () => {
  const cookies = document.cookie
  console.log('Todas las cookies:', cookies)
  try {
    const response = await axios.get(`${api()}/auth/refresh-token`, {
      withCredentials: true
    })

    if (response.statusText !== 'OK') {
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
