import SignalLoader from 'src/Components/Common/SignalLoader'
import React from 'react'
import { Container, Grid, Alert, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import MaintenanceErrorBoundary from '../../Components/Maintenance/MaintenanceErrorBoundary'
import useMaintenanceTicketDetails from './ticket-details/useMaintenanceTicketDetails'
import MaintenanceTicketHeader from './ticket-details/MaintenanceTicketHeader'
import MaintenanceTicketStatusCard from './ticket-details/MaintenanceTicketStatusCard'
import MaintenanceTicketCustomerCard from './ticket-details/MaintenanceTicketCustomerCard'
import MaintenanceTicketEquipmentCard from './ticket-details/MaintenanceTicketEquipmentCard'
import MaintenanceTicketIssueCard from './ticket-details/MaintenanceTicketIssueCard'
import MaintenanceTicketActivitySections from './ticket-details/MaintenanceTicketActivitySections'
import MaintenanceTicketTechnicianCard from './ticket-details/MaintenanceTicketTechnicianCard'
import MaintenanceTicketScheduleCard from './ticket-details/MaintenanceTicketScheduleCard'
import MaintenanceTicketCostsSection from './ticket-details/MaintenanceTicketCostsSection'
import MaintenanceTicketSignaturesCard from './ticket-details/MaintenanceTicketSignaturesCard'
import MaintenanceTicketSatisfactionCard from './ticket-details/MaintenanceTicketSatisfactionCard'
import MaintenanceTicketQuickActions from './ticket-details/MaintenanceTicketQuickActions'
import MaintenanceTicketDialogs from './ticket-details/MaintenanceTicketDialogs'

export { formatCurrency } from './ticket-details/maintenanceTicketDetailUtils'

/**
 * MaintenanceTicketDetails component provides a comprehensive ticket management interface
 * Features: ticket info display, editing, comments, file management, timeline, PDF generation
 */
const MaintenanceTicketDetails: React.FC = () => {
  const details = useMaintenanceTicketDetails()
  const { ticket, ticketLoading, ticketError, handleBack } = details

  // Loading state
  if (ticketLoading) {
    return <SignalLoader message='Cargando ticket...' fullPage />
  }

  // Error state
  if (ticketError || !ticket) {
    return (
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        <Alert
          severity='error'
          sx={{
            mb: 3,
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid rgba(244, 67, 54, 0.2)'
          }}
        >
          {(ticketError as any)?.message ||
            'Error al cargar el ticket. El ticket no existe o no tienes permisos para verlo.'}
        </Alert>
        <Button
          variant='outlined'
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{
            minHeight: 48,
            borderColor: '#d1d5db',
            color: '#334155',
            borderRadius: '12px',
            '&:hover': {
              borderColor: '#94a3b8',
              backgroundColor: '#f8fafc'
            }
          }}
        >
          Volver al Dashboard
        </Button>
      </Container>
    )
  }

  return (
    <MaintenanceErrorBoundary>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh'
        }}
      >
        {/* Header with breadcrumbs */}
        <MaintenanceTicketHeader ticket={ticket} details={details} />

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            {/* Ticket Status and Priority */}
            <MaintenanceTicketStatusCard ticket={ticket} details={details} />
            <MaintenanceTicketCustomerCard ticket={ticket} details={details} />
            <MaintenanceTicketEquipmentCard ticket={ticket} details={details} />
            <MaintenanceTicketIssueCard ticket={ticket} />
            <MaintenanceTicketActivitySections ticket={ticket} details={details} />
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <MaintenanceTicketTechnicianCard ticket={ticket} details={details} />
            <MaintenanceTicketScheduleCard ticket={ticket} details={details} />
            <MaintenanceTicketCostsSection ticket={ticket} details={details} />
            <MaintenanceTicketSignaturesCard ticket={ticket} details={details} />
            <MaintenanceTicketSatisfactionCard ticket={ticket} />
            <MaintenanceTicketQuickActions ticket={ticket} details={details} />
          </Grid>
        </Grid>

        <MaintenanceTicketDialogs ticket={ticket} details={details} />
      </Container>
    </MaintenanceErrorBoundary>
  )
}

export default MaintenanceTicketDetails
