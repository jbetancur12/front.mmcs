import { useMemo } from 'react'
import { CalibrationService } from '../../../types/calibrationService'
import { FILTER_ALL, FILTER_UNASSIGNED, SLA_FILTER_ALERT } from './calibrationServicesListConstants'
import { CalibrationServicesMetrologistOption } from './calibrationServicesListTypes'
import {
  getKanbanColumnKey,
  getKanbanColumns,
  getMetrologistEmails,
  getMetrologistNames,
  hasCustomerChangeRequest,
  matchesSiteFilter
} from './calibrationServicesListUtils'
import { CalibrationServicesListFilters } from './useCalibrationServicesListFilters'

interface CalibrationServicesListDataParams {
  services: CalibrationService[]
  filters: CalibrationServicesListFilters
  isTechnicalOnlyView: boolean
  userEmail?: string | null
  /** Conteo por estado del servidor (todas las páginas, no solo las cargadas). */
  statusCounts?: Partial<Record<string, number>>
}

// Columnas del kanban que corresponden solo a estos estados, así su total sale del servidor
const COLUMN_STATUSES: Record<string, string[]> = {
  to_schedule: ['ods_issued', 'pending_programming'],
  in_service: ['scheduled', 'in_execution'],
  pending_close: ['technically_completed'],
  closed: ['closed']
}

/** Servicios visibles tras los filtros locales, contadores, columnas del kanban y grupos de la lista. */
const useCalibrationServicesListData = ({
  services,
  filters,
  isTechnicalOnlyView,
  userEmail,
  statusCounts
}: CalibrationServicesListDataParams) => {
  const {
    scopeFilter,
    slaFilter,
    metrologistFilter,
    showOnlyMyLoad,
    siteFilter,
    activeFiltersCount
  } = filters

  const metrologistOptions = services
    .reduce<CalibrationServicesMetrologistOption[]>((accumulator, service) => {
      const names = getMetrologistNames(service)
      const emails = getMetrologistEmails(service)

      if (names.length === 0) return accumulator

      names.forEach((name, idx) => {
        const email = emails[idx] || ''
        const optionId = email || name

        if (accumulator.some((metrologist) => metrologist.id === optionId)) {
          return
        }

        accumulator.push({
          id: optionId,
          label: email
            ? `${name} · ${email}`
            : name
        })
      })

      return accumulator
    }, [])
    .sort((left, right) => left.label.localeCompare(right.label, 'es'))

  const visibleServices = services.filter((service) => {
    const currentMetrologistNames = getMetrologistNames(service)
    const currentMetrologistEmails = getMetrologistEmails(service)

    if (scopeFilter !== FILTER_ALL && service.scopeType !== scopeFilter) {
      return false
    }

    const slaColor = service.slaIndicator?.color || 'gray'
    // "alert" = en riesgo: semáforo amarillo o rojo
    if ((slaFilter as string) === SLA_FILTER_ALERT) {
      if (!['yellow', 'red'].includes(slaColor)) return false
    } else if (slaFilter !== FILTER_ALL && slaColor !== slaFilter) {
      return false
    }

    if (metrologistFilter === FILTER_UNASSIGNED && currentMetrologistNames.length > 0) {
      return false
    }

    if (
      metrologistFilter !== FILTER_ALL &&
      metrologistFilter !== FILTER_UNASSIGNED &&
      !currentMetrologistEmails.includes(metrologistFilter) &&
      !currentMetrologistNames.includes(metrologistFilter)
    ) {
      return false
    }

    if (showOnlyMyLoad) {
      const currentUserEmail = userEmail?.trim().toLowerCase()
      if (!currentUserEmail || !currentMetrologistEmails.some(e => e.toLowerCase() === currentUserEmail)) {
        return false
      }
    }

    return matchesSiteFilter(service, siteFilter)
  })

  const counts = useMemo(() => {
    let pendingApproval = 0, requestedChanges = 0, odsIssued = 0
    let scheduled = 0, inExecution = 0, technicallyCompleted = 0, closed = 0
    let readyToClose = 0, pendingDocumentControl = 0, readyForOds = 0, urgent = 0

    for (const service of visibleServices) {
      if (service.status === 'pending_approval') pendingApproval++
      if (service.status === 'ods_issued') odsIssued++
      if (service.status === 'scheduled') scheduled++
      if (service.status === 'in_execution') inExecution++
      if (service.status === 'technically_completed') technicallyCompleted++
      if (service.status === 'closed') closed++
      if (hasCustomerChangeRequest(service)) requestedChanges++
      if (service.status === 'technically_completed' && service.slaIndicator?.activePhase === 'document_control_closed') readyToClose++
      if (service.slaIndicator?.activePhase === 'document_control') pendingDocumentControl++
      if (service.status === 'approved' && service.approvalStatus === 'approved' && !service.odsCode) readyForOds++
      if (['yellow', 'red'].includes(service.slaIndicator?.color || 'gray')) urgent++
    }

    return { pendingApproval, requestedChanges, odsIssued, scheduled, inExecution, technicallyCompleted, closed, readyToClose, pendingDocumentControl, readyForOds, urgent }
  }, [visibleServices])

  const hasLocalFilters =
    scopeFilter !== FILTER_ALL ||
    slaFilter !== FILTER_ALL ||
    metrologistFilter !== FILTER_ALL ||
    showOnlyMyLoad ||
    siteFilter.trim() !== ''

  const kanbanColumns = useMemo(
    () => getKanbanColumns(isTechnicalOnlyView),
    [isTechnicalOnlyView]
  )

  const kanbanServices = useMemo(() => {
    const groupedServices = visibleServices.reduce<Record<string, CalibrationService[]>>(
      (accumulator, service) => {
        const columnKey = getKanbanColumnKey(service, isTechnicalOnlyView)

        if (!accumulator[columnKey]) {
          accumulator[columnKey] = []
        }

        accumulator[columnKey].push(service)
        return accumulator
      },
      {}
    )

    const columnsWithServices = kanbanColumns.map((column) => {
      const servicesForColumn = (groupedServices[column.key] || []).sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )

      const urgentCount = servicesForColumn.filter((service) =>
        ['red', 'yellow'].includes(service.slaIndicator?.color || 'gray')
      ).length

      const currentUserEmail = userEmail?.trim().toLowerCase()
      const myLoadCount = currentUserEmail
        ? servicesForColumn.filter((service) => {
            const emails = getMetrologistEmails(service)
            return emails.some(e => e.toLowerCase() === currentUserEmail)
          }).length
        : 0

      const columnStatuses = COLUMN_STATUSES[column.key]
      const serverTotal =
        statusCounts && columnStatuses && !hasLocalFilters
          ? columnStatuses.reduce(
              (sum, status) => sum + (statusCounts[status] ?? 0),
              0
            )
          : null

      return {
        ...column,
        services: servicesForColumn,
        urgentCount,
        myLoadCount,
        serverTotal
      }
    })

    const shouldPrioritizeOperationally =
      showOnlyMyLoad || activeFiltersCount > 0

    if (!shouldPrioritizeOperationally) {
      return columnsWithServices.sort(
        (left, right) => left.priority - right.priority
      )
    }

    return columnsWithServices.sort((left, right) => {
      if (right.urgentCount !== left.urgentCount) {
        return right.urgentCount - left.urgentCount
      }

      if (right.myLoadCount !== left.myLoadCount) {
        return right.myLoadCount - left.myLoadCount
      }

      if (right.services.length !== left.services.length) {
        return right.services.length - left.services.length
      }

      return left.priority - right.priority
    })
  }, [
    userEmail,
    activeFiltersCount,
    isTechnicalOnlyView,
    kanbanColumns,
    showOnlyMyLoad,
    visibleServices,
    statusCounts,
    hasLocalFilters
  ])

  const groupedListServices = useMemo(() => {
    const grouped = visibleServices.reduce<Record<string, CalibrationService[]>>(
      (acc, service) => {
        const key = getKanbanColumnKey(service, isTechnicalOnlyView)
        if (!acc[key]) acc[key] = []
        acc[key].push(service)
        return acc
      },
      {}
    )

    return getKanbanColumns(isTechnicalOnlyView)
      .map(col => ({
        ...col,
        services: (grouped[col.key] || []).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      }))
      .filter(col => col.services.length > 0)
      .sort((a, b) => a.priority - b.priority)
  }, [visibleServices, isTechnicalOnlyView])

  const currentUserHasAssignedLoad = useMemo(() => {
    const currentUserEmail = userEmail?.trim().toLowerCase()

    if (!currentUserEmail) {
      return false
    }

    return services.some((service) => {
      const emails = getMetrologistEmails(service)
      return emails.some(e => e.toLowerCase() === currentUserEmail)
    })
  }, [userEmail, services])

  const myLoadCount = useMemo(() => {
    const currentUserEmail = userEmail?.trim().toLowerCase()

    if (!currentUserEmail) {
      return 0
    }

    return services.filter((service) => {
      const emails = getMetrologistEmails(service)
      return emails.some(e => e.toLowerCase() === currentUserEmail)
    }).length
  }, [userEmail, services])

  return {
    metrologistOptions,
    visibleServices,
    counts,
    kanbanServices,
    groupedListServices,
    currentUserHasAssignedLoad,
    myLoadCount
  }
}

export type CalibrationServicesListCounts = ReturnType<
  typeof useCalibrationServicesListData
>['counts']

export default useCalibrationServicesListData
