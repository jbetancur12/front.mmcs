import React from 'react'
import { useNavigate } from 'react-router-dom'

const NotAuthorizedPage: React.FC = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // Regresar a la página anterior
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-neutral-head'>
      <div className='bg-neutral-surface p-8 rounded-lg shadow-lg text-center'>
        <h1 className='text-4xl font-bold text-intent-danger mb-4'>403</h1>
        <h2 className='text-2xl font-semibold mb-2'>Acceso Denegado</h2>
        <p className='text-neutral-body mb-6'>
          No tienes permisos suficientes para acceder a esta página.
        </p>
        <button
          onClick={handleGoBack}
          className='bg-intent-info text-white px-6 py-2 rounded-md shadow-md hover:bg-intent-action focus:outline-none'
        >
          Regresar
        </button>
      </div>
    </div>
  )
}

export default NotAuthorizedPage
