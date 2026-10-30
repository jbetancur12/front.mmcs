import { toast } from 'react-hot-toast'
import {
  CalibrationService,
  CalibrationServiceAdjustment
} from '../../../types/calibrationService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'

import { logger } from 'src/utils/logger'
type CalibrationServiceMutations = ReturnType<typeof useCalibrationServiceMutations>

interface CalibrationServiceDocumentActionsParams {
  service: CalibrationService
  mutations: CalibrationServiceMutations
}

/** Acciones de documentos: descarga, generación de PDFs oficiales y carga de soportes. */
const useCalibrationServiceDocumentActions = ({
  service,
  mutations
}: CalibrationServiceDocumentActionsParams) => {
  const {
    uploadDocument,
    generateQuotePdf,
    generateOdsPdf,
    generateAdjustmentPdf,
    generateAdjustmentSummaryPdf,
    generateTechnicalProgressPdf,
    downloadDocument
  } = mutations

  const handleDownloadDocument = async (
    documentId: number,
    fileName: string
  ) => {
    try {
      const fileBlob = await downloadDocument.mutateAsync({
        serviceId: String(service.id),
        documentId: String(documentId)
      })

      const objectUrl = window.URL.createObjectURL(fileBlob)
      const anchor = window.document.createElement('a')
      anchor.href = objectUrl
      anchor.download = fileName
      anchor.target = '_blank'
      anchor.rel = 'noopener'
      anchor.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch (downloadError) {
      logger.error(downloadError)
      toast.error(getApiErrorMessage(downloadError, 'No pudimos descargar el documento.'))
    }
  }

  const handleGenerateQuotePdf = async () => {
    try {
      const document = await generateQuotePdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('La cotización PDF quedó generada.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName || `cotizacion-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      logger.error(pdfError)
      toast.error(getApiErrorMessage(pdfError, 'No pudimos generar la cotización PDF.'))
    }
  }

  const handleGenerateOdsPdf = async () => {
    try {
      const document = await generateOdsPdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('La ODS PDF quedó generada.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName || `ods-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      logger.error(pdfError)
      toast.error(getApiErrorMessage(pdfError, 'No pudimos generar la ODS PDF.'))
    }
  }

  const handleGenerateAdjustmentPdf = async (
    adjustment: CalibrationServiceAdjustment
  ) => {
    try {
      const document = await generateAdjustmentPdf.mutateAsync({
        serviceId: String(service.id),
        adjustmentId: String(adjustment.id)
      })
      toast.success('El anexo PDF de la novedad quedó generado.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName ||
          `anexo-novedad-${service.serviceCode}-${adjustment.id}.pdf`
      )
    } catch (pdfError) {
      logger.error(pdfError)
      toast.error(getApiErrorMessage(pdfError, 'No pudimos generar el anexo PDF de la novedad.'))
    }
  }

  const handleGenerateTechnicalProgressPdf = async () => {
    try {
      const document = await generateTechnicalProgressPdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('El anexo de avance técnico quedó generado.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName ||
          `anexo-avance-tecnico-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      logger.error(pdfError)
      toast.error(getApiErrorMessage(pdfError, 'No pudimos generar el anexo de avance técnico.'))
    }
  }

  const handleGenerateAdjustmentSummaryPdf = async () => {
    try {
      const document = await generateAdjustmentSummaryPdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('El consolidado PDF de novedades quedó generado.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName ||
          `consolidado-novedades-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      logger.error(pdfError)
      toast.error(getApiErrorMessage(pdfError, 'No pudimos generar el consolidado PDF de novedades.'))
    }
  }

  const handleUploadSupportDocument = async ({
    file,
    documentType,
    title,
    notes
  }: {
    file: File
    documentType:
      | 'request_evidence'
      | 'approval_evidence'
      | 'rejection_evidence'
      | 'supporting_attachment'
    title?: string
    notes?: string
  }) => {
    try {
      await uploadDocument.mutateAsync({
        serviceId: String(service.id),
        file,
        documentType,
        title,
        notes
      })
      toast.success('El documento quedó cargado al servicio.')
    } catch (uploadError) {
      logger.error(uploadError)
      toast.error(getApiErrorMessage(uploadError, 'No pudimos cargar el documento.'))
      throw uploadError
    }
  }

  return {
    handleDownloadDocument,
    handleGenerateQuotePdf,
    handleGenerateOdsPdf,
    handleGenerateAdjustmentPdf,
    handleGenerateTechnicalProgressPdf,
    handleGenerateAdjustmentSummaryPdf,
    handleUploadSupportDocument
  }
}

export default useCalibrationServiceDocumentActions
