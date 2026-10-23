import { ContentCopy, WhatsApp } from '@mui/icons-material'
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'

import {
  ActivationLinkInfo,
  buildActivationWhatsappUrl,
  copyToClipboard
} from '../utils/activationLink'

import FormDialog from './Common/FormDialog'

interface ActivationLinkDialogProps {
  open: boolean
  info: ActivationLinkInfo
  onClose: () => void
}

/**
 * Enlace de activación de un usuario: copiar o enviar por WhatsApp.
 * Se usa al crear un usuario y al consultar o reenviar la activación de uno
 * pendiente. Copiar no cierra el diálogo, para poder seguir con WhatsApp.
 */
const ActivationLinkDialog = ({
  open,
  info,
  onClose
}: ActivationLinkDialogProps) => {
  const [copied, setCopied] = useState<boolean | null>(null)

  useEffect(() => {
    if (open) setCopied(null)
  }, [open])

  const copy = async () => setCopied(await copyToClipboard(info.activationUrl))

  const emailFailed = info.emailSent === false

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={
        emailFailed
          ? 'Usuario sin correo de activación'
          : 'Enlace de activación'
      }
      subtitle={info.nombre ? `${info.nombre} · ${info.email}` : info.email}
      submitLabel={copied ? 'Copiado' : 'Copiar enlace'}
      onSubmit={() => void copy()}
      cancelLabel='Cerrar'
      extraActions={
        <Button
          startIcon={<WhatsApp />}
          onClick={() =>
            window.open(
              buildActivationWhatsappUrl(info),
              '_blank',
              'noopener,noreferrer'
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#00695C'
          }}
        >
          Enviar por WhatsApp
        </Button>
      }
    >
      <Stack spacing={2}>
        {info.emailSent === true ? (
          <Alert severity='success'>
            Se envió el correo de activación a <strong>{info.email}</strong>.
          </Alert>
        ) : null}
        {emailFailed ? (
          <Alert severity='warning'>
            No se pudo enviar el correo a <strong>{info.email}</strong>.
            {info.emailError ? (
              <Typography variant='caption' display='block'>
                {info.emailError}
              </Typography>
            ) : null}{' '}
            Comparte el enlace de abajo por otro medio.
          </Alert>
        ) : null}
        <Typography variant='body2' color='text.secondary'>
          Comparte este enlace con el usuario para que cree su contraseña. Un
          enlace generado antes para este usuario deja de funcionar.
        </Typography>
        <TextField
          fullWidth
          label='Enlace'
          value={info.activationUrl}
          onFocus={(event) => event.target.select()}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position='end'>
                <Tooltip title='Copiar enlace'>
                  <IconButton
                    aria-label='Copiar enlace'
                    edge='end'
                    onClick={() => void copy()}
                  >
                    <ContentCopy fontSize='small' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
          helperText={
            copied === true
              ? '¡Enlace copiado!'
              : copied === false
                ? 'No se pudo copiar, selecciónalo manualmente.'
                : undefined
          }
          FormHelperTextProps={{
            sx: { color: copied === false ? 'error.main' : '#00695C' }
          }}
        />
      </Stack>
    </FormDialog>
  )
}

export default ActivationLinkDialog
