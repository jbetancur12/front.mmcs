import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Fade
} from '@mui/material'
import {
  Clear as ClearIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material'

// Filter types
type FilterType = 'all' | 'active' | 'warning' | 'expired'

interface FilterIndicatorProps {
  activeFilter: FilterType
  onClearFilter: () => void
  totalCount: number
  filteredCount: number
  customerName?: string
}

const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  activeFilter,
  onClearFilter,
  totalCount,
  filteredCount,
  customerName
}) => {
  // Don't show indicator when showing all certificates
  if (activeFilter === 'all') {
    return null
  }

  // Get filter display information
  const getFilterInfo = (filterType: FilterType) => {
    switch (filterType) {
      case 'active':
        return {
          label: 'Certificados Vigentes',
          color: '#4caf50',
          bgColor: '#e8f5e8',
          description: 'Mostrando certificados con más de 30 días para vencer'
        }
      case 'warning':
        return {
          label: 'Próximos a Vencer',
          color: '#ff9800',
          bgColor: '#fff3e0',
          description: 'Mostrando certificados que vencen en 30 días o menos'
        }
      case 'expired':
        return {
          label: 'Certificados Vencidos',
          color: '#f44336',
          bgColor: '#ffebee',
          description: 'Mostrando certificados que ya han vencido'
        }
      default:
        return {
          label: 'Filtro Activo',
          color: '#2196f3',
          bgColor: '#e3f2fd',
          description: 'Filtro aplicado'
        }
    }
  }

  const filterInfo = getFilterInfo(activeFilter)

  return (
    <Fade in timeout={300}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: filterInfo.bgColor,
          border: `1px solid ${filterInfo.color}30`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <FilterListIcon sx={{ color: filterInfo.color, fontSize: 24 }} />
          
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ color: filterInfo.color, fontWeight: 600 }}>
                {filterInfo.label}
              </Typography>
              <Chip
                label={`${filteredCount} de ${totalCount}`}
                size="small"
                sx={{
                  backgroundColor: filterInfo.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {filterInfo.description}
              {customerName && ` para ${customerName}`}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClearFilter}
          sx={{
            borderColor: filterInfo.color,
            color: filterInfo.color,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1,
            minWidth: 'auto',
            '&:hover': {
              borderColor: filterInfo.color,
              backgroundColor: `${filterInfo.color}10`,
              transform: 'scale(1.02)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Ver Todos
        </Button>
      </Paper>
    </Fade>
  )
}

export default FilterIndicator