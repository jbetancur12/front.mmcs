import React from 'react'
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  Chip
} from '@mui/material'
import {
  Star as StarIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { SidebarItemProps } from '../types/sidebar.types'

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isMinimized,
  onItemClick,
  
}) => {

  const handleClick = () => {
    onItemClick?.()
  }

  const renderIcon = () => {
    if (!item.icon) return null

    const IconComponent = item.icon as React.ComponentType<any>
    
    const iconElement = (
      <IconComponent 
        sx={{ 
          fontSize: 22,
          color: isActive ? 'primary.main' : 'text.secondary',
          transition: 'color 0.2s ease-in-out'
        }} 
      />
    )

    if (item.badge && item.badge.count > 0) {
      return (
        <Badge
          badgeContent={item.badge.count}
          color={item.badge.color}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.625rem',
              height: 16,
              minWidth: 16,
              animation: item.badge.pulse ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' }
              }
            }
          }}
        >
          {iconElement}
        </Badge>
      )
    }

    return iconElement
  }

  const content = (
    <ListItemButton
      component={item.to ? Link : 'div'}
      to={item.to}
      onClick={handleClick}
      selected={isActive}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        minHeight: 44,
        px: isMinimized ? 1 : 2,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark'
          },
          '& .MuiListItemIcon-root': {
            color: 'primary.contrastText'
          },
          '& .MuiListItemText-primary': {
            color: 'primary.contrastText',
            fontWeight: 600
          }
        },
        '&:hover': {
          bgcolor: isActive ? 'primary.main' : 'action.hover',
          transform: 'translateX(2px)',
          transition: 'all 0.2s ease-in-out'
        },
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isMinimized ? 'auto' : 40,
          justifyContent: 'center'
        }}
      >
        {renderIcon()}
      </ListItemIcon>
      
      {!isMinimized && (
        <ListItemText
          primary={item.label}
          sx={{
            '& .MuiListItemText-primary': {
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'font-weight 0.2s ease-in-out'
            }
          }}
        />
      )}
      
      {!isMinimized && item.isNew && (
        <Chip
          label="Nuevo"
          size="small"
          color="success"
          sx={{
            height: 20,
            fontSize: '0.625rem',
            fontWeight: 600
          }}
        />
      )}
      
      {!isMinimized && item.isFavorite && (
        <StarIcon
          sx={{
            fontSize: 16,
            color: 'warning.main',
            ml: 1
          }}
        />
      )}
    </ListItemButton>
  )

  if (isMinimized) {
    return (
      <Tooltip
        title={item.label}
        placement="right"
        arrow
        enterDelay={500}
      >
        <ListItem disablePadding sx={{ display: 'block' }}>
          {content}
        </ListItem>
      </Tooltip>
    )
  }

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      {content}
    </ListItem>
  )
}

export default SidebarItem