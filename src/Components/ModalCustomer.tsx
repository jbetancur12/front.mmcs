import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { TextField } from '@mui/material'

import FormDialog, { FormDialogSection } from './Common/FormDialog'
import { notify } from 'src/utils/notify'
import { useCreateCustomer } from 'src/hooks/customers/useCustomers'

import { logger } from 'src/utils/logger'
import type { CreatedCustomerOption } from './ExcelManipulation/Types'

interface ModalCustomerProps {
  open: boolean
  onClose: Dispatch<SetStateAction<boolean>>
  name: string
  dataReturned: (data: CreatedCustomerOption) => void
}

const FIELDS: Array<{ name: string; label: string; fullWidth?: boolean }> = [
  { name: 'nombre', label: 'Nombre', fullWidth: true },
  { name: 'email', label: 'Correo' },
  { name: 'identificacion', label: 'Identificación' },
  { name: 'direccion', label: 'Dirección' },
  { name: 'telefono', label: 'Teléfono' },
  { name: 'ciudad', label: 'Ciudad' },
  { name: 'departamento', label: 'Departamento' },
  { name: 'pais', label: 'País' }
]

const emptyValues = () =>
  FIELDS.reduce<Record<string, string>>(
    (obj, field) => ({ ...obj, [field.name]: '' }),
    {}
  )

const ModalCustomer: React.FC<ModalCustomerProps> = ({
  open,
  onClose,
  name,
  dataReturned
}) => {
  const createCustomer = useCreateCustomer<Record<string, string | boolean>>()
  const [formValues, setFormValues] =
    useState<Record<string, string>>(emptyValues)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const handleClose = () => onClose(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name: field, value } = event.target
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: value === '' }))
  }

  // El nombre llega del Excel; el resto lo completa quien crea el cliente
  useEffect(() => {
    setFormValues((prev) => ({ ...prev, nombre: name }))
  }, [name])

  const handleSubmit = async () => {
    const newErrors = FIELDS.reduce<Record<string, boolean>>(
      (obj, field) => ({ ...obj, [field.name]: formValues[field.name] === '' }),
      {}
    )
    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      return
    }

    try {
      const response = await createCustomer.mutateAsync(formValues)

      if (response.status === 201) {
        notify.success('Cliente creado')
        dataReturned(response.data)
        onClose(false)
      } else {
        logger.error('Error al crear cliente')
      }
    } catch (error) {
      logger.error('Error de red:', error)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear cliente'
      subtitle='Datos del cliente que trae el Excel'
      submitLabel='Crear cliente'
      onSubmit={handleSubmit}
      loading={createCustomer.isLoading}
      maxWidth='sm'
    >
      <FormDialogSection title='Datos del cliente'>
        {FIELDS.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            value={formValues[field.name]}
            onChange={handleChange}
            error={Boolean(errors[field.name])}
            helperText={errors[field.name] ? 'Obligatorio' : undefined}
            required
            fullWidth
            sx={field.fullWidth ? { gridColumn: '1 / -1' } : undefined}
          />
        ))}
      </FormDialogSection>
    </FormDialog>
  )
}

export default ModalCustomer
