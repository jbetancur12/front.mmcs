import { useState, useEffect } from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useStore } from '@nanostores/react'
import Swal from 'sweetalert2'
import axios from 'axios'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import AsyncSelectField, {
  AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import FileDropZone from 'src/Components/Common/FileDropZone'
import { FileData } from '../types/fileTypes'
import { handleCreateFile } from './CreateFileModalHandlers'
import { customerStore } from '@stores/customerStore'
import { deviceStore } from '@stores/deviceStore'
import { certificateTypeStore } from '@stores/certificateTypeStore'
import { genericMapOptions } from '@utils/loadOptions'
import {
  limitArraySize,
  limitArraySizeCustomer,
  limitArraySizeDevice
} from '../utils/limitArraySizes'

interface CreateFileModalProps {
  open: boolean
  onClose: () => void
  fetchFiles: (options?: { force?: boolean }) => Promise<void>
  axiosPrivate: any
  preSelectedCustomer?: {
    id: number
    nombre: string
    sede: string[]
  }
}

const TEAL = '#00BFA5'
const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/**
 * Subir un certificado: datos del certificado en secciones de dos columnas y
 * el PDF al final. Sigue el patrón de `FormDialog` (sin cabecera de color).
 */
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
  const [customerOption, setCustomerOption] =
    useState<AsyncSelectOption | null>(null)
  const [deviceOption, setDeviceOption] = useState<AsyncSelectOption | null>(
    null
  )
  const [typeOption, setTypeOption] = useState<AsyncSelectOption | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'6' | '12'>('12')
  const [sedes, setSedes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  const resetForm = () => {
    setValues({
      calibrationDate: new Date(),
      nextCalibrationDate: new Date()
    })
    setCustomerOption(null)
    setDeviceOption(null)
    setTypeOption(null)
    setFile(null)
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
      setCustomerOption({
        value: String(preSelectedCustomer.id),
        label: preSelectedCustomer.nombre,
        sede: preSelectedCustomer.sede
      })
      setSedes(preSelectedCustomer.sede || [])
    }
  }, [open, preSelectedCustomer])

  useEffect(() => {
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
  }, [values.calibrationDate, selectedPeriod])

  const searchResource =
    (
      resource: string,
      valueKey: string,
      labelKey: string,
      extra?: { [key: string]: string }
    ) =>
    async (input: string): Promise<AsyncSelectOption[]> => {
      const response = await axiosPrivate.get(`/${resource}`, {
        params: { q: input }
      })
      return response.data.map((item: unknown) =>
        genericMapOptions(item, valueKey, labelKey, extra)
      )
    }

  const isIncomplete =
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

  const handleSubmit = async () => {
    if (isIncomplete || !file) return

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
        resetForm()
        onClose()
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Certificado creado exitosamente',
          confirmButtonColor: TEAL,
          timer: 3000,
          showConfirmButton: true
        })
      }
    } catch (error) {
      setLoading(false)
      let errorMessage = 'Error desconocido al crear el certificado'

      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message

        // Archivo duplicado (409)
        if (error.response && error.response.status === 409) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo duplicado',
            text:
              error.response.data.error ||
              'El archivo con este nombre ya existe. Por favor, renombre el archivo e intente nuevamente.',
            confirmButtonColor: TEAL
          })
          return
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: TEAL
      })
      console.error('Error en creación de certificado:', error)
    }
  }

  const radioSx = { '&.Mui-checked': { color: TEAL } }

  return (
    <FormDialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title='Subir certificado'
      subtitle={customerOption?.label}
      submitLabel='Guardar certificado'
      onSubmit={() => void handleSubmit()}
      loading={loading}
      submitDisabled={isIncomplete}
      maxWidth='md'
    >
      <FormDialogSection title='Información general'>
        <Box sx={FULL_ROW}>
          <AsyncSelectField
            label='Cliente'
            required
            disabled={!!preSelectedCustomer}
            value={customerOption}
            onChange={(option) => {
              setCustomerOption(option)
              setSedes((option?.sede as string[]) || [])
              if (option) limitArraySizeCustomer($customerStore, option)
              setValues({
                ...values,
                customerId: option ? Number(option.value) : undefined,
                headquarter: undefined
              })
            }}
            loadOptions={searchResource('customers', 'id', 'nombre', {
              sede: 'sede'
            })}
            defaultOptions={
              preSelectedCustomer && customerOption
                ? [customerOption]
                : ($customerStore as AsyncSelectOption[])
            }
          />
        </Box>
        <AsyncSelectField
          label='Equipo'
          required
          value={deviceOption}
          onChange={(option) => {
            setDeviceOption(option)
            if (option) {
              limitArraySizeDevice($deviceStore, {
                value: option.value,
                label: option.label
              })
            }
            setValues({
              ...values,
              deviceId: option ? Number(option.value) : undefined
            })
          }}
          loadOptions={searchResource('devices', 'id', 'name')}
          defaultOptions={$deviceStore as AsyncSelectOption[]}
        />
        <AsyncSelectField
          label='Tipo de certificado'
          required
          value={typeOption}
          onChange={(option) => {
            setTypeOption(option)
            if (option) {
              limitArraySize($certificateTypeStore, {
                value: option.value,
                label: option.label
              })
            }
            setValues({
              ...values,
              certificateTypeId: option ? Number(option.value) : undefined
            })
          }}
          loadOptions={searchResource('certificateTypes', 'id', 'name')}
          defaultOptions={$certificateTypeStore as AsyncSelectOption[]}
        />
      </FormDialogSection>

      <FormDialogSection title='Ubicación'>
        <TextField
          select
          label='Sede'
          required
          value={values.headquarter || ''}
          onChange={(e) =>
            setValues({ ...values, headquarter: e.target.value })
          }
          disabled={sedes.length === 0}
          helperText={
            sedes.length === 0
              ? 'Elige primero un cliente con sedes registradas'
              : undefined
          }
        >
          {sedes.map((sede) => (
            <MenuItem key={sede} value={sede}>
              {sede}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label='Ciudad'
          required
          value={values.city || ''}
          onChange={(e) => setValues({ ...values, city: e.target.value })}
        />
        <TextField
          label='Dirección'
          required
          value={values.sede || ''}
          onChange={(e) => setValues({ ...values, sede: e.target.value })}
        />
        <TextField
          label='Ubicación dentro de la sede'
          required
          value={values.location || ''}
          onChange={(e) => setValues({ ...values, location: e.target.value })}
        />
      </FormDialogSection>

      <FormDialogSection title='Información del equipo'>
        <TextField
          label='Activo fijo'
          required
          value={values.activoFijo || ''}
          onChange={(e) => setValues({ ...values, activoFijo: e.target.value })}
        />
        <TextField
          label='Serie'
          required
          value={values.serie || ''}
          onChange={(e) => setValues({ ...values, serie: e.target.value })}
        />
      </FormDialogSection>

      <FormDialogSection title='Fechas de calibración'>
        <DatePicker
          label='Fecha de calibración'
          value={values.calibrationDate}
          onChange={(newDate) =>
            setValues({ ...values, calibrationDate: newDate as Date })
          }
          slotProps={{ textField: { required: true } }}
        />
        <DatePicker
          label='Próxima calibración'
          value={values.nextCalibrationDate}
          onChange={(newDate) =>
            setValues({ ...values, nextCalibrationDate: newDate as Date })
          }
          slotProps={{ textField: { required: true } }}
        />
        <FormControl component='fieldset' sx={FULL_ROW}>
          <FormLabel
            component='legend'
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              '&.Mui-focused': { color: '#374151' }
            }}
          >
            Periodo de calibración
          </FormLabel>
          <RadioGroup
            row
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '6' | '12')}
          >
            <FormControlLabel
              value='6'
              control={<Radio sx={radioSx} />}
              label='6 meses'
            />
            <FormControlLabel
              value='12'
              control={<Radio sx={radioSx} />}
              label='12 meses'
            />
          </RadioGroup>
        </FormControl>
      </FormDialogSection>

      <FormDialogSection
        title='Certificado en PDF'
        description='Es el archivo que verá el cliente.'
      >
        <Box sx={FULL_ROW}>
          <FileDropZone
            file={file}
            onFileSelected={setFile}
            inputKey={fileInputKey}
            disabled={loading}
            onReject={(message) =>
              Swal.fire({
                icon: 'error',
                title: 'Archivo no válido',
                text: message,
                confirmButtonColor: TEAL
              })
            }
          />
        </Box>
      </FormDialogSection>
    </FormDialog>
  )
}
