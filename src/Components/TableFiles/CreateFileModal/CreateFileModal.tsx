import { useState, useEffect } from 'react'
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
  InputLabel
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { CloudUpload } from '@mui/icons-material'
import AsyncSelect from 'react-select/async'
import { useStore } from '@nanostores/react'
import { FileData } from '../types/fileTypes'
import { handleCreateFile } from './CreateFileModalHandlers'
import { customerStore } from '@stores/customerStore'
import { deviceStore } from '@stores/deviceStore'
import { certificateTypeStore } from '@stores/certificateTypeStore'
import { genericMapOptions, loadOptions } from '@utils/loadOptions'
import { bigToast, styles } from 'src/Components/ExcelManipulation/Utils'
import { VisuallyHiddenInput } from 'src/Components/TableFiles'
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
}

export const CreateFileModal = ({
  open,
  onClose,
  fetchFiles,
  axiosPrivate
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setSelectedFileName(selectedFile.name)
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
    try {
      const success = await handleCreateFile(
        values as FileData,
        file,
        axiosPrivate,
        fetchFiles
      )

      if (success) {
        bigToast('Certificado Creado Exitosamente!', 'success')
        onClose()
        setValues({
          calibrationDate: new Date(),
          nextCalibrationDate: new Date()
        })
        setFile(null)
        setSelectedFileName('')
      }
    } catch (error) {
      let errorMessage = 'Error desconocido al crear el certificado'

      // Manejo de errores de Axios
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message
      }
      // Manejo de errores genéricos
      else if (error instanceof Error) {
        errorMessage = error.message
      }

      // Mostrar error específico del backend o genérico
      bigToast(errorMessage, 'error')

      // Opcional: Loggear error para debugging
      console.error('Error en creación de certificado:', error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle textAlign='center' sx={{ fontWeight: 'bold' }}>
        Subir Nuevo Certificado
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Selector de Cliente */}
          <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
            cacheOptions
            placeholder='Buscar Cliente'
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
            defaultOptions={$customerStore}
            styles={styles(true)}
          />

          {/* Selector de Equipo */}
          <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
            cacheOptions
            placeholder='Buscar Equipo'
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

          {/* Selector de Tipo de Certificado */}
          <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
            cacheOptions
            placeholder='Tipo de Certificado'
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
              setValues({ ...values, certificateTypeId: Number(option?.value) })
            }}
            defaultOptions={$certificateTypeStore}
            styles={styles(true)}
          />
          <FormControl fullWidth variant='outlined'>
            {' '}
            {/* fullWidth es opcional, variant puede ser "outlined", "filled", "standard" */}
            <InputLabel id='sede-select-label'>Seleccionar Sede</InputLabel>
            <Select
              placeholder='Seleccionar Sede'
              value={values.headquarter || ''}
              onChange={(e) =>
                setValues({
                  ...values,
                  headquarter: e.target.value
                })
              }
            >
              {sedes?.map((sede) => (
                <MenuItem key={sede} value={sede}>
                  {sede}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label='Ciudad'
            name='city'
            value={values.city || ''}
            onChange={(e) => setValues({ ...values, city: e.target.value })}
          />
          <TextField
            label='Dirección'
            name='sede'
            value={values.sede || ''}
            onChange={(e) => setValues({ ...values, sede: e.target.value })}
          />

          <TextField
            label='Ubicación'
            name='location'
            value={values.location || ''}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
          />

          {/* <TextField
            label='Sede'
            name='sede'
            value={values.headquarter || ''}
            onChange={(e) => setValues({ ...values, sede: e.target.value })}
          /> */}

          <TextField
            label='Activo Fijo'
            value={values.activoFijo || ''}
            onChange={(e) =>
              setValues({ ...values, activoFijo: e.target.value })
            }
          />

          <TextField
            label='Serie'
            value={values.serie || ''}
            onChange={(e) => setValues({ ...values, serie: e.target.value })}
          />

          {/* Selector de Fecha de Calibración */}
          <DatePicker
            label='Fecha de Calibración'
            value={values.calibrationDate}
            onChange={(newDate) =>
              setValues({ ...values, calibrationDate: newDate as Date })
            }
          />

          <DatePicker
            label='Próxima Calibración'
            value={values.nextCalibrationDate}
            onChange={(newDate) =>
              setValues({ ...values, nextCalibrationDate: newDate as Date })
            }
          />

          {/* Selector de Periodo */}
          <FormControl component='fieldset'>
            <FormLabel component='legend'>Periodo de Calibración</FormLabel>
            <RadioGroup
              row
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '6' | '12')}
            >
              <FormControlLabel value='6' control={<Radio />} label='6 Meses' />
              <FormControlLabel
                value='12'
                control={<Radio />}
                label='12 Meses'
              />
            </RadioGroup>
          </FormControl>

          {/* Campos adicionales */}

          {/* Upload de Archivo */}
          <Button
            component='label'
            variant='contained'
            startIcon={<CloudUpload />}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            {selectedFileName || 'Seleccionar archivo PDF'}
            <VisuallyHiddenInput
              type='file'
              accept='.pdf'
              onChange={handleFileChange}
            />
          </Button>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant='outlined'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant='contained' color='primary'>
          Guardar Certificado
        </Button>
      </DialogActions>
    </Dialog>
  )
}
