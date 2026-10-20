import {
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import {
  Assignment,
  Person,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import { surfaceSx } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketCustomerCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Datos del cliente y del contacto. */
const MaintenanceTicketCustomerCard = ({ ticket, details }: MaintenanceTicketCustomerCardProps) => {
  const {
    editMode,
    editData,
    setEditData,
    editErrors
  } = details

  return (
    <>
      {/* Customer Information */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
      >
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#0f172a'
            }}
          >
            Información del Cliente
          </Typography>
          <Box display='flex' gap={1}>
            <Tooltip title='Enviar email al cliente'>
              <IconButton
                size='small'
                onClick={() =>
                  window.open(`mailto:${ticket.customerEmail}`, '_blank')
                }
                aria-label={`Enviar email a ${ticket.customerEmail}`}
                sx={{
                  backgroundColor: '#e8f7ef',
                  color: '#00A651',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#dbeedb'
                  }
                }}
              >
                <Email />
              </IconButton>
            </Tooltip>
            <Tooltip title='Llamar al cliente'>
              <IconButton
                size='small'
                onClick={() =>
                  window.open(`tel:${ticket.customerPhone}`, '_blank')
                }
                aria-label={`Llamar al cliente ${ticket.customerPhone}`}
                sx={{
                  backgroundColor: '#e8f7ef',
                  color: '#00A651',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#dbeedb'
                  }
                }}
              >
                <Phone />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <Person color='action' aria-hidden='true' />
              <Typography variant='body2' color='text.secondary'>
                Nombre
              </Typography>
            </Box>
            <Typography variant='body1' fontWeight='medium'>
              {ticket.customerName}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <Email color='action' aria-hidden='true' />
              <Typography variant='body2' color='text.secondary'>
                Email
              </Typography>
            </Box>
            <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
              {ticket.customerEmail}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <Phone color='action' aria-hidden='true' />
              <Typography variant='body2' color='text.secondary'>
                Teléfono
              </Typography>
            </Box>
            <Typography variant='body1'>
              {ticket.customerPhone}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <LocationOn color='action' aria-hidden='true' />
              <Typography variant='body2' color='text.secondary'>
                Ubicación
              </Typography>
            </Box>
            {editMode ? (
              <TextField
                fullWidth
                id='edit-location-field'
                label='Ubicación del servicio'
                value={editData.location || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    location: e.target.value
                  }))
                }
                size='small'
                multiline
                rows={2}
                placeholder='Ingrese la ubicación del servicio'
                error={!!editErrors.location}
                helperText={editErrors.location}
                aria-label='Editar ubicación del servicio'
                aria-invalid={!!editErrors.location}
                aria-describedby={
                  editErrors.location ? 'location-error' : undefined
                }
              />
            ) : (
              <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                {ticket.location}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Condición inicial del equipo'
      >
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <Box
            sx={{
              backgroundColor: '#fff7ed',
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Assignment
              sx={{ color: '#c2410c', fontSize: 20 }}
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
            Condición Inicial del Equipo
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography
              variant='body2'
              color='text.secondary'
              gutterBottom
            >
              Condición inicial del equipo
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                label='Condición inicial del equipo'
                value={editData.intakePhysicalCondition || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    intakePhysicalCondition: e.target.value
                  }))
                }
                size='small'
                multiline
                minRows={4}
                placeholder='Rayones, golpes, faltantes o condición general al iniciar la intervención'
                error={!!editErrors.intakePhysicalCondition}
                helperText={
                  editErrors.intakePhysicalCondition ||
                  'Opcional, pero muy útil para la orden de servicio'
                }
              />
            ) : (
              <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                {ticket.intakePhysicalCondition ||
                  'Pendiente de registrar al inicio del servicio'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography
              variant='body2'
              color='text.secondary'
              gutterBottom
            >
              Accesorios disponibles
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                label='Accesorios disponibles'
                value={editData.receivedAccessories || ''}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    receivedAccessories: e.target.value
                  }))
                }
                size='small'
                multiline
                minRows={4}
                placeholder='Cables, sensores, adaptadores, batería, mangueras u otros accesorios disponibles durante el servicio'
                error={!!editErrors.receivedAccessories}
                helperText={
                  editErrors.receivedAccessories ||
                  'Opcional, pero recomendado para trazabilidad'
                }
              />
            ) : (
              <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
                {ticket.receivedAccessories ||
                  'Pendiente de registrar al inicio del servicio'}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default MaintenanceTicketCustomerCard
