import { useStore } from '@nanostores/react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userStore } from '../../store/userStore'
import { api } from '../../config'
import toast from 'react-hot-toast'

interface RequireAuthProps {
  children: React.ReactNode
}

const apiUrl = api()

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const $userStore = useStore(userStore)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authenticationError, setAuthenticationError] = useState(false) // Nueva variable de estado

  const navigate = useNavigate()

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error('Token no encontrado')
        }

        const response = await fetch(`${apiUrl}/auth/validateToken`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Token no válido')
        }

        const userData = await response.json()
        userStore.set(userData.user)
        setLoading(false)
      } catch (error) {
        setLoading(false)
        setError('No se pudo validar el token') // Mensaje de error informativo
        setAuthenticationError(true)
        toast('Su sesión se cerrar en 10 segundos')
        setTimeout(() => {
          navigate('/login')
        }, 10000) // Mostrar un mensaje de error al usuario
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

  if (error) {
    return <div>Error: {error}</div>
  }

  return children
}

export default RequireAuth
