import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { ModernSidebarItem } from './types/sidebar.types'

interface SidebarSearchProps {
  items: ModernSidebarItem[]
  searchTerm: string
  onSearchChange: (term: string) => void
  isMinimized: boolean
  onItemClick?: (item: ModernSidebarItem) => void
}

const SidebarSearch: React.FC<SidebarSearchProps> = ({
  searchTerm,
  onSearchChange,
  isMinimized,
}) => {
  const handleClear = () => {
    onSearchChange('')
  }

  if (isMinimized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
        <Tooltip title="Buscar en el menú" placement="right">
          <IconButton
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  return (
    <Collapse in={!isMinimized} timeout={300}>
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar en el menú..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.paper',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '0.875rem'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon 
                  sx={{ 
                    fontSize: 18, 
                    color: searchTerm ? 'primary.main' : 'text.secondary' 
                  }} 
                />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary'
                    }
                  }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {searchTerm && (
          <Box sx={{ mt: 1 }}>
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              Buscando: "{searchTerm}"
            </Box>
          </Box>
        )}
      </Box>
    </Collapse>
  )
}

export default SidebarSearch