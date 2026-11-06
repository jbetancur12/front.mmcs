import { useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import { ReleaseStatus } from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import {
  releaseFileUrl,
  useReleaseReview
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { PERMISSIONS } from 'src/constants/permissions'
import { CALIBRATION_SERVICE_QUERY_KEYS } from 'src/hooks/useCalibrationServices'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'
import { useCan } from 'src/utils/functions'
import { CalibrationServiceReleaseCertificates } from '../../types/calibrationService'

type Item = CalibrationServiceReleaseCertificates['items'][number]

// Motivos para eliminar (descartar) un certificado cargado en el servicio.
const DISCARD_REASONS = [
  {
    code: 'duplicado',
    label: 'Duplicado',
    text: 'Ya está cargado: es un duplicado.'
  },
  {
    code: 'cargado_por_error',
    label: 'Cargado por error',
    text: 'Se cargó por error.'
  },
  {
    code: 'servicio_equivocado',
    label: 'Servicio equivocado',
    text: 'Se cargó en el servicio equivocado.'
  }
]

const lineText = (item: Item) =>
  [item.documentNumber ?? 'Sin número', item.instrument, item.serie]
    .filter(Boolean)
    .join(' · ')

interface CertificateRowsProps {
  items: Item[]
  /** Se llama cuando un cambio hecho aquí debe refrescar el servicio. */
  onChanged?: () => void
}

/**
 * Certificados de un corte con lo que se puede hacer sin salir del control documental: verlos, reemplazar el que
 * tiene observaciones por el PDF corregido o eliminarlo (descartarlo con motivo). Revisar y liberar sigue en
 * «Certificados a liberar».
 */
const CalibrationServiceCertificateRows = ({
  items,
  onChanged
}: CertificateRowsProps) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const review = useReleaseReview()
  const canView = useCan(PERMISSIONS.RELEASE_CERTIFICATE_VIEW)
  const canUpload = useCan(PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD)
  const fileInput = useRef<HTMLInputElement>(null)
  const [replacing, setReplacing] = useState<number | null>(null)
  const [discarding, setDiscarding] = useState<number | null>(null)
  const [motive, setMotive] = useState('')
  const [reasons, setReasons] = useState<string[]>([])

  const refresh = () => {
    queryClient.invalidateQueries(CALIBRATION_SERVICE_QUERY_KEYS.detail)
    onChanged?.()
  }

  const openPdf = async (id: number) => {
    try {
      const response = await axiosPrivate.get(releaseFileUrl(id), {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      )
      window.open(url, '_blank', 'noopener')
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
    } catch {
      notify.error('No se pudo abrir el PDF')
    }
  }

  const replaceWith = (file: File | undefined) => {
    const id = replacing
    setReplacing(null)
    if (!file || id === null) return
    review.mutate(
      { type: 'version', id, file },
      {
        onSuccess: () => {
          notify.success(
            'PDF corregido cargado',
            'Quedó pendiente de revisión.'
          )
          refresh()
        },
        onError: (error) =>
          notify.error(
            'No se pudo cargar el PDF',
            getApiErrorReason(error) ?? undefined
          )
      }
    )
  }

  const startDiscard = (id: number | null) => {
    setDiscarding(id)
    setMotive('')
    setReasons([])
  }

  const toggleReason = (reason: (typeof DISCARD_REASONS)[number]) => {
    const selected = reasons.includes(reason.code)
    setReasons(
      selected
        ? reasons.filter((code) => code !== reason.code)
        : [...reasons, reason.code]
    )
    setMotive(
      selected
        ? motive.replace(reason.text, '').trim()
        : motive.includes(reason.text)
          ? motive
          : `${motive.trim()} ${reason.text}`.trim()
    )
  }

  const confirmDiscard = () => {
    if (discarding === null || !motive.trim()) return
    review.mutate(
      { type: 'discard', id: discarding, observation: motive, reasons },
      {
        onSuccess: () => {
          notify.success('Certificado eliminado del servicio')
          startDiscard(null)
          refresh()
        },
        onError: (error) =>
          notify.error(
            'No se pudo eliminar',
            getApiErrorReason(error) ?? undefined
          )
      }
    )
  }

  if (items.length === 0) return null

  return (
    <Box sx={{ ...{ gridColumn: { sm: '1 / -1' } } }}>
      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 0.5 }}>
        Certificados de este corte
      </Typography>
      <input
        ref={fileInput}
        type='file'
        accept='application/pdf,.pdf'
        hidden
        onChange={(event) => {
          replaceWith(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {items.map((item) => {
          const flagged = item.status === 'requiere_ajustes'
          const editable =
            canUpload &&
            (item.status === 'requiere_ajustes' ||
              item.status === 'pendiente_revision')
          return (
            <Box
              component='li'
              key={item.id}
              sx={{
                border: '1px solid',
                borderColor: flagged ? 'warning.main' : 'divider',
                borderRadius: 2,
                p: 1.25,
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Typography variant='body2' sx={{ minWidth: 0 }}>
                  {lineText(item)}
                </Typography>
                <ReleaseStatusPill status={item.status as ReleaseStatus} />
              </Box>
              {item.observation && (
                <Typography
                  variant='caption'
                  color='error'
                  display='block'
                  sx={{ mt: 0.5, whiteSpace: 'pre-line' }}
                >
                  Observación: {item.observation}
                </Typography>
              )}
              <Box
                sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}
              >
                {canView && (
                  <Button size='small' onClick={() => openPdf(item.id)}>
                    Ver PDF
                  </Button>
                )}
                {canUpload && flagged && (
                  <Button
                    size='small'
                    disabled={review.isLoading}
                    onClick={() => {
                      setReplacing(item.id)
                      fileInput.current?.click()
                    }}
                  >
                    Subir PDF corregido
                  </Button>
                )}
                {editable && (
                  <Button
                    size='small'
                    color='error'
                    disabled={review.isLoading}
                    onClick={() =>
                      startDiscard(discarding === item.id ? null : item.id)
                    }
                  >
                    Eliminar
                  </Button>
                )}
              </Box>
              {discarding === item.id && (
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}
                  >
                    {DISCARD_REASONS.map((reason) => (
                      <Chip
                        key={reason.code}
                        size='small'
                        label={reason.label}
                        clickable
                        variant={
                          reasons.includes(reason.code) ? 'filled' : 'outlined'
                        }
                        onClick={() => toggleReason(reason)}
                      />
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    size='small'
                    multiline
                    label='Motivo para eliminar el certificado'
                    value={motive}
                    onChange={(event) => setMotive(event.target.value)}
                    inputProps={{ maxLength: 2000 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size='small'
                      color='error'
                      variant='contained'
                      disabled={!motive.trim() || review.isLoading}
                      onClick={confirmDiscard}
                    >
                      Eliminar certificado
                    </Button>
                    <Button size='small' onClick={() => startDiscard(null)}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default CalibrationServiceCertificateRows
