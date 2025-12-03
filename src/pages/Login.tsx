import { AxiosError } from 'axios' // Import Axios
import { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup' // Importa Yup para la validación

import { usePostHog } from 'posthog-js/react'

import { userStore } from 'src/store/userStore'
import { axiosPublic } from '@utils/api'
import Cookies from 'js-cookie'

// Función de utilidad para verificar si un objeto es de tipo AxiosError
function isAxiosError(obj: any): obj is AxiosError {
  return obj instanceof Error && 'isAxiosError' in obj
}

const Login: React.FC = () => {
  const posthog = usePostHog()
  const navigate = useNavigate()
  const [_loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })

  const [error, setError] = useState<string | null>(null) // Agrega estado para manejar errores

  // Define el esquema de validación del formulario con Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Ingresa un correo electrónico válido')
      .required('El correo electrónico es obligatorio'),
    password: Yup.string().required('La contraseña es obligatoria')
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

        case 403:
          if (
            error.response.data &&
            typeof error.response.data === 'object' &&
            'message' in error.response.data
          ) {
            const message = error.response.data.message
            if (
              message ===
              '"El cliente asociado está inactivo. Contacta al administrador.'
            ) {
              setError(
                '"El cliente asociado está inactivo. Contacta al administrador.'
              )
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

        case 429:
          setError(
            'Demasiados intentos de inicio de sesión. Por favor, espera un momento e inténtalo de nuevo.'
          )
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

    const data = {
      email: formData.email,
      contraseña: formData.password
    }

    try {
      await validationSchema.validate(formData, { abortEarly: false })

      const response = await axiosPublic
        .post(`/auth/login`, data, {
          withCredentials: true // Permite enviar cookies con la solicitud
        })
        .finally(() => {
          setLoading(false)
        })

      if (response.status === 200) {
        const { token, expiresIn, user } = response.data

        const expirationDate = new Date(expiresIn)
        Cookies.set('expiresIn', expiresIn.toString(), {
          expires: expirationDate, // Fecha de expiración real
          secure: true,
          sameSite: 'strict',
          path: '/'
        })

        userStore.set(user)
        // Handle successful login
        // toast.success("Bienvenido", {
        //   duration: 4000,
        //   position: "top-center",
        // });

        // Toast.fire('Bienvenido', '', 'success')
        const lastLocation = sessionStorage.getItem('lastLocation') || '/'

        // Limpiar lastLocation después de usarla
        sessionStorage.removeItem('lastLocation')

        navigate(lastLocation)

        localStorage.setItem('accessToken', token)

        posthog?.capture('clicked_log_in')
        posthog?.identify(response.data.user.id, {
          email: response.data.user.email
        })
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
      // Toast.fire('Error', error.message, 'error')
    }
  }

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      const lastLocation = sessionStorage.getItem('lastLocation') || '/'
      sessionStorage.removeItem('lastLocation')
      navigate(lastLocation)
    }
  }, [])

  return (
    <div className='flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen pt:mt-0 dark:bg-gray-900'>
      <a
        href='/'
        className='flex items-center justify-center mb-8 text-2xl font-semibold lg:mb-10 dark:text-white'
      >
        <img
          src='/images/logo2.png'
          className='mr-4 h-28'
          alt='Metromedics Logo Logo'
        />
        {/* <span>Metromedics S.A.S</span> */}
      </a>

      <div className='w-full max-w-xl p-6 space-y-8 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Ingresa a la plataforma{' '}
        </h2>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor='email'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              Email
            </label>
            <input
              type='email'
              name='email'
              id='email'
              className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
              placeholder='name@company.com'
              required
              value={formData.email}
              onChange={handleInputChange}
              autoComplete='email'
            />
          </div>
          <div>
            <label
              htmlFor='password'
              className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
            >
              Contraseña
            </label>
            {/* <span>------------------</span> */}
            <input
              type='password'
              name='password'
              id='password'
              placeholder='••••••••'
              className='bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
              required
              value={formData.password}
              onChange={handleInputChange}
              autoComplete='password'
            />
          </div>

          <div className='flex justify-between items-center'>
            <button
              type='submit'
              className='w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800'
            >
              Ingresar a tu cuenta
            </button>

            <Link
              to='/password-recovery'
              className='text-blue-500 hover:text-blue-800'
            >
              Recordar Contraseña
            </Link>
          </div>
          {error && (
            <p className='text-red-500 text-sm mt-2'>{error}</p> // Mostrar el mensaje de error si existe
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
