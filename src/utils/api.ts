import axios from 'axios'
import { api } from 'src/config'

export const customAxios = axios.create({
  baseURL: api()
})

customAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
