import React, { useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog, { FormDialogSection } from './Common/FormDialog'
import { CustomerData } from './TableCustomers'

interface CustomerFormDialogProps {
  open: boolean
  /** Sin cliente se crea uno nuevo; con cliente se editan sus datos. */
  customer?: CustomerData | null
  onClose: () => void
  /** Guarda en el servidor. El diálogo espera y se cierra solo si no falla. */
  onSubmit: (customerData: CustomerData) => Promise<void> | void
}

type FieldName =
  | 'nombre'
  | 'identificacion'
  | 'email'
  | 'telefono'
  | 'direccion'
  | 'ciudad'
  | 'departamento'
  | 'pais'

const EMPTY_CUSTOMER: CustomerData = {
  nombre: '',
  identificacion: '',
  direccion: '',
  email: '',
  telefono: '',
  ciudad: '',
  departamento: '',
  pais: 'Colombia',
  rol: 'customer',
  isActive: true
}

const REQUIRED_MESSAGES: Partial<Record<FieldName, string>> = {
  nombre: 'Escribe la razón social.',
  identificacion: 'Escribe el NIT o la identificación.',
  email: 'Escribe un correo de contacto.',
  telefono: 'Escribe un teléfono de contacto.',
  direccion: 'Escribe la dirección.',
  ciudad: 'Escribe la ciudad.',
  departamento: 'Escribe el departamento.'
}

const validate = (values: CustomerData) => {
  const errors: Partial<Record<FieldName, string>> = {}
  ;(Object.keys(REQUIRED_MESSAGES) as FieldName[]).forEach((field) => {
    if (!String(values[field] ?? '').trim()) {
      errors[field] = REQUIRED_MESSAGES[field]
    }
  })
  if (!errors.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Revisa el correo: debe tener la forma nombre@empresa.com.'
  }
  return errors
}

/**
 * Crear o editar un cliente (empresa) desde el listado de clientes.
 * Usa FormDialog: cabecera blanca, secciones y botón principal turquesa.
 */
const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  customer,
  onClose,
  onSubmit
}) => {
  const isEditing = Boolean(customer)
  const [values, setValues] = useState<CustomerData>(EMPTY_CUSTOMER)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [saving, setSaving] = useState(false)

  // Cada vez que se abre parte de los datos del cliente o de un formulario vacío
  useEffect(() => {
    if (!open) return
    setValues(customer ? { ...EMPTY_CUSTOMER, ...customer } : EMPTY_CUSTOMER)
    setErrors({})
    setSaving(false)
  }, [open, customer])

  const fieldProps = (name: FieldName) => ({
    name,
    value: values[name] ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [name]: event.target.value }))
      if (errors[name]) {
        setErrors((current) => ({ ...current, [name]: undefined }))
      }
    },
    error: Boolean(errors[name]),
    required: Boolean(REQUIRED_MESSAGES[name]),
    fullWidth: true
  })

  const handleSubmit = async () => {
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    try {
      await onSubmit({
        ...values,
        nombre: values.nombre.trim(),
        identificacion: values.identificacion.trim(),
        email: values.email.trim()
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={isEditing ? 'Editar cliente' : 'Crear cliente'}
      subtitle={isEditing ? customer?.nombre : undefined}
      submitLabel={isEditing ? 'Guardar cambios' : 'Crear cliente'}
      onSubmit={() => void handleSubmit()}
      loading={saving}
      maxWidth='md'
    >
      <FormDialogSection title='Datos de la empresa'>
        <TextField
          label='Razón social'
          autoFocus={!isEditing}
          autoComplete='organization'
          {...fieldProps('nombre')}
          helperText={errors.nombre}
        />
        <TextField
          label='NIT o identificación'
          {...fieldProps('identificacion')}
          helperText={errors.identificacion || 'Como aparece en el RUT.'}
        />
      </FormDialogSection>

      <FormDialogSection title='Contacto'>
        <TextField
          label='Correo'
          type='email'
          autoComplete='email'
          {...fieldProps('email')}
          helperText={errors.email}
        />
        <TextField
          label='Teléfono'
          type='tel'
          autoComplete='tel'
          {...fieldProps('telefono')}
          helperText={errors.telefono}
        />
      </FormDialogSection>

      <FormDialogSection title='Ubicación'>
        <TextField
          label='Dirección'
          autoComplete='street-address'
          {...fieldProps('direccion')}
          helperText={errors.direccion}
          sx={{ gridColumn: { sm: '1 / -1' } }}
        />
        <TextField
          label='Ciudad'
          autoComplete='address-level2'
          {...fieldProps('ciudad')}
          helperText={errors.ciudad}
        />
        <TextField
          label='Departamento'
          autoComplete='address-level1'
          {...fieldProps('departamento')}
          helperText={errors.departamento}
        />
        <TextField
          label='País'
          autoComplete='country-name'
          {...fieldProps('pais')}
        />
      </FormDialogSection>
    </FormDialog>
  )
}

export default CustomerFormDialog
