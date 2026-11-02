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
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { ContentCopyRounded } from '@mui/icons-material'
import ReleaseDriveGuideDialog from './ReleaseDriveGuideDialog'
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

type Mode = 'oauth' | 'service_account'

const MODE_LABELS: Record<Mode, string> = {
  oauth: 'Cuenta de Gmail',
  service_account: 'Cuenta de servicio (Workspace)'
}

const sameLevels = (a: DriveLevel[], b: DriveLevel[]) =>
  a.length === b.length && a.every((level, index) => level === b[index])

/**
 * Conexión con el Drive del laboratorio. Las credenciales se guardan cifradas en el servidor y nunca se vuelven a
 * mostrar: solo se ve que está conectada y con qué cuenta.
 */
const ReleaseDriveDialog: React.FC<ReleaseDriveDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: status, isLoading } = useDriveStatus(open)
  const actions = useDriveActions()
  const [mode, setMode] = useState<Mode>('oauth')
  const [credentials, setCredentials] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [rootFolderId, setRootFolderId] = useState('')
  const [preset, setPreset] = useState(0)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    if (!status) return
    setRootFolderId(status.rootFolderId ?? '')
    if (status.mode) setMode(status.mode)
    const index = DRIVE_LEVEL_PRESETS.findIndex((p) =>
      sameLevels(p.levels, status.levels)
    )
    setPreset(index >= 0 ? index : 0)
  }, [status])

  const fail = (message: string) => (error: unknown) =>
    notify.error(message, getApiErrorReason(error) ?? undefined)

  const levels = DRIVE_LEVEL_PRESETS[preset].levels

  const save = () =>
    actions.save.mutate(
      {
        credentials: credentials.trim() || undefined,
        rootFolderId: rootFolderId.trim(),
        levels
      },
      {
        onSuccess: () => {
          setCredentials('')
          notify.success('Configuración del Drive guardada')
        },
        onError: fail('No se pudo guardar la configuración')
      }
    )

  // Lleva a Google a autorizar y vuelve a esta pantalla con ?drive=connected.
  const connectWithGoogle = () =>
    actions.startOAuth.mutate(
      {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        rootFolderId: rootFolderId.trim(),
        levels,
        returnUrl: `${window.location.origin}/release-certificates`
      },
      {
        onSuccess: ({ authUrl }) => {
          window.location.href = authUrl
        },
        onError: fail('No se pudo iniciar la conexión con Google')
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

  const copyRedirect = () => {
    if (!status?.redirectUri) return
    navigator.clipboard
      ?.writeText(status.redirectUri)
      .then(() => notify.success('Dirección copiada'))
      .catch(() => notify.error('No se pudo copiar; selecciónala y cópiala'))
  }

  const connectedMode = status?.configured ? status.mode : null
  const sameModeConnected = connectedMode === mode
  const needsQuotaHint =
    status?.lastTestOk === false &&
    /espacio propio/i.test(status.lastTestMessage ?? '')

  const canSaveSettings =
    sameModeConnected && rootFolderId.trim() !== '' && credentials.trim() === ''
  const canSaveServiceAccount =
    mode === 'service_account' &&
    rootFolderId.trim() !== '' &&
    (sameModeConnected || credentials.trim() !== '')
  const canConnect =
    mode === 'oauth' &&
    clientId.trim() !== '' &&
    clientSecret.trim() !== '' &&
    rootFolderId.trim() !== ''

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
            <Button
              size='small'
              variant='outlined'
              sx={{ mb: 2 }}
              onClick={() => setGuideOpen(true)}
            >
              ¿Cómo obtengo la credencial? Guía paso a paso
            </Button>

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
                    label={`Conectado (${MODE_LABELS[status.mode ?? 'service_account']}, cifrado)`}
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
                Aún no hay conexión. Elige cómo conectar y sigue la guía.
              </Alert>
            )}

            {needsQuotaHint && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Una cuenta de servicio no puede guardar archivos en un Drive
                personal. Conecta con una cuenta de Gmail (pestaña «Cuenta de
                Gmail») o usa una unidad compartida de Google Workspace.
              </Alert>
            )}

            <Tabs
              value={mode}
              onChange={(_event, value: Mode) => setMode(value)}
              sx={{
                mb: 2,
                '& .MuiTabs-indicator': { backgroundColor: '#00BFA5' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
              }}
            >
              <Tab value='oauth' label={MODE_LABELS.oauth} />
              <Tab
                value='service_account'
                label={MODE_LABELS.service_account}
              />
            </Tabs>

            {mode === 'oauth' ? (
              <>
                <Typography variant='body2' sx={{ mb: 1.5 }}>
                  Los PDF se guardan en el Drive de la cuenta de Gmail que
                  autorices y usan su espacio. Necesitas el ID y el secreto de
                  un «cliente OAuth» creado en Google Cloud (la guía te lleva).
                </Typography>
                <TextField
                  fullWidth
                  size='small'
                  label='ID de cliente'
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  autoComplete='off'
                  inputProps={{ spellCheck: false }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  size='small'
                  type='password'
                  label='Secreto de cliente'
                  value={clientSecret}
                  onChange={(event) => setClientSecret(event.target.value)}
                  autoComplete='new-password'
                  helperText='Se guarda cifrado y no se vuelve a mostrar.'
                  sx={{ mb: 2 }}
                />
                {status.redirectUri && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Dirección de redireccionamiento autorizada (regístrala tal
                      cual en el cliente OAuth de Google Cloud):
                    </Typography>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography
                        variant='body2'
                        sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                      >
                        {status.redirectUri}
                      </Typography>
                      <Tooltip title='Copiar'>
                        <IconButton
                          size='small'
                          aria-label='Copiar la dirección de redireccionamiento'
                          onClick={copyRedirect}
                        >
                          <ContentCopyRounded fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <TextField
                fullWidth
                multiline
                minRows={4}
                size='small'
                label={
                  sameModeConnected
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
            )}

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
        {mode === 'oauth' && (
          <Button
            variant='contained'
            disabled={
              !canConnect ||
              actions.startOAuth.isLoading ||
              !status?.encryptionReady
            }
            onClick={connectWithGoogle}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
          >
            {sameModeConnected
              ? 'Reconectar con Google'
              : 'Conectar con Google'}
          </Button>
        )}
        {(canSaveServiceAccount || canSaveSettings) && (
          <Button
            variant={mode === 'oauth' ? 'outlined' : 'contained'}
            disabled={actions.save.isLoading || !status?.encryptionReady}
            onClick={save}
            sx={
              mode === 'oauth'
                ? undefined
                : { bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }
            }
          >
            Guardar
          </Button>
        )}
      </DialogActions>
      <ReleaseDriveGuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
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
