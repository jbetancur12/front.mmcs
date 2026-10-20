import { toast } from 'react-hot-toast'
import { CalibrationService } from '../../../types/calibrationService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceDetailDialogs } from './useCalibrationServiceDetailDialogs'
import { DetailTab } from './calibrationServiceDetailUtils'

type CalibrationServiceMutations = ReturnType<typeof useCalibrationServiceMutations>

interface CalibrationServiceCutActionsParams {
  service: CalibrationService
  mutations: CalibrationServiceMutations
  dialogs: CalibrationServiceDetailDialogs
  setActiveTab: (tab: DetailTab) => void
}

/** Acciones de cortes: creación, listo para facturar, facturación, pago y control documental. */
const useCalibrationServiceCutActions = ({
  service,
  mutations,
  dialogs,
  setActiveTab
}: CalibrationServiceCutActionsParams) => {
  const {
    uploadDocument,
    createCut,
    markCutReadyForInvoicing,
    markCutInvoiced,
    registerCutPayment,
    updateCutDocumentControl
  } = mutations
  const {
    setIsCutDialogOpen,
    selectedCutForInvoice,
    setSelectedCutForInvoice,
    selectedCutForPayment,
    setSelectedCutForPayment,
    selectedCutForDocumentControl,
    setSelectedCutForDocumentControl
  } = dialogs

  const handleCreateCut = async (values: {
    cutType: 'partial' | 'final'
    notes: string
    items: Array<{ serviceItemId: number; quantity: number }>
  }) => {
    try {
      if (!values.items.length) {
        toast.error('Selecciona al menos un ítem para el corte.')
        return
      }

      const updatedService = await createCut.mutateAsync({
        serviceId: String(service.id),
        cutType: values.cutType,
        notes: values.notes.trim() || null,
        items: values.items
      })
      setIsCutDialogOpen(false)
      setActiveTab('cuts')

      const newCut = [...(updatedService?.cuts || [])].sort(
        (a, b) => b.id - a.id
      )[0]

      if (!newCut) {
        toast.success('El corte quedó creado.')
        return
      }

      try {
        await markCutReadyForInvoicing.mutateAsync({
          serviceId: String(service.id),
          cutId: String(newCut.id),
          readyForInvoicingAt: new Date().toISOString()
        })
        toast.success('El corte quedó creado y listo para facturar.')
      } catch (readyError) {
        const message =
          (readyError as { response?: { data?: { error?: string } } })
            ?.response?.data?.error ||
          'El corte se creó pero no pudo marcarse listo para facturar.'
        toast.error(message)
      }
    } catch (cutError) {
      console.error(cutError)
      toast.error(getApiErrorMessage(cutError, 'No pudimos crear el corte.'))
    }
  }

  const handleMarkCutReady = async (cutId: number) => {
    try {
      await markCutReadyForInvoicing.mutateAsync({
        serviceId: String(service.id),
        cutId: String(cutId),
        readyForInvoicingAt: new Date().toISOString()
      })
      toast.success('El corte quedó listo para facturar.')
    } catch (cutError) {
      console.error(cutError)
      const message =
        (cutError as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No pudimos mover el corte a listo para facturar.'
      toast.error(message)
    }
  }

  const handleMarkCutInvoiced = async (values: {
    invoiceReference: string
    invoicedAt: string
    invoiceNotes?: string | null
    invoiceFile?: File | null
    customerHasCredit: boolean
  }) => {
    if (!selectedCutForInvoice) {
      return
    }

    try {
      let invoiceEvidenceDocumentId: number | null = null

      if (values.invoiceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          file: values.invoiceFile,
          documentType: 'invoice_attachment',
          title: `Factura ${values.invoiceReference} · ${selectedCutForInvoice.cutCode}`,
          notes: values.invoiceNotes || undefined,
          cutId: selectedCutForInvoice.id
        })

        invoiceEvidenceDocumentId = uploadedDocument.id
      }

      await markCutInvoiced.mutateAsync({
        serviceId: String(service.id),
        cutId: String(selectedCutForInvoice.id),
        invoiceReference: values.invoiceReference,
        invoicedAt: values.invoicedAt,
        invoiceNotes: values.invoiceNotes || null,
        invoiceEvidenceDocumentId,
        customerHasCredit: values.customerHasCredit
      })
      toast.success('El corte quedó marcado como facturado.')
      setSelectedCutForInvoice(null)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error(getApiErrorMessage(cutError, 'No pudimos registrar la facturación del corte.'))
    }
  }

  const handleRegisterCutPayment = async () => {
    if (!selectedCutForPayment) {
      return
    }

    try {
      await registerCutPayment.mutateAsync({
        serviceId: String(service.id),
        cutId: String(selectedCutForPayment.id)
      })
      toast.success('El pago del corte quedó registrado.')
      setSelectedCutForPayment(null)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error(getApiErrorMessage(cutError, 'No pudimos registrar el pago del corte.'))
    }
  }

  const handleUpdateCutDocumentControl = async (values: {
    expectedCertificates: number
    uploadedCertificates: number
    reviewedCertificates: number
    sentCertificates: number
    sendChannel?: string | null
    sentTo?: string | null
    sentAt?: string | null
    evidenceFile?: File | null
    notes?: string | null
  }) => {
    if (!selectedCutForDocumentControl) {
      return
    }

    try {
      if (
        values.sentCertificates > 0 &&
        (!values.sendChannel?.trim() || !values.sentTo?.trim())
      ) {
        toast.error(
          'Cuando ya hay certificados enviados, indica el canal y el destinatario.'
        )
        return
      }

      let evidenceDocumentIds =
        selectedCutForDocumentControl.otherFields?.documentControl
          ?.evidenceDocumentIds || []

      if (values.evidenceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          cutId: selectedCutForDocumentControl.id,
          file: values.evidenceFile,
          documentType: 'supporting_attachment',
          title: `Soporte de envío ${selectedCutForDocumentControl.cutCode}`,
          notes: values.notes || 'Soporte de envío documental del corte'
        })

        evidenceDocumentIds = [
          ...new Set([...evidenceDocumentIds, uploadedDocument.id])
        ]
      }

      await updateCutDocumentControl.mutateAsync({
        serviceId: String(service.id),
        cutId: String(selectedCutForDocumentControl.id),
        expectedCertificates: values.expectedCertificates,
        uploadedCertificates: values.uploadedCertificates,
        reviewedCertificates: values.reviewedCertificates,
        sentCertificates: values.sentCertificates,
        sendChannel: values.sendChannel,
        sentTo: values.sentTo,
        sentAt: values.sentAt,
        notes: values.notes,
        evidenceDocumentIds
      })
      toast.success('El control documental del corte quedó actualizado.')
      setSelectedCutForDocumentControl(null)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error(getApiErrorMessage(cutError, 'No pudimos actualizar el control documental del corte.'))
    }
  }

  return {
    handleCreateCut,
    handleMarkCutReady,
    handleMarkCutInvoiced,
    handleRegisterCutPayment,
    handleUpdateCutDocumentControl
  }
}

export default useCalibrationServiceCutActions
