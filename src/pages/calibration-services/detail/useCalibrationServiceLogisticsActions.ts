import { toast } from 'react-hot-toast'
import { CalibrationService } from '../../../types/calibrationService'
import { CalibrationServicePhysicalTraceabilityDialogValues } from '../CalibrationServicePhysicalTraceabilityDialog'
import { CalibrationServiceLogisticsControlDialogValues } from '../CalibrationServiceLogisticsControlDialog'
import { getEmailSendPreview } from './calibrationServiceDetailUtils'
import { getApiErrorMessage } from '../../../utils/apiError'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceDetailDialogs } from './useCalibrationServiceDetailDialogs'
import { DetailTab } from './calibrationServiceDetailUtils'

type CalibrationServiceMutations = ReturnType<typeof useCalibrationServiceMutations>

interface CalibrationServiceLogisticsActionsParams {
  service: CalibrationService
  mutations: CalibrationServiceMutations
  dialogs: CalibrationServiceDetailDialogs
  setActiveTab: (tab: DetailTab) => void
  handleDownloadDocument: (documentId: number, fileName: string) => Promise<void>
}

/** Acciones de logística: trazabilidad física, ficha de control, PDF y envío por correo. */
const useCalibrationServiceLogisticsActions = ({
  service,
  mutations,
  dialogs,
  setActiveTab,
  handleDownloadDocument
}: CalibrationServiceLogisticsActionsParams) => {
  const {
    registerPhysicalTraceability,
    updateLogisticsControl,
    generateLogisticsPdf,
    sendLogisticsControlEmail
  } = mutations
  const {
    setIsLogisticsControlDialogOpen,
    setIsSendLogisticsEmailDialogOpen,
    setSendLogisticsPreview,
    setIsPhysicalTraceabilityDialogOpen
  } = dialogs

  const handleRegisterPhysicalTraceability = async (
    values: CalibrationServicePhysicalTraceabilityDialogValues
  ) => {
    try {
      if (!values.contactName.trim()) {
        toast.error('Indica el contacto de la recogida o entrega.')
        return
      }

      await registerPhysicalTraceability.mutateAsync({
        serviceId: String(service.id),
        movementType: values.movementType,
        occurredAt: new Date(values.occurredAt).toISOString(),
        contactName: values.contactName.trim(),
        contactRole: values.contactRole.trim() || null,
        location: values.location.trim() || null,
        notes: values.notes.trim() || null
      })

      toast.success('La trazabilidad física quedó registrada.')
      setIsPhysicalTraceabilityDialogOpen(false)
      setActiveTab('logistics')
    } catch (traceabilityError) {
      console.error(traceabilityError)
      toast.error(getApiErrorMessage(traceabilityError, 'No pudimos registrar la trazabilidad física.'))
    }
  }

  const handleSaveLogisticsControl = async (
    values: CalibrationServiceLogisticsControlDialogValues
  ) => {
    try {
      await updateLogisticsControl.mutateAsync({
        serviceId: String(service.id),
        ...values
      })

      toast.success('La ficha logística quedó actualizada.')
      setIsLogisticsControlDialogOpen(false)
      setActiveTab('logistics')
    } catch (logisticsError) {
      console.error(logisticsError)
      toast.error(getApiErrorMessage(logisticsError, 'No pudimos guardar la ficha logística.'))
    }
  }

  const handleGenerateLogisticsPdf = async () => {
    try {
      const document = await generateLogisticsPdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('El PDF de control de ingreso y entrega ya está listo.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName ||
          `control-ingreso-entrega-${service.serviceCode}.pdf`
      )
      setActiveTab('logistics')
    } catch (logisticsPdfError) {
      console.error(logisticsPdfError)
      toast.error(getApiErrorMessage(logisticsPdfError, 'No pudimos generar el PDF de control de ingreso y entrega.'))
    }
  }

  const handleOpenSendLogisticsEmail = () => {
    setSendLogisticsPreview(
      getEmailSendPreview(service.contactEmail, service.customer?.email)
    )
    setIsSendLogisticsEmailDialogOpen(true)
  }

  const handleSendLogisticsEmail = async (values: {
    recipientEmail?: string | null
    recipientName?: string | null
    sendWhatsApp?: boolean
    whatsappPhone?: string | null
  }) => {
    try {
      const result = await sendLogisticsControlEmail.mutateAsync({
        serviceId: String(service.id),
        recipientEmail: values.recipientEmail,
        recipientName: values.recipientName,
        sendWhatsApp: values.sendWhatsApp,
        whatsappPhone: values.whatsappPhone
      })

      const actualRecipient = result.delivery?.actualRecipient
      toast.success(
        actualRecipient
          ? `Formato logístico enviado a ${actualRecipient}.`
          : 'Formato logístico enviado.'
      )
      if (result.whatsapp?.sent) {
        toast.success(
          `También se envió por WhatsApp a ${result.whatsapp.actualRecipient || 'el cliente'}.`
        )
      } else if (result.whatsapp) {
        toast.error(
          result.whatsapp.reason === 'provider_error'
            ? 'El correo salió, pero WhatsApp rechazó el envío. Revisa que la plantilla esté aprobada y la conexión con WhatsApp.'
            : result.whatsapp.reason === 'missing_recipient_phone'
              ? 'El correo salió, pero no hay un número de WhatsApp válido.'
              : 'El correo salió, pero el envío por WhatsApp no está activo en este ambiente.'
        )
      }
      setIsSendLogisticsEmailDialogOpen(false)
      setSendLogisticsPreview(null)
      setActiveTab('logistics')
    } catch (logisticsEmailError) {
      console.error(logisticsEmailError)
      toast.error(getApiErrorMessage(logisticsEmailError, 'No pudimos enviar el formato logístico por correo.'))
    }
  }

  return {
    handleRegisterPhysicalTraceability,
    handleSaveLogisticsControl,
    handleGenerateLogisticsPdf,
    handleOpenSendLogisticsEmail,
    handleSendLogisticsEmail
  }
}

export default useCalibrationServiceLogisticsActions
