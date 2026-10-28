import { useParams } from 'react-router-dom'
import {
  useCalibrationService,
  useCalibrationServiceCustomerOptions,
  useCalibrationServiceProductOptions,
  useCalibrationServiceQuoteTermsTemplate,
  useCalibrationServiceSequenceConfig
} from '../../../hooks/useCalibrationServices'
import { CalibrationServiceProductSummary } from '../../../types/calibrationService'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { getQueryErrorMessage } from './calibrationServiceWorkspaceUtils'

/**
 * Datos del formulario de cotización: permisos, servicio en edición, consecutivos,
 * plantilla de términos y catálogos de clientes y productos.
 */
const useCalibrationServiceWorkspaceData = () => {
  const { serviceId } = useParams<{ serviceId?: string }>()
  const isEditing = Boolean(serviceId)
  const canResetSequence = useCan(PERMISSIONS.CALIBRATION_CONFIG_SEQUENCE_RESET)
  // Crear exige "crear" y editar exige "editar"; la ruta ya filtra, esto cubre el cambio en vivo
  const canCreateService = useCan(PERMISSIONS.CALIBRATION_SERVICE_CREATE)
  const canUpdateService = useCan(PERMISSIONS.CALIBRATION_SERVICE_UPDATE)
  const canAccessWorkspace = isEditing ? canUpdateService : canCreateService
  const {
    data: sequenceConfig,
    isLoading: isLoadingSequenceConfig
  } = useCalibrationServiceSequenceConfig(canAccessWorkspace)
  const { data: service, isLoading: isLoadingService } = useCalibrationService(serviceId)
  const { data: quoteTermsTemplate, isFetchedAfterMount: isTemplateFresh } =
    useCalibrationServiceQuoteTermsTemplate(canAccessWorkspace && !isEditing)
  const {
    data: customers = [],
    error: customersError,
    isError: hasCustomersError,
    isLoading: isLoadingCustomers
  } = useCalibrationServiceCustomerOptions(canAccessWorkspace)
  const {
    data: products = [],
    error: productsError,
    isError: hasProductsError,
    isLoading: isLoadingProducts
  } = useCalibrationServiceProductOptions(canAccessWorkspace)

  const customerOptions =
    customers.length > 0
      ? customers
      : service?.customer
        ? [service.customer]
        : []
  const productFallbackOptions = (service?.items || [])
    .map((item) => item.product)
    .filter(
      (product): product is CalibrationServiceProductSummary =>
        Boolean(product?.id)
    )
    .filter(
      (product, index, array) =>
        array.findIndex((candidate) => candidate.id === product.id) === index
    )
  const productOptions = products.length > 0 ? products : productFallbackOptions
  const catalogErrors = [
    hasCustomersError
      ? getQueryErrorMessage(
          customersError,
          'No pudimos cargar el catalogo de clientes para este formulario.'
        )
      : null,
    hasProductsError
      ? getQueryErrorMessage(
          productsError,
          'No pudimos cargar el catalogo de productos para este formulario.'
        )
      : null
  ].filter(Boolean) as string[]
  const requestEvidenceDocuments =
    service?.documents?.filter((document) => document.documentType === 'request_evidence') || []
  const hasCustomerChangeRequest =
    service?.otherFields?.customerResponseType === 'changes_requested'
  const latestChangeRequest =
    service?.otherFields?.latestChangeRequest &&
    typeof service.otherFields.latestChangeRequest === 'object' &&
    !Array.isArray(service.otherFields.latestChangeRequest)
      ? (service.otherFields.latestChangeRequest as Record<string, unknown>)
      : null
  const canEdit =
    canAccessWorkspace &&
    (!service || service.status === 'draft')
  const isPageLoading = isLoadingService || isLoadingCustomers || isLoadingProducts || isLoadingSequenceConfig

  return {
    serviceId,
    isEditing,
    canResetSequence,
    canAccessWorkspace,
    sequenceConfig,
    isLoadingSequenceConfig,
    service,
    quoteTermsTemplate,
    isTemplateFresh,
    customerOptions,
    hasCustomersError,
    productOptions,
    catalogErrors,
    requestEvidenceDocuments,
    hasCustomerChangeRequest,
    latestChangeRequest,
    canEdit,
    isPageLoading
  }
}

export type CalibrationServiceWorkspaceData = ReturnType<
  typeof useCalibrationServiceWorkspaceData
>

export default useCalibrationServiceWorkspaceData
