import React from 'react'
import {
  Box,
  List,
  Typography,
  Divider
} from '@mui/material'
import { ModernSidebarItem } from '../types/sidebar.types'
import SidebarMenuItem from './SidebarMenuItem'


interface SidebarContentProps {
  items: ModernSidebarItem[]
  isMinimized: boolean
  favorites: string[]
  recentItems: string[]
  notifications: Record<string, number>
  onItemClick: (item: ModernSidebarItem) => void
  onToggleFavorite: (itemId: string) => void
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  items,
  isMinimized,
  favorites,
  recentItems,
  notifications,
  onItemClick,
}) => {

  
  // Obtener elementos recientes
  const recentItemsData = React.useMemo(() => {
    const findItemById = (items: ModernSidebarItem[], id: string): ModernSidebarItem | null => {
      for (const item of items) {
        if (item.id === id) return item
        if (item.children) {
          const found = findItemById(item.children, id)
          if (found) return found
        }
      }
      return null
    }
    
    return recentItems
      .slice(0, 5) // Solo los 5 más recientes
      .map(id => findItemById(items, id))
      .filter(Boolean) as ModernSidebarItem[]
  }, [items, recentItems])
  
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: 6
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'action.disabled',
          borderRadius: 3,
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }
      }}
    >
      {/* Favoritos */}

      {/* Elementos recientes */}
      {!isMinimized && recentItemsData.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            Recientes
          </Typography>
          <List dense sx={{ py: 0 }}>
            {recentItemsData.map((item) => (
              <SidebarMenuItem
                key={`recent-${item.id}`}
                item={item}
                isMinimized={isMinimized}
                isFavorite={favorites.includes(item.id)}
                notificationCount={notifications[item.id]}
                onItemClick={onItemClick}
                
              />
            ))}\n          </List>
          <Divider sx={{ mx: 2, my: 1 }} />
        </Box>
      )}
      
      {/* Menú principal */}
      <List sx={{ py: 0 }}>
        {items.map((item) => {
          if (item.type === 'divider') {
            return (
              <Divider
                key={item.id}
                sx={{
                  mx: 2,
                  my: 1,
                  borderColor: 'divider'
                }}
              />
            )
          }
          
          return (
            <SidebarMenuItem
              key={item.id}
              item={item}
              isMinimized={isMinimized}
              isFavorite={favorites.includes(item.id)}
              notificationCount={notifications[item.id]}
              onItemClick={onItemClick}
            />
          )
        })}
      </List>
    </Box>
  )
}

export default SidebarContent