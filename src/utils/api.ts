import axios from 'axios'
import { api } from 'src/config'



export const axiosPublic = axios.create({
  baseURL: api(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
axiosPublic.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const axiosPrivate = axios.create({
  baseURL: api()
})
