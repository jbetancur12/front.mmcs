// src/pages/Admin/FiscalParametersManagementPage.tsx (o donde corresponda)
import React, { useState } from 'react'
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Chip
} from '@mui/material'
import { Edit, Delete, Add, Save, Cancel } from '@mui/icons-material' // Importar Save y Cancel
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'
import { SelectChangeEvent } from '@mui/material/Select'

interface FiscalParameter {
  id: number
  keyName: string
  value: string
  valueType: 'PERCENTAGE' | 'AMOUNT' | 'RATE_DECIMAL' | 'TEXT'
  description?: string
  isActive: boolean
  createdAt?: string // Sequelize los añade
  updatedAt?: string // Sequelize los añade
}

const initialFormValues: Omit<
  FiscalParameter,
  'id' | 'createdAt' | 'updatedAt'
> = {
  keyName: '',
  value: '',
  valueType: 'TEXT',
  description: '',
  isActive: true
}

const valueTypeOptions: FiscalParameter['valueType'][] = [
  'PERCENTAGE',
  'AMOUNT',
  'RATE_DECIMAL',
  'TEXT'
]

const FiscalParametersManagementPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [openDialog, setOpenDialog] = useState(false)
  const [editingParam, setEditingParam] = useState<FiscalParameter | null>(null)
  const [formValues, setFormValues] =
    useState<Omit<FiscalParameter, 'id' | 'createdAt' | 'updatedAt'>>(
      initialFormValues
    )

  const {
    data: fiscalParams = [], // Default to empty array
    isLoading,
    error
    // refetch // no es necesario si invalidamos queries
  } = useQuery<FiscalParameter[], Error>(
    'fiscalParametersListManageable',
    async () => {
      const response = await axiosPrivate.get<FiscalParameter[]>(
        '/fiscal-parameters/manageable'
      )
      return response.data
    }
  )

  const mutationOptions = {
    onSuccess: (_data: unknown, _variables: unknown, _context: unknown) => {
      queryClient.invalidateQueries('fiscalParametersListManageable')
      queryClient.invalidateQueries('activeFiscalSettings') // Para que GenerateOrderModal también se refresque
      handleCloseDialog()
    },
    onError: (err: unknown) => {
      console.error('Error en la operación del parámetro fiscal:', err)
      let errorMessage = 'Ocurrió un error.'
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data
        errorMessage =
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.errors)
              ? data.errors.join(', ')
              : JSON.stringify(data)
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      Swal.fire('Error', errorMessage, 'error')
    }
  }

  const createMutation = useMutation(
    (paramData: Omit<FiscalParameter, 'id' | 'createdAt' | 'updatedAt'>) =>
      axiosPrivate.post('/fiscal-parameters', paramData),
    {
      ...mutationOptions,
      onSuccess: (...args) => {
        Swal.fire('Creado', 'Parámetro fiscal creado con éxito.', 'success')
        mutationOptions.onSuccess(...args)
      }
    }
  )

  const updateMutation = useMutation(
    (paramData: Partial<FiscalParameter> & { id: number }) =>
      axiosPrivate.put(`/fiscal-parameters/${paramData.id}`, paramData),
    {
      ...mutationOptions,
      onSuccess: (...args) => {
        Swal.fire(
          'Actualizado',
          'Parámetro fiscal actualizado con éxito.',
          'success'
        )
        mutationOptions.onSuccess(...args)
      }
    }
  )

  const deleteMutation = useMutation(
    (id: number) => axiosPrivate.delete(`/fiscal-parameters/${id}`),
    {
      ...mutationOptions,
      onSuccess: (...args) => {
        Swal.fire(
          'Eliminado',
          'Parámetro fiscal eliminado con éxito.',
          'success'
        )
        mutationOptions.onSuccess(...args)
      }
    }
  )

  const handleOpenDialog = (param: FiscalParameter | null = null) => {
    if (param) {
      setEditingParam(param)
      setFormValues({
        keyName: param.keyName,
        value: param.value,
        valueType: param.valueType,
        description: param.description || '',
        isActive: param.isActive
      })
    } else {
      setEditingParam(null)
      setFormValues(initialFormValues)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingParam(null)
  }

  const handleFormChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<FiscalParameter['valueType']>
  ) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name!]: value }))
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setFormValues((prev) => ({ ...prev, [name!]: checked }))
  }

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (
      !formValues.keyName?.trim() ||
      !formValues.value?.trim() ||
      !formValues.valueType
    ) {
      Swal.fire(
        'Validación',
        'Los campos "Key Name", "Valor" y "Tipo de Valor" son requeridos.',
        'warning'
      )
      return
    }
    if (editingParam) {
      updateMutation.mutate({ ...formValues, id: editingParam.id })
    } else {
      createMutation.mutate(formValues)
    }
  }

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará permanentemente el parámetro. ¡No podrás revertirlo!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id)
      }
    })
  }

  if (isLoading)
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />{' '}
        <Typography sx={{ ml: 1 }}>Cargando parámetros fiscales...</Typography>
      </Container>
    )

  if (error)
    return (
      <Container sx={{ mt: 2 }}>
        <Alert severity='error'>
          Error al cargar parámetros fiscales: {error.message}
        </Alert>
      </Container>
    )

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' component='h1'>
          Gestión de Parámetros Fiscales
        </Typography>
        <Button
          variant='contained'
          color='primary'
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Parámetro
        </Button>
      </Box>
      <Paper elevation={2}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Clave (keyName)
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo de Valor</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                  Descripción
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Activo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fiscalParams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No hay parámetros fiscales definidos.
                  </TableCell>
                </TableRow>
              )}
              {fiscalParams.map((param) => (
                <TableRow hover key={param.id}>
                  <TableCell>{param.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {param.keyName}
                  </TableCell>
                  <TableCell>{param.value}</TableCell>
                  <TableCell>
                    <Chip label={param.valueType} size='small' />
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={param.description}
                  >
                    {param.description}
                  </TableCell>
                  <TableCell>
                    {param.isActive ? (
                      <Chip label='Sí' color='success' size='small' />
                    ) : (
                      <Chip label='No' color='default' size='small' />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      onClick={() => handleOpenDialog(param)}
                      color='primary'
                      size='small'
                      title='Editar'
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(param.id)}
                      color='error'
                      size='small'
                      title='Eliminar'
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
        PaperProps={{ component: 'form', onSubmit: handleFormSubmit }}
      >
        <DialogTitle>
          {editingParam ? 'Editar Parámetro Fiscal' : 'Nuevo Parámetro Fiscal'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label='Nombre Clave (Key Name)'
                name='keyName'
                required
                fullWidth
                value={formValues.keyName || ''}
                onChange={handleFormChange}
                helperText='Ej: PURCHASE_RETENTION_RATE (único, no editable después)'
                InputProps={{ readOnly: !!editingParam }} // KeyName no se edita
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Valor'
                name='value'
                required
                fullWidth
                value={formValues.value || ''}
                onChange={handleFormChange}
                helperText='Ej: 0.025, 19, 1345000, texto...'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id='valueType-dialog-label'>
                  Tipo de Valor
                </InputLabel>
                <Select
                  labelId='valueType-dialog-label'
                  name='valueType'
                  label='Tipo de Valor'
                  value={formValues.valueType}
                  onChange={handleFormChange}
                >
                  {valueTypeOptions.map((vt) => (
                    <MenuItem key={vt} value={vt}>
                      {vt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Descripción (Opcional)'
                name='description'
                fullWidth
                multiline
                rows={3}
                value={formValues.description || ''}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formValues.isActive}
                    onChange={handleSwitchChange}
                    name='isActive'
                  />
                }
                label='Parámetro Activo'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            startIcon={<Save />}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Guardando...'
              : editingParam
                ? 'Actualizar'
                : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default FiscalParametersManagementPage
