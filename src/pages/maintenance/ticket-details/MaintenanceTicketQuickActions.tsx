import { Paper, Typography, Box, Button, Divider, Stack } from '@mui/material'
import { Print, Share, TrendingUp, Draw, Science } from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { maintenanceSignaturesEnabled } from '../../../features/maintenanceFlags'
import { surfaceSx } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'
import { neutral } from 'src/theme/designTokens'

interface MaintenanceTicketQuickActionsProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Acciones rápidas del ticket. */
const MaintenanceTicketQuickActions = ({
  ticket,
  details
}: MaintenanceTicketQuickActionsProps) => {
  const {
    hasCustomerSignature,
    isCustomerApprovalLocked,
    signaturesMissing,
    generateServiceOrderMutation,
    handleGenerateServiceOrder,
    setSignaturesDialogOpen,
    setTechnicalReportDialogOpen,
    showToast
  } = details

  return (
    <>
      {/* Quick Actions */}
      <Paper sx={{ ...surfaceSx, p: 3 }}>
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <TrendingUp sx={{ color: neutral.textMuted }} />
          <Typography
            variant='h6'
            sx={{ color: neutral.text, fontWeight: 600 }}
          >
            Acciones Rápidas
          </Typography>
        </Box>

        <Stack spacing={1}>
          <Button
            fullWidth
            variant='outlined'
            startIcon={<Print />}
            onClick={handleGenerateServiceOrder}
            size='small'
            disabled={generateServiceOrderMutation.isLoading}
          >
            Orden de Servicio
          </Button>
          {ticket.status === MaintenanceStatus.COMPLETED && (
            <Button
              fullWidth
              variant='outlined'
              startIcon={<Science />}
              onClick={() => {
                if (isCustomerApprovalLocked) {
                  showToast(
                    'El reporte técnico ya no puede editarse después de la firma del cliente',
                    'warning'
                  )
                  return
                }
                setTechnicalReportDialogOpen(true)
              }}
              size='small'
              disabled={isCustomerApprovalLocked}
            >
              Reporte Técnico
            </Button>
          )}
          {maintenanceSignaturesEnabled &&
            !hasCustomerSignature &&
            ticket.status === MaintenanceStatus.COMPLETED && (
              <Button
                fullWidth
                variant='outlined'
                startIcon={<Draw />}
                onClick={() => setSignaturesDialogOpen(true)}
                size='small'
              >
                {signaturesMissing ? 'Registrar firmas' : 'Actualizar firmas'}
              </Button>
            )}

          <Divider sx={{ my: 1 }} />

          <Button
            fullWidth
            variant='outlined'
            startIcon={<Share />}
            onClick={() => {
              const url = window.location.href
              navigator.clipboard.writeText(url)
              showToast('Enlace copiado al portapapeles', 'success')
            }}
            size='small'
          >
            Compartir Ticket
          </Button>
        </Stack>
      </Paper>
    </>
  )
}

export default MaintenanceTicketQuickActions
