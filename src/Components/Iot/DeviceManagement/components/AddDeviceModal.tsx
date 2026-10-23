import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { useStore } from '@nanostores/react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'
import { customerStore } from '@stores/customerStore'
import { axiosPrivate } from '@utils/api'
import FormDialog from 'src/Components/Common/FormDialog'
import AsyncSelectField, {
  AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import { limitArraySizeCustomer } from 'src/Components/ExcelManipulation/Utils'
import { useCreateDevice, useUpdateDevice } from '../hooks/useDeviceMutations'
import { AddDeviceModalProps } from '../types/deviceTypes'
import { DeviceIot } from '../../types'

const validationSchema = Yup.object().shape({
  imei: Yup.string()
    .required('IMEI es requerido')
    .matches(/^\d{15}$/, 'IMEI debe tener 15 dígitos'),
  name: Yup.string()
    .required('Nombre es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  customerId: Yup.number().nullable()
})

const searchCustomers = async (input: string): Promise<AsyncSelectOption[]> => {
  const response = await axiosPrivate.get('/customers', {
    params: { q: input }
  })
  return response.data.map((item: { id: number; nombre: string }) => ({
    value: item.id,
    label: item.nombre
  }))
}

/** Agrega o edita un dispositivo IoT y lo asigna a un cliente. */
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
    <FormDialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar dispositivo' : 'Agregar dispositivo'}
      subtitle={isEdit ? device?.name : undefined}
      submitLabel={isEdit ? 'Actualizar dispositivo' : 'Agregar dispositivo'}
      onSubmit={() => formik.handleSubmit()}
      loading={createDevice.isLoading || updateDevice.isLoading}
    >
      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          label='IMEI'
          name='imei'
          value={formik.values.imei}
          onChange={formik.handleChange}
          error={formik.touched.imei && Boolean(formik.errors.imei)}
          helperText={
            (formik.touched.imei && formik.errors.imei) ||
            'Son 15 dígitos, los encuentras en la etiqueta del equipo'
          }
        />
        <TextField
          fullWidth
          required
          label='Nombre del dispositivo'
          name='name'
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
        <TextField
          fullWidth
          label='Ubicación del dispositivo'
          name='location'
          value={formik.values.location}
          onChange={formik.handleChange}
          error={formik.touched.location && Boolean(formik.errors.location)}
          helperText={formik.touched.location && formik.errors.location}
        />
        <AsyncSelectField
          label='Cliente'
          value={
            formik.values.customer
              ? {
                  value: formik.values.customer.id.toString(),
                  label: formik.values.customer.nombre
                }
              : null
          }
          onChange={(option) => {
            if (option) limitArraySizeCustomer($customerStore, option)
            formik.setFieldValue(
              'customer',
              option ? { id: Number(option.value), nombre: option.label } : null
            )
          }}
          loadOptions={searchCustomers}
          defaultOptions={$customerStore as AsyncSelectOption[]}
        />
      </Stack>
    </FormDialog>
  )
}

export default AddDeviceModal
