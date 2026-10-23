import React, { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography
} from '@mui/material'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'
import {
  useFetchDevicesNow,
  type DeviceCatalogItem
} from '@hooks/devices/useDevices'
import useAxiosPrivate from '@utils/use-axios-private'
import { notify } from 'src/utils/notify'

interface PreviewData {
  totalAffected: number
  sourceDevice: { name: string }
  targetDevice: { name: string }
  sampleCertificates?: Array<{
    id: number
    customerName: string
    serie?: string | null
  }>
}

interface BulkReassignDialogProps {
  open: boolean
  onClose: () => void
  customerId?: number
  customerName?: string
  /** Equipo del certificado abierto: se propone como origen. */
  currentDeviceId?: number
  /** Aplica el cambio y devuelve cuántos certificados se actualizaron. */
  onApply: (sourceDeviceId: number, targetDeviceId: number) => Promise<number>
}

type Step = 'select' | 'preview'

/** Cambio masivo de equipo en dos pasos: elegir origen y destino, y confirmar con una vista previa. */
const BulkReassignDialog: React.FC<BulkReassignDialogProps> = ({
  open,
  onClose,
  customerId,
  customerName,
  currentDeviceId,
  onApply
}) => {
  const axiosPrivate = useAxiosPrivate()
  const fetchDevicesNow = useFetchDevicesNow()
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [source, setSource] = useState<DeviceCatalogItem | null>(null)
  const [target, setTarget] = useState<DeviceCatalogItem | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('select')
    setPreview(null)
    setTarget(null)
    setError('')
    setLoadingDevices(true)
    fetchDevicesNow()
      .then((list) => {
        const sorted = [...list].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', {
            sensitivity: 'base'
          })
        )
        setDevices(sorted)
        setSource(
          sorted.find((device) => Number(device.id) === currentDeviceId) ?? null
        )
      })
      .catch(() => setError('No se pudo cargar el catálogo de equipos.'))
      .finally(() => setLoadingDevices(false))
  }, [open])

  const handlePreview = async () => {
    if (!source) {
      setError('Selecciona el equipo origen.')
      return
    }
    if (!target) {
      setError('Selecciona el equipo destino.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const response = await axiosPrivate.post(
        '/files/bulk/device-reassignment/preview',
        {
          sourceDeviceId: Number(source.id),
          targetDeviceId: Number(target.id),
          customerId
        }
      )
      const data: PreviewData = response.data
      if (!data.totalAffected) {
        setError(`No hay certificados asociados a "${source.name}".`)
        return
      }
      setPreview(data)
      setStep('preview')
    } catch (previewError) {
      console.error('Error en la vista previa del cambio masivo:', previewError)
      setError('No se pudo preparar la vista previa del cambio.')
    } finally {
      setBusy(false)
    }
  }

  const handleApply = async () => {
    if (!source || !target) return
    setBusy(true)
    try {
      const updated = await onApply(Number(source.id), Number(target.id))
      notify.success(`Se reasignaron ${updated} certificado(s) correctamente`)
      onClose()
    } catch (applyError) {
      console.error('Error en el cambio masivo:', applyError)
      setError('No se pudo completar el cambio masivo de equipo.')
    } finally {
      setBusy(false)
    }
  }

  const renderPicker = (
    label: string,
    value: DeviceCatalogItem | null,
    onChange: (device: DeviceCatalogItem | null) => void,
    exclude?: DeviceCatalogItem | null
  ) => (
    <Autocomplete<DeviceCatalogItem, false, false, false>
      options={
        exclude
          ? devices.filter((device) => Number(device.id) !== Number(exclude.id))
          : devices
      }
      value={value}
      loading={loadingDevices}
      onChange={(_event, option) => onChange(option)}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
      noOptionsText='Sin resultados'
      loadingText='Cargando equipos…'
      disabled={busy}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
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
  )

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Cambio masivo de equipo'
      subtitle={
        step === 'select'
          ? 'Reasigna en lote los certificados de un equipo a otro.'
          : 'Revisa el alcance antes de aplicar el cambio.'
      }
      submitLabel={step === 'select' ? 'Previsualizar' : 'Aplicar cambio'}
      onSubmit={step === 'select' ? handlePreview : handleApply}
      loading={busy}
      extraActions={
        step === 'preview' ? (
          <Button
            onClick={() => {
              setStep('select')
              setError('')
            }}
            disabled={busy}
            sx={{ textTransform: 'none', color: '#4b5563' }}
          >
            Cambiar selección
          </Button>
        ) : undefined
      }
      maxWidth='sm'
    >
      {error && (
        <Alert
          severity='error'
          variant='outlined'
          sx={{ mb: 2, borderRadius: '12px' }}
        >
          {error}
        </Alert>
      )}
      {step === 'select' ? (
        <FormDialogSection
          title='Equipos'
          description='Los certificados del origen pasarán a quedar asociados al destino.'
        >
          <Box sx={{ gridColumn: '1 / -1' }}>
            {renderPicker('Equipo origen', source, setSource)}
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            {renderPicker('Equipo destino', target, setTarget, source)}
          </Box>
        </FormDialogSection>
      ) : (
        preview && (
          <Box>
            <Typography sx={{ mb: 2 }}>
              Se reasignarán <strong>{preview.totalAffected}</strong>{' '}
              certificado(s) de{' '}
              <strong>{customerName || 'esta empresa'}</strong>.
            </Typography>
            <DetailSection title='Cambio'>
              <DetailCell>
                <DetailField label='Origen'>
                  {preview.sourceDevice.name}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Destino'>
                  {preview.targetDevice.name}
                </DetailField>
              </DetailCell>
            </DetailSection>
            {!!preview.sampleCertificates?.length && (
              <DetailSection title='Muestra'>
                <DetailCell full>
                  <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
                    {preview.sampleCertificates.map((item) => (
                      <li key={item.id}>
                        <Typography variant='body2'>
                          <strong>#{item.id}</strong> · {item.customerName} ·
                          Serie: {item.serie || 'N/A'}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </DetailCell>
              </DetailSection>
            )}
          </Box>
        )
      )}
    </FormDialog>
  )
}

export default BulkReassignDialog
