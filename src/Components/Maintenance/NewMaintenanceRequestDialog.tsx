import React, { useState } from 'react'
import { Grid } from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from 'react-query'
import FormDialog from 'src/Components/Common/FormDialog'
import FormikField from 'src/Components/Common/FormikField'
import AsyncSelectField, {
  AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import { axiosPrivate } from 'src/utils/api'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import { logger } from 'src/utils/logger'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import { MaintenancePriority } from '../../types/maintenance'
import { MAINTENANCE_PRIORITY_LABELS } from './maintenanceLabels'

interface CustomerOption extends AsyncSelectOption {
  email?: string
  telefono?: string
}

interface NewMaintenanceRequestDialogProps {
  open: boolean
  onClose: () => void
  /** Recibe el id del ticket creado (por ejemplo, para abrirlo). */
  onCreated?: (ticketId: string | number) => void
}

interface RequestFormValues {
  customerName: string
  customerEmail: string
  customerPhone: string
  equipmentType: string
  equipmentBrand: string
  equipmentModel: string
  equipmentSerial: string
  issueDescription: string
  location: string
  priority: MaintenancePriority
}

const emptyValues: RequestFormValues = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  equipmentType: '',
  equipmentBrand: '',
  equipmentModel: '',
  equipmentSerial: '',
  issueDescription: '',
  location: '',
  priority: MaintenancePriority.MEDIUM
}

const validationSchema = Yup.object({
  customerName: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(255, 'Máximo 255 caracteres')
    .required('El nombre del cliente es requerido'),
  customerEmail: Yup.string()
    .email('Correo inválido')
    .required('El correo es requerido'),
  customerPhone: Yup.string()
    .trim()
    .min(7, 'Mínimo 7 caracteres')
    .max(20, 'Máximo 20 caracteres'),
  equipmentType: Yup.string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('El tipo de equipo es requerido'),
  issueDescription: Yup.string()
    .trim()
    .min(10, 'Describe el problema con al menos 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres')
    .required('La descripción del problema es requerida'),
  location: Yup.string().trim().max(255, 'Máximo 255 caracteres')
})

const searchCustomers = async (input: string): Promise<CustomerOption[]> => {
  const response = await axiosPrivate.get('/customers', {
    params: { q: input }
  })
  return (
    response.data as Array<{
      id: number
      nombre: string
      email?: string
      telefono?: string
    }>
  ).map((item) => ({
    value: item.id,
    label: item.nombre,
    email: item.email,
    telefono: item.telefono
  }))
}

/**
 * Nueva solicitud interna: el personal registra el ticket sin salir de la aplicación.
 * Si el cliente ya existe, se busca y el contacto se llena solo.
 */
const NewMaintenanceRequestDialog: React.FC<
  NewMaintenanceRequestDialogProps
> = ({ open, onClose, onCreated }) => {
  const queryClient = useQueryClient()
  const canSearchCustomers = useCan(PERMISSIONS.CUSTOMERS_CUSTOMER_CATALOG)
  const [customer, setCustomer] = useState<CustomerOption | null>(null)
  const [saving, setSaving] = useState(false)

  const formik = useFormik<RequestFormValues>({
    initialValues: emptyValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSaving(true)
      try {
        const payload: Record<string, unknown> = {
          ...values,
          customerName: values.customerName.trim(),
          customerPhone: values.customerPhone.trim() || undefined,
          equipmentBrand: values.equipmentBrand.trim() || undefined,
          equipmentModel: values.equipmentModel.trim() || undefined,
          equipmentSerial: values.equipmentSerial.trim() || undefined,
          location: values.location.trim() || undefined,
          customerId: customer?.value
        }
        const response = await axiosPrivate.post(
          '/maintenance/tickets',
          payload
        )
        await queryClient.invalidateQueries({
          queryKey: ['maintenance-tickets']
        })
        await queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })
        notify.success(
          `Solicitud ${response.data?.ticket?.ticketCode ?? ''} creada`.trim()
        )
        resetForm()
        setCustomer(null)
        onClose()
        if (response.data?.ticket?.id) onCreated?.(response.data.ticket.id)
      } catch (error: unknown) {
        logger.error('Error al crear la solicitud interna:', error)
        notify.error(
          getApiErrorReason(error) || 'No se pudo crear la solicitud.'
        )
      } finally {
        setSaving(false)
      }
    }
  })

  const handleClose = () => {
    if (saving) return
    formik.resetForm()
    setCustomer(null)
    onClose()
  }

  const handleCustomerChange = (option: CustomerOption | null) => {
    setCustomer(option)
    if (!option) return
    formik.setValues({
      ...formik.values,
      customerName: option.label,
      customerEmail: option.email || formik.values.customerEmail,
      customerPhone: option.telefono || formik.values.customerPhone
    })
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Nueva solicitud de mantenimiento'
      subtitle='Se crea como ticket pendiente, listo para asignar técnico.'
      submitLabel='Crear solicitud'
      onSubmit={() => formik.handleSubmit()}
      loading={saving}
      submitDisabled={!formik.dirty}
      maxWidth='md'
    >
      <Grid container spacing={2} sx={{ pt: 0.5 }}>
        {canSearchCustomers && (
          <Grid item xs={12}>
            <AsyncSelectField<CustomerOption>
              label='Buscar cliente existente (opcional)'
              value={customer}
              onChange={handleCustomerChange}
              loadOptions={searchCustomers}
              helperText='Al elegirlo se llenan nombre, correo y teléfono.'
            />
          </Grid>
        )}
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='customerName'
            label='Nombre del cliente'
            size='small'
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='customerEmail'
            label='Correo'
            type='email'
            size='small'
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='customerPhone'
            label='Teléfono'
            size='small'
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='location'
            label='Ubicación del equipo'
            size='small'
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='equipmentType'
            label='Tipo de equipo'
            size='small'
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='equipmentBrand'
            label='Marca'
            size='small'
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='equipmentModel'
            label='Modelo'
            size='small'
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormikField
            formik={formik}
            name='equipmentSerial'
            label='Número de serie'
            size='small'
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormikField
            formik={formik}
            name='priority'
            label='Prioridad'
            size='small'
            options={Object.values(MaintenancePriority).map((priority) => ({
              value: priority,
              label: MAINTENANCE_PRIORITY_LABELS[priority]
            }))}
          />
        </Grid>
        <Grid item xs={12}>
          <FormikField
            formik={formik}
            name='issueDescription'
            label='Descripción del problema'
            multiline
            size='small'
            required
          />
        </Grid>
      </Grid>
    </FormDialog>
  )
}

export default NewMaintenanceRequestDialog
