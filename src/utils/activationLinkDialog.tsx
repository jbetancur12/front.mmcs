import { ThemeProvider } from '@mui/material'
import { createRoot } from 'react-dom/client'

import ActivationLinkDialog from '../Components/ActivationLinkDialog'
import { theme } from '../theme'

import type { ActivationLinkInfo } from './activationLink'

/**
 * Muestra el diálogo del enlace de activación y espera a que se cierre.
 * Se llama igual que antes (`await showActivationLinkDialog(info)`): monta el
 * diálogo en su propio nodo y lo retira al cerrar.
 */
export const showActivationLinkDialog = (
  info: ActivationLinkInfo
): Promise<void> =>
  new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const close = () => {
      root.unmount()
      container.remove()
      resolve()
    }

    root.render(
      <ThemeProvider theme={theme}>
        <ActivationLinkDialog open info={info} onClose={close} />
      </ThemeProvider>
    )
  })
