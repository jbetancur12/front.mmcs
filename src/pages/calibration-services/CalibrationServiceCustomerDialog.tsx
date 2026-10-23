import { useEffect, useState } from 'react'
import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import {
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite
} from '../../types/calibrationService'

export interface CalibrationServiceCustomerDialogValues {
  customer: {
    nombre: string
    identificacion: string
    email: string
    telefono: string
    direccion: string
    ciudad: string
    departamento: string
    pais: string
    certificateProfileEnabled: boolean
  }
  site: CalibrationServiceCustomerSite
}

interface CalibrationServiceCustomerDialogProps {
  open: boolean
  mode: 'customer' | 'site'
  customer?: CalibrationServiceCustomer | null
  site?: CalibrationServiceCustomerSite | null
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceCustomerDialogValues) => void
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const emptyValues: CalibrationServiceCustomerDialogValues = {
  customer: {
    nombre: '',
    identificacion: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia',
    certificateProfileEnabled: false
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

const CalibrationServiceCustomerDialog = ({
  open,
  mode,
  customer,
  site,
  isSubmitting = false,
  onClose,
  onSubmit
}: CalibrationServiceCustomerDialogProps) => {
  const [values, setValues] =
    useState<CalibrationServiceCustomerDialogValues>(emptyValues)

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
          pais: 'Colombia',
          certificateProfileEnabled: customer.certificateProfileEnabled ?? true
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

    if (mode === 'customer' && customer) {
      setValues({
        customer: {
          nombre: customer.nombre || '',
          identificacion: customer.identificacion || '',
          email: customer.email || '',
          telefono: customer.telefono || '',
          direccion: customer.direccion || '',
          ciudad: customer.ciudad || '',
          departamento: customer.departamento || '',
          pais: 'Colombia',
          certificateProfileEnabled: customer.certificateProfileEnabled ?? true
        },
        site: { ...emptyValues.site }
      })
      return
    }

    setValues(emptyValues)
  }, [customer, mode, open, site])

  const setCustomerField = (
    field: keyof CalibrationServiceCustomerDialogValues['customer'],
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      customer: {
        ...previous.customer,
        [field]: value
      }
    }))
  }

  const setSiteField = (
    field: keyof CalibrationServiceCustomerSite,
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      site: {
        ...previous.site,
        [field]: value
      }
    }))
  }

  const handleSubmit = () => {
    onSubmit(values)
  }

  const isEdit = mode === 'customer' && Boolean(customer)

  const title =
    mode === 'customer'
      ? isEdit
        ? 'Editar cliente comercial'
        : 'Crear cliente comercial'
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
    (mode === 'customer' && !values.customer.nombre.trim()) ||
    (!isEdit && !values.site.name.trim())

  return (
    <FormDialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={title}
      subtitle={
        mode === 'site'
          ? customer?.nombre || 'Cliente seleccionado'
          : 'Estos datos alimentan la cotización y la ODS'
      }
      submitLabel={
        mode === 'customer'
          ? isEdit
            ? 'Guardar cambios'
            : 'Crear cliente'
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
          <Box sx={FULL_ROW}>
            <FormControlLabel
              control={
                <Switch
                  checked={values.customer.certificateProfileEnabled}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      customer: {
                        ...previous.customer,
                        certificateProfileEnabled: event.target.checked
                      }
                    }))
                  }
                  sx={{
                    '& .Mui-checked': { color: '#00BFA5' },
                    '& .Mui-checked + .MuiSwitch-track': {
                      bgcolor: '#00BFA5'
                    }
                  }}
                />
              }
              label='También visible en clientes para certificados'
            />
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
            >
              Déjalo apagado si el cliente solo se usará para cotización, ODS y
              operación de calibración.
            </Typography>
          </Box>
        </FormDialogSection>
      ) : null}
      {isEdit ? null : siteSection}
    </FormDialog>
  )
}

export default CalibrationServiceCustomerDialog
