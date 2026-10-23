import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import {
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'

/**
 * Confirmaciones y esperas que se piden desde código (un handler, un hook)
 * sin tener que declarar estado y JSX en cada pantalla. Las muestra el
 * `<DialogHost />` montado una sola vez en `main.tsx`.
 *
 *   const { isConfirmed } = await confirmDialog({
 *     title: '¿Eliminar el certificado?',
 *     text: 'Esta acción no se puede deshacer.',
 *     confirmLabel: 'Sí, eliminar',
 *     tone: 'danger'
 *   })
 *
 * El resultado tiene la misma forma que el de SweetAlert (`isConfirmed`,
 * `isDismissed`), así que reemplaza a `Swal.fire({ showCancelButton })` sin
 * tocar el resto del flujo. Cuando la pantalla ya tiene su propio estado, usa
 * `ConfirmDialog` directamente.
 */

export interface ConfirmOptions {
  title: string
  /** Explicación de lo que pasa si se confirma. */
  text?: React.ReactNode
  /**
   * Explicación con formato (listas, negritas) como HTML. Se sanea con DOMPurify,
   * pero escapa tú los datos del usuario que metas dentro. Si hay `html`, `text` se ignora.
   */
  html?: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` para borrar, quitar acceso o acciones que no se deshacen. */
  tone?: 'default' | 'danger'
}

const HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'div',
    'span'
  ],
  ALLOWED_ATTR: ['style']
}

export interface ConfirmResult {
  isConfirmed: boolean
  isDismissed: boolean
}

type Pending = ConfirmOptions & { resolve: (result: ConfirmResult) => void }

let enqueueConfirm: ((pending: Pending) => void) | null = null
let setBusy: ((state: BusyState | null) => void) | null = null

export const confirmDialog = (
  options: ConfirmOptions
): Promise<ConfirmResult> =>
  new Promise((resolve) => {
    // Sin host montado (tests, pantallas fuera de main.tsx) se trata como cancelado
    if (!enqueueConfirm) {
      resolve({ isConfirmed: false, isDismissed: true })
      return
    }
    enqueueConfirm({ ...options, resolve })
  })

interface BusyState {
  title: string
  text?: string
}

/**
 * Diálogo de espera para una operación larga ("Generando el PDF…"). No se
 * cierra solo: llama a `hide()` cuando termine, también si falla (`finally`).
 */
export interface PromptOptions {
  title: string
  label?: string
  placeholder?: string
  type?: 'text' | 'number'
  /** Valor mínimo cuando `type` es number. */
  min?: number
  confirmLabel?: string
  cancelLabel?: string
  /** Mensaje si se confirma vacío; sin él, el botón queda inactivo hasta escribir algo. */
  requiredMessage?: string
}

export interface PromptResult {
  isConfirmed: boolean
  isDismissed: boolean
  value?: string
}

type PendingPrompt = PromptOptions & { resolve: (result: PromptResult) => void }
let setPrompt: ((pending: PendingPrompt | null) => void) | null = null

/** Pide un texto o un número ("Motivo de rechazo"). Devuelve `value` si se confirma. */
export const promptDialog = (options: PromptOptions): Promise<PromptResult> =>
  new Promise((resolve) => {
    if (!setPrompt) {
      resolve({ isConfirmed: false, isDismissed: true })
      return
    }
    setPrompt({ ...options, resolve })
  })

export const busyDialog = {
  show: (title: string, text?: string) => setBusy?.({ title, text }),
  hide: () => setBusy?.(null)
}

export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<Pending[]>([])
  const [busy, setBusyState] = useState<BusyState | null>(null)
  const [prompt, setPromptState] = useState<PendingPrompt | null>(null)
  const [promptValue, setPromptValue] = useState('')

  useEffect(() => {
    enqueueConfirm = (pending) => setQueue((current) => [...current, pending])
    setBusy = setBusyState
    setPrompt = (pending) => {
      setPromptValue('')
      setPromptState(pending)
    }
    return () => {
      enqueueConfirm = null
      setBusy = null
      setPrompt = null
    }
  }, [])

  const current = queue[0]
  const settle = (isConfirmed: boolean) => {
    current?.resolve({ isConfirmed, isDismissed: !isConfirmed })
    setQueue((items) => items.slice(1))
  }

  const closePrompt = (isConfirmed: boolean) => {
    prompt?.resolve({
      isConfirmed,
      isDismissed: !isConfirmed,
      value: isConfirmed ? promptValue.trim() : undefined
    })
    setPromptState(null)
  }

  return (
    <>
      <ConfirmDialog
        open={Boolean(current)}
        title={current?.title ?? ''}
        message={
          current?.html ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(current.html, HTML_CONFIG)
              }}
            />
          ) : (
            current?.text ?? ''
          )
        }
        confirmLabel={current?.confirmLabel ?? 'Confirmar'}
        cancelLabel={current?.cancelLabel ?? 'Cancelar'}
        tone={current?.tone ?? 'default'}
        onConfirm={() => settle(true)}
        onClose={() => settle(false)}
      />
      <Dialog
        open={Boolean(prompt)}
        onClose={() => closePrompt(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 3 }}>
          {prompt?.title}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin='dense'
            size='small'
            type={prompt?.type ?? 'text'}
            label={prompt?.label}
            placeholder={prompt?.placeholder}
            value={promptValue}
            onChange={(event) => setPromptValue(event.target.value)}
            inputProps={
              prompt?.type === 'number' ? { min: prompt.min } : undefined
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' && promptValue.trim()) closePrompt(true)
            }}
            helperText={prompt?.requiredMessage}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => closePrompt(false)}
            sx={{ textTransform: 'none' }}
          >
            {prompt?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant='contained'
            disabled={!promptValue.trim()}
            onClick={() => closePrompt(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00ACC1' }
            }}
          >
            {prompt?.confirmLabel ?? 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(busy)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
        aria-busy
      >
        <DialogContent
          sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}
        >
          <CircularProgress
            size={28}
            sx={{ color: '#00BFA5', flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700}>{busy?.title}</Typography>
            {busy?.text && (
              <Typography variant='body2' color='text.secondary'>
                {busy.text}
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}
