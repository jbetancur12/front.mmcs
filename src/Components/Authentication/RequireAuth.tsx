import { useStore } from '@nanostores/react'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { userStore } from '../../store/userStore'
import { api } from '../../config'
import toast from 'react-hot-toast'
import useAxiosPrivate from '@utils/use-axios-private'

interface RequireAuthProps {
  children: React.ReactNode
}

const apiUrl = api()

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const [loading, setLoading] = useState(true)
  const [authenticationError, setAuthenticationError] = useState(false) // Nueva variable de estado

  const navigate = useNavigate()
  const location = useLocation()

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

        const userData = await response.data
        userStore.set(userData.user)
      } catch (error) {
        sessionStorage.setItem('lastLocation', location.pathname)

        setAuthenticationError(true)
        toast('Su sesión se cerrara en 10 segundos')
        setTimeout(() => {
          navigate('/login')
        }, 10000) // Mostrar un mensaje de error al usuario
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [])

  // Verificar si el usuario está autenticado después de que se haya establecido el $userStore
  if (!Object.keys($userStore).length || authenticationError) {
    // Utiliza navigate para redirigir al usuario a la página de inicio de sesión
    navigate('/login')

    return null
  }

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
