import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface SidebarFooterProps {
  isMinimized: boolean
  user: {
    name?: string
    email?: string
    rol?: string
    customer?: {
      name?: string
    }
  }
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isMinimized,
  user
}) => {
  const navigate = useNavigate()
  
  const handleSettingsClick = () => {
    navigate('/settings')
  }
  
  const handleLogout = () => {
    // Aquí iría la lógica de logout
    console.log('Logout clicked')
  }
  
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'biomedico':
        return 'primary'
      case 'customer':
        return 'success'
      default:
        return 'default'
    }
  }
  
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'biomedico':
        return 'Biomédico'
      case 'customer':
        return 'Cliente'
      default:
        return 'Usuario'
    }
  }
  
  if (isMinimized) {
    return (
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}
      >
        {/* Avatar del usuario */}
        <Tooltip title={user.name || 'Usuario'} placement="right">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'primary.main',
              fontSize: '0.875rem'
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
          </Avatar>
        </Tooltip>
        
        {/* Botones de acción */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Configuración" placement="right">
            <IconButton
              size="small"
              onClick={handleSettingsClick}
              sx={{ color: 'text.secondary' }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{ color: 'text.secondary' }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    )
  }
  
  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Información del usuario */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: 'primary.main',
              fontSize: '1rem'
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user.name || 'Usuario'}\n            </Typography>
            
            {user.email && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block'
                }}
              >
                {user.email}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Información adicional */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Rol del usuario */}
          <Chip
            label={getRoleLabel(user.rol)}
            size="small"
            color={getRoleColor(user.rol) as any}
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          />
          
          {/* Empresa del cliente */}
          {user.customer?.name && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user.customer.name}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Divider />
      
      {/* Botones de acción */}
      <Box
        sx={{
          p: 1,
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Tooltip title="Configuración">
          <IconButton
            size="small"
            onClick={handleSettingsClick}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'primary.main'
              }
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Cerrar sesión">
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'error.main'
              }
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default SidebarFooter