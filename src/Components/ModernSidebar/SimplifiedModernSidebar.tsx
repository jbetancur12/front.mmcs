import React from 'react'
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Avatar,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  RequestQuote as QuoteIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  DirectionsCar as FleetIcon,
  Sensors as IoTIcon,
  ShoppingCart as PurchasesIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import { useSidebarState } from './hooks/useSidebarState'
import { useNavigate, useLocation } from 'react-router-dom'

interface ModernSidebarProps {
  onItemClick?: (item: any) => void
}

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_MINIMIZED = 64

const SimplifiedModernSidebar: React.FC<ModernSidebarProps> = ({ onItemClick }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const $userStore = useStore(userStore)
  const { state, actions } = useSidebarState()

  // Elementos del menú simplificados
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      to: '/',
      roles: ['admin', 'user', 'metrologist']
    },
    {
      id: 'customers',
      label: 'Empresas',
      icon: <BusinessIcon />,
      to: '/customers',
      roles: ['admin', 'metrologist']
    },
    {
      id: 'quotes',
      label: 'Cotizaciones',
      icon: <QuoteIcon />,
      to: '/cotizaciones',
      roles: ['admin']
    },
    {
      id: 'traceability',
      label: 'Trazabilidades',
      icon: <TimelineIcon />,
      to: '/traceability',
      roles: ['admin', 'user', 'metrologist']
    },
    {
      id: 'certificates',
      label: 'Certificados',
      icon: <AssignmentIcon />,
      to: '/certificates',
      roles: ['admin', 'user', 'metrologist']
    },
    {
      id: 'datasheets',
      label: 'Hojas de Vida',
      icon: <BuildIcon />,
      to: '/datasheets',
      roles: ['admin', 'metrologist']
    },
    {
      id: 'maintenance',
      label: 'Mantenimientos',
      icon: <BuildIcon />,
      to: '/maintenance',
      roles: ['admin', 'metrologist']
    },
    {
      id: 'fleet',
      label: 'Flota',
      icon: <FleetIcon />,
      to: '/fleet',
      roles: ['admin', 'metrologist']
    },
    {
      id: 'iot',
      label: 'IoT',
      icon: <IoTIcon />,
      to: '/iot',
      roles: ['admin', 'metrologist']
    },
    {
      id: 'purchases',
      label: 'Compras',
      icon: <PurchasesIcon />,
      to: '/purchases',
      roles: ['admin']
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: <UsersIcon />,
      to: '/users',
      roles: ['admin']
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <SettingsIcon />,
      to: '/settings',
      roles: ['admin', 'user', 'metrologist']
    }
  ]

  // Filtrar elementos según roles del usuario
  const filteredItems = menuItems.filter(item => {
    if (!$userStore.rol || $userStore.rol.length === 0) return false
    return item.roles.some(role => $userStore.rol.includes(role))
  })

  const handleItemClick = (item: any) => {
    if (item.to) {
      navigate(item.to)
    }
    
    // Agregar a recientes
    actions.addToRecent(item.id)
    
    // Cerrar móvil si está abierto
    if (isMobile) {
      actions.closeMobile()
    }
    
    // Callback externo
    if (onItemClick) {
      onItemClick(item)
    }
  }

  const drawerWidth = state.isMinimized ? DRAWER_WIDTH_MINIMIZED : DRAWER_WIDTH

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: state.isMinimized ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: state.isMinimized ? 'center' : 'space-between',
          minHeight: 64
        }}
      >
        {!state.isMinimized && (
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
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                MetroMedics
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Sistema de Gestión
              </Typography>
            </Box>
          </Box>
        )}
        
        {state.isMinimized && (
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
        )}

        {/* Controles */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <Tooltip title="Cerrar menú">
              <IconButton size="small" onClick={actions.closeMobile}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={state.isMinimized ? "Expandir sidebar" : "Minimizar sidebar"}>
              <IconButton size="small" onClick={actions.toggleMinimized}>
                {state.isMinimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 1, py: 2 }}>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.to
            
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip
                  title={state.isMinimized ? item.label : ''}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      justifyContent: state.isMinimized ? 'center' : 'flex-start',
                      px: state.isMinimized ? 1 : 2,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: state.isMinimized ? 0 : 40,
                        justifyContent: 'center',
                        color: 'inherit'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    
                    {!state.isMinimized && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 600 : 400
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )
          })}
        </List>
      </Box>

      <Divider />

      {/* Footer - User Info */}
      <Box
        sx={{
          p: state.isMinimized ? 1 : 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        {state.isMinimized ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title={$userStore.nombre || 'Usuario'} placement="right">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {($userStore.nombre || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'primary.main',
                  fontSize: '1rem'
                }}
              >
                {($userStore.nombre || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {$userStore.nombre || 'Usuario'}
                </Typography>
                {$userStore.email && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}
                  >
                    {$userStore.email}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* Rol del usuario */}
            {$userStore.rol && $userStore.rol.length > 0 && (
              <Chip
                label={$userStore.rol[0]}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={state.isMobileOpen}
        onClose={actions.closeMobile}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          }),
          overflowX: 'hidden'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default SimplifiedModernSidebar