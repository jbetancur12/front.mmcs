import { useState } from 'react'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { toast } from 'react-hot-toast'
import { useCalibrationServiceMutations } from '../../hooks/useCalibrationServices'
import { getApiErrorMessage } from '../../utils/apiError'

interface RemoteSignatureState {
  expiresAt?: string
  usedAt?: string | null
  signerName?: string | null
}

interface CalibrationServiceRemoteSignatureLinkProps {
  serviceId: string | number
  serviceCode?: string | null
  otherFields?: Record<string, unknown>
  // Ya hay firma de recepción conforme (por la plataforma o por enlace).
  hasSignature?: boolean
}

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('es-CO') : null

const CalibrationServiceRemoteSignatureLink = ({
  serviceId,
  serviceCode,
  otherFields,
  hasSignature = false
}: CalibrationServiceRemoteSignatureLinkProps) => {
  const { createRemoteSignatureLink, revokeRemoteSignatureLink } =
    useCalibrationServiceMutations()
  // El enlace completo solo se conoce al generarlo (en el servidor se guarda su hash).
  const [generated, setGenerated] = useState<{ url: string; expiresAt: string } | null>(
    null
  )

  const remote = (otherFields?.remoteSignature as RemoteSignatureState | undefined) ?? null
  const signedAt = formatDateTime(remote?.usedAt)
  const signerName = remote?.signerName
  const hasActiveLink = Boolean(
    remote?.expiresAt &&
      !remote.usedAt &&
      new Date(remote.expiresAt).getTime() > Date.now()
  )
  const isBusy = createRemoteSignatureLink.isLoading || revokeRemoteSignatureLink.isLoading
  const signedViaLink = hasSignature && Boolean(remote?.usedAt)
  const signedInPlatform = hasSignature && !signedViaLink

  const handleGenerate = async () => {
    try {
      const result = await createRemoteSignatureLink.mutateAsync({
        serviceId: String(serviceId)
      })
      setGenerated(result)
      toast.success('Enlace de firma generado.')
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos generar el enlace de firma.'))
    }
  }

  const handleRevoke = async () => {
    try {
      await revokeRemoteSignatureLink.mutateAsync({ serviceId: String(serviceId) })
      setGenerated(null)
      toast.success('Enlace revocado.')
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos revocar el enlace.'))
    }
  }

  const handleCopy = async () => {
    if (!generated) return
    try {
      await navigator.clipboard.writeText(generated.url)
      toast.success('Enlace copiado.')
    } catch {
      toast.error('No pudimos copiar el enlace. Cópialo manualmente.')
    }
  }

  const whatsappHref = generated
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hola, por favor firma la orden de servicio ${serviceCode || ''} de Metromedics en este enlace: ${generated.url}`
      )}`
    : null

  // La recepción conforme se firma por una sola vía: la que haya firmado primero bloquea la otra.
  if (signedInPlatform) {
    return null
  }

  if (signedViaLink) {
    return (
      <Alert severity='success'>
        Recepción conforme firmada a distancia por {signerName || 'el cliente'} el{' '}
        {signedAt}. Ya no puede firmarse ni modificarse desde la plataforma.
      </Alert>
    )
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: '#00BFA5',
        bgcolor: '#E0F7F4'
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <LinkOutlinedIcon sx={{ color: '#00897B' }} />
          <Typography variant='body2' fontWeight={700}>
            Firma a distancia
          </Typography>
        </Stack>
        <Typography variant='caption' color='text.secondary'>
          Genera un enlace temporal (72 horas, un solo uso) para que el cliente vea la ODS y firme la
          recepción conforme de la orden de servicio desde su celular o computador, sin iniciar sesión.
        </Typography>

        {generated ? (
          <Stack spacing={1}>
            <TextField
              size='small'
              value={generated.url}
              InputProps={{ readOnly: true }}
              onFocus={(event) => event.target.select()}
              fullWidth
            />
            <Typography variant='caption' color='text.secondary'>
              Vence el {formatDateTime(generated.expiresAt)}. Compártelo solo con el
              contacto del cliente: quien tenga el enlace puede firmar.
            </Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Button
                size='small'
                variant='outlined'
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={handleCopy}
              >
                Copiar enlace
              </Button>
              {whatsappHref ? (
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<WhatsAppIcon />}
                  href={whatsappHref}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  WhatsApp
                </Button>
              ) : null}
            </Stack>
          </Stack>
        ) : hasActiveLink ? (
          <Typography variant='caption' color='text.secondary'>
            Hay un enlace activo (vence el {formatDateTime(remote?.expiresAt)}). Por
            seguridad solo se muestra al generarlo; genera uno nuevo para obtenerlo otra
            vez (el anterior dejará de funcionar).
          </Typography>
        ) : null}

        <Stack direction='row' spacing={1}>
          <Button
            size='small'
            variant='contained'
            onClick={handleGenerate}
            disabled={isBusy}
            sx={{
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00897B' },
              textTransform: 'none'
            }}
          >
            {hasActiveLink || generated ? 'Generar nuevo enlace' : 'Generar enlace de firma'}
          </Button>
          {hasActiveLink || generated ? (
            <Button
              size='small'
              color='error'
              onClick={handleRevoke}
              disabled={isBusy}
              sx={{ textTransform: 'none' }}
            >
              Revocar enlace
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}

export default CalibrationServiceRemoteSignatureLink
