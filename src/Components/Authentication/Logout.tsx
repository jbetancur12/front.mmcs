import { axiosPublic } from '@utils/api'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { bigToast, Toast } from '../ExcelManipulation/Utils'

const LogoutButton: React.FC = () => {
  const navigate = useNavigate()
  const handleLogout = async () => {
    // Borra el token del localStorage
    const response = await axiosPublic.post(
      '/auth/logout',
      {},
      {
        withCredentials: true
      }
    )

    if (response.status !== 200) {
      bigToast('Error al cerrar sesión', 'error')
      throw new Error('Error al cerrar sesión')
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('columnFiltersCustomers') // Limpiar filtros
    localStorage.removeItem('columnFiltersHV') // Limpiar filtros
    Toast.fire('Sesión cerrada exitosamente', '', 'success')

    // Redirige al usuario a la página de inicio de sesión
    navigate('/login') // Cambia '/login' por la ruta de tu página de inicio de sesión
  }

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
