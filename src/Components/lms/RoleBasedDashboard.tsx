import React from 'react'
import { Box, Alert, CircularProgress, Typography } from '@mui/material'
import { useUserLMSRole, getRoleDisplayInfo } from '../../utils/roleUtils'
import TrainingManagerDashboard from './TrainingManagerDashboard'
import LmsAdmin from '../../pages/lms/admin/LmsAdmin'

/**
 * Role-based dashboard wrapper that renders the appropriate dashboard
 * based on the user's LMS role
 */
const RoleBasedDashboard: React.FC = () => {
  const userRole = useUserLMSRole()
  const roleInfo = getRoleDisplayInfo(userRole)

  // Show loading state while determining role
  if (!userRole) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Cargando panel de administración...
        </Typography>
      </Box>
    )
  }

  // Render appropriate dashboard based on role
  switch (userRole) {
    case 'admin':
      return <LmsAdmin />
    
    case 'training_manager':
      return <TrainingManagerDashboard />
    
    case 'department_manager':
      // For now, show training manager dashboard with limited scope
      // In the future, this could be a separate DepartmentManagerDashboard
      return <TrainingManagerDashboard />
    
    case 'user':
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Acceso Limitado
            </Typography>
            <Typography variant="body2">
              Su rol actual ({roleInfo.label}) no tiene acceso al panel de administración del LMS.
              Para acceder a sus cursos asignados, visite la sección de estudiantes.
            </Typography>
          </Alert>
        </Box>
      )
    
    default:
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Rol No Reconocido
            </Typography>
            <Typography variant="body2">
              Su rol actual no está configurado para acceder al sistema LMS.
              Contacte al administrador del sistema para obtener los permisos necesarios.
            </Typography>
          </Alert>
        </Box>
      )
  }
}

export default RoleBasedDashboard