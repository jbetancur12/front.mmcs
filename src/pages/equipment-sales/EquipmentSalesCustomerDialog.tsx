import { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import {
  EquipmentCustomerOption,
  EquipmentCustomerSite
} from '../../types/equipmentSales'

export interface EquipmentSalesCustomerDialogValues {
  customer: {
    nombre: string
    identificacion: string
    email: string
    telefono: string
    direccion: string
    ciudad: string
    departamento: string
    pais: string
  }
  site: EquipmentCustomerSite
}

interface EquipmentSalesCustomerDialogProps {
  open: boolean
  mode: 'customer' | 'site'
  customer?: EquipmentCustomerOption | null
  site?: EquipmentCustomerSite | null
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (values: EquipmentSalesCustomerDialogValues) => void
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const emptyValues: EquipmentSalesCustomerDialogValues = {
  customer: {
    nombre: '',
    identificacion: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia'
  },
  site: {
    name: 'Principal',
    address: '',
    city: '',
    department: '',
    country: 'Colombia',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    isActive: true
  }
}

const EquipmentSalesCustomerDialog = ({
  open,
  mode,
  customer,
  site,
  isSubmitting = false,
  onClose,
  onSubmit
}: EquipmentSalesCustomerDialogProps) => {
  const [values, setValues] =
    useState<EquipmentSalesCustomerDialogValues>(emptyValues)

  useEffect(() => {
    if (!open) return

    if (mode === 'site' && customer) {
      setValues({
        customer: {
          nombre: customer.nombre || '',
          identificacion: customer.identificacion || '',
          email: customer.email || '',
          telefono: customer.telefono || '',
          direccion: customer.direccion || '',
          ciudad: customer.ciudad || '',
          departamento: customer.departamento || '',
          pais: 'Colombia'
        },
        site: {
          id: site?.id,
          customerId: site?.customerId || customer.id,
          name: site?.name || '',
          address: site?.address || customer.direccion || '',
          city: site?.city || customer.ciudad || '',
          department: site?.department || customer.departamento || '',
          country: site?.country || 'Colombia',
          contactName: site?.contactName || '',
          contactEmail: site?.contactEmail || customer.email || '',
          contactPhone: site?.contactPhone || customer.telefono || '',
          notes: site?.notes || '',
          isActive: site?.isActive ?? true
        }
      })
      return
    }

    setValues(emptyValues)
  }, [customer, mode, open, site])

  const setCustomerField = (
    field: keyof EquipmentSalesCustomerDialogValues['customer'],
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      customer: { ...previous.customer, [field]: value }
    }))
  }

  const setSiteField = (field: keyof EquipmentCustomerSite, value: string) => {
    setValues((previous) => ({
      ...previous,
      site: { ...previous.site, [field]: value }
    }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  const title =
    mode === 'customer'
      ? 'Crear cliente comercial'
      : site?.id
        ? 'Editar sede del cliente'
        : 'Crear sede del cliente'

  const siteSection = (
    <FormDialogSection title='Sede'>
      <TextField
        required
        label='Nombre de la sede'
        value={values.site.name}
        onChange={(event) => setSiteField('name', event.target.value)}
      />
      <TextField
        label='Contacto de la sede'
        value={values.site.contactName || ''}
        onChange={(event) => setSiteField('contactName', event.target.value)}
      />
      <TextField
        type='email'
        label='Email del contacto'
        value={values.site.contactEmail || ''}
        onChange={(event) => setSiteField('contactEmail', event.target.value)}
      />
      <TextField
        label='Teléfono del contacto'
        value={values.site.contactPhone || ''}
        onChange={(event) => setSiteField('contactPhone', event.target.value)}
      />
      <TextField
        label='Dirección'
        sx={FULL_ROW}
        value={values.site.address || ''}
        onChange={(event) => setSiteField('address', event.target.value)}
      />
      <TextField
        label='Ciudad'
        value={values.site.city || ''}
        onChange={(event) => setSiteField('city', event.target.value)}
      />
      <TextField
        label='Departamento'
        value={values.site.department || ''}
        onChange={(event) => setSiteField('department', event.target.value)}
      />
      <TextField
        label='País'
        value={values.site.country || ''}
        onChange={(event) => setSiteField('country', event.target.value)}
      />
      <TextField
        multiline
        minRows={2}
        label='Notas de la sede'
        sx={FULL_ROW}
        value={values.site.notes || ''}
        onChange={(event) => setSiteField('notes', event.target.value)}
      />
    </FormDialogSection>
  )

  const isIncomplete =
    !values.site.name.trim() ||
    (mode === 'customer' && !values.customer.nombre.trim())

  return (
    <FormDialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={title}
      subtitle={
        mode === 'site'
          ? customer?.nombre || 'Cliente seleccionado'
          : 'Estos datos alimentan la cotización de venta de equipos'
      }
      submitLabel={
        mode === 'customer'
          ? 'Crear cliente'
          : site?.id
            ? 'Guardar sede'
            : 'Crear sede'
      }
      onSubmit={handleSubmit}
      loading={isSubmitting}
      submitDisabled={isIncomplete}
      maxWidth='md'
    >
      {mode === 'customer' ? (
        <FormDialogSection title='Datos de la empresa'>
          <TextField
            required
            label='Nombre / razón social'
            value={values.customer.nombre}
            onChange={(event) => setCustomerField('nombre', event.target.value)}
          />
          <TextField
            label='NIT / identificación'
            value={values.customer.identificacion}
            onChange={(event) =>
              setCustomerField('identificacion', event.target.value)
            }
          />
          <TextField
            type='email'
            label='Email principal'
            value={values.customer.email}
            onChange={(event) => setCustomerField('email', event.target.value)}
          />
          <TextField
            label='Teléfono principal'
            value={values.customer.telefono}
            onChange={(event) =>
              setCustomerField('telefono', event.target.value)
            }
          />
        </FormDialogSection>
      ) : null}
      {siteSection}
    </FormDialog>
  )
}

export default EquipmentSalesCustomerDialog
