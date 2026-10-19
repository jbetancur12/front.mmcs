import { Alert, Grid } from '@mui/material'
import { Dispatch, SetStateAction } from 'react'
import { alpha } from '@mui/material/styles'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import {
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../../types/calibrationService'
import { FILTER_ALL, ui } from './calibrationServicesListConstants'
import { CalibrationServicesListCounts } from './useCalibrationServicesListData'

interface CalibrationServicesSummaryProps {
  counts: CalibrationServicesListCounts
  visibleCount: number
  totalItems: number
  isTechnicalOnlyView: boolean
  clearFilters: () => void
  setStatusFilter: Dispatch<SetStateAction<CalibrationServiceStatus | typeof FILTER_ALL>>
  setSlaFilter: Dispatch<SetStateAction<CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL>>
  setAreFiltersOpen: Dispatch<SetStateAction<boolean>>
}

/** Indicadores de la bandeja (atajos de filtro) y avisos de frente documental y cierre. */
const CalibrationServicesSummary = ({
  counts,
  visibleCount,
  totalItems,
  isTechnicalOnlyView,
  clearFilters,
  setStatusFilter,
  setSlaFilter,
  setAreFiltersOpen
}: CalibrationServicesSummaryProps) => {
  const { pendingApproval: pendingApprovalCount, requestedChanges: requestedChangesCount, odsIssued: odsIssuedCount, scheduled: scheduledCount, inExecution: inExecutionCount, technicallyCompleted: technicallyCompletedCount, closed: closedCount, readyToClose: readyToCloseCount, pendingDocumentControl: pendingDocumentControlCount, readyForOds: readyForOdsCount, urgent: urgentCount } = counts

  return (
    <>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Servicios visibles'
            value={visibleCount}
            caption={`Total cargados: ${totalItems}`}
            icon={<VisibilityOutlinedIcon />}
            tone='blue'
            onClick={clearFilters}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label={isTechnicalOnlyView ? 'Programadas' : 'Pendientes respuesta'}
            value={isTechnicalOnlyView ? scheduledCount : pendingApprovalCount}
            caption={isTechnicalOnlyView ? 'Servicios con fecha asignada, listos para ejecutar' : 'Cotizaciones enviadas esperando respuesta'}
            icon={<WarningAmberOutlinedIcon />}
            tone='orange'
            onClick={() => { setStatusFilter(isTechnicalOnlyView ? 'scheduled' : 'pending_approval'); setAreFiltersOpen(true) }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label={isTechnicalOnlyView ? 'Requieren agenda' : 'Listos para ODS'}
            value={isTechnicalOnlyView ? odsIssuedCount : readyForOdsCount}
            caption={isTechnicalOnlyView ? 'Servicios que requieren coordinación' : 'Aprobados y pendientes de emisión ODS'}
            icon={<DescriptionOutlinedIcon />}
            tone='green'
            onClick={() => { setStatusFilter(isTechnicalOnlyView ? 'ods_issued' : 'approved'); setAreFiltersOpen(true) }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='En riesgo o vencidos'
            value={urgentCount}
            caption={
              isTechnicalOnlyView
                ? `${scheduledCount} prog · ${inExecutionCount} ejec · ${technicallyCompletedCount} fin · ${closedCount} cerrados`
                : `${requestedChangesCount} con cambios · ${pendingDocumentControlCount} documentales`
            }
            icon={<ReportProblemOutlinedIcon />}
            tone={urgentCount > 0 ? 'red' : 'teal'}
            onClick={() => { setSlaFilter('red'); setAreFiltersOpen(true) }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Alert
            severity='info'
            sx={{
              borderRadius: '16px',
              border: `1px solid ${alpha(ui.info, 0.18)}`,
              bgcolor: alpha(ui.info, 0.06),
              color: ui.textSecondary,
              '& .MuiAlert-icon': { color: ui.info }
            }}
          >
            {pendingDocumentControlCount > 0
              ? `${pendingDocumentControlCount} servicios todavía requieren control documental o envío por corte.`
              : 'No hay servicios con frente documental pendiente en la bandeja actual.'}
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert
            severity='success'
            sx={{
              borderRadius: '16px',
              border: `1px solid ${alpha(ui.green, 0.18)}`,
              bgcolor: ui.greenLight,
              color: ui.textSecondary,
              '& .MuiAlert-icon': { color: ui.green }
            }}
          >
            {readyToCloseCount > 0
              ? `${readyToCloseCount} servicios ya están listos para cierre final.`
              : 'Todavía no hay servicios listos para cierre final en la bandeja actual.'}
          </Alert>
        </Grid>
      </Grid>
    </>
  )
}

export default CalibrationServicesSummary
