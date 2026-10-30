import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_QUERY_KEYS,
  useCalibrationServiceMutations,
  useCalibrationServiceQuoteTermsTemplate,
  useCalibrationServiceSequenceConfig,
  useCalibrationServiceSlaConfig
} from '../../../hooks/useCalibrationServices'
import {
  CalibrationService,
  CalibrationServiceFilters,
  CalibrationServiceQuoteTerms,
  CalibrationServiceQuoteTermsTemplate,
  CalibrationServiceSlaConfigPayload
} from '../../../types/calibrationService'
import { mergeCalibrationQuoteTerms } from '../calibrationQuoteTerms'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'

import { logger } from 'src/utils/logger'
interface CalibrationServicesListActionsParams {
  permissions: CalibrationServicesListPermissions
  queryFilters: CalibrationServiceFilters
}

/**
 * Acciones de la bandeja: navegación al detalle, envío de cotización y certificado,
 * y diálogos de configuración (consecutivos, SLA y plantilla de términos).
 */
const useCalibrationServicesListActions = ({
  permissions,
  queryFilters
}: CalibrationServicesListActionsParams) => {
  const { canCreateServices, canManageSequenceConfig, canManageSlaConfig } = permissions
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { requestApproval, upsertSequenceConfig, upsertSlaConfig, upsertQuoteTermsTemplate, sendCertificate } =
    useCalibrationServiceMutations()
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [isSlaConfigDialogOpen, setIsSlaConfigDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateTerms, setTemplateTerms] = useState<CalibrationServiceQuoteTerms>({})
  const { data: quoteTermsTemplate } = useCalibrationServiceQuoteTermsTemplate(canCreateServices)

  const {
    data: sequenceConfig,
    isLoading: isLoadingSequenceConfig
  } = useCalibrationServiceSequenceConfig(canManageSequenceConfig)
  const { data: slaConfig } = useCalibrationServiceSlaConfig(canManageSlaConfig)

  useEffect(() => {
    if (!canManageSequenceConfig || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canManageSequenceConfig, isLoadingSequenceConfig, sequenceConfig?.initialized])

  const handleRequestApproval = async (service: CalibrationService) => {
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success(`${service.serviceCode} quedó marcado como cotización enviada al cliente.`)
    } catch (requestError) {
      logger.error(requestError)
      toast.error('No pudimos marcar la cotización como enviada al cliente.')
    }
  }

  const handleSendCertificate = async (service: CalibrationService) => {
    try {
      await sendCertificate.mutateAsync({ serviceId: String(service.id) })
      toast.success(`Certificado de ${service.serviceCode} registrado como enviado.`)
    } catch (sendError) {
      logger.error(sendError)
      toast.error('No pudimos registrar el envío del certificado.')
    }
  }

  const openServiceDetail = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}`)
  }

  const openOdsWorkflow = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}?open=ods`)
  }

  const openScheduleWorkflow = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}?open=schedule`)
  }

  const handleSaveSequenceConfig = async (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
  }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('Los consecutivos iniciales quedaron configurados.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      logger.error(configError)
      toast.error('No pudimos guardar la configuración inicial del módulo.')
    }
  }

  const handleSaveSlaConfig = async (values: CalibrationServiceSlaConfigPayload) => {
    try {
      await upsertSlaConfig.mutateAsync(values)
      toast.success('Los tiempos SLA quedaron actualizados.')
      setIsSlaConfigDialogOpen(false)
      // Recarga la bandeja actual: los semáforos SLA dependen de la configuración
      void queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all, queryFilters], {
        exact: true
      })
    } catch (configError) {
      logger.error(configError)
      toast.error('No pudimos guardar los tiempos SLA.')
    }
  }

  const handleOpenTemplate = async () => {
    // Quien edita parte de la versión del servidor, no de una copia de hasta 5 min
    const key = [CALIBRATION_SERVICE_QUERY_KEYS.all, 'quote-terms-template']
    // Si falla (sin red, 429) se abre con la copia que ya hay
    try {
      await queryClient.refetchQueries(key, { exact: true })
    } catch {
      // se usa la copia local
    }
    const current =
      queryClient.getQueryData<CalibrationServiceQuoteTermsTemplate>(key) ??
      quoteTermsTemplate
    setTemplateTerms(mergeCalibrationQuoteTerms(current?.terms))
    setTemplateDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      await upsertQuoteTermsTemplate.mutateAsync(templateTerms)
      toast.success('Plantilla de términos actualizada correctamente.')
      setTemplateDialogOpen(false)
    } catch {
      toast.error('No se pudo guardar la plantilla de términos.')
    }
  }

  const setTemplateTerm = (key: string, value: string) => {
    setTemplateTerms((previous) => ({ ...previous, [key]: value }))
  }

  return {
    requestApproval,
    sendCertificate,
    upsertSequenceConfig,
    upsertSlaConfig,
    upsertQuoteTermsTemplate,
    sequenceConfig,
    slaConfig,
    isSequenceDialogOpen,
    setIsSequenceDialogOpen,
    isSlaConfigDialogOpen,
    setIsSlaConfigDialogOpen,
    templateDialogOpen,
    setTemplateDialogOpen,
    templateTerms,
    handleRequestApproval,
    handleSendCertificate,
    openServiceDetail,
    openOdsWorkflow,
    openScheduleWorkflow,
    handleSaveSequenceConfig,
    handleSaveSlaConfig,
    handleOpenTemplate,
    handleSaveTemplate,
    setTemplateTerm
  }
}

export type CalibrationServicesListActions = ReturnType<
  typeof useCalibrationServicesListActions
>

export default useCalibrationServicesListActions
