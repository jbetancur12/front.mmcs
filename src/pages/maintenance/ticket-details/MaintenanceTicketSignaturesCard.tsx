import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Stack
} from '@mui/material'
import {
  Draw,
  Lock
} from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { maintenanceSignaturesEnabled } from '../../../features/maintenanceFlags'
import {
  formatDate,
  surfaceSx
} from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketSignaturesCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Firmas del cliente y del técnico. */
const MaintenanceTicketSignaturesCard = ({ ticket, details }: MaintenanceTicketSignaturesCardProps) => {
  const {
    canManageTechnicians,
    hasCustomerSignature,
    hasTechnicianSignature,
    signaturesMissing,
    handleRevokeCustomerSignature,
    setSignaturesDialogOpen,
    showConfirmDialog
  } = details

  return (
    <>
      {maintenanceSignaturesEnabled &&
        ticket.status === MaintenanceStatus.COMPLETED && (
          <Paper
            sx={{
              ...surfaceSx,
              p: 3,
              mb: 3,
              borderColor: signaturesMissing ? '#fcd34d' : '#bbf7d0'
            }}
          >
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Box>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 600,
                    color: signaturesMissing ? '#d97706' : '#059669'
                  }}
                >
                  Firmas de conformidad
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 0.5 }}
                >
                  {signaturesMissing
                    ? 'Este ticket ya está completado, pero todavía le faltan firmas para que la orden quede cerrada visualmente.'
                    : 'Las firmas ya están registradas y listas para aparecer en la orden de servicio PDF.'}
                </Typography>
                <Stack
                  direction='row'
                  spacing={1}
                  sx={{ mt: 1.5 }}
                  flexWrap='wrap'
                >
                  <Chip
                    size='small'
                    color={hasTechnicianSignature ? 'success' : 'warning'}
                    label={
                      hasTechnicianSignature
                        ? 'Firma técnico OK'
                        : 'Falta firma técnico'
                    }
                  />
                  <Chip
                    size='small'
                    color={hasCustomerSignature ? 'success' : 'warning'}
                    label={
                      hasCustomerSignature
                        ? 'Firma cliente OK'
                        : 'Falta firma cliente'
                    }
                  />
                </Stack>
                {(ticket.technicianSignedAt ||
                  ticket.customerSignedAt) && (
                  <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                    {ticket.technicianSignedAt && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        Firma técnico:{' '}
                        {formatDate(ticket.technicianSignedAt)}
                      </Typography>
                    )}
                    {ticket.customerSignedAt && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                      >
                        Firma cliente:{' '}
                        {formatDate(ticket.customerSignedAt)}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>

              {!hasCustomerSignature && (
                <Button
                  variant={signaturesMissing ? 'contained' : 'outlined'}
                  startIcon={<Draw />}
                  onClick={() => setSignaturesDialogOpen(true)}
                >
                  {signaturesMissing
                    ? 'Registrar firmas'
                    : 'Actualizar firmas'}
                </Button>
              )}
              {canManageTechnicians && hasCustomerSignature && (
                <Button
                  variant='text'
                  color='warning'
                  startIcon={<Lock />}
                  onClick={() =>
                    showConfirmDialog(
                      'Revocar firma del cliente',
                      'Esta acción quitará la firma del cliente y volverá a habilitar la edición del reporte técnico y del cierre del servicio. ¿Deseas continuar?',
                      handleRevokeCustomerSignature,
                      'warning'
                    )
                  }
                >
                  Revocar firma cliente
                </Button>
              )}
            </Box>
          </Paper>
        )}
    </>
  )
}

export default MaintenanceTicketSignaturesCard
