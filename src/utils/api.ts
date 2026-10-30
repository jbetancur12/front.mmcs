import axios from 'axios'
import { api } from 'src/config'

import { logger } from 'src/utils/logger'
export const axiosPublic = axios.create({
  baseURL: api(),
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
axiosPublic.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const axiosPrivate = axios.create({
  baseURL: api(),
  withCredentials: true
})
