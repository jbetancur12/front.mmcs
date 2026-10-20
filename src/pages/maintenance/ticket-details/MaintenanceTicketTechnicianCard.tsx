import {
  Grid,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  Divider,
  AlertTitle,
  LinearProgress
} from '@mui/material'
import {
  Assignment,
  Person,
  Star
} from '@mui/icons-material'
import {
  MaintenanceTicket,
  MaintenanceStatus
} from '../../../types/maintenance'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketTechnicianCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Técnico asignado y su asignación en modo edición. */
const MaintenanceTicketTechnicianCard = ({ ticket, details }: MaintenanceTicketTechnicianCardProps) => {
  const {
    isTechnician,
    technicians,
    editMode,
    editData,
    setEditData
  } = details

  return (
    <>
      {/* Assigned Technician */}
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
            <Assignment sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#00bf75'
            }}
          >
            Técnico Asignado
          </Typography>
        </Box>

        {editMode ? (
          <>
            {isTechnician ? (
              <Box
                sx={{
                  border: '1px solid #dbe3ef',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  backgroundColor: '#f8fafc'
                }}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Técnico
                </Typography>
                <Typography variant='body1' fontWeight={600}>
                  {ticket.assignedTechnician?.name || 'No asignado'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  La asignación solo puede cambiarla coordinación o
                  administración.
                </Typography>
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Técnico</InputLabel>
                <Select
                  value={editData.assignedTechnician || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      assignedTechnician: e.target.value,
                      status:
                        prev.status === MaintenanceStatus.PENDING &&
                        Boolean(e.target.value)
                          ? MaintenanceStatus.ASSIGNED
                          : prev.status
                    }))
                  }
                  label='Técnico'
                  disabled={ticket.status === MaintenanceStatus.COMPLETED}
                >
                  <MenuItem value=''>Sin asignar</MenuItem>
                  {technicians
                    ?.filter((t) => t.status === 'active')
                    .sort((a, b) => {
                      const aCapacity = a.maxWorkload - a.workload
                      const bCapacity = b.maxWorkload - b.workload
                      return bCapacity - aCapacity
                    })
                    .map((technician) => {
                      const utilizationPct =
                        (technician.workload / technician.maxWorkload) *
                        100
                      const isFull =
                        technician.workload >= technician.maxWorkload
                      const isNearFull = utilizationPct >= 80

                      return (
                        <MenuItem
                          key={technician.id}
                          value={technician.id}
                          disabled={isFull}
                        >
                          <Box
                            display='flex'
                            flexDirection='column'
                            width='100%'
                          >
                            <Box
                              display='flex'
                              alignItems='center'
                              gap={1}
                              width='100%'
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.875rem',
                                  bgcolor: isFull
                                    ? 'error.main'
                                    : isNearFull
                                      ? 'warning.main'
                                      : 'success.main'
                                }}
                              >
                                {technician.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </Avatar>

                              <Box flex={1}>
                                <Typography
                                  variant='body2'
                                  fontWeight='medium'
                                >
                                  {technician.name}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {technician.specialization || 'General'}
                                </Typography>
                              </Box>

                              <Box
                                display='flex'
                                gap={0.5}
                                alignItems='center'
                              >
                                <Chip
                                  size='small'
                                  label={`${technician.workload}/${technician.maxWorkload}`}
                                  color={
                                    isFull
                                      ? 'error'
                                      : isNearFull
                                        ? 'warning'
                                        : 'success'
                                  }
                                  variant='outlined'
                                />
                                {isFull && (
                                  <Chip
                                    size='small'
                                    label='Completo'
                                    color='error'
                                  />
                                )}
                              </Box>
                            </Box>

                            <Box width='100%' mt={1}>
                              <LinearProgress
                                variant='determinate'
                                value={utilizationPct}
                                color={
                                  isFull
                                    ? 'error'
                                    : isNearFull
                                      ? 'warning'
                                      : 'success'
                                }
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          </Box>
                        </MenuItem>
                      )
                    })}
                </Select>
              </FormControl>
            )}

            {/* Capacity Warning Alert */}
            {editData.assignedTechnician &&
              (() => {
                const selectedTech = technicians?.find(
                  (t) => t.id === editData.assignedTechnician
                )
                if (!selectedTech) return null

                const utilizationPct =
                  (selectedTech.workload / selectedTech.maxWorkload) * 100

                if (utilizationPct >= 80 && utilizationPct < 100) {
                  return (
                    <Alert severity='warning' sx={{ mt: 2 }}>
                      <AlertTitle>
                        Técnico casi en capacidad máxima
                      </AlertTitle>
                      <Typography variant='body2'>
                        <strong>{selectedTech.name}</strong> tiene{' '}
                        <strong>{selectedTech.workload}</strong> de{' '}
                        <strong>{selectedTech.maxWorkload}</strong>{' '}
                        tickets asignados ({utilizationPct.toFixed(0)}%
                        utilización). Considere asignar a un técnico con
                        menos carga de trabajo.
                      </Typography>
                    </Alert>
                  )
                }

                if (utilizationPct >= 100) {
                  return (
                    <Alert severity='error' sx={{ mt: 2 }}>
                      <AlertTitle>Técnico en capacidad máxima</AlertTitle>
                      <Typography variant='body2'>
                        <strong>{selectedTech.name}</strong> ha alcanzado
                        su capacidad máxima ({selectedTech.workload}/
                        {selectedTech.maxWorkload} tickets). Por favor
                        seleccione otro técnico disponible.
                      </Typography>
                    </Alert>
                  )
                }

                return null
              })()}
          </>
        ) : ticket.assignedTechnician ? (
          <Box>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main'
                }}
              >
                {ticket.assignedTechnician.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </Avatar>
              <Box flex={1}>
                <Typography variant='body1' fontWeight='bold'>
                  {ticket.assignedTechnician.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {ticket.assignedTechnician.email}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {ticket.assignedTechnician.phone}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant='body2' color='text.secondary'>
                  Rating
                </Typography>
                <Box display='flex' alignItems='center' gap={0.5}>
                  <Star color='warning' fontSize='small' />
                  <Typography variant='body2' fontWeight='medium'>
                    {ticket.assignedTechnician.rating?.toFixed(1) ||
                      '0.0'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='text.secondary'>
                  Carga Actual
                </Typography>
                <Typography variant='body2' fontWeight='medium'>
                  {ticket.assignedTechnician.workload || 0}/
                  {ticket.assignedTechnician.maxWorkload || 0}
                </Typography>
              </Grid>
            </Grid>

            {ticket.assignedTechnician.specialization && (
              <Box mt={2}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  gutterBottom
                >
                  Especialidad
                </Typography>
                <Box display='flex' flexWrap='wrap' gap={0.5}>
                  <Chip
                    key={ticket.assignedTechnician.specialization}
                    label={ticket.assignedTechnician.specialization}
                    size='small'
                    variant='outlined'
                    color='primary'
                  />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity='info' icon={<Person />}>
            <AlertTitle>Sin asignar</AlertTitle>
            No hay técnico asignado a este ticket
          </Alert>
        )}
      </Paper>
    </>
  )
}

export default MaintenanceTicketTechnicianCard
