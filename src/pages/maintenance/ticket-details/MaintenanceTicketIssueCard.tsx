import {
  Paper,
  Typography,
  Box
} from '@mui/material'
import { Description } from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import { surfaceSx } from './maintenanceTicketDetailUtils'

interface MaintenanceTicketIssueCardProps {
  ticket: MaintenanceTicket
}

/** Descripción de la falla reportada. */
const MaintenanceTicketIssueCard = ({ ticket }: MaintenanceTicketIssueCardProps) => {
  return (
    <>
      {/* Issue Description */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Descripción del problema'
      >
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <Box
            sx={{
              backgroundColor: '#e8f7ef',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Description
              sx={{ color: '#00A651', fontSize: 20 }}
              aria-hidden='true'
            />
          </Box>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#0f172a'
            }}
          >
            Descripción del Problema
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography
            variant='body1'
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
          >
            {ticket.issueDescription}
          </Typography>
        </Box>
      </Paper>
    </>
  )
}

export default MaintenanceTicketIssueCard
