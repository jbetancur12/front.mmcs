import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, CircularProgress, TextField } from '@mui/material'
import { addYears, format, isValid, parse } from 'date-fns'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import FormDateField from 'src/Components/Common/FormDateField'
import {
  useFetchDevicesNow,
  type DeviceCatalogItem
} from '@hooks/devices/useDevices'
import { bigToast } from '../ExcelManipulation/Utils'

export interface CertificateEditValues {
  deviceId: number | null
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  /** `yyyy-MM-dd` */
  calibrationDate: string
}

interface CertificateEditDialogProps {
  open: boolean
  onClose: () => void
  /** Valores actuales del certificado. */
  initial: CertificateEditValues
  /** Recibe solo los campos que cambiaron, listos para enviar. */
  onSave: (payload: Record<string, unknown>) => Promise<void>
}

const FULL_ROW = { gridColumn: '1 / -1' } as const

/**
 * Edición de los datos de un certificado en un solo formulario (reemplaza los
 * diálogos sueltos por campo). Cambiar la fecha de calibración recalcula la
 * próxima a un año, igual que antes.
 */
const CertificateEditDialog: React.FC<CertificateEditDialogProps> = ({
  open,
  onClose,
  initial,
  onSave
}) => {
  const fetchDevicesNow = useFetchDevicesNow()
  const [values, setValues] = useState<CertificateEditValues>(initial)
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(initial)
    setLoadingDevices(true)
    fetchDevicesNow()
      .then((list) =>
        setDevices(
          [...list].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''), 'es', {
              sensitivity: 'base'
            })
          )
        )
      )
      .catch(() =>
        bigToast('No se pudo cargar el catálogo de equipos', 'error')
      )
      .finally(() => setLoadingDevices(false))
  }, [open])

  const setField =
    (name: keyof CertificateEditValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value }))

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = {}
    ;(['city', 'location', 'sede', 'activoFijo', 'serie'] as const).forEach(
      (key) => {
        if (values[key] !== initial[key]) payload[key] = values[key]
      }
    )
    if (values.deviceId && values.deviceId !== initial.deviceId) {
      payload.deviceId = values.deviceId
    }
    if (values.calibrationDate !== initial.calibrationDate) {
      if (!values.calibrationDate) {
        bigToast('Selecciona la fecha de calibración', 'error')
        return
      }
      payload.calibrationDate = values.calibrationDate
      const parsed = parse(values.calibrationDate, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        payload.nextCalibrationDate = format(addYears(parsed, 1), 'yyyy-MM-dd')
      }
    }
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const selectedDevice =
    devices.find((device) => Number(device.id) === values.deviceId) ?? null

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Editar datos del certificado'
      subtitle='Solo se guardan los campos que cambies.'
      submitLabel='Guardar cambios'
      onSubmit={handleSubmit}
      loading={saving}
      maxWidth='md'
    >
      <FormDialogSection title='Equipo'>
        <Box sx={FULL_ROW}>
          <Autocomplete<DeviceCatalogItem, false, false, false>
            options={devices}
            value={selectedDevice}
            loading={loadingDevices}
            onChange={(_event, option) =>
              setValues((current) => ({
                ...current,
                deviceId: option ? Number(option.id) : current.deviceId
              }))
            }
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
            noOptionsText='Sin resultados'
            loadingText='Cargando equipos…'
            renderInput={(params) => (
              <TextField
                {...params}
                label='Equipo'
                helperText='El certificado quedará asociado a este equipo.'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingDevices ? (
                        <CircularProgress color='inherit' size={18} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        </Box>
      </FormDialogSection>

      <FormDialogSection title='Ubicación'>
        <TextField
          fullWidth
          label='Ciudad'
          value={values.city}
          onChange={setField('city')}
        />
        <TextField
          fullWidth
          label='Ubicación'
          value={values.location}
          onChange={setField('location')}
        />
        <Box sx={FULL_ROW}>
          <TextField
            fullWidth
            label='Dirección'
            value={values.sede}
            onChange={setField('sede')}
          />
        </Box>
      </FormDialogSection>

      <FormDialogSection title='Identificación y calibración'>
        <TextField
          fullWidth
          label='Activo fijo'
          value={values.activoFijo}
          onChange={setField('activoFijo')}
        />
        <TextField
          fullWidth
          label='Serie'
          value={values.serie}
          onChange={setField('serie')}
        />
        <FormDateField
          label='Última calibración'
          name='calibrationDate'
          value={values.calibrationDate}
          onChange={(value) =>
            setValues((current) => ({ ...current, calibrationDate: value }))
          }
        />
        <Box
          sx={{
            alignSelf: 'center',
            color: 'text.secondary',
            fontSize: 13
          }}
        >
          La próxima calibración se calcula un año después.
        </Box>
      </FormDialogSection>
    </FormDialog>
  )
}

export default CertificateEditDialog
