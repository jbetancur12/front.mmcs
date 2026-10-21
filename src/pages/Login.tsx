import { AxiosError } from 'axios' // Import Axios
import { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup' // Importa Yup para la validación

import { usePostHog } from 'posthog-js/react'

import { userStore } from 'src/store/userStore'
import { getPreferredPostLoginRoute } from 'src/utils/lmsIdentity'
import { axiosPublic } from '@utils/api'
import Cookies from 'js-cookie'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  Stack
} from '@mui/material'
import AuthLayout from 'src/Components/Common/AuthLayout'
import AuthField from 'src/Components/Common/AuthField'

// Función de utilidad para verificar si un objeto es de tipo AxiosError
function isAxiosError(obj: any): obj is AxiosError {
  return obj instanceof Error && 'isAxiosError' in obj
}

const clearStaleAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('sessionExpiresAt')
  localStorage.removeItem('impersonator')
  localStorage.removeItem('impersonationTarget')
  localStorage.removeItem('user')
  localStorage.removeItem('userProfile')
}

const Login: React.FC = () => {
  const posthog = usePostHog()
  const navigate = useNavigate()
  const [_loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
      if (isAxiosError(error)) {
        handleNetworkError(error)
      } else {
        setError(
          'Ocurrió un error durante el inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
        )
      }
    }
  }

  function handleNetworkError(error: AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          setError(
            'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'
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
              setError(
                'Tu cuenta aún no está activada. Revisa el correo de activación.'
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
                'El cliente asociado está inactivo. Contacta al administrador.'
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
            'Hiciste demasiados intentos. Espera un minuto e inténtalo de nuevo.'
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
        'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      email: formData.email,
      contraseña: formData.password
    }

    setError(null)
    setSubmitting(true)

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
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
          path: '/'
        })
        localStorage.setItem('sessionExpiresAt', expiresIn.toString())

        userStore.set({
          nombre: user.name || '',
          email: user.email || '',
          rol: user.rol || [],
          userType: user.userType || 'internal',
          lmsOnly: Boolean(user.lmsOnly),
          customer: {
            id: 0,
            nombre: '',
            modules: []
          }
        })
        // Handle successful login
        // toast.success("Bienvenido", {
        //   duration: 4000,
        //   position: "top-center",
        // });

        // Toast.fire('Bienvenido', '', 'success')
        const lastLocation = sessionStorage.getItem('lastLocation')
        const preferredDestination = getPreferredPostLoginRoute({
          lastLocation,
          roles: user.rol || [],
          userType: user.userType || 'internal',
          lmsOnly: Boolean(user.lmsOnly)
        })

        // Limpiar lastLocation después de usarla
        sessionStorage.removeItem('lastLocation')

        localStorage.setItem('accessToken', token)
        navigate(preferredDestination, { replace: true })

        posthog?.capture('clicked_log_in')
        posthog?.identify(response.data.user.id, {
          email: response.data.user.email
        })
        setError(null)
      } else {
        // Handle login error
        if (response.status === 401) {
          setError(
            'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'
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
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const validateExistingSession = async () => {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await axiosPublic.get('/auth/validateToken', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!isMounted) return

        const user = response.data || {}
        const lastLocation = sessionStorage.getItem('lastLocation')
        const resolvedRoles = Array.isArray(user.rol)
          ? user.rol
          : Array.isArray(user.roles)
            ? user.roles.map((role: { name?: string } | string) =>
                typeof role === 'string' ? role : role?.name || ''
              )
            : []
        const preferredDestination = getPreferredPostLoginRoute({
          lastLocation,
          roles: resolvedRoles,
          userType: user.userType || 'internal',
          lmsOnly: Boolean(user.lmsOnly)
        })
        sessionStorage.removeItem('lastLocation')
        navigate(preferredDestination, { replace: true })
      } catch (error) {
        clearStaleAuth()
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    validateExistingSession()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <AuthLayout
      title='Ingresa a la plataforma'
      subtitle='Usa el correo y la contraseña de tu cuenta Metromedics.'
    >
      <Box component='form' noValidate onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <AuthField
            label='Correo electrónico'
            type='email'
            name='email'
            id='email'
            placeholder='nombre@empresa.com'
            required
            autoFocus
            autoComplete='email'
            value={formData.email}
            onChange={handleInputChange}
          />
          <Box>
            <AuthField
              label='Contraseña'
              type='password'
              name='password'
              id='password'
              required
              autoComplete='current-password'
              value={formData.password}
              onChange={handleInputChange}
            />
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <MuiLink
                component={Link}
                to='/password-recovery'
                underline='hover'
                sx={{ fontSize: 14, fontWeight: 600, color: '#00695c' }}
              >
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Box>
          </Box>

          {error && (
            <Alert severity='error' sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <Button
            type='submit'
            fullWidth
            disabled={submitting}
            sx={{
              height: 48,
              borderRadius: '12px',
              bgcolor: '#00bfa5',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: '#00acc1' },
              '&.Mui-disabled': {
                bgcolor: '#00bfa5',
                color: '#ffffff',
                opacity: 0.6
              }
            }}
          >
            {submitting ? (
              <>
                <CircularProgress size={18} sx={{ color: '#ffffff', mr: 1 }} />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  )
}

export default Login
