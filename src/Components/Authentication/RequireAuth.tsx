import React, { useEffect, useState } from 'react'
import { userStore } from '../../store/userStore'
import { api } from '../../config'
import useAxiosPrivate from '@utils/use-axios-private'
import useRefreshToken from '@utils/use-refresh-token'
import { useNavigate, useLocation } from 'react-router-dom'

interface RequireAuthProps {
  children: React.ReactNode
}
interface Role {
  name: string
  // agrega otros campos si es necesario
}

const apiUrl = api()

const clearInvalidSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('sessionExpiresAt')
  localStorage.removeItem('user')
  localStorage.removeItem('userProfile')

  userStore.set({
    nombre: '',
    email: '',
    rol: [''],
    userType: 'internal',
    lmsOnly: false,
    customer: {
      id: 0,
      nombre: '',
      modules: []
    }
  })
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const axiosPrivate = useAxiosPrivate()
  const refresh = useRefreshToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      try {
        let token = localStorage.getItem('accessToken')

        if (!token) {
          const refreshResult = await refresh()
          token = refreshResult.accessToken

          if (!token) {
            throw new Error('Token no encontrado')
          }

          localStorage.setItem('accessToken', token)
        }

        const response = await axiosPrivate.get(`${apiUrl}/auth/validateToken`)

        if (!(response.status === 200)) {
          throw new Error('Token no válido')
        }

        const { ...user } = await response.data

        const resolvedRoles = Array.isArray(user.rol)
          ? user.rol
          : Array.isArray(user.roles)
            ? user.roles.map((role: Role | string) =>
                typeof role === 'string' ? role : role.name
              )
            : []

        const formattedUser = {
          ...user,
          rol: resolvedRoles,
          lmsOnly: Boolean(user.lmsOnly)
        }
        userStore.set(formattedUser)
      } catch (error) {
        console.log('Error al validar el token:', error)
        const currentPath = location.pathname + location.search
        clearInvalidSession()
        sessionStorage.setItem('lastLocation', currentPath)
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [axiosPrivate, location.pathname, location.search, navigate, refresh])

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
