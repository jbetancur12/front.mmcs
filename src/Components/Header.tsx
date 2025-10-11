import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { useNavigate } from 'react-router-dom'
import { userStore } from '../store/userStore'
import LogoutButton from './Authentication/Logout'
import useAxiosPrivate from '@utils/use-axios-private'
import { EquipmentData } from './DataSheet/EquipmentAlertPage'

interface HeaderProps {
  toggleMobileMenu: () => void
}

function Header({ toggleMobileMenu }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [hasAlert, setHasAlert] = useState<EquipmentData[]>([])
  
  const isMenuOpen = Boolean(anchorEl)

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    // Only fetch alerts for admin users to avoid authentication issues
    if ($userStore.rol.some((role) => ['admin'].includes(role)) && $userStore.email) {
      const fetchAlerts = async () => {
        try {
          const response = await axiosPrivate('/dataSheet')
          setHasAlert(response.data || [])
        } catch (error) {
          console.error('Error fetching alerts:', error)
        }
      }
      
      fetchAlerts()
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
      return () => clearInterval(interval)
    } else {
      setHasAlert([])
    }
  }, [axiosPrivate, $userStore.rol, $userStore.email])

  const calibrationDueSoon = hasAlert?.filter((equipment) => equipment.isCalibrationDueSoon) || []
  const inspectionDueSoon = hasAlert?.filter((equipment) => equipment.isInspectionDueSoon) || []
  const totalAlerts = calibrationDueSoon.length + inspectionDueSoon.length
  const hasAlerts = totalAlerts > 0

  const handleAlertsClick = () => {
    navigate('/datasheets/alerts')
  }

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        {/* Botón de menú móvil */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileMenu}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            component="a"
            href="https://metromedics.co"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <Box
              component="img"
              src="/images/logo2.png"
              alt="MetroMedics Logo"
              sx={{ height: 32, mr: 2 }}
            />
          </Box>
        </Box>

        {/* Controles del header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Botón de alertas - Solo para admins */}
          {$userStore.rol.some((role) => ['admin'].includes(role)) && (
            <Tooltip 
              title={hasAlerts ? `${totalAlerts} alertas pendientes` : 'No hay alertas'}
            >
              <IconButton
                color="inherit"
                onClick={handleAlertsClick}
                sx={{
                  color: hasAlerts ? 'error.main' : 'text.secondary',
                  animation: hasAlerts ? 'alertBounce 1.5s ease-in-out infinite' : 'none',
                  '&:hover': {
                    backgroundColor: hasAlerts ? 'error.light' : 'action.hover',
                    color: hasAlerts ? 'error.contrastText' : 'text.primary'
                  },
                  '@keyframes alertBounce': {
                    '0%, 20%, 50%, 80%, 100%': {
                      transform: 'translateY(0)'
                    },
                    '40%': {
                      transform: 'translateY(-8px)'
                    },
                    '60%': {
                      transform: 'translateY(-4px)'
                    }
                  }
                }}
              >
                <Badge 
                  badgeContent={totalAlerts} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: hasAlerts ? 'badgePulse 2s ease-in-out infinite' : 'none',
                      '@keyframes badgePulse': {
                        '0%': {
                          transform: 'scale(1)',
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)'
                        },
                        '70%': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 0 8px rgba(244, 67, 54, 0)'
                        },
                        '100%': {
                          transform: 'scale(1)',
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)'
                        }
                      }
                    }
                  }}
                >
                  <NotificationsIcon 
                    sx={{
                      animation: hasAlerts ? 'iconShake 0.8s ease-in-out infinite' : 'none',
                      '@keyframes iconShake': {
                        '0%, 100%': { transform: 'rotate(0deg)' },
                        '10%, 30%, 50%, 70%, 90%': { transform: 'rotate(-10deg)' },
                        '20%, 40%, 60%, 80%': { transform: 'rotate(10deg)' }
                      }
                    }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {/* Botón de perfil */}
          <Tooltip title="Perfil de usuario">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {$userStore.nombre ? $userStore.nombre.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menú de perfil */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {$userStore.nombre || 'Usuario'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {$userStore.email}
              </Typography>
            </Box>
          </MenuItem>          
          <MenuItem>
            <LogoutButton />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header