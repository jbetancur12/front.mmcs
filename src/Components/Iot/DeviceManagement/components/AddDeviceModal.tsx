import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress
} from '@mui/material'
import { useCreateDevice, useUpdateDevice } from '../hooks/useDeviceMutations'
import { AddDeviceModalProps } from '../types/deviceTypes'
import { DeviceIot } from '../../types'
import AsyncSelect from 'react-select/async'
import { SelectOption } from 'src/types'
import { CSSObjectWithLabel, GroupBase } from 'react-select'
import { genericMapOptions, loadOptions } from '@utils/loadOptions'
import {
  limitArraySizeCustomer,
  styles
} from 'src/Components/ExcelManipulation/Utils'
import { useStore } from '@nanostores/react'
import { customerStore } from '@stores/customerStore'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'
import { useEffect } from 'react'

const validationSchema = Yup.object().shape({
  imei: Yup.string()
    .required('IMEI es requerido')
    .matches(/^\d{15}$/, 'IMEI debe tener 15 dígitos'),
  name: Yup.string()
    .required('Nombre es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  customerId: Yup.number().nullable()
})

const AddDeviceModal = ({ open, onClose, device }: AddDeviceModalProps) => {
  const isEdit = !!device

  const $customerStore = useStore(customerStore)
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()

  const formik = useFormik<Partial<DeviceIot>>({
    initialValues: {
      imei: device?.imei || '',
      name: device?.name || '',
      location: device?.location || '',
      customer: device?.customer || null
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          await updateDevice.mutateAsync({
            id: device.id,
            imei: values.imei!,
            name: values.name!,
            location: values.location || '',
            customerId: values.customer?.id // Asegurar enviar solo el ID
          })
          Swal.fire(
            '¡Actualizado!',
            'Dispositivo actualizado correctamente',
            'success'
          )
          handleClose()
        } else {
          await createDevice.mutateAsync({
            imei: values.imei!,
            name: values.name!,
            location: values.location || '',
            customerId: values.customer?.id
          })
          Swal.fire({
            title: '¡Éxito!',
            text: 'Dispositivo creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          })
          handleClose()
        }
      } catch (error) {
        console.error('Error creating device:', error)
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el dispositivo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
      }
    }
  })

  useEffect(() => {
    if (device) {
      formik.setValues({
        imei: device.imei,
        name: device.name,
        location: device.location,
        customerId: device?.customerId,
        customer: device.customer
      })
    }
  }, [device])

  const handleClose = () => {
    formik.resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>{isEdit ? 'Editar' : 'Agregar'} Dispositivo</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box mb={3}>
            <TextField
              fullWidth
              label='IMEI'
              name='imei'
              variant='outlined'
              value={formik.values.imei}
              onChange={formik.handleChange}
              error={formik.touched.imei && Boolean(formik.errors.imei)}
              helperText={formik.touched.imei && formik.errors.imei}
            />
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              label='Nombre del Dispositivo'
              name='name'
              variant='outlined'
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Box>
          <Box mb={3}>
            <TextField
              fullWidth
              label='Ubicación del Dispositivo'
              name='location'
              variant='outlined'
              value={formik.values.location}
              onChange={formik.handleChange}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
            />
          </Box>
          <Box mb={3}>
            <AsyncSelect<SelectOption, false, GroupBase<SelectOption>>
              cacheOptions
              placeholder='Buscar Cliente'
              menuPortalTarget={document.body}
              menuPosition='fixed'
              styles={{
                ...styles(true),
                menuPortal: (base) =>
                  ({ ...base, zIndex: 9999 }) as CSSObjectWithLabel
              }}
              loadOptions={(input) =>
                loadOptions(input, 'customers', (item) =>
                  genericMapOptions(item, 'id', 'nombre')
                )
              }
              onChange={(option) => {
                limitArraySizeCustomer($customerStore, option)
                formik.setFieldValue(
                  'customer',
                  option
                    ? { id: Number(option.value), nombre: option.label }
                    : null
                )
              }}
              value={
                formik.values.customer
                  ? {
                      value: formik.values.customer.id.toString(),
                      label: formik.values.customer.nombre
                    }
                  : null
              }
              defaultOptions={$customerStore}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant='outlined'
            color='secondary'
            disabled={createDevice.isLoading || updateDevice.isLoading}
          >
            Cancelar
          </Button>

          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={createDevice.isLoading || updateDevice.isLoading}
          >
            {
              createDevice.isLoading || updateDevice.isLoading ? (
                <CircularProgress size={24} color='inherit' />
              ) : isEdit ? (
                'Actualizar Dispositivo'
              ) : (
                'Agregar Dispositivo'
              ) // Cambiar texto según modo
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddDeviceModal
