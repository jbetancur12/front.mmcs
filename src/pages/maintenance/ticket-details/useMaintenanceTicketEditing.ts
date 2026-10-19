import { useEffect, useState } from 'react'
import {
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceUpdateRequest
} from '../../../types/maintenance'
import { getInitialEditData } from './maintenanceTicketDetailUtils'

interface UseMaintenanceTicketEditingParams {
  ticket: MaintenanceTicket | undefined
  isTechnician: boolean
  canEditTicket: boolean
  isCustomerApprovalLocked: boolean
  showToast: (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => void
}

/** Modo edición del ticket: datos del formulario, validación y entrada/salida. */
const useMaintenanceTicketEditing = ({
  ticket,
  isTechnician,
  canEditTicket,
  isCustomerApprovalLocked,
  showToast
}: UseMaintenanceTicketEditingParams) => {
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<MaintenanceUpdateRequest>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isEditValid, setIsEditValid] = useState(true)

  // Initialize edit data when ticket loads
  useEffect(() => {
    if (ticket && !editMode) {
      setEditData(getInitialEditData(ticket, isTechnician))
    }
  }, [ticket, editMode, isTechnician])

  // Validate edit data when it changes
  useEffect(() => {
    if (editMode) {
      validateEditData()
    }
  }, [editData, editMode])

  const handleEdit = () => {
    if (!canEditTicket) {
      showToast('Solo puedes editar tickets asignados a tu usuario', 'warning')
      return
    }
    if (isCustomerApprovalLocked) {
      showToast(
        'Este ticket ya fue firmado por el cliente y su contenido técnico quedó bloqueado',
        'warning'
      )
      return
    }
    setEditMode(true)
    setEditErrors({})
    setIsEditValid(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    if (ticket) {
      setEditData(getInitialEditData(ticket, isTechnician))
    }
  }

  const validateEditData = () => {
    const errors: Record<string, string> = {}

    if (editData.estimatedCost !== undefined && editData.estimatedCost < 0) {
      errors.estimatedCost = 'El costo estimado no puede ser negativo'
    }

    if (editData.actualCost !== undefined && editData.actualCost < 0) {
      errors.actualCost = 'El costo real no puede ser negativo'
    }

    if (
      editData.location !== undefined &&
      editData.location.trim().length < 5
    ) {
      errors.location = 'La ubicación debe tener al menos 5 caracteres'
    }

    if (
      editData.intakePhysicalCondition &&
      editData.intakePhysicalCondition.trim().length > 0 &&
      editData.intakePhysicalCondition.trim().length < 3
    ) {
      errors.intakePhysicalCondition =
        'Describe un poco mejor cómo se recibió el equipo'
    }

    if (
      editData.receivedAccessories &&
      editData.receivedAccessories.trim().length > 0 &&
      editData.receivedAccessories.trim().length < 3
    ) {
      errors.receivedAccessories =
        'Indica mejor los accesorios recibidos o deja el campo vacío'
    }

    if (editData.scheduledDate) {
      const scheduledDate = new Date(editData.scheduledDate)
      const now = new Date()
      if (scheduledDate < now && ticket?.status === MaintenanceStatus.PENDING) {
        errors.scheduledDate =
          'No se puede programar una fecha en el pasado para tickets pendientes'
      }
    }

    setEditErrors(errors)
    const valid = Object.keys(errors).length === 0
    setIsEditValid(valid)
    return valid
  }

  return {
    handleEdit,
    handleCancelEdit,
    validateEditData,
    editMode,
    setEditMode,
    editData,
    setEditData,
    editErrors,
    setEditErrors,
    isEditValid,
    setIsEditValid
  }
}

export default useMaintenanceTicketEditing
