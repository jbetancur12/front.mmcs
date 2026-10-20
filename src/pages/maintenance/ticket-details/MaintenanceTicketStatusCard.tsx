import {
  Grid,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  InputAdornment,
  FormHelperText,
  Select,
  MenuItem
} from '@mui/material'
import { Lock } from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus,
  MaintenancePriority
} from '../../../types/maintenance'
import MaintenanceStatusBadge from '../../../Components/Maintenance/MaintenanceStatusBadge'
import MaintenancePriorityBadge from '../../../Components/Maintenance/MaintenancePriorityBadge'
import {
  formatDate,
  surfaceSx
} from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketStatusCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Estado, prioridad y facturación del ticket (editables en modo edición). */
const MaintenanceTicketStatusCard = ({ ticket, details }: MaintenanceTicketStatusCardProps) => {
  const {
    isMobile,
    isTechnician,
    editMode,
    editData,
    setEditData
  } = details

  return (
    <Paper
      sx={{
        ...surfaceSx,
        p: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 }
      }}
    >
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={2}
        gap={{ xs: 1, sm: 0 }}
      >
        <Typography
          variant='h6'
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 600,
            color: '#0f172a'
          }}
        >
          Estado del Ticket
        </Typography>
        <Box display='flex' gap={1} flexWrap='wrap'>
          <MaintenanceStatusBadge status={ticket.status} />
          <MaintenancePriorityBadge priority={ticket.priority} />
        </Box>
      </Box>

      {editMode ? (
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              disabled={ticket.status === MaintenanceStatus.COMPLETED}
            >
              <InputLabel id='detail-status-label'>
                Estado{' '}
                {ticket.status === MaintenanceStatus.COMPLETED &&
                  '(Bloqueado)'}
              </InputLabel>
              <Select
                labelId='detail-status-label'
                id='detail-status-select'
                value={editData.status || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    status: e.target.value as MaintenanceStatus
                  }))
                }
                label={`Estado${ticket.status === MaintenanceStatus.COMPLETED ? ' (Bloqueado)' : ''}`}
                startAdornment={
                  ticket.status === MaintenanceStatus.COMPLETED ? (
                    <InputAdornment position='start'>
                      <Lock sx={{ color: '#10b981' }} />
                    </InputAdornment>
                  ) : undefined
                }
                aria-label='Seleccionar estado del ticket'
                sx={
                  ticket.status === MaintenanceStatus.COMPLETED
                    ? {
                        background: 'rgba(16, 185, 129, 0.05)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981'
                        }
                      }
                    : {}
                }
              >
                {Object.values(MaintenanceStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    <MaintenanceStatusBadge
                      status={status}
                      size='small'
                    />
                  </MenuItem>
                ))}
              </Select>
              {ticket.status === MaintenanceStatus.COMPLETED && (
                <FormHelperText>
                  <Box display='flex' alignItems='center' gap={0.5}>
                    <Lock fontSize='small' />
                    Este ticket está completado y no puede cambiar de
                    estado
                  </Box>
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={isTechnician}>
              <InputLabel id='detail-priority-label'>
                Prioridad{isTechnician ? ' (Solo coordinador)' : ''}
              </InputLabel>
              <Select
                labelId='detail-priority-label'
                id='detail-priority-select'
                value={editData.priority || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    priority: e.target.value as MaintenancePriority
                  }))
                }
                label={`Prioridad${isTechnician ? ' (Solo coordinador)' : ''}`}
                aria-label='Seleccionar prioridad del ticket'
                startAdornment={
                  isTechnician ? (
                    <InputAdornment position='start'>
                      <Lock sx={{ color: '#10b981' }} />
                    </InputAdornment>
                  ) : undefined
                }
                sx={
                  isTechnician
                    ? {
                        background: 'rgba(16, 185, 129, 0.05)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981'
                        }
                      }
                    : {}
                }
              >
                {Object.values(MaintenancePriority).map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    <MaintenancePriorityBadge
                      priority={priority}
                      size='small'
                    />
                  </MenuItem>
                ))}
              </Select>
              {isTechnician && (
                <FormHelperText>
                  <Box display='flex' alignItems='center' gap={0.5}>
                    <Lock fontSize='small' />
                    La prioridad solo puede cambiarla un coordinador o
                    administrador
                  </Box>
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Creado
            </Typography>
            <Typography variant='body1'>
              {formatDate(ticket.createdAt)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant='body2' color='text.secondary'>
              Última actualización
            </Typography>
            <Typography variant='body1'>
              {formatDate(ticket.updatedAt)}
            </Typography>
          </Grid>

          {ticket.completedDate && (
            <Grid item xs={12} sm={6}>
              <Typography variant='body2' color='text.secondary'>
                Completado
              </Typography>
              <Typography variant='body1'>
                {formatDate(ticket.completedDate)}
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Paper>
  )
}

export default MaintenanceTicketStatusCard
