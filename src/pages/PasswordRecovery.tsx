import axios, { AxiosError, isAxiosError } from 'axios'
import React, { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import * as Yup from 'yup' // Importa Yup para la validación
import { api } from '../config'

const apiUrl = api()

const PasswordRecovery: React.FC = () => {
  const [formData, setFormData] = useState({
    email: ''
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Define el esquema de validación del formulario con Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Ingresa un correo electrónico válido')
      .required('El correo electrónico es obligatorio')
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  function handleValidationOrNetworkError(error: AxiosError | Error) {
    if (error instanceof Yup.ValidationError) {
      const errorMessage = error.errors[0]
      setError(errorMessage)
    } else {
      // Verificar si error es de tipo AxiosError antes de acceder a response
      if (isAxiosError(error) && error.response) {
        handleNetworkError(error)
      } else {
        // Manejar otros tipos de errores aquí
      }
    }
  }

  function handleNetworkError(error: AxiosError) {
    console.error('An error occurred:', error)

    if (error.response) {
      switch (error.response.status) {
        case 401:
          setError(
            'Credenciales incorrectas. Por favor, verifica tus credenciales.'
          )
          break
        case 400:
          const responseData = error.response.data

          if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData
          ) {
            const message = responseData.message
            if (message === 'You are not verified') {
              setError('La cuenta aún no ha sido activada')
            } else {
              setError(
                'Error de inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
              )
            }
          } else {
            setError(
              'Error de inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
            )
          }
          break
        default:
          setError(
            'Ocurrió un error durante el inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
          )
          break
      }
    } else {
      setError(
        'Ocurrió un error de red. Por favor, verifica tu conexión e inténtalo de nuevo.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      email: formData.email
    }

    try {
      await validationSchema.validate(formData, { abortEarly: false })

      const response = await axios.post(`${apiUrl}/auth/recover-password`, data)

      if (response.status === 201) {
        // Handle successful login
        toast.success('Email para recuperación enviado', {
          duration: 4000,
          position: 'top-center'
        })

        setTimeout(() => {
          window.location.href = '/login'
          setLoading(false)
        }, 3000)

        setError(null)
      } else {
        // Handle login error
        if (response.status === 401) {
          setError(
            'Credenciales incorrectas. Por favor, verifica tus credenciales.'
          )
        } else {
          setError(
            'Error de inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
          )
        }
      }
    } catch (error: any) {
      // Handle network error or other exceptions
      handleValidationOrNetworkError(error)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen pt:mt-0 dark:bg-gray-900'>
      <Toaster />
      <a
        href='/'
        className='flex items-center justify-center mb-8 text-2xl font-semibold lg:mb-10 dark:text-white'
      >
        <img
          src='/images/logo2.png'
          className='mr-4 h-11'
          alt='Metromedics Logo Logo'
        />
        {/* <span>Metromedics S.A.S</span> */}
      </a>
      <div className='w-full max-w-xl p-6 space-y-4 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Restablecer Contraseña
        </h2>
        <p>
          Introduce tu dirección de correo electrónico y te enviaremos un código
          de verificación para restablecer tu contraseña
        </p>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div>
            <input
              type='email'
              name='email'
              id='email'
              className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
              placeholder='name@company.com'
              required
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <button
            type='submit'
            className='w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
            disabled={loading}
          >
            {!loading ? 'Enviar' : 'Enviando...'}
          </button>
          {error && (
            <p className='text-red-500 text-sm mt-2'>{error}</p> // Mostrar el mensaje de error si existe
          )}
        </form>
      </div>
    </div>
  )
}

export default PasswordRecovery
