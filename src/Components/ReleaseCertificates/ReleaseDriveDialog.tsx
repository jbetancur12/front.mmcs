import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import {
  DriveLevel,
  DRIVE_LEVEL_PRESETS,
  useDriveActions,
  useDriveStatus
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

interface ReleaseDriveDialogProps {
  open: boolean
  onClose: () => void
}

const sameLevels = (a: DriveLevel[], b: DriveLevel[]) =>
  a.length === b.length && a.every((level, index) => level === b[index])

/**
 * Conexión con el Drive del laboratorio. La credencial se pega aquí, se guarda cifrada en el servidor y nunca se
 * vuelve a mostrar: solo se ve que está configurada y de qué cuenta es.
 */
const ReleaseDriveDialog: React.FC<ReleaseDriveDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: status, isLoading } = useDriveStatus(open)
  const actions = useDriveActions()
  const [credentials, setCredentials] = useState('')
  const [rootFolderId, setRootFolderId] = useState('')
  const [preset, setPreset] = useState(0)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (!status) return
    setRootFolderId(status.rootFolderId ?? '')
    const index = DRIVE_LEVEL_PRESETS.findIndex((p) =>
      sameLevels(p.levels, status.levels)
    )
    setPreset(index >= 0 ? index : 0)
  }, [status])

  const fail = (message: string) => (error: unknown) =>
    notify.error(message, getApiErrorReason(error) ?? undefined)

  const save = () =>
    actions.save.mutate(
      {
        credentials: credentials.trim() || undefined,
        rootFolderId: rootFolderId.trim(),
        levels: DRIVE_LEVEL_PRESETS[preset].levels
      },
      {
        onSuccess: () => {
          setCredentials('')
          notify.success('Configuración del Drive guardada')
        },
        onError: fail('No se pudo guardar la configuración')
      }
    )

  const test = () =>
    actions.test.mutate(undefined, {
      onSuccess: (result) =>
        result.lastTestOk
          ? notify.success(
              'Conexión correcta',
              result.lastTestMessage ?? undefined
            )
          : notify.error(
              'La conexión falló',
              result.lastTestMessage ?? undefined
            ),
      onError: fail('No se pudo probar la conexión')
    })

  const backfill = () =>
    actions.backfill.mutate(undefined, {
      onSuccess: ({ queued }) =>
        notify.success(
          queued === 0
            ? 'No hay certificados liberados pendientes de copiar'
            : `${queued} certificados en cola para copiar al Drive`
        ),
      onError: fail('No se pudo encolar la copia')
    })

  const remove = () =>
    actions.remove.mutate(undefined, {
      onSuccess: () => {
        setConfirmRemove(false)
        notify.success('Conexión con el Drive eliminada')
      },
      onError: fail('No se pudo eliminar la conexión')
    })

  const canSave =
    rootFolderId.trim() !== '' &&
    (status?.configured || credentials.trim() !== '')

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>Copia al Drive</DialogTitle>
      <DialogContent>
        {isLoading || !status ? (
          <SignalLoader message='Cargando configuración' />
        ) : (
          <>
            {!status.encryptionReady && (
              <Alert severity='error' sx={{ mb: 2 }}>
                El servidor no tiene la clave para cifrar credenciales
                (SECRETS_MASTER_KEY). Pídele a quien administra el servidor que
                la configure antes de guardar la credencial.
              </Alert>
            )}
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Cuando se libera un certificado, el sistema copia el PDF a esta
              carpeta del Drive. Si Google falla, el certificado sigue liberado
              y la copia se reintenta sola.
            </Typography>

            {status.configured ? (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                >
                  <Chip
                    color='success'
                    size='small'
                    label='Credencial guardada (cifrada)'
                  />
                  <Typography variant='body2'>{status.clientEmail}</Typography>
                </Box>
                {status.lastTestAt && (
                  <Typography
                    variant='caption'
                    color={status.lastTestOk ? 'text.secondary' : 'error'}
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Última prueba{' '}
                    {new Date(status.lastTestAt).toLocaleString('es-CO')}:{' '}
                    {status.lastTestMessage}
                  </Typography>
                )}
              </Box>
            ) : (
              <Alert severity='info' sx={{ mb: 2 }}>
                Aún no hay conexión. Crea una cuenta de servicio de Google,
                comparte la carpeta con su correo como editor y pega aquí su
                archivo JSON.
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              minRows={4}
              size='small'
              label={
                status.configured
                  ? 'Reemplazar credencial (JSON de la cuenta de servicio)'
                  : 'Credencial (JSON de la cuenta de servicio)'
              }
              value={credentials}
              onChange={(event) => setCredentials(event.target.value)}
              placeholder='{ "type": "service_account", ... }'
              autoComplete='off'
              inputProps={{ spellCheck: false }}
              helperText='Se guarda cifrada y no se vuelve a mostrar. No la compartas por chat ni la subas al repositorio.'
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size='small'
              label='Identificador de la carpeta raíz'
              value={rootFolderId}
              onChange={(event) => setRootFolderId(event.target.value)}
              helperText='Es el final de la dirección de la carpeta en Drive.'
              sx={{ mb: 2 }}
            />
            <TextField
              select
              fullWidth
              size='small'
              label='Estructura de carpetas'
              value={preset}
              onChange={(event) => setPreset(Number(event.target.value))}
            >
              {DRIVE_LEVEL_PRESETS.map((option, index) => (
                <MenuItem key={option.label} value={index}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {status?.configured && (
          <>
            <Button
              color='error'
              onClick={() => setConfirmRemove(true)}
              disabled={actions.remove.isLoading}
            >
              Quitar conexión
            </Button>
            <Button onClick={backfill} disabled={actions.backfill.isLoading}>
              Copiar liberados pendientes
            </Button>
            <Button onClick={test} disabled={actions.test.isLoading}>
              Probar conexión
            </Button>
          </>
        )}
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant='contained'
          disabled={
            !canSave || actions.save.isLoading || !status?.encryptionReady
          }
          onClick={save}
          sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
        >
          Guardar
        </Button>
      </DialogActions>
      <ConfirmDialog
        open={confirmRemove}
        title='¿Quitar la conexión con el Drive?'
        message='Se borra la credencial guardada. Los certificados liberados dejarán de copiarse hasta que configures una nueva.'
        confirmLabel='Quitar'
        tone='danger'
        loading={actions.remove.isLoading}
        onConfirm={remove}
        onClose={() => setConfirmRemove(false)}
      />
    </Dialog>
  )
}

export default ReleaseDriveDialog
