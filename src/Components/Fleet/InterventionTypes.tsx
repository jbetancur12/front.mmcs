import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
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
import { api } from '../../config'
import { useNavigate } from 'react-router-dom'
import { InterventionType } from './types'
import GenericFormModal, { FieldConfig } from './GenericFormModal'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { bigToast } from '../ExcelManipulation/Utils'

const apiUrl = api()

const validationSchema = yup.object().shape({
  name: yup.string().required('Nombre es obligatorio'),
  requiresReminder: yup.boolean(),
  description: yup.string().required('Descripción es obligatoria')
})

const fetchInterventionTypes = async (): Promise<InterventionType[]> => {
  const { data } = await axios.get(`${apiUrl}/interventionType`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    }
  })
  return data
}

const InterventionTypes = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [currentType, setCurrentType] = useState<InterventionType | null>(null)

  const { data: interventionTypes = [] } = useQuery(
    'interventionType',
    fetchInterventionTypes
  )

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

  const createOrUpdateInterventionType = useMutation(
    async (newData: InterventionType) => {
      if (currentType) {
        // Update existing type
        await axios.put(
          `${apiUrl}/interventionType/${currentType.id}`,
          newData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )
      } else {
        // Create new type

        await axios.post(`${apiUrl}/interventionType`, newData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('interventionType')
        bigToast('Tipo de Intervención Creado Exitosamente!', 'success')
        setModalOpen(false)
      }
    }
  )

  const deleteInterventionType = useMutation(
    async (id: number) => {
      const { status } = await axios.delete(
        `${apiUrl}/interventionType/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      if (status !== 204) {
        throw new Error('Error al eliminar el tipo de intervención')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('interventionType')
      }
    }
  )

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        '¿Está seguro que desea eliminar este tipo de intervención?'
      )
    ) {
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
    // Crear el objeto base sin el id
    const payload: Omit<InterventionType, 'id'> = {
      name: values.name,
      requiresReminder: values.requiresReminder,
      description: values.description
    }

    // Agregar el id solo si existe
    if (currentType?.id !== undefined) {
      createOrUpdateInterventionType.mutate({ ...payload, id: currentType.id })
    } else {
      createOrUpdateInterventionType.mutate(payload)
    }
  }

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
                <IconButton
                  onClick={() => {
                    if (type.id !== undefined) {
                      handleEdit(type.id)
                    }
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color='error'
                  onClick={() => {
                    if (type.id !== undefined) {
                      handleDelete(type.id)
                    }
                  }}
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