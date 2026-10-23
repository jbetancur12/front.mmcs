import toast, { type ToastOptions } from 'react-hot-toast'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

/**
 * Avisos breves de la app. Es la única forma de mostrar un aviso que no pide
 * una decisión: usa `notify.success` / `error` / `info` / `warning` con una
 * frase corta ("Guardado", "No se pudo cargar el catálogo"). Los muestra el
 * `<AppToaster />` que está montado una sola vez en `main.tsx`; no montes un
 * `<Toaster />` propio en una pantalla (cada aviso saldría doble).
 *
 * Si necesitas una decisión (confirmar, cancelar) usa `ConfirmDialog`, no un
 * aviso. Reemplaza a `Toast.fire` / `bigToast` (SweetAlert), `Snackbar`,
 * `notistack`, `react-toastify` y `alert()`.
 */

/** `detail` es opcional y se une al mensaje: `notify.error('No se pudo guardar', 'Revisa el campo NIT')`. */
const compose = (message: string, detail?: string) =>
  detail ? `${message}. ${detail}` : message

export const notify = {
  success: (message: string, detail?: string, options?: ToastOptions): void => {
    toast.success(compose(message, detail), options)
  },

  error: (message: string, detail?: string, options?: ToastOptions): void => {
    toast.error(compose(message, detail), options)
  },

  info: (message: string, detail?: string, options?: ToastOptions): void => {
    toast(compose(message, detail), {
      icon: <InfoOutlinedIcon fontSize='small' sx={{ color: '#2563eb' }} />,
      ...options
    })
  },

  warning: (message: string, detail?: string, options?: ToastOptions): void => {
    toast(compose(message, detail), {
      icon: (
        <WarningAmberRoundedIcon fontSize='small' sx={{ color: '#d97706' }} />
      ),
      ...options
    })
  },

  /** Cierra un aviso (o todos) antes de que venza. */
  dismiss: (toastId?: string): void => toast.dismiss(toastId)
}
