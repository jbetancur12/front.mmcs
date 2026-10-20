import {
  Paper,
  Typography,
  Box,
  TextField,
  Chip
} from '@mui/material'
import {
  Schedule,
  CalendarToday
} from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { formatDate } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketScheduleCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Programación del servicio. */
const MaintenanceTicketScheduleCard = ({ ticket, details }: MaintenanceTicketScheduleCardProps) => {
  const {
    editMode,
    editData,
    setEditData,
    editErrors
  } = details

  return (
    <>
      {/* Schedule */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(109, 198, 98, 0.12)'
          }
        }}
      >
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <Box
            sx={{
              background:
                'linear-gradient(135deg, #00bf75 0%, #008f4f 100%)',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Schedule sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#00bf75'
            }}
          >
            Programación
          </Typography>
        </Box>

        {editMode ? (
          <TextField
            fullWidth
            id='detail-scheduled-date'
            label='Fecha Programada'
            type='datetime-local'
            value={
              editData.scheduledDate
                ? new Date(editData.scheduledDate)
                    .toISOString()
                    .slice(0, 16)
                : ''
            }
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                scheduledDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined
              }))
            }
            InputLabelProps={{ shrink: true }}
            helperText={
              editErrors.scheduledDate ||
              'Seleccione fecha y hora del servicio'
            }
            error={!!editErrors.scheduledDate}
            aria-label='Seleccionar fecha y hora programada del servicio'
            aria-invalid={!!editErrors.scheduledDate}
            aria-describedby={
              editErrors.scheduledDate
                ? 'scheduled-date-error'
                : 'scheduled-date-helper'
            }
          />
        ) : (
          <Box>
            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <CalendarToday color='action' fontSize='small' />
              <Typography variant='body2' color='text.secondary'>
                Fecha Programada
              </Typography>
            </Box>
            <Typography variant='body1' fontWeight='medium'>
              {formatDate(ticket.scheduledDate)}
            </Typography>

            {ticket.scheduledDate && (
              <Box mt={2}>
                <Typography variant='body2' color='text.secondary'>
                  Estado del Cronograma
                </Typography>
                <Chip
                  size='small'
                  label={
                    new Date(ticket.scheduledDate) < new Date()
                      ? ticket.status === MaintenanceStatus.COMPLETED
                        ? 'Completado a tiempo'
                        : 'Retrasado'
                      : 'En cronograma'
                  }
                  color={
                    new Date(ticket.scheduledDate) < new Date()
                      ? ticket.status === MaintenanceStatus.COMPLETED
                        ? 'success'
                        : 'error'
                      : 'primary'
                  }
                  variant='outlined'
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </>
  )
}

export default MaintenanceTicketScheduleCard
