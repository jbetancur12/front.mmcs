import React, { useEffect, useState } from 'react'
import { userStore } from '../../store/userStore'
import { api } from '../../config'
import useAxiosPrivate from '@utils/use-axios-private'

interface RequireAuthProps {
  children: React.ReactNode
}

const apiUrl = api()

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const axiosPrivate = useAxiosPrivate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error('Token no encontrado')
        }

        const response = await axiosPrivate.get(`${apiUrl}/auth/validateToken`)

        if (!(response.status === 200)) {
          throw new Error('Token no válido')
        }

        console.log('Entro aca')

        const userData = await response.data
        userStore.set(userData.user)
      } catch (error) {
        console.log('Error al validar el token:', error)
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  if (loading) {
    return (
      <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white opacity-80'>
        <div
          className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
          role='status'
        >
          <span className='!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]'>
            Loading...
          </span>
        </div>
      </div>
    )
  }

  return children
}

export default RequireAuth
