import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { CalibrationServiceWorkspaceSummary } from './calibrationServiceWorkspaceSummary'
import { buildPayload } from './calibrationServiceWorkspaceUtils'
import { CalibrationServiceWorkspaceData } from './useCalibrationServiceWorkspaceData'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'
import { CalibrationServiceWorkspaceNavigation } from './useCalibrationServiceWorkspaceNavigation'

import { logger } from 'src/utils/logger'
interface CalibrationServiceWorkspaceActionsParams {
  data: CalibrationServiceWorkspaceData
  form: CalibrationServiceWorkspaceForm
  summary: CalibrationServiceWorkspaceSummary
  navigation: CalibrationServiceWorkspaceNavigation
}

/**
 * Guardado de la cotización (borrador o envío con PDF), validación previa y
 * configuración inicial de consecutivos.
 */
const useCalibrationServiceWorkspaceActions = ({
  data,
  form,
  summary,
  navigation
}: CalibrationServiceWorkspaceActionsParams) => {
  const navigate = useNavigate()
  const {
    serviceId,
    isEditing,
    canAccessWorkspace,
    isLoadingSequenceConfig,
    sequenceConfig,
    requestEvidenceDocuments
  } = data
  const { formState, requestEvidenceFile, requestEvidenceTitle } = form
  const { pendingForDraft, pendingRequirements, itemsNeedingPoints } = summary
  const { setActiveSection, goToSection } = navigation
  const {
    createService,
    updateService,
    uploadDocument,
    generateQuotePdf,
    downloadDocument,
    upsertSequenceConfig
  } = useCalibrationServiceMutations()
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [validationErrorItemIds, setValidationErrorItemIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!canAccessWorkspace || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canAccessWorkspace, isLoadingSequenceConfig, sequenceConfig?.initialized])

  const isBusy = createService.isLoading || updateService.isLoading || uploadDocument.isLoading ||
    generateQuotePdf.isLoading || downloadDocument.isLoading

  const validateForm = (targetStatus: 'draft' | 'pending_approval') => {
    if (!formState.customerId) return 'Selecciona un cliente.'
    if (formState.scopeType === 'site' && !formState.customerSite?.trim()) {
      return 'Selecciona la sede del servicio.'
    }
    if (!formState.requestChannel?.trim()) return 'Define la vía de solicitud.'
    if (formState.contactEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.contactEmail.trim())) {
      return 'El email de contacto no es válido. Ingresa un email con formato correcto (ej: usuario@dominio.com).'
    }
    const validItems = formState.items.filter(
      (item) => item.itemName.trim() || item.instrumentName?.trim()
    )
    if (!validItems.length) return 'Agrega al menos un ítem.'
    if (validItems.some((item) => !item.itemName.trim() || !(Number(item.quantity) > 0))) {
      return 'Revisa nombre y cantidad de los ítems.'
    }
    if (targetStatus === 'pending_approval') {
      if (!formState.paymentMethod) {
        setActiveSection(4)
        return 'Selecciona la forma de pago.'
      }
      if (!formState.instrumentDeliveryTime) {
        setActiveSection(4)
        return 'Selecciona el tiempo de entrega de equipos.'
      }
      if (!formState.certificateDeliveryTime) {
        setActiveSection(4)
        return 'Selecciona el tiempo de entrega de certificados.'
      }
      if (formState.hasDiscount) {
        if (!formState.discountType || Number(formState.discountValue) <= 0) {
          setActiveSection(4)
          return 'Completa el tipo y valor del descuento.'
        }
      }
      const invalidItems = validItems.filter(
        (item) =>
          item.otherFields?.hasCalibrationPoints !== false &&
          (!item.otherFields?.calibrationPointCount || !item.otherFields?.measurementRange)
      )
      if (invalidItems.length) {
        setValidationErrorItemIds(new Set(invalidItems.map((i) => i.localId)))
        setActiveSection(3)
        return `Completa cantidad de puntos y rango de medición en ${invalidItems.length} item${invalidItems.length > 1 ? 's' : ''}.`
      }
    }
    setValidationErrorItemIds(new Set())
    if (!requestEvidenceFile && !requestEvidenceDocuments.length) {
      return 'Debes adjuntar la evidencia de solicitud.'
    }
    return null
  }

  const handleSave = async (targetStatus: 'draft' | 'pending_approval') => {
    const blocking = targetStatus === 'draft' ? pendingForDraft : pendingRequirements
    if (blocking.length) {
      if (blocking.some((requirement) => requirement.key === 'points')) {
        setValidationErrorItemIds(new Set(itemsNeedingPoints.map((item) => item.localId)))
      }
      goToSection(blocking[0].section)
      toast.error(
        `Antes de ${targetStatus === 'draft' ? 'guardar' : 'enviar'}, completa: ${blocking
          .map((requirement) => requirement.label.charAt(0).toLowerCase() + requirement.label.slice(1))
          .join('; ')}.`
      )
      return
    }
    const validationError = validateForm(targetStatus)
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      const payload = buildPayload(formState, targetStatus)
      const savedService = isEditing
        ? await updateService.mutateAsync({ serviceId: serviceId as string, payload })
        : await createService.mutateAsync(payload)
      if (requestEvidenceFile) {
        try {
          await uploadDocument.mutateAsync({
            serviceId: String(savedService.id),
            file: requestEvidenceFile,
            documentType: 'request_evidence',
            title: requestEvidenceTitle || `Evidencia de solicitud ${savedService.serviceCode}`
          })
        } catch (uploadError) {
          logger.error(uploadError)
          toast.error('El servicio se guardo, pero no fue posible subir la evidencia.')
          navigate(`/calibration-services/${savedService.id}`)
          return
        }
      }
      if (targetStatus === 'pending_approval') {
        try {
          const pdfDocument = await generateQuotePdf.mutateAsync({
            serviceId: String(savedService.id)
          })
          const fileBlob = await downloadDocument.mutateAsync({
            serviceId: String(savedService.id),
            documentId: String(pdfDocument.id)
          })
          const objectUrl = window.URL.createObjectURL(fileBlob as Blob)
          const anchor = window.document.createElement('a')
          anchor.href = objectUrl
          anchor.download = pdfDocument.originalFileName || `cotizacion-${savedService.serviceCode}.pdf`
          anchor.target = '_blank'
          anchor.rel = 'noopener'
          anchor.click()
          window.URL.revokeObjectURL(objectUrl)
        } catch (pdfError) {
          logger.error(pdfError)
          toast.error('No se pudo generar la cotización PDF.')
        }
      }
      const codeLabel = savedService.quoteCode || savedService.serviceCode
      toast.success(
        targetStatus === 'pending_approval'
          ? `Cotización ${codeLabel} generada y guardada.`
          : `Servicio ${codeLabel} guardado como borrador.`
      )
      navigate(`/calibration-services/${savedService.id}`)
    } catch (error) {
      logger.error(error)
      toast.error(isEditing ? 'No pudimos actualizar el servicio.' : 'No pudimos crear el servicio.')
    }
  }

  const handleSaveSequenceConfig = async (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
  }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('Los consecutivos iniciales del módulo quedaron configurados.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      logger.error(configError)
      toast.error('No pudimos guardar la configuración inicial.')
    }
  }

  return {
    upsertSequenceConfig,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    validationErrorItemIds,
    isBusy,
    handleSave,
    handleSaveSequenceConfig
  }
}

export default useCalibrationServiceWorkspaceActions
