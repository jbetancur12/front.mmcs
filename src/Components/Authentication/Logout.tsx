import { axiosPublic } from '@utils/api'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { notify } from 'src/utils/notify'
import { userStore } from '../../store/userStore'

/** Cierra la sesión en el servidor, limpia el estado local y lleva al login. */
export const useLogout = () => {
  const navigate = useNavigate()
  return async () => {
    // Borra el token del localStorage
    const response = await axiosPublic.post(
      '/auth/logout',
      {},
      {
        withCredentials: true
      }
    )

    if (response.status !== 200) {
      notify.error('Error al cerrar sesión')
      throw new Error('Error al cerrar sesión')
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('sessionExpiresAt')
    localStorage.removeItem('impersonator')
    localStorage.removeItem('impersonationTarget')
    localStorage.removeItem('columnFiltersCustomers') // Limpiar filtros
    localStorage.removeItem('columnFiltersHV') // Limpiar filtros
    userStore.set({
      nombre: '',
      email: '',
      rol: [''],
      permissions: [],
      userType: 'internal',
      lmsOnly: false,
      customer: {
        id: 0,
        nombre: '',
        modules: []
      }
    })
    notify.success('Sesión cerrada exitosamente')

    // Redirige al usuario a la página de inicio de sesión
    navigate('/login') // Cambia '/login' por la ruta de tu página de inicio de sesión
  }
}

const LogoutButton: React.FC = () => {
  const handleLogout = useLogout()

  return (
    <a
      href='#'
      onClick={handleLogout}
      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white'
    >
      {' '}
      Cerrar Sesión
    </a>
  )
}

export default LogoutButton
