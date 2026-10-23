import { useDeferredValue, useEffect, useState } from 'react'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceFilters,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import {
  CALIBRATION_SERVICES_FILTERS_STORAGE_KEY,
  CALIBRATION_SERVICES_VIEW_STORAGE_KEY,
  FILTER_ALL
} from './calibrationServicesListConstants'
import { CalibrationServicesViewMode } from './calibrationServicesListTypes'
import {
  getStoredFilters,
  getStoredViewMode,
  saveStoredFilters
} from './calibrationServicesListUtils'

const PAGE_SIZE = 100

/**
 * Filtros de la bandeja (persistidos en sessionStorage), modo de vista (localStorage)
 * y filtros que se envían a la API.
 */
const useCalibrationServicesListFilters = (isTechnicalOnlyView: boolean) => {
  const storedFilters = getStoredFilters()
  const [search, setSearch] = useState(storedFilters.search ?? '')
  const [statusFilter, setStatusFilter] = useState<
    CalibrationServiceStatus | typeof FILTER_ALL
  >((storedFilters.statusFilter as CalibrationServiceStatus | typeof FILTER_ALL) ?? FILTER_ALL)
  const [approvalFilter, setApprovalFilter] = useState<
    CalibrationServiceApprovalStatus | typeof FILTER_ALL
  >((storedFilters.approvalFilter as CalibrationServiceApprovalStatus | typeof FILTER_ALL) ?? FILTER_ALL)
  const [scopeFilter, setScopeFilter] = useState<
    CalibrationServiceScopeType | typeof FILTER_ALL
  >((storedFilters.scopeFilter as CalibrationServiceScopeType | typeof FILTER_ALL) ?? FILTER_ALL)
  const [slaFilter, setSlaFilter] = useState<
    CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  >((storedFilters.slaFilter as CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL) ?? FILTER_ALL)
  const [siteFilter, setSiteFilter] = useState(storedFilters.siteFilter ?? '')
  const [metrologistFilter, setMetrologistFilter] = useState<string>(storedFilters.metrologistFilter ?? FILTER_ALL)
  const [hasAdjustmentsFilter, setHasAdjustmentsFilter] = useState<string>(storedFilters.hasAdjustmentsFilter ?? FILTER_ALL)
  const [areFiltersOpen, setAreFiltersOpen] = useState(storedFilters.areFiltersOpen ?? false)
  const [viewMode, setViewMode] = useState<CalibrationServicesViewMode>(
    getStoredViewMode
  )
  const [showOnlyMyLoad, setShowOnlyMyLoad] = useState(storedFilters.showOnlyMyLoad ?? false)
  const hasCutsReadyForInvoicing = (statusFilter as string) === 'ready_for_invoicing'
  const hasCutsInvoiced = (statusFilter as string) === 'invoiced'
  const [billingStatusFilter, setBillingStatusFilter] = useState<string | undefined>(undefined)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | undefined>(undefined)

  // La bandeja carga de a PAGE_SIZE servicios; "Cargar más" amplía el límite
  const [limit, setLimit] = useState(PAGE_SIZE)

  const deferredSearch = useDeferredValue(search)
  const queryFilters: CalibrationServiceFilters = {
    limit
  }

  if (deferredSearch.trim()) {
    queryFilters.search = deferredSearch.trim()
  }

  if (statusFilter !== FILTER_ALL) {
    if ((statusFilter as string) === 'invoiced') {
      queryFilters.hasCutsInvoiced = 'true'
    } else if ((statusFilter as string) === 'ready_for_invoicing') {
      queryFilters.hasCutsReadyForInvoicing = 'true'
    } else {
      queryFilters.status = statusFilter
    }
  }

  if (!isTechnicalOnlyView && approvalFilter !== FILTER_ALL) {
    queryFilters.approvalStatus = approvalFilter
  }

  if (hasAdjustmentsFilter !== FILTER_ALL) {
    queryFilters.hasAdjustments = hasAdjustmentsFilter
  }

  if (billingStatusFilter) {
    queryFilters.billingStatus = billingStatusFilter as 'enviado' | 'no_enviado'
  }

  if (paymentStatusFilter) {
    queryFilters.paymentStatus = paymentStatusFilter as 'pagado' | 'pendiente'
  }

  // Al cambiar lo que se consulta al servidor, se vuelve a la primera página
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [
    deferredSearch,
    statusFilter,
    approvalFilter,
    hasAdjustmentsFilter,
    billingStatusFilter,
    paymentStatusFilter
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      CALIBRATION_SERVICES_VIEW_STORAGE_KEY,
      viewMode
    )
  }, [viewMode])

  useEffect(() => {
    saveStoredFilters({
      search,
      statusFilter,
      approvalFilter,
      scopeFilter,
      slaFilter,
      siteFilter,
      metrologistFilter,
      hasAdjustmentsFilter,
      showOnlyMyLoad,
      areFiltersOpen
    })
  }, [
    search,
    statusFilter,
    approvalFilter,
    scopeFilter,
    slaFilter,
    siteFilter,
    metrologistFilter,
    hasAdjustmentsFilter,
    showOnlyMyLoad,
    areFiltersOpen
  ])

  const activeFiltersCount = [
    search.trim(),
    statusFilter !== FILTER_ALL,
    !isTechnicalOnlyView && approvalFilter !== FILTER_ALL,
    scopeFilter !== FILTER_ALL,
    slaFilter !== FILTER_ALL,
    siteFilter.trim(),
    metrologistFilter !== FILTER_ALL,
    hasAdjustmentsFilter !== FILTER_ALL,
    showOnlyMyLoad
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter(FILTER_ALL)
    setApprovalFilter(FILTER_ALL)
    setScopeFilter(FILTER_ALL)
    setSlaFilter(FILTER_ALL)
    setSiteFilter('')
    setMetrologistFilter(FILTER_ALL)
    setHasAdjustmentsFilter(FILTER_ALL)
    setShowOnlyMyLoad(false)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CALIBRATION_SERVICES_FILTERS_STORAGE_KEY)
    }
  }

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    approvalFilter,
    setApprovalFilter,
    scopeFilter,
    setScopeFilter,
    slaFilter,
    setSlaFilter,
    siteFilter,
    setSiteFilter,
    metrologistFilter,
    setMetrologistFilter,
    hasAdjustmentsFilter,
    setHasAdjustmentsFilter,
    areFiltersOpen,
    setAreFiltersOpen,
    viewMode,
    setViewMode,
    showOnlyMyLoad,
    setShowOnlyMyLoad,
    hasCutsReadyForInvoicing,
    hasCutsInvoiced,
    billingStatusFilter,
    setBillingStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    queryFilters,
    limit,
    loadMore: () => setLimit((current) => current + PAGE_SIZE),
    activeFiltersCount,
    clearFilters
  }
}

export type CalibrationServicesListFilters = ReturnType<
  typeof useCalibrationServicesListFilters
>

export default useCalibrationServicesListFilters
