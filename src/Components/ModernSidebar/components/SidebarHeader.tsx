import React from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon
} from '@mui/icons-material'

interface SidebarHeaderProps {
  isMinimized: boolean
  theme: 'light' | 'dark'
  onToggleMinimized: () => void
  onToggleTheme: () => void
  isMobile: boolean
  onCloseMobile: () => void
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isMinimized,
  theme,
  onToggleMinimized,
  onToggleTheme,
  isMobile,
  onCloseMobile
}) => {
  
  if (isMinimized && !isMobile) {
    return (
      <Box
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}
      >
        {/* Logo minimizado */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'primary.main',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          MM
        </Avatar>
        
        {/* Botones de control */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Tooltip title="Expandir sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleMinimized}
              sx={{ color: 'text.secondary' }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`} placement="right">
            <IconButton
              size="small"
              onClick={onToggleTheme}
              sx={{ color: 'text.secondary' }}
            >
              {theme === 'light' ? (
                <DarkModeIcon fontSize="small" />
              ) : (
                <LightModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    )
  }
  
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 64
      }}
    >
      {/* Logo y título */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'primary.main',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          MM
        </Avatar>
        
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2
            }}
          >
            MetroMedics
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            Sistema de Gestión
          </Typography>
        </Box>
      </Box>
      
      {/* Controles */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Botón de tema */}
        <Tooltip title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}>
          <IconButton
            size="small"
            onClick={onToggleTheme}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {theme === 'light' ? (
              <DarkModeIcon fontSize="small" />
            ) : (
              <LightModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        
        {/* Botón de minimizar/cerrar */}
        {isMobile ? (
          <Tooltip title="Cerrar menú">
            <IconButton
              size="small"
              onClick={onCloseMobile}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Minimizar sidebar">
            <IconButton
              size="small"
              onClick={onToggleMinimized}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default SidebarHeader