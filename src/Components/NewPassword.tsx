import React, { useState } from 'react'

import toast from 'react-hot-toast'
import { axiosPublic } from '@utils/api'
import type { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Link as MuiLink, Stack } from '@mui/material'
import AuthLayout from 'src/Components/Common/AuthLayout'
import AuthField from 'src/Components/Common/AuthField'
import PasswordRequirements from 'src/Components/Common/PasswordRequirements'
import { isPasswordValid } from 'src/utils/passwordPolicy'
// import * as Yup from 'yup'; // Importa Yup para la validación

const PasswordGeneratorForm: React.FC = () => {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const code = urlParams.get('code')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // Define el esquema de validación del formulario con Yup
  // const validationSchema = Yup.object().shape({
  //   confirmPassword: Yup.string().required('La contraseña es obligatoria'),
  //   password: Yup.string().required('La contraseña es obligatoria'),
  // });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Enlace vencido o ya usado: el usuario debe pedir otro
  const [linkError, setLinkError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinkError(null)

    if (!isPasswordValid(formData.password)) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    try {
      const response = await axiosPublic.put(
        '/auth/new-password',
        { password: formData.password },
        { params: { code } }
      )
      if (response.status === 200) {
        window.location.href = '/login'
      }
    } catch (error) {
      const data = (
        error as AxiosError<{ code?: string; reasons?: string[] }>
      ).response?.data
      if (data?.code === 'WEAK_PASSWORD') {
        toast.error(data.reasons?.join('. ') || 'La contraseña no es segura')
      } else if (data?.code === 'CODE_EXPIRED') {
        setLinkError(
          'Este enlace venció. Solicita uno nuevo para crear tu contraseña.'
        )
      } else if (data?.code === 'INVALID_CODE') {
        setLinkError(
          'Este enlace no es válido o ya se usó. Solicita uno nuevo para crear tu contraseña.'
        )
      } else {
        toast.error('No se pudo guardar la contraseña. Inténtalo de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthLayout
      title='Crea tu nueva contraseña'
      subtitle='Escríbela dos veces para confirmar que quedó bien.'
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
      <Box component='form' onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <AuthField
            label='Nueva contraseña'
            type='password'
            id='password'
            name='password'
            required
            autoFocus
            autoComplete='new-password'
            value={formData.password}
            onChange={handleInputChange}
          />
          <PasswordRequirements password={formData.password} />
          <AuthField
            label='Confirmar contraseña'
            type='password'
            id='confirmPassword'
            name='confirmPassword'
            required
            autoComplete='new-password'
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
          {linkError && (
            <Alert
              severity='warning'
              sx={{ borderRadius: '8px' }}
              action={
                <MuiLink
                  component={Link}
                  to='/password-recovery'
                  underline='hover'
                  sx={{
                    fontWeight: 600,
                    color: '#00695c',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Pedir otro enlace
                </MuiLink>
              }
            >
              {linkError}
            </Alert>
          )}
          <Button
            type='submit'
            fullWidth
            disabled={saving}
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
            Guardar contraseña
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  )
}

export default PasswordGeneratorForm
