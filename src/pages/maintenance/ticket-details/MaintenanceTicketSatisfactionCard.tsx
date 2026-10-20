import {
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material'
import { Star } from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import { surfaceSx } from './maintenanceTicketDetailUtils'

interface MaintenanceTicketSatisfactionCardProps {
  ticket: MaintenanceTicket
}

/** Calificación de satisfacción del cliente. */
const MaintenanceTicketSatisfactionCard = ({ ticket }: MaintenanceTicketSatisfactionCardProps) => {
  return (
    <>
      {/* Customer Satisfaction */}
      {ticket.customerSatisfaction && (
        <Paper
          sx={{
            ...surfaceSx,
            p: 3,
            mb: 3,
            borderColor: '#fde68a'
          }}
        >
          <Box display='flex' alignItems='center' gap={1} mb={2}>
            <Box
              sx={{
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Star sx={{ color: '#b45309', fontSize: 20 }} />
            </Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Satisfacción del Cliente
            </Typography>
          </Box>

          <Box textAlign='center' py={2}>
            <Typography
              variant='h4'
              color='warning.main'
              fontWeight='bold'
            >
              {ticket.customerSatisfaction?.toFixed(1) || '0.0'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              de 5 estrellas
            </Typography>

            <Box display='flex' justifyContent='center' mt={1}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  color={
                    star <= ticket.customerSatisfaction!
                      ? 'warning'
                      : 'disabled'
                  }
                  fontSize='small'
                />
              ))}
            </Box>

            <Box mt={2}>
              <Chip
                label={
                  ticket.customerSatisfaction >= 4.5
                    ? 'Excelente'
                    : ticket.customerSatisfaction >= 3.5
                      ? 'Bueno'
                      : ticket.customerSatisfaction >= 2.5
                        ? 'Regular'
                        : 'Necesita mejorar'
                }
                color={
                  ticket.customerSatisfaction >= 4.5
                    ? 'success'
                    : ticket.customerSatisfaction >= 3.5
                      ? 'primary'
                      : ticket.customerSatisfaction >= 2.5
                        ? 'warning'
                        : 'error'
                }
                variant='filled'
              />
            </Box>
          </Box>
        </Paper>
      )}
    </>
  )
}

export default MaintenanceTicketSatisfactionCard
