import React, { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  CheckCircleOutline,
  CloseRounded,
  CloudUploadOutlined,
  ErrorOutline,
  PictureAsPdfOutlined
} from '@mui/icons-material'
import { useUploadReleaseCertificates } from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { getApiErrorReason } from 'src/utils/apiError'
import ReleaseServicePicker from './ReleaseServicePicker'
import {
  ReleaseServiceOption,
  ReleaseUploadResult
} from './ReleaseCertificates.types'

const MAX_FILES = 50
const MAX_SIZE_MB = 20
const BUTTON_SX = { bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }

interface ReleaseUploadDialogProps {
  open: boolean
  onClose: () => void
}

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

const resultDetail = (result: ReleaseUploadResult) => {
  if (!result.ok) return result.error
  const pending = result.certificate?.anomalies.length
  return [
    result.certificate?.documentNumber,
    pending ? `${pending} por revisar` : null
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Carga masiva: se sueltan los PDF y el sistema los lee; no se diligencia nada más. */
const ReleaseUploadDialog: React.FC<ReleaseUploadDialogProps> = ({
  open,
  onClose
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState<string[]>([])
  const [results, setResults] = useState<ReleaseUploadResult[] | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [service, setService] = useState<ReleaseServiceOption | null>(null)
  const upload = useUploadReleaseCertificates()

  const reset = () => {
    setFiles([])
    setRejected([])
    setResults(null)
    setFailure(null)
    setService(null)
  }

  const close = () => {
    if (upload.isLoading) return
    reset()
    onClose()
  }

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return
    const refused: string[] = []
    const accepted = [...incoming].filter((file) => {
      if (!isPdf(file)) {
        refused.push(`${file.name}: no es un PDF`)
        return false
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        refused.push(`${file.name}: supera ${MAX_SIZE_MB} MB`)
        return false
      }
      return true
    })
    setRejected(refused)
    setFiles((current) => {
      const known = new Set(current.map((f) => `${f.name}:${f.size}`))
      const fresh = accepted.filter((f) => !known.has(`${f.name}:${f.size}`))
      return [...current, ...fresh].slice(0, MAX_FILES)
    })
  }

  const send = () => {
    setFailure(null)
    upload.mutate(
      { files, serviceId: service?.id ?? null },
      {
        onSuccess: (data) => setResults(data),
        onError: (error) =>
          setFailure(
            getApiErrorReason(error) ?? 'No se pudo completar la carga'
          )
      }
    )
  }

  const okCount = results?.filter((r) => r.ok).length ?? 0

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>Cargar certificados</DialogTitle>
      <DialogContent>
        {results ? (
          <Box>
            <Alert
              severity={okCount === results.length ? 'success' : 'warning'}
            >
              {okCount} de {results.length} certificados quedaron pendientes de
              revisión.
            </Alert>
            <Box component='ul' sx={{ listStyle: 'none', p: 0, mt: 2, mb: 0 }}>
              {results.map((result, index) => (
                <Box
                  component='li'
                  key={`${result.fileName}-${index}`}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                    py: 0.5
                  }}
                >
                  {result.ok ? (
                    <CheckCircleOutline
                      fontSize='small'
                      sx={{ color: '#2e7d32', mt: 0.25 }}
                    />
                  ) : (
                    <ErrorOutline
                      fontSize='small'
                      sx={{ color: '#b91c1c', mt: 0.25 }}
                    />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant='body2'
                      sx={{ wordBreak: 'break-word' }}
                    >
                      {result.fileName}
                    </Typography>
                    <Typography
                      variant='caption'
                      color={result.ok ? 'text.secondary' : 'error'}
                    >
                      {resultDetail(result)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <ReleaseServicePicker
                value={service}
                onChange={setService}
                helperText='Opcional. Si los PDF son de un servicio, elígelo: el cliente se toma de ahí. Si no, déjalo vacío.'
              />
            </Box>
            <Box
              role='button'
              tabIndex={0}
              aria-label='Elegir o arrastrar los PDF de los certificados'
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                addFiles(event.dataTransfer.files)
              }}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? '#00BFA5' : '#d1d5db',
                bgcolor: dragOver ? '#f0fbf9' : '#fafafa',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:focus-visible': { outline: '2px solid #00BFA5' }
              }}
            >
              <CloudUploadOutlined sx={{ fontSize: 40, color: '#00897B' }} />
              <Typography fontWeight={600}>
                Suelta aquí los PDF o haz clic para elegirlos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Hasta {MAX_FILES} archivos de {MAX_SIZE_MB} MB. El sistema lee
                el cliente, el equipo y las fechas.
              </Typography>
              <input
                ref={inputRef}
                type='file'
                accept='application/pdf,.pdf'
                multiple
                hidden
                onChange={(event) => {
                  addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </Box>

            {rejected.length > 0 && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                {rejected.join('. ')}
              </Alert>
            )}
            {failure && (
              <Alert severity='error' sx={{ mt: 2 }}>
                {failure}
              </Alert>
            )}

            {files.length > 0 && (
              <Box
                component='ul'
                sx={{
                  listStyle: 'none',
                  p: 0,
                  mt: 2,
                  mb: 0,
                  maxHeight: 240,
                  overflow: 'auto'
                }}
              >
                {files.map((file) => (
                  <Box
                    component='li'
                    key={`${file.name}:${file.size}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.25
                    }}
                  >
                    <PictureAsPdfOutlined
                      fontSize='small'
                      sx={{ color: '#b91c1c' }}
                    />
                    <Typography
                      variant='body2'
                      sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}
                    >
                      {file.name}
                    </Typography>
                    <IconButton
                      size='small'
                      aria-label={`Quitar ${file.name}`}
                      disabled={upload.isLoading}
                      onClick={() =>
                        setFiles((current) => current.filter((f) => f !== file))
                      }
                    >
                      <CloseRounded fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            {upload.isLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' } }}
                />
                <Typography variant='caption' color='text.secondary'>
                  Cargando y leyendo los certificados…
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {results ? (
          <>
            <Button onClick={reset}>Cargar más</Button>
            <Button variant='contained' onClick={close} sx={BUTTON_SX}>
              Listo
            </Button>
          </>
        ) : (
          <>
            <Button onClick={close} disabled={upload.isLoading}>
              Cancelar
            </Button>
            <Button
              variant='contained'
              disabled={files.length === 0 || upload.isLoading}
              onClick={send}
              sx={BUTTON_SX}
            >
              Cargar {files.length > 0 ? `${files.length} ` : ''}
              {files.length === 1 ? 'certificado' : 'certificados'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseUploadDialog
