import React from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Button,
  TextField,
  Container,
  Box,
  Typography,
  Paper
} from '@mui/material'
import { IModule, ModuleFormProps } from '../types/moduleTypes'
import useAxiosPrivate from '@utils/use-axios-private'

const validationSchema = Yup.object({
  name: Yup.string().required('Nombre es requerido'),
  label: Yup.string().required('Label es requerido'),
  description: Yup.string().max(500, 'Descripción muy larga')
})

const ModuleForm: React.FC<ModuleFormProps> = ({
  onSuccess,
  initialData,
  onCancel
}) => {
  const axiosPrivate = useAxiosPrivate()

  const formik = useFormik<Omit<IModule, 'id'>>({
    initialValues: initialData || {
      name: '',
      label: '',
      description: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        const endpoint = initialData ? `/modules/${initialData.id}` : '/modules'
        const method = initialData ? 'patch' : 'post'

        await axiosPrivate[method](endpoint, values)

        setStatus({ success: true })
        onSuccess?.()
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || 'Error al procesar el módulo'
        setStatus({ success: false, error: errorMessage })
      } finally {
        setSubmitting(false)
      }
    }
  })

  return (
    <Container maxWidth='sm'>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant='h5' gutterBottom>
          {initialData ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
        </Typography>

        <Box component='form' onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            margin='normal'
            id='name'
            name='name'
            label='Nombre del módulo'
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />

          <TextField
            fullWidth
            margin='normal'
            id='label'
            name='label'
            label='Label'
            value={formik.values.label}
            onChange={formik.handleChange}
            error={formik.touched.label && Boolean(formik.errors.label)}
            helperText={formik.touched.label && formik.errors.label}
          />

          <TextField
            fullWidth
            margin='normal'
            id='description'
            name='description'
            label='Descripción'
            multiline
            rows={4}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={
              formik.touched.description && Boolean(formik.errors.description)
            }
            helperText={formik.touched.description && formik.errors.description}
          />

          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}
          >
            {onCancel && (
              <Button
                variant='outlined'
                onClick={onCancel}
                disabled={formik.isSubmitting}
              >
                Cancelar
              </Button>
            )}

            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting
                ? 'Procesando...'
                : initialData
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </Box>

          {formik.status?.error && (
            <Typography color='error' sx={{ mt: 2 }}>
              {formik.status.error}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  )
}

export default ModuleForm
