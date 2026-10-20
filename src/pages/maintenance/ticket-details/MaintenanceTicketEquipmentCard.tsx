import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Chip
} from '@mui/material'
import { Build } from '@mui/icons-material'
import { MaintenanceTicket } from '../../../types/maintenance'
import { surfaceSx } from './maintenanceTicketDetailUtils'
import { MaintenanceTicketDetailsState } from './useMaintenanceTicketDetails'

interface MaintenanceTicketEquipmentCardProps {
  ticket: MaintenanceTicket
  details: MaintenanceTicketDetailsState
}

/** Datos del equipo y condiciones de recepción. */
const MaintenanceTicketEquipmentCard = ({ ticket, details }: MaintenanceTicketEquipmentCardProps) => {
  const {
    isTechnician,
    editMode,
    editData,
    setEditData
  } = details

  return (
    <>
      {/* Equipment Information */}
      <Paper
        sx={{
          ...surfaceSx,
          p: 3,
          mb: 3
        }}
        role='region'
        aria-label='Información del equipo'
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
            <Build
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
            Información del Equipo
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Tipo de Equipo
              </Typography>
              {editMode && !isTechnician ? (
                <TextField
                  fullWidth
                  size='small'
                  label='Tipo de equipo'
                  value={editData.equipmentType || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentType: e.target.value
                    }))
                  }
                />
              ) : (
                <Chip
                  label={ticket.equipmentType}
                  sx={{
                    fontWeight: 'medium',
                    backgroundColor: '#e8f7ef',
                    color: '#00A651',
                    borderRadius: '8px',
                    border: '1px solid #dbeedb'
                  }}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Marca
              </Typography>
              {editMode && !isTechnician ? (
                <TextField
                  fullWidth
                  size='small'
                  label='Marca'
                  value={editData.equipmentBrand || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentBrand: e.target.value
                    }))
                  }
                />
              ) : (
                <Typography variant='body1' fontWeight='medium'>
                  {ticket.equipmentBrand}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Modelo
              </Typography>
              {editMode && !isTechnician ? (
                <TextField
                  fullWidth
                  size='small'
                  label='Modelo'
                  value={editData.equipmentModel || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentModel: e.target.value
                    }))
                  }
                />
              ) : (
                <Typography variant='body1'>
                  {ticket.equipmentModel}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Número de Serie
              </Typography>
              {editMode && !isTechnician ? (
                <TextField
                  fullWidth
                  size='small'
                  label='Número de serie'
                  value={editData.equipmentSerial || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      equipmentSerial: e.target.value
                    }))
                  }
                />
              ) : (
                <Typography variant='body1' fontWeight='medium'>
                  {ticket.equipmentSerial}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default MaintenanceTicketEquipmentCard
