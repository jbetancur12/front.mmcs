import { axiosPublic } from '@utils/api'
import { AxiosError, isAxiosError } from 'axios'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from 'src/config'
import * as Yup from 'yup' // Importa Yup para la validación
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Link as MuiLink, Stack } from '@mui/material'
import AuthLayout from 'src/Components/Common/AuthLayout'
import AuthField from 'src/Components/Common/AuthField'

import { logger } from 'src/utils/logger'
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
        setError('No pudimos enviar el enlace. Inténtalo de nuevo más tarde.')
      }
    }
  }

  function handleNetworkError(error: AxiosError) {
    logger.error('An error occurred:', error)

    if (!error.response) {
      setError(
        'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
      )
      return
    }

    // La API responde igual exista o no el correo: aquí solo llegan el límite de intentos y las fallas
    if (error.response.status === 429) {
      setError(
        'Hiciste demasiados intentos. Espera 10 minutos antes de pedir otro enlace.'
      )
      return
    }

    setError('No pudimos enviar el enlace. Inténtalo de nuevo más tarde.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      email: formData.email
    }

    try {
      await validationSchema.validate(formData, { abortEarly: false })

      const response = await axiosPublic.post(
        `${apiUrl}/auth/recover-password`,
        data
      )

      if (response.status === 201) {
        // Handle successful login
        toast.success('Si el correo está registrado, recibirás un enlace.')

        setTimeout(() => {
          window.location.href = '/login'
          setLoading(false)
        }, 3000)

        setError(null)
      } else {
        setError('No pudimos enviar el enlace. Inténtalo de nuevo más tarde.')
        setLoading(false)
      }
    } catch (error: any) {
      // Handle network error or other exceptions
      handleValidationOrNetworkError(error)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title='Recupera tu contraseña'
      subtitle='Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.'
      footer={
        <MuiLink
          component={Link}
          to='/login'
          underline='hover'
          sx={{ fontWeight: 600, color: '#00695c' }}
        >
          Volver a iniciar sesión
        </MuiLink>
      }
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
          {error && (
            <Alert severity='error' sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
          <Button
            type='submit'
            fullWidth
            disabled={loading}
            sx={{
              height: 48,
              borderRadius: '12px',
              bgcolor: '#00bfa5',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#00acc1' },
              '&.Mui-disabled': {
                bgcolor: '#00bfa5',
                color: '#ffffff',
                opacity: 0.6
              }
            }}
          >
            {loading ? 'Enviando enlace…' : 'Enviar enlace'}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  )
}

export default PasswordRecovery
