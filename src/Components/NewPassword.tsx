import React, { useState } from 'react'

import { Toast } from './ExcelManipulation/Utils'
import { axiosPublic } from '@utils/api'
import { Link } from 'react-router-dom'
import { Box, Button, Link as MuiLink, Stack } from '@mui/material'
import AuthLayout from 'src/Components/Common/AuthLayout'
import AuthField from 'src/Components/Common/AuthField'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password === formData.confirmPassword) {
      const response = await axiosPublic.put(
        `/auth/new-password/?code=${code}`,
        {
          password: formData.password
        }
      )
      if (response.status == 200) {
        window.location.href = '/login'
      }
    } else {
      Toast.fire('Las contraseñas no coinciden', '', 'error')
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
          <Button
            type='submit'
            fullWidth
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
