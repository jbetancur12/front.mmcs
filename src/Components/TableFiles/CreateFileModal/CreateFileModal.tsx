import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Typography,
  Paper,
  Fade,
  IconButton,
  LinearProgress,
  Divider
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import {
  CloudUpload,
  Close,
  CalendarToday,
  Description,
  CheckCircle,
  Business,
  LocationOn,
  Devices,
  Upload
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import AsyncSelect from 'react-select/async'
import { useStore } from '@nanostores/react'
import Swal from 'sweetalert2'
import Loader from '../../Loader2'
import { FileData } from '../types/fileTypes'
import { handleCreateFile } from './CreateFileModalHandlers'
import { customerStore } from '@stores/customerStore'
import { deviceStore } from '@stores/deviceStore'
import { certificateTypeStore } from '@stores/certificateTypeStore'
import { genericMapOptions, loadOptions } from '@utils/loadOptions'
import { styles } from 'src/Components/ExcelManipulation/Utils'
import { GroupBase } from 'react-select'
import axios from 'axios'
import {
  limitArraySize,
  limitArraySizeCustomer,
  limitArraySizeDevice
} from '../utils/limitArraySizes'
import { SelectOption } from 'src/types'

interface CreateFileModalProps {
  open: boolean
  onClose: () => void
  fetchFiles: () => Promise<void>
  axiosPrivate: any
  preSelectedCustomer?: {
    id: number
    nombre: string
    sede: string[]
  }
}

// Styled Components
const DropZone = styled(Paper)(() => ({
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  backgroundColor: '#f9fafb',
  '&:hover': {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
  },
  '&.dragover': {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)'
  }
}))

const DatePickerContainer = styled(Box)(() => ({
  '& .MuiTextField-root': {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#10b981'
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#10b981'
      }
    }
  }
}))

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#10b981'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#10b981'
    }
  }
}))

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <Box display='flex' alignItems='center' mb={2}>
    <Icon sx={{ color: '#10b981', mr: 1, fontSize: 24 }} />
    <Typography variant='h6' fontWeight='600' sx={{ color: '#1f2937' }}>
      {title}
    </Typography>
  </Box>
)

export const CreateFileModal = ({
  open,
  onClose,
  fetchFiles,
  axiosPrivate,
  preSelectedCustomer
}: CreateFileModalProps) => {
  const $customerStore = useStore(customerStore)
  const $deviceStore = useStore(deviceStore)
  const $certificateTypeStore = useStore(certificateTypeStore)

  const [values, setValues] = useState<Partial<FileData>>({
    calibrationDate: new Date(),
    nextCalibrationDate: new Date()
  })
  const [file, setFile] = useState<File | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'6' | '12'>('12')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [sedes, setSedes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(Date.now())
  const [isDragOver, setIsDragOver] = useState(false)

  // Función para limpiar el formulario
  const resetForm = () => {
    setValues({
      calibrationDate: new Date(),
      nextCalibrationDate: new Date()
    })
    setFile(null)
    setSelectedFileName('')
    setIsDragOver(false)
    setSedes([])
    setSelectedPeriod('12')
    setFileInputKey(Date.now())
  }

  // Limpiar el formulario cuando el modal se abre
  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  // Establecer datos del cliente pre-seleccionado
  useEffect(() => {
    if (open && preSelectedCustomer) {
      setValues((prev) => ({
        ...prev,
        customerId: preSelectedCustomer.id
      }))
      setSedes(preSelectedCustomer.sede || [])
    }
  }, [open, preSelectedCustomer])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    // Validar que sea un PDF
    if (selectedFile.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: 'Archivo inválido',
        text: 'Solo se permiten archivos PDF',
        confirmButtonColor: '#10b981'
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo muy grande',
        text: 'El archivo no puede ser mayor a 10MB',
        confirmButtonColor: '#10b981'
      })
      return
    }

    setFile(selectedFile)
    setSelectedFileName(selectedFile.name)
  }

  // Funciones para drag & drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  useEffect(() => {
    const updateNextCalibrationDate = () => {
      const baseDate = values.calibrationDate || new Date()
      const newDate = new Date(baseDate)

      if (selectedPeriod === '6') {
        newDate.setMonth(newDate.getMonth() + 6)
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1)
      }

      setValues((prev) => ({
        ...prev,
        nextCalibrationDate: newDate
      }))
    }

    updateNextCalibrationDate()
  }, [values.calibrationDate, selectedPeriod])

  const handleSubmit = async () => {
    // Validación del archivo PDF
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar un archivo PDF',
        confirmButtonColor: '#10b981'
      })
      return
    }

    // Validación de campos obligatorios
    if (!values.customerId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar un cliente',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.deviceId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar un equipo',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.certificateTypeId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar un tipo de certificado',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.headquarter) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar una sede',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.city || values.city.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes ingresar la ciudad',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.sede || values.sede.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes ingresar la dirección',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.location || values.location.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes ingresar la ubicación',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.activoFijo || values.activoFijo.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes ingresar el activo fijo',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.serie || values.serie.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes ingresar la serie',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.calibrationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar la fecha de calibración',
        confirmButtonColor: '#10b981'
      })
      return
    }

    if (!values.nextCalibrationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debes seleccionar la próxima fecha de calibración',
        confirmButtonColor: '#10b981'
      })
      return
    }

    try {
      setLoading(true)
      const success = await handleCreateFile(
        values as FileData,
        file,
        axiosPrivate,
        fetchFiles
      )

      if (success) {
        setLoading(false)

        // Limpiar formulario
        resetForm()

        // Cerrar modal primero
        onClose()

        // Mostrar mensaje de éxito después de cerrar
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Certificado creado exitosamente',
          confirmButtonColor: '#10b981',
          timer: 3000,
          showConfirmButton: true
        })
      }
    } catch (error) {
      setLoading(false)
      let errorMessage = 'Error desconocido al crear el certificado'

      // Manejo de errores de Axios
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message

        // Verificar si es un error de archivo duplicado (409)
        if (error.response && error.response.status === 409) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo duplicado',
            text:
              error.response.data.error ||
              'El archivo con este nombre ya existe. Por favor, renombre el archivo e intente nuevamente.',
            confirmButtonColor: '#10b981'
          })
          return
        }
      }
      // Manejo de errores genéricos
      else if (error instanceof Error) {
        errorMessage = error.message
      }

      // Mostrar error específico del backend o genérico
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#10b981'
      })

      // Opcional: Loggear error para debugging
      console.error('Error en creación de certificado:', error)
    }
  }

  return (
    <>
      <Loader loading={loading} />

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='sm'
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'visible'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            position: 'relative',
            textAlign: 'center',
            py: 3
          }}
        >
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            mb={1}
          >
            <Upload sx={{ fontSize: 28, mr: 1 }} />
            <Typography variant='h5' fontWeight='bold'>
              Subir Nuevo Certificado
            </Typography>
          </Box>
          <Typography variant='body2' sx={{ opacity: 0.9 }}>
            Completa la información del certificado y sube el archivo PDF
          </Typography>

          <IconButton
            onClick={onClose}
            disabled={loading}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {loading && (
          <LinearProgress
            sx={{
              height: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#10b981'
              }
            }}
          />
        )}

        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Sección: Información General */}
            <Box>
              <SectionHeader icon={Business} title='Información General' />
              <Stack spacing={3}>
                <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
                  cacheOptions
                  placeholder='Buscar Cliente *'
                  loadOptions={(input) =>
                    loadOptions(input, 'customers', (item) =>
                      genericMapOptions(item, 'id', 'nombre', { sede: 'sede' })
                    )
                  }
                  onChange={(option) => {
                    setSedes((option as any)?.sede)
                    limitArraySizeCustomer($customerStore, option)
                    setValues({ ...values, customerId: Number(option?.value) })
                  }}
                  defaultOptions={
                    preSelectedCustomer
                      ? ([
                        {
                          value: String(preSelectedCustomer.id),
                          label: preSelectedCustomer.nombre,
                          sede: preSelectedCustomer.sede
                        }
                      ] as any)
                      : $customerStore
                  }
                  defaultValue={
                    preSelectedCustomer
                      ? ({
                        value: String(preSelectedCustomer.id),
                        label: preSelectedCustomer.nombre,
                        sede: preSelectedCustomer.sede
                      } as any)
                      : null
                  }
                  isDisabled={!!preSelectedCustomer}
                  styles={styles(true)}
                />

                <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
                  cacheOptions
                  placeholder='Buscar Equipo *'
                  loadOptions={(input) =>
                    loadOptions(input, 'devices', (item) =>
                      genericMapOptions(item, 'id', 'name')
                    )
                  }
                  onChange={(option) => {
                    const opt = {
                      value: option?.value,
                      label: option?.label
                    }
                    limitArraySizeDevice($deviceStore, opt)
                    setValues({ ...values, deviceId: Number(option?.value) })
                  }}
                  defaultOptions={$deviceStore}
                  styles={styles(true)}
                />

                <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
                  cacheOptions
                  placeholder='Tipo de Certificado *'
                  loadOptions={(input) =>
                    loadOptions(input, 'certificateTypes', (item) =>
                      genericMapOptions(item, 'id', 'name')
                    )
                  }
                  onChange={(option) => {
                    const opt = {
                      value: option?.value,
                      label: option?.label
                    }
                    limitArraySize($certificateTypeStore, opt)
                    setValues({
                      ...values,
                      certificateTypeId: Number(option?.value)
                    })
                  }}
                  defaultOptions={$certificateTypeStore}
                  styles={styles(true)}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Sección: Ubicación */}
            <Box>
              <SectionHeader icon={LocationOn} title='Ubicación' />
              <Stack spacing={3}>
                <FormControl fullWidth variant='outlined' required>
                  <InputLabel id='sede-select-label'>
                    Seleccionar Sede
                  </InputLabel>
                  <Select
                    labelId='sede-select-label'
                    label='Seleccionar Sede'
                    value={values.headquarter || ''}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        headquarter: e.target.value
                      })
                    }
                    required
                    sx={{
                      borderRadius: '12px',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10b981'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10b981'
                      }
                    }}
                  >
                    {sedes?.map((sede) => (
                      <MenuItem key={sede} value={sede}>
                        {sede}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <StyledTextField
                  label='Ciudad'
                  name='city'
                  value={values.city || ''}
                  onChange={(e) =>
                    setValues({ ...values, city: e.target.value })
                  }
                  fullWidth
                  required
                />

                <StyledTextField
                  label='Dirección'
                  name='sede'
                  value={values.sede || ''}
                  onChange={(e) =>
                    setValues({ ...values, sede: e.target.value })
                  }
                  fullWidth
                  required
                />

                <StyledTextField
                  label='Ubicación'
                  name='location'
                  value={values.location || ''}
                  onChange={(e) =>
                    setValues({ ...values, location: e.target.value })
                  }
                  fullWidth
                  required
                />
              </Stack>
            </Box>

            <Divider />

            {/* Sección: Información del Equipo */}
            <Box>
              <SectionHeader icon={Devices} title='Información del Equipo' />
              <Stack spacing={3}>
                <StyledTextField
                  label='Activo Fijo'
                  value={values.activoFijo || ''}
                  onChange={(e) =>
                    setValues({ ...values, activoFijo: e.target.value })
                  }
                  fullWidth
                  required
                />

                <StyledTextField
                  label='Serie'
                  value={values.serie || ''}
                  onChange={(e) =>
                    setValues({ ...values, serie: e.target.value })
                  }
                  fullWidth
                  required
                />
              </Stack>
            </Box>

            <Divider />

            {/* Sección: Fechas de Calibración */}
            <Box>
              <SectionHeader
                icon={CalendarToday}
                title='Fechas de Calibración'
              />
              <Stack spacing={3}>
                <DatePickerContainer>
                  <DatePicker
                    label='Fecha de Calibración'
                    value={values.calibrationDate}
                    onChange={(newDate) =>
                      setValues({ ...values, calibrationDate: newDate as Date })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        required: true
                      }
                    }}
                  />
                </DatePickerContainer>

                <DatePickerContainer>
                  <DatePicker
                    label='Próxima Calibración'
                    value={values.nextCalibrationDate}
                    onChange={(newDate) =>
                      setValues({
                        ...values,
                        nextCalibrationDate: newDate as Date
                      })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        required: true
                      }
                    }}
                  />
                </DatePickerContainer>

                <FormControl component='fieldset'>
                  <FormLabel
                    component='legend'
                    sx={{
                      color: '#374151',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Periodo de Calibración
                  </FormLabel>
                  <RadioGroup
                    row
                    value={selectedPeriod}
                    onChange={(e) =>
                      setSelectedPeriod(e.target.value as '6' | '12')
                    }
                  >
                    <FormControlLabel
                      value='6'
                      control={
                        <Radio
                          sx={{
                            '&.Mui-checked': {
                              color: '#10b981'
                            }
                          }}
                        />
                      }
                      label='6 Meses'
                    />
                    <FormControlLabel
                      value='12'
                      control={
                        <Radio
                          sx={{
                            '&.Mui-checked': {
                              color: '#10b981'
                            }
                          }}
                        />
                      }
                      label='12 Meses'
                    />
                  </RadioGroup>
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Sección: Archivo PDF */}
            <Box>
              <SectionHeader icon={Description} title='Certificado PDF *' />
              <DropZone
                elevation={0}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById('file-input-create')?.click()
                }
                sx={{
                  borderColor: isDragOver ? '#10b981' : '#d1d5db',
                  backgroundColor: isDragOver ? '#f0fdf4' : '#f9fafb',
                  transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isDragOver
                    ? '0 8px 25px rgba(16, 185, 129, 0.2)'
                    : 'none'
                }}
              >
                <input
                  id='file-input-create'
                  key={fileInputKey}
                  type='file'
                  accept='.pdf'
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <CloudUpload
                  sx={{
                    fontSize: 48,
                    color: selectedFileName
                      ? '#10b981'
                      : isDragOver
                        ? '#10b981'
                        : '#9ca3af',
                    mb: 2,
                    transition: 'color 0.3s ease'
                  }}
                />

                {selectedFileName ? (
                  <Box>
                    <Typography
                      variant='body1'
                      fontWeight='600'
                      sx={{ color: '#10b981', mb: 1 }}
                    >
                      ✓ Archivo seleccionado
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#374151' }}>
                      {selectedFileName}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ color: '#6b7280', mt: 1, display: 'block' }}
                    >
                      Haz clic para cambiar el archivo
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant='body1'
                      fontWeight='600'
                      sx={{
                        color: isDragOver ? '#10b981' : '#374151',
                        mb: 1,
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {isDragOver
                        ? '¡Suelta el archivo aquí!'
                        : 'Arrastra tu archivo PDF aquí'}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#6b7280' }}>
                      o haz clic para seleccionar
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ color: '#9ca3af', mt: 1, display: 'block' }}
                    >
                      Máximo 10MB • Solo archivos PDF
                    </Typography>
                  </Box>
                )}
              </DropZone>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            variant='outlined'
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: '#d1d5db',
              color: '#374151',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !file ||
              !values.customerId ||
              !values.deviceId ||
              !values.certificateTypeId ||
              !values.headquarter ||
              !values.city?.trim() ||
              !values.sede?.trim() ||
              !values.location?.trim() ||
              !values.activoFijo?.trim() ||
              !values.serie?.trim() ||
              !values.calibrationDate ||
              !values.nextCalibrationDate
            }
            variant='contained'
            startIcon={loading ? null : <CheckCircle />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              ml: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af'
              }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Certificado'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
