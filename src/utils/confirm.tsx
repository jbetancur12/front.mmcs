import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
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

export interface PromptOptions {
  title: string
  label?: string
  placeholder?: string
  type?: 'text' | 'number' | 'password'
  /** Texto de apoyo bajo el campo. */
  helperText?: string
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

export interface ChoiceOption {
  value: string
  label: string
}

export interface ChoiceOptions {
  title: string
  /** Contexto de la decisión (puede llevar una lista o datos del registro). */
  text?: React.ReactNode
  options: ChoiceOption[]
  /** Opción marcada al abrir; sin ella el botón queda inactivo hasta escoger. */
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ChoiceResult {
  isConfirmed: boolean
  isDismissed: boolean
  value?: string
}

type PendingChoice = ChoiceOptions & { resolve: (result: ChoiceResult) => void }
let setChoice: ((pending: PendingChoice | null) => void) | null = null

/** Pide escoger una opción entre varias ("Actualizar" o "Crear"). Devuelve `value` si se confirma. */
export const choiceDialog = (options: ChoiceOptions): Promise<ChoiceResult> =>
  new Promise((resolve) => {
    if (!setChoice) {
      resolve({ isConfirmed: false, isDismissed: true })
      return
    }
    setChoice({ ...options, resolve })
  })

/**
 * Diálogo de espera para una operación larga ("Generando el PDF…"). No se
 * cierra solo: llama a `hide()` cuando termine, también si falla (`finally`).
 */
export const busyDialog = {
  show: (title: string, text?: string) => setBusy?.({ title, text }),
  hide: () => setBusy?.(null)
}

export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<Pending[]>([])
  const [busy, setBusyState] = useState<BusyState | null>(null)
  const [prompt, setPromptState] = useState<PendingPrompt | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const [choice, setChoiceState] = useState<PendingChoice | null>(null)
  const [choiceValue, setChoiceValue] = useState('')

  useEffect(() => {
    setChoice = (pending) => {
      setChoiceValue(pending?.defaultValue ?? '')
      setChoiceState(pending)
    }
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
      setChoice = null
    }
  }, [])

  const closeChoice = (isConfirmed: boolean) => {
    choice?.resolve({
      isConfirmed,
      isDismissed: !isConfirmed,
      value: isConfirmed ? choiceValue : undefined
    })
    setChoiceState(null)
  }

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
            helperText={prompt?.helperText ?? prompt?.requiredMessage}
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
        open={Boolean(choice)}
        onClose={() => closeChoice(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 3 }}>{choice?.title}</DialogTitle>
        <DialogContent>
          {choice?.text && (
            <Typography
              component='div'
              variant='body2'
              color='text.secondary'
              sx={{ mb: 1.5 }}
            >
              {choice.text}
            </Typography>
          )}
          <RadioGroup
            value={choiceValue}
            onChange={(event) => setChoiceValue(event.target.value)}
          >
            {choice?.options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                label={option.label}
                control={<Radio sx={{ '&.Mui-checked': { color: '#00BFA5' } }} />}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => closeChoice(false)}
            sx={{ textTransform: 'none' }}
          >
            {choice?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant='contained'
            disabled={!choiceValue}
            onClick={() => closeChoice(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#00BFA5',
              '&:hover': { bgcolor: '#00ACC1' }
            }}
          >
            {choice?.confirmLabel ?? 'Aceptar'}
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
          sx={{ py: 2 }}
        >
          <SignalLoader message={busy?.title} />
          {busy?.text && (
            <Typography
              variant='body2'
              color='text.secondary'
              align='center'
            >
              {busy.text}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
