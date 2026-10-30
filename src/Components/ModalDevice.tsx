import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import { notify } from 'src/utils/notify'
import { useCreateDevice } from '@hooks/devices/useDevices'
import { axiosPrivate } from '../utils/api'
import FormDialog from './Common/FormDialog'
import AsyncSelectField, { AsyncSelectOption } from './Common/AsyncSelectField'

import { logger } from 'src/utils/logger'
interface ModalDeviceProps {
  open: boolean
  onClose: Dispatch<SetStateAction<boolean>>
  name: string
  dataReturned: (data: any) => void
  resetForm: () => void
}

const formFields = ['name', 'magnitude', 'certificateTemplate']

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  magnitude: 'Magnitud',
  certificateTemplate: 'Plantilla de certificado'
}

/** Crea un equipo nuevo desde el análisis de Excel. */
const ModalDevice: React.FC<ModalDeviceProps> = ({
  open,
  onClose,
  name,
  dataReturned,
  resetForm
}) => {
  const createDeviceMutation = useCreateDevice()
  const [formValues, setFormValues] = useState<
    Record<string, string | boolean | AsyncSelectOption | null>
  >(formFields.reduce((obj, field) => ({ ...obj, [field]: '' }), {}))
  const [errors, setErrors] = useState<Record<string, boolean>>(
    formFields.reduce((obj, field) => ({ ...obj, [field]: false }), {})
  )

  const handleClose = () => onClose(false)

  useEffect(() => {
    setFormValues((prev) => ({
      ...prev,
      name: name
    }))
  }, [name])

  const setField = (
    field: string,
    value: string | AsyncSelectOption | null
  ) => {
    setFormValues({ ...formValues, [field]: value })
    setErrors({ ...errors, [field]: !value })
  }

  const handleSubmit = async () => {
    const newErrors = formFields.reduce(
      (obj: Record<string, boolean>, field) => ({
        ...obj,
        [field]: !formValues[field]
      }),
      {}
    )

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      return
    }

    try {
      const response = await createDeviceMutation.mutateAsync(formValues)

      if (response.status === 201) {
        notify.success('Equipo creado exitosamente')
        dataReturned(response.data)
        resetForm()
        onClose(false)
      } else {
        logger.error('Error al crear equipo')
      }
    } catch (error) {
      logger.error('Error de red:', error)
    }
  }

  const searchTemplates = async (
    input: string
  ): Promise<AsyncSelectOption[]> => {
    const response = await axiosPrivate.get('/templates', {
      params: { q: input }
    })
    return response.data.map((item: { id: number; name: string }) => ({
      value: item.id,
      label: item.name
    }))
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear equipo'
      subtitle='Se agregará al catálogo de equipos'
      submitLabel='Crear equipo'
      onSubmit={() => void handleSubmit()}
      loading={createDeviceMutation.isLoading}
    >
      <TextField
        label={FIELD_LABELS.name}
        required
        fullWidth
        value={formValues.name as string}
        onChange={(event) => setField('name', event.target.value)}
        error={errors.name}
        sx={{ mb: 2 }}
      />
      <TextField
        label={FIELD_LABELS.magnitude}
        required
        fullWidth
        value={formValues.magnitude as string}
        onChange={(event) => setField('magnitude', event.target.value)}
        error={errors.magnitude}
        sx={{ mb: 2 }}
      />
      <AsyncSelectField
        label={FIELD_LABELS.certificateTemplate}
        required
        value={(formValues.certificateTemplate as AsyncSelectOption) || null}
        onChange={(option) => setField('certificateTemplate', option)}
        loadOptions={searchTemplates}
        helperText={
          errors.certificateTemplate ? 'Elige una plantilla' : undefined
        }
      />
    </FormDialog>
  )
}

export default ModalDevice
