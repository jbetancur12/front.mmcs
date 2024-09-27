import axios from 'axios'
import { api } from 'src/config'

export const axiosPublic = axios.create({
  baseURL: api()
})

export const axiosPrivate = axios.create({
  baseURL: api()
})
