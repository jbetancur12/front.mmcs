import { useState } from 'react'
import {
  CalibrationServiceAdjustment,
  CalibrationServiceCut,
  CalibrationServiceSendPreviewResult
} from '../../../types/calibrationService'
import { CalibrationServiceDecisionMode } from '../CalibrationServiceApprovalDialog'

/** Estado de apertura de los diálogos del detalle y de los registros seleccionados. */
const useCalibrationServiceDetailDialogs = () => {
  const [decisionMode, setDecisionMode] =
    useState<CalibrationServiceDecisionMode | null>(null)
  const [isOdsDialogOpen, setIsOdsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false)
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isLogisticsControlDialogOpen, setIsLogisticsControlDialogOpen] =
    useState(false)
  const [isSendLogisticsEmailDialogOpen, setIsSendLogisticsEmailDialogOpen] =
    useState(false)
  const [sendLogisticsPreview, setSendLogisticsPreview] =
    useState<CalibrationServiceSendPreviewResult | null>(null)
  const [
    isPhysicalTraceabilityDialogOpen,
    setIsPhysicalTraceabilityDialogOpen
  ] = useState(false)
  const [isCutDialogOpen, setIsCutDialogOpen] = useState(false)
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isExecutionCustomerDialogOpen, setIsExecutionCustomerDialogOpen] =
    useState(false)
  const [executionCustomerDraft, setExecutionCustomerDraft] = useState('')
  const [executionSiteDraft, setExecutionSiteDraft] = useState('')
  const [selectedCutForInvoice, setSelectedCutForInvoice] =
    useState<CalibrationServiceCut | null>(null)
  const [selectedCutForPayment, setSelectedCutForPayment] =
    useState<CalibrationServiceCut | null>(null)
  const [selectedCutForDocumentControl, setSelectedCutForDocumentControl] =
    useState<CalibrationServiceCut | null>(null)
  const [selectedAdjustmentsForReview, setSelectedAdjustmentsForReview] =
    useState<CalibrationServiceAdjustment[]>([])
  const [selectedAdjustmentReviewStage, setSelectedAdjustmentReviewStage] =
    useState<'technical' | 'commercial'>('technical')
  const [
    selectedAdjustmentsForCustomerResponse,
    setSelectedAdjustmentsForCustomerResponse
  ] = useState<CalibrationServiceAdjustment[]>([])
  const [selectedAdjustmentsForSend, setSelectedAdjustmentsForSend] =
    useState<CalibrationServiceAdjustment[]>([])
  const [sendAdjustmentPreview, setSendAdjustmentPreview] =
    useState<CalibrationServiceSendPreviewResult | null>(null)

  return {
    decisionMode,
    setDecisionMode,
    isOdsDialogOpen,
    setIsOdsDialogOpen,
    isScheduleDialogOpen,
    setIsScheduleDialogOpen,
    isRescheduleDialogOpen,
    setIsRescheduleDialogOpen,
    isReassignDialogOpen,
    setIsReassignDialogOpen,
    isPauseDialogOpen,
    setIsPauseDialogOpen,
    isResumeDialogOpen,
    setIsResumeDialogOpen,
    isCancelDialogOpen,
    setIsCancelDialogOpen,
    isLogisticsControlDialogOpen,
    setIsLogisticsControlDialogOpen,
    isSendLogisticsEmailDialogOpen,
    setIsSendLogisticsEmailDialogOpen,
    sendLogisticsPreview,
    setSendLogisticsPreview,
    isPhysicalTraceabilityDialogOpen,
    setIsPhysicalTraceabilityDialogOpen,
    isCutDialogOpen,
    setIsCutDialogOpen,
    isAdjustmentDialogOpen,
    setIsAdjustmentDialogOpen,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    isCloseDialogOpen,
    setIsCloseDialogOpen,
    isExecutionCustomerDialogOpen,
    setIsExecutionCustomerDialogOpen,
    executionCustomerDraft,
    setExecutionCustomerDraft,
    executionSiteDraft,
    setExecutionSiteDraft,
    selectedCutForInvoice,
    setSelectedCutForInvoice,
    selectedCutForPayment,
    setSelectedCutForPayment,
    selectedCutForDocumentControl,
    setSelectedCutForDocumentControl,
    selectedAdjustmentsForReview,
    setSelectedAdjustmentsForReview,
    selectedAdjustmentReviewStage,
    setSelectedAdjustmentReviewStage,
    selectedAdjustmentsForCustomerResponse,
    setSelectedAdjustmentsForCustomerResponse,
    selectedAdjustmentsForSend,
    setSelectedAdjustmentsForSend,
    sendAdjustmentPreview,
    setSendAdjustmentPreview
  }
}

export type CalibrationServiceDetailDialogs = ReturnType<
  typeof useCalibrationServiceDetailDialogs
>

export default useCalibrationServiceDetailDialogs
