import { useState } from 'react'
import { notify } from 'src/utils/notify'

/** Avisos (notify) y diálogo de confirmación del detalle del ticket. */
const useMaintenanceTicketFeedback = () => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    severity?: 'warning' | 'error' | 'info'
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  // Los avisos los muestra el AppToaster global (notify); aquí solo se conserva la firma de showToast
  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    notify[severity](message)
  }

  // Confirmation dialog helper
  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    severity: 'warning' | 'error' | 'info' = 'warning'
  ) => {
    setConfirmDialog({ open: true, title, message, onConfirm, severity })
  }

  // Close dialogs
  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: '',
      message: '',
      onConfirm: () => {}
    })
  }

  return {
    showToast,
    showConfirmDialog,
    closeConfirmDialog,
    confirmDialog,
    setConfirmDialog
  }
}

export default useMaintenanceTicketFeedback
