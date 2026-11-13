import React, { useEffect, useRef, useState } from 'react'
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
  Link,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  CheckCircleOutline,
  CloseRounded,
  CloudUploadOutlined,
  ErrorOutline,
  PictureAsPdfOutlined,
  ScheduleOutlined,
  WarningAmberRounded
} from '@mui/icons-material'
import { useReleaseUploadQueue } from 'src/hooks/releaseCertificates/useReleaseUploadQueue'
import ReleaseServicePicker from './ReleaseServicePicker'
import { ReleaseServiceOption } from './ReleaseCertificates.types'
import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_SIZE_MB,
  UploadRow,
  UploadRowStatus,
  hashFile,
  summarize
} from './releaseUploadQueue'
import { brand, neutral, intent } from 'src/theme/designTokens'

const BUTTON_SX = { bgcolor: brand.main, '&:hover': { bgcolor: brand.hover } }

interface ReleaseUploadDialogProps {
  open: boolean
  onClose: () => void
  /** Servicio preelegido (cuando se abre desde un servicio). */
  initialService?: ReleaseServiceOption | null
  /** Corte preelegido (cuando se abre desde el control documental de un corte). */
  initialCutId?: number | null
  /** Código del corte preelegido, para decir a cuál van los PDF. */
  initialCutCode?: string | null
  /** Se llama cuando termina una carga con al menos un PDF registrado. */
  onUploaded?: () => void
  /** Se llama al pulsar «Listo» después de registrar algo (p. ej. para mostrar lo recién cargado). */
  onDone?: () => void
  /** Abre el certificado en el mismo lugar; sin esto el enlace abre la bandeja en otra pestaña. */
  onOpenCertificate?: (id: number) => void
}

interface Entry {
  file: File
  hash: string
}

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

const ROW_ICON: Record<UploadRowStatus, React.ReactNode> = {
  queued: (
    <ScheduleOutlined fontSize='small' sx={{ color: neutral.textMuted }} />
  ),
  uploading: (
    <CloudUploadOutlined fontSize='small' sx={{ color: brand.main }} />
  ),
  done: (
    <CheckCircleOutline fontSize='small' sx={{ color: intent.successInk }} />
  ),
  warning: (
    <WarningAmberRounded fontSize='small' sx={{ color: intent.warningInk }} />
  ),
  failed: <ErrorOutline fontSize='small' sx={{ color: intent.dangerInk }} />,
  cancelled: <ErrorOutline fontSize='small' sx={{ color: neutral.textMuted }} />
}

const ROW_LABEL: Record<UploadRowStatus, string> = {
  queued: 'En cola',
  uploading: 'Subiendo…',
  done: 'Listo',
  warning: 'Con rarezas',
  failed: 'Falló',
  cancelled: 'Cancelado'
}

const DETAIL_COLOR: Record<UploadRowStatus, string> = {
  queued: 'text.secondary',
  uploading: 'text.secondary',
  done: 'text.secondary',
  warning: intent.warningInk,
  failed: intent.dangerInk,
  cancelled: 'text.secondary'
}

/** Carga masiva: se sueltan los PDF y el sistema los lee; no se diligencia nada más. */
const ReleaseUploadDialog: React.FC<ReleaseUploadDialogProps> = ({
  open,
  onClose,
  initialService = null,
  initialCutId = null,
  initialCutCode = null,
  onUploaded,
  onDone,
  onOpenCertificate
}) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const inputRef = useRef<HTMLInputElement>(null)
  const entriesRef = useRef<Entry[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [service, setService] = useState<ReleaseServiceOption | null>(null)
  const queue = useReleaseUploadQueue()
  const { rows, running } = queue

  useEffect(() => {
    if (open) setService(initialService)
  }, [open, initialService])

  const updateEntries = (next: Entry[]) => {
    entriesRef.current = next
    setEntries(next)
  }

  const reset = () => {
    updateEntries([])
    setNotices([])
    setDragOver(false)
    setService(initialService)
    queue.reset()
  }

  const selecting = rows.length === 0
  const summary = summarize(rows)
  const registered = summary.good + summary.warnings
  const finished = !selecting && !running

  // Un PDF soltado fuera del diálogo no debe abrirse en el navegador.
  useEffect(() => {
    if (!open) return undefined
    const stop = (event: DragEvent) => event.preventDefault()
    window.addEventListener('dragover', stop)
    window.addEventListener('drop', stop)
    return () => {
      window.removeEventListener('dragover', stop)
      window.removeEventListener('drop', stop)
    }
  }, [open])

  // Avisa una sola vez cuando termina la cola con algo registrado.
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !running && registered > 0) onUploaded?.()
    wasRunning.current = running
    // Solo importa el cambio de `running`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const close = () => {
    if (running) return
    if (finished && registered > 0) onDone?.()
    onClose()
  }

  const addFiles = async (incoming: FileList | File[] | null) => {
    if (!incoming || !selecting) return
    const messages: string[] = []
    const accepted = [...incoming].filter((file) => {
      if (!isPdf(file)) {
        messages.push(`${file.name}: no es un PDF`)
        return false
      }
      if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        messages.push(`${file.name}: supera ${MAX_UPLOAD_SIZE_MB} MB`)
        return false
      }
      return true
    })
    const hashed = await Promise.all(
      accepted.map(async (file) => ({ file, hash: await hashFile(file) }))
    )
    const known = new Set(entriesRef.current.map((entry) => entry.hash))
    const fresh: Entry[] = []
    const repeated: string[] = []
    for (const entry of hashed) {
      if (known.has(entry.hash)) repeated.push(entry.file.name)
      else {
        known.add(entry.hash)
        fresh.push(entry)
      }
    }
    if (repeated.length > 0) {
      messages.push(
        `Ya estaba en la lista (mismo contenido): ${repeated.join(', ')}`
      )
    }
    const room = MAX_UPLOAD_FILES - entriesRef.current.length
    if (fresh.length > room) {
      messages.push(
        `Solo caben ${MAX_UPLOAD_FILES} archivos por carga: ${fresh.length - room} quedaron fuera (${fresh
          .slice(room)
          .map((entry) => entry.file.name)
          .join(', ')}). Cárgalos en otra tanda.`
      )
    }
    updateEntries([...entriesRef.current, ...fresh.slice(0, room)])
    setNotices(messages)
  }

  const cutStillApplies = service?.id === initialService?.id
  const send = () => {
    queue.start(
      entries.map((entry) => entry.file),
      {
        serviceId: service?.id ?? null,
        // El corte solo vale mientras siga el servicio con el que se abrió.
        cutId: cutStillApplies ? initialCutId : null
      }
    )
  }

  const cutLabel = initialCutCode ?? 'del corte'
  const openCertificate = (id: number) => (event: React.MouseEvent) => {
    if (!onOpenCertificate) return
    event.preventDefault()
    onOpenCertificate(id)
  }

  const renderRow = (row: UploadRow) => (
    <Box
      component='li'
      key={row.id}
      sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.5 }}
    >
      <Box sx={{ mt: 0.25, display: 'flex' }}>{ROW_ICON[row.status]}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
          {row.file.name}
        </Typography>
        <Typography
          variant='caption'
          sx={{ color: DETAIL_COLOR[row.status], display: 'block' }}
        >
          {ROW_LABEL[row.status]}
          {row.detail ? ` · ${row.detail}` : ''}
        </Typography>
      </Box>
      {row.certificateId && (
        <Link
          href={`/release-certificates?id=${row.certificateId}`}
          target={onOpenCertificate ? undefined : '_blank'}
          rel='noopener'
          onClick={openCertificate(row.certificateId)}
          variant='body2'
          sx={{ flexShrink: 0, color: brand.ink }}
        >
          Abrir
        </Link>
      )}
    </Box>
  )

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
      // El formulario se vacía cuando la animación de cierre termina, no antes.
      TransitionProps={{ onExited: reset }}
      PaperProps={{
        onDragOver: (event: React.DragEvent) => {
          event.preventDefault()
          if (selecting) setDragOver(true)
        },
        onDragLeave: (event: React.DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setDragOver(false)
        },
        onDrop: (event: React.DragEvent) => {
          event.preventDefault()
          setDragOver(false)
          addFiles(event.dataTransfer.files)
        }
      }}
    >
      <DialogTitle>Cargar certificados</DialogTitle>
      <DialogContent>
        {initialCutId && initialService && (
          <Alert severity={cutStillApplies ? 'info' : 'warning'} sx={{ mb: 2 }}>
            {cutStillApplies
              ? `Los PDF quedarán ligados al corte ${cutLabel} del servicio ${initialService.serviceCode}.`
              : `Cambiaste de servicio: los PDF ya no quedarán ligados al corte ${cutLabel}.`}
          </Alert>
        )}
        {!selecting && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='body2' fontWeight={600}>
                {summary.finished} de {summary.total}
                {running ? ' procesados' : ' terminados'}
              </Typography>
              <LinearProgress
                variant='determinate'
                value={(summary.finished / summary.total) * 100}
                sx={{
                  my: 0.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: neutral.border,
                  '& .MuiLinearProgress-bar': { bgcolor: brand.main }
                }}
              />
              {running ? (
                <Typography variant='caption' color='text.secondary'>
                  Esta ventana no se puede cerrar mientras se cargan los
                  archivos: los que ya salieron se registran igual. Puedes
                  cancelar lo que falta.
                </Typography>
              ) : (
                <Alert
                  severity={
                    summary.warnings + summary.rejected + summary.cancelled ===
                    0
                      ? 'success'
                      : 'warning'
                  }
                  sx={{ mt: 1 }}
                >
                  {summary.good} registrados bien · {summary.warnings} con
                  rarezas o ilegibles · {summary.rejected} rechazados
                  {summary.cancelled > 0
                    ? ` · ${summary.cancelled} cancelados`
                    : ''}
                  .
                </Alert>
              )}
            </Box>
            <Box
              component='ul'
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                maxHeight: 360,
                overflow: 'auto'
              }}
            >
              {rows.map(renderRow)}
            </Box>
          </Box>
        )}
        {selecting && (
          <>
            <Box sx={{ mb: 2 }}>
              <ReleaseServicePicker
                value={service}
                onChange={setService}
                helperText='Opcional. Si eliges uno, el cliente se toma del servicio.'
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
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? brand.main : neutral.borderStrong,
                bgcolor: dragOver ? brand.softer : neutral.surfaceAlt,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:focus-visible': { outline: `2px solid ${brand.main}` }
              }}
            >
              <CloudUploadOutlined sx={{ fontSize: 40, color: brand.hover }} />
              <Typography fontWeight={600}>
                Suelta aquí los PDF o haz clic para elegirlos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Hasta {MAX_UPLOAD_FILES} archivos de {MAX_UPLOAD_SIZE_MB} MB. El
                sistema lee el cliente, el equipo y las fechas.
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

            {notices.length > 0 && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                {notices.map((notice) => (
                  <div key={notice}>{notice}</div>
                ))}
              </Alert>
            )}

            {entries.length > 0 && (
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
                {entries.map((entry) => (
                  <Box
                    component='li'
                    key={entry.hash}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.25
                    }}
                  >
                    <PictureAsPdfOutlined
                      fontSize='small'
                      sx={{ color: intent.dangerInk }}
                    />
                    <Typography
                      variant='body2'
                      sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}
                    >
                      {entry.file.name}
                    </Typography>
                    <IconButton
                      size='small'
                      aria-label={`Quitar ${entry.file.name}`}
                      onClick={() =>
                        updateEntries(
                          entriesRef.current.filter((e) => e !== entry)
                        )
                      }
                    >
                      <CloseRounded fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {running && (
          <Button color='inherit' onClick={queue.cancel}>
            Cancelar lo que falta
          </Button>
        )}
        {finished && (
          <>
            {summary.rejected + summary.cancelled > 0 && (
              <Button onClick={queue.retryFailed}>
                {summary.rejected > 0
                  ? 'Reintentar los que fallaron'
                  : 'Subir los cancelados'}
              </Button>
            )}
            <Button onClick={reset}>Cargar más</Button>
            <Button variant='contained' onClick={close} sx={BUTTON_SX}>
              Listo
            </Button>
          </>
        )}
        {selecting && (
          <>
            <Button onClick={close}>Cancelar</Button>
            <Button
              variant='contained'
              disabled={entries.length === 0}
              onClick={send}
              sx={BUTTON_SX}
            >
              Cargar {entries.length > 0 ? `${entries.length} ` : ''}
              {entries.length === 1 ? 'certificado' : 'certificados'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseUploadDialog
