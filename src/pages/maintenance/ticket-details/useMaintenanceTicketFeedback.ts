import { useState } from 'react'

/** Aviso flotante (toast) y diálogo de confirmación del detalle del ticket. */
const useMaintenanceTicketFeedback = () => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    severity?: 'warning' | 'error' | 'info'
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })
  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setToast({ open: true, message, severity })
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

  const closeToast = () => {
    setToast({ open: false, message: '', severity: 'info' })
  }

  return {
    showToast,
    showConfirmDialog,
    closeConfirmDialog,
    closeToast,
    confirmDialog,
    setConfirmDialog,
    toast,
    setToast
  }
}

export default useMaintenanceTicketFeedback
