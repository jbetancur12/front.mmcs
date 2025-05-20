// src/pages/Admin/FiscalParametersManagementPage.tsx (o la ubicación que prefieras)

import React, { useState, ChangeEvent } from 'react'
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
  Chip,
  Tooltip
} from '@mui/material'
import {
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import Swal from 'sweetalert2'
import { isAxiosError, AxiosResponse } from 'axios'
import { SelectChangeEvent } from '@mui/material/Select'
import { NumericFormat, NumberFormatValues } from 'react-number-format'

// Interfaz para los parámetros fiscales
interface FiscalParameter {
  id: number
  keyName: string
  value: string // Se guarda como string, se interpreta/formatea según valueType
  valueType: 'PERCENTAGE' | 'AMOUNT' | 'RATE_DECIMAL' | 'TEXT'
  description?: string
  isActive: boolean
  createdAt?: string // Sequelize los añade
  updatedAt?: string // Sequelize los añade
}

// Tipos para las variables de mutación y los datos de respuesta
type CreateFiscalParameterVariables = Omit<
  FiscalParameter,
  'id' | 'createdAt' | 'updatedAt'
>
type UpdateFiscalParameterVariables =
  Partial<CreateFiscalParameterVariables> & { id: number }
type FiscalParameterMutationResponse = FiscalParameter

const initialFormValues: CreateFiscalParameterVariables = {
  keyName: '',
  value: '',
  valueType: 'TEXT', // Default a TEXT
  description: '',
  isActive: true
}

const valueTypeOptions: FiscalParameter['valueType'][] = [
  'PERCENTAGE',
  'AMOUNT',
  'RATE_DECIMAL',
  'TEXT'
]

// Función helper para formatear el valor a mostrar en la TABLA
const formatDisplayValueInTable = (
  value: string,
  valueType: FiscalParameter['valueType']
): string => {
  let displayValue = value
  // Intentar parsear solo si no está vacío para evitar que parseFloat('') sea 0
  if (value && value.trim() !== '') {
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue)) {
      switch (valueType) {
        case 'PERCENTAGE':
          displayValue = `${numericValue.toLocaleString('es-CO')}%`
          break
        case 'AMOUNT':
          displayValue = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(numericValue)
          break
        case 'RATE_DECIMAL':
          displayValue = numericValue.toLocaleString('es-CO', {
            minimumFractionDigits: 2, // Mostrar al menos 2 decimales para tasas
            maximumFractionDigits: 5
          })
          break
        case 'TEXT':
        default:
          displayValue = value
          break
      }
    }
  }
  return displayValue
}

const FiscalParametersManagementPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [openDialog, setOpenDialog] = useState(false)
  const [editingParam, setEditingParam] = useState<FiscalParameter | null>(null)
  const [formValues, setFormValues] =
    useState<CreateFiscalParameterVariables>(initialFormValues)

  const {
    data: fiscalParams = [],
    isLoading,
    isError: queryIsError, // Renombrado para evitar conflicto con variable 'error'
    error: queryError, // Renombrado
    isFetching,
    refetch
  } = useQuery<FiscalParameter[], Error>(
    'fiscalParametersListManageable',
    async () => {
      const response = await axiosPrivate.get<FiscalParameter[]>(
        '/fiscal-parameters/manageable'
      )
      return response.data
    },
    {
      // staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    }
  )

  const handleGenericMutationSuccess = () => {
    queryClient.invalidateQueries('fiscalParametersListManageable')
    queryClient.invalidateQueries('activeFiscalSettings')
    handleCloseDialog()
  }

  const handleGenericMutationError = (
    err: unknown,
    operationMessage: string
  ) => {
    console.error(`Error en ${operationMessage}:`, err)
    let errorMessage = `Error durante ${operationMessage}.`
    if (isAxiosError(err) && err.response?.data) {
      const data = err.response.data
      errorMessage =
        typeof data.message === 'string'
          ? data.message
          : Array.isArray(data.errors)
            ? data.errors.map((e: any) => e.message).join(', ')
            : JSON.stringify(data)
    } else if (err instanceof Error) {
      errorMessage = err.message
    }
    Swal.fire('Error', errorMessage, 'error')
  }

  const createMutation = useMutation<
    AxiosResponse<FiscalParameterMutationResponse>,
    Error,
    CreateFiscalParameterVariables
  >((paramData) => axiosPrivate.post('/fiscal-parameters', paramData), {
    onSuccess: () => {
      Swal.fire('Creado', 'Parámetro fiscal creado con éxito.', 'success')
      handleGenericMutationSuccess()
    },
    onError: (err) =>
      handleGenericMutationError(err, 'la creación del parámetro')
  })

  const updateMutation = useMutation<
    AxiosResponse<FiscalParameterMutationResponse>,
    Error,
    UpdateFiscalParameterVariables
  >(
    (paramData) =>
      axiosPrivate.put(`/fiscal-parameters/${paramData.id}`, paramData),
    {
      onSuccess: () => {
        Swal.fire(
          'Actualizado',
          'Parámetro fiscal actualizado con éxito.',
          'success'
        )
        handleGenericMutationSuccess()
      },
      onError: (err) =>
        handleGenericMutationError(err, 'la actualización del parámetro')
    }
  )

  const deleteMutation = useMutation<AxiosResponse, Error, number>(
    (id: number) => axiosPrivate.delete(`/fiscal-parameters/${id}`),
    {
      onSuccess: () => {
        Swal.fire(
          'Eliminado',
          'Parámetro fiscal eliminado con éxito.',
          'success'
        )
        queryClient.invalidateQueries('fiscalParametersListManageable')
        queryClient.invalidateQueries('activeFiscalSettings')
      },
      onError: (err) =>
        handleGenericMutationError(err, 'la eliminación del parámetro')
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
    setEditingParam(null) // Limpiar el parámetro en edición al cerrar
  }

  const handleFormChange = (
    event:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<FiscalParameter['valueType']>
  ) => {
    const { name, value } = event.target

    if (name === 'valueType') {
      setFormValues((prev) => ({
        ...prev,
        value: '', // Resetear valor cuando cambia el tipo de valor
        [name!]: value as FiscalParameter['valueType']
      }))
    } else {
      setFormValues((prev) => ({ ...prev, [name!]: value }))
    }
  }

  // Handler específico para NumericFormat
  const handleNumericValueChange = (values: NumberFormatValues) => {
    setFormValues((prev) => ({ ...prev, value: values.value || '' }))
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setFormValues((prev) => ({ ...prev, [name!]: checked }))
  }

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formValues.keyName?.trim() || !formValues.valueType) {
      // 'value' puede ser "0" que es falsy pero válido
      Swal.fire(
        'Validación',
        'Los campos "Key Name" y "Tipo de Valor" son requeridos.',
        'warning'
      )
      return
    }
    if (formValues.value.trim() === '' && formValues.valueType !== 'TEXT') {
      // Para tipos numéricos, el valor no puede estar vacío
      Swal.fire(
        'Validación',
        'El campo "Valor" es requerido para tipos numéricos.',
        'warning'
      )
      return
    }

    if (
      formValues.valueType !== 'TEXT' &&
      isNaN(parseFloat(formValues.value))
    ) {
      Swal.fire(
        'Validación',
        `El valor para el tipo '${formValues.valueType}' debe ser numérico. Ingresaste: '${formValues.value}'`,
        'warning'
      )
      return
    }

    const dataToSubmit = { ...formValues }
    // Asegurarse que el valor para tipos numéricos sea un string que represente el número,
    // o parsearlo si el backend espera un número (backend actual espera string para 'value')
    // if (dataToSubmit.valueType !== 'TEXT') {
    //   dataToSubmit.value = parseFloat(dataToSubmit.value).toString(); // O enviar como número si el backend lo espera
    // }

    if (editingParam) {
      updateMutation.mutate({ ...dataToSubmit, id: editingParam.id })
    } else {
      createMutation.mutate(dataToSubmit)
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

  if (isLoading && fiscalParams.length === 0) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5, p: 2 }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>Cargando parámetros fiscales...</Typography>
      </Container>
    )
  }

  // Mostrar error solo si es la carga inicial y no hay datos cacheados
  if (queryIsError && fiscalParams.length === 0) {
    return (
      <Container sx={{ mt: 2 }}>
        <Alert severity='error'>
          Error al cargar parámetros fiscales:{' '}
          {queryError?.message || 'Error desconocido.'}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
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
        <Box>
          <Button
            variant='outlined'
            onClick={() => refetch()}
            startIcon={
              isFetching ? <CircularProgress size={18} /> : <RefreshIcon />
            }
            disabled={isFetching}
            sx={{ mr: 1 }}
            size='small'
          >
            Refrescar
          </Button>
          <Button
            variant='contained'
            color='primary'
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size='small'
          >
            Nuevo Parámetro
          </Button>
        </Box>
      </Box>
      <Paper elevation={2}>
        <TableContainer>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>
                  Clave (keyName)
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>
                  Valor
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>
                  Tipo de Valor
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>
                  Descripción
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', width: '10%', textAlign: 'center' }}
                >
                  Activo
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', width: '10%', textAlign: 'right' }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isFetching && fiscalParams.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align='center'
                    sx={{ py: 0.5, borderBottom: 'none' }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        opacity: 0.7,
                        height: 20
                      }}
                    >
                      <CircularProgress size={16} />{' '}
                      <Typography variant='caption'>Actualizando...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && fiscalParams.length === 0 && (
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
                  <TableCell>
                    {formatDisplayValueInTable(param.value, param.valueType)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={param.valueType}
                      size='small'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={param.description || ''}
                  >
                    {param.description}
                  </TableCell>
                  <TableCell align='center'>
                    {param.isActive ? (
                      <Chip
                        label='Sí'
                        color='success'
                        size='small'
                        variant='filled'
                      />
                    ) : (
                      <Chip
                        label='No'
                        color='default'
                        size='small'
                        variant='outlined'
                      />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Editar'>
                      <IconButton
                        onClick={() => handleOpenDialog(param)}
                        color='primary'
                        size='small'
                      >
                        <Edit fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Eliminar'>
                      <IconButton
                        onClick={() => handleDelete(param.id)}
                        color='error'
                        size='small'
                      >
                        <Delete fontSize='small' />
                      </IconButton>
                    </Tooltip>
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
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {editingParam ? 'Editar Parámetro Fiscal' : 'Nuevo Parámetro Fiscal'}
          <IconButton aria-label='close' onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: '16px !important' }}>
          {' '}
          {/* Forzar padding top */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label='Nombre Clave (Key Name)'
                name='keyName'
                required
                fullWidth
                margin='normal'
                value={formValues.keyName || ''}
                onChange={handleFormChange}
                helperText='Ej: PURCHASE_RETENTION_RATE (único, no editable después)'
                InputProps={{ readOnly: !!editingParam }}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {formValues.valueType === 'TEXT' ? (
                <TextField
                  label='Valor'
                  name='value'
                  required
                  fullWidth
                  margin='normal'
                  value={formValues.value || ''}
                  onChange={handleFormChange}
                  helperText='Valor del parámetro (texto libre)'
                  disabled={
                    createMutation.isLoading || updateMutation.isLoading
                  }
                />
              ) : (
                <NumericFormat
                  label='Valor'
                  name='value'
                  required
                  fullWidth
                  margin='normal'
                  customInput={TextField}
                  value={formValues.value || ''}
                  onValueChange={handleNumericValueChange} // Usar el handler específico
                  thousandSeparator={
                    formValues.valueType === 'AMOUNT' ? ',' : undefined
                  }
                  decimalSeparator='.'
                  prefix={formValues.valueType === 'AMOUNT' ? '$ ' : ''}
                  suffix={formValues.valueType === 'PERCENTAGE' ? ' %' : ''}
                  decimalScale={
                    formValues.valueType === 'PERCENTAGE'
                      ? 2
                      : formValues.valueType === 'AMOUNT'
                        ? 2
                        : formValues.valueType === 'RATE_DECIMAL'
                          ? 5
                          : undefined
                  }
                  allowNegative={false}
                  helperText={
                    formValues.valueType === 'PERCENTAGE'
                      ? 'Ej: 19 (para 19%)'
                      : formValues.valueType === 'RATE_DECIMAL'
                        ? 'Ej: 0.025 (para 2.5%)'
                        : formValues.valueType === 'AMOUNT'
                          ? 'Ej: 1350000.50'
                          : 'Valor numérico'
                  }
                  disabled={
                    createMutation.isLoading || updateMutation.isLoading
                  }
                />
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                required
                margin='normal'
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                <InputLabel id='valueType-dialog-label'>
                  Tipo de Valor
                </InputLabel>
                <Select
                  labelId='valueType-dialog-label'
                  name='valueType'
                  label='Tipo de Valor'
                  value={formValues.valueType}
                  onChange={(e) =>
                    handleFormChange(
                      e as SelectChangeEvent<FiscalParameter['valueType']>
                    )
                  }
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
                margin='normal'
                value={formValues.description || ''}
                onChange={handleFormChange}
                disabled={createMutation.isLoading || updateMutation.isLoading}
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
                sx={{ mt: 1 }}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button
            onClick={handleCloseDialog}
            startIcon={<Cancel />}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
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
