import React, { useState } from 'react'
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
  Badge,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { ModernSidebarItem } from '../types/sidebar.types'

interface SidebarMenuItemProps {
  item: ModernSidebarItem
  isMinimized: boolean
  isFavorite: boolean
  notificationCount?: number
  onItemClick: (item: ModernSidebarItem) => void
  // onToggleFavorite: (itemId: string) => void
  level?: number

}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isMinimized,
  isFavorite,
  notificationCount,
  onItemClick,
  // onToggleFavorite,
  level = 0,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const IconComponent = item.icon as React.ComponentType<{ sx?: any }> | undefined
  const isActive = item.to ? location.pathname === item.to : false
  const hasChildren = item.children && item.children.length > 0
  const hasNotifications = notificationCount && notificationCount > 0
  
  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    } else {
      if (item.to) {
        navigate(item.to)
      }
      onItemClick(item)
    }
  }
  
  
  // Estilo para elementos minimizados
  if (isMinimized) {
    return (
      <Tooltip
        title={item.label}
        placement="right"
        arrow
      >
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleClick}
            sx={{
              minHeight: 48,
              justifyContent: 'center',
              px: 2.5,
              borderRadius: 2,
              mx: 1,
              backgroundColor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive ? 'primary.dark' : 'action.hover'
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'inherit'
              }}
            >
              <Badge
                badgeContent={notificationCount}
                color="error"
                variant="dot"
                invisible={!hasNotifications}
              >
                {IconComponent && <IconComponent sx={{ fontSize: 24 }} />}
              </Badge>
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </Tooltip>
    )
  }
  
  return (
    <>
      <ListItem
        disablePadding
        sx={{
          mb: 0.5,
          pl: level * 2
        }}
      >
        <ListItemButton
          onClick={handleClick}
          sx={{
            minHeight: 48,
            borderRadius: 2,
            mx: 1,
            backgroundColor: isActive ? 'primary.main' : 'transparent',
            color: isActive ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              backgroundColor: isActive ? 'primary.dark' : 'action.hover'
            },
            '&:hover .favorite-button': {
              opacity: 1
            }
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: 'inherit'
            }}
          >
            <Badge
              badgeContent={notificationCount}
              color="error"
              max={99}
              invisible={!hasNotifications}
            >
              {IconComponent && <IconComponent sx={{ fontSize: 22 }} />}
            </Badge>
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: level > 0 ? '0.875rem' : '0.9rem'
                  }}
                >
                  {item.label}
                </Typography>
                
                {/* Badges */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {item.isNew && (
                    <Chip
                      label="Nuevo"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                  
                  {/* {isRecent && (
                    <Tooltip title="Visitado recientemente">
                      <RecentIcon
                        sx={{
                          fontSize: 14,
                          color: 'text.secondary',
                          opacity: 0.7
                        }}
                      />
                    </Tooltip>
                  )} */}
                </Box>
              </Box>
            }
            sx={{ my: 0 }}
          />
          
          {/* Controles del lado derecho */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Botón de favorito */}
            {/* {!hasChildren && (
              <IconButton
                size="small"
                onClick={handleFavoriteClick}
                className="favorite-button"
                sx={{
                  opacity: isFavorite ? 1 : 0,
                  transition: 'opacity 0.2s',
                  color: isFavorite ? 'warning.main' : 'text.secondary',
                  '&:hover': {
                    color: 'warning.main'
                  }
                }}
              >
                {isFavorite ? (
                  <StarIcon sx={{ fontSize: 16 }} />
                ) : (
                  <StarBorderIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            )} */}
            
            {/* Indicador de expansión */}
            {hasChildren && (
              <IconButton
                size="small"
                sx={{ color: 'inherit' }}
              >
                {isExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
      
      {/* Elementos hijos */}
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children!.map((child) => (
              <SidebarMenuItem
                key={child.id}
                item={child}
                isMinimized={isMinimized}
                isFavorite={isFavorite}
                notificationCount={notificationCount}
                onItemClick={onItemClick}
                // onToggleFavorite={onToggleFavorite}
                // level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

export default SidebarMenuItem