import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  Stack
} from '@mui/material'
import { Edit, Delete, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { InterventionType } from './types'
import GenericFormModal, { FieldConfig } from './GenericFormModal'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { bigToast } from '../ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const validationSchema = yup.object().shape({
  name: yup.string().required('Nombre es obligatorio'),
  requiresReminder: yup.boolean(),
  description: yup.string().required('Descripción es obligatoria')
})

const fetchInterventionTypes = async (): Promise<InterventionType[]> => {
  const axiosPrivate = useAxiosPrivate()
  const { data } = await axiosPrivate.get(`/interventionType`)
  return data
}

const InterventionTypes = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()

  const [modalOpen, setModalOpen] = useState(false)
  const [currentType, setCurrentType] = useState<InterventionType | null>(null)

  const { data: interventionTypes = [] } = useQuery(
    'interventionType',
    fetchInterventionTypes
  )

  const createOrUpdateInterventionType = useMutation(
    async (newData: InterventionType) => {
      return currentType
        ? axiosPrivate.put(`/interventionType/${currentType.id}`, newData)
        : axiosPrivate.post(`/interventionType`, newData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('interventionType')
        bigToast(
          currentType
            ? 'Tipo de Intervención Actualizado Exitosamente!'
            : 'Tipo de Intervención Creado Exitosamente!',
          'success'
        )
        setModalOpen(false)
      },
      onError: (error: any) => {
        bigToast(
          `Error: ${error.response?.data?.message || error.message}`,
          'error'
        )
      }
    }
  )

  const deleteInterventionType = useMutation(
    async (id: number) => {
      const { status } = await axiosPrivate.delete(`/interventionType/${id}`)
      if (status !== 204)
        throw new Error('Error al eliminar el tipo de intervención')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('interventionType')
        bigToast('Tipo de Intervención Eliminado Exitosamente!', 'success')
      },
      onError: (error: any) => {
        bigToast(
          `Error: ${error.response?.data?.message || error.message}`,
          'error'
        )
      }
    }
  )

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar Tipo de Intervención?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      deleteInterventionType.mutate(id)
    }
  }

  const handleEdit = (id: number) => {
    const typeToEdit = interventionTypes.find((type) => type.id === id)
    if (typeToEdit) {
      setCurrentType(typeToEdit)
      formik.setValues(typeToEdit)
      setModalOpen(true)
    }
  }

  const handleAddNew = () => {
    setCurrentType(null)
    setModalOpen(true)
  }

  const handleFormSubmit = (values: Record<string, any>) => {
    const payload: Omit<InterventionType, 'id'> = {
      name: values.name,
      requiresReminder: values.requiresReminder,
      description: values.description
    }

    if (currentType?.id !== undefined) {
      createOrUpdateInterventionType.mutate({ ...payload, id: currentType.id })
    } else {
      createOrUpdateInterventionType.mutate(payload)
    }
  }

  const formik = useFormik<InterventionType>({
    initialValues: {
      name: '',
      requiresReminder: false,
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      handleFormSubmit(values)
      resetForm()
    }
  })

  const fields: FieldConfig[] = [
    { accessorKey: 'name', header: 'Nombre', type: 'text' },
    {
      accessorKey: 'requiresReminder',
      header: 'Requiere Recordatorio',
      type: 'checkbox'
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      type: 'text'
    }
  ]

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Stack direction='row' spacing={2} mb={2}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant='h4'>Tipos de Intervención</Typography>
        </Stack>

        <Button variant='contained' onClick={handleAddNew}>
          Agregar Nuevo
        </Button>
      </Box>
      <Grid container spacing={2}>
        {interventionTypes.map((type) => (
          <Grid item xs={12} sm={6} md={4} key={type.id}>
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant='h5' gutterBottom>
                  {type.name}
                </Typography>
                <Typography variant='body2'>
                  Requiere Recordatorio: {type.requiresReminder ? 'Sí' : 'No'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleEdit(type.id as number)}>
                  <Edit />
                </IconButton>
                <IconButton
                  color='error'
                  onClick={() => handleDelete(type.id as number)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <GenericFormModal
        open={modalOpen}
        fields={fields}
        onClose={() => setModalOpen(false)}
        formik={formik}
        submitButtonText={currentType ? 'Actualizar' : 'Crear'}
      />
    </Box>
  )
}

export default InterventionTypes
