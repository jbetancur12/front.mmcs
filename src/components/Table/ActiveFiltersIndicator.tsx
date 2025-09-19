import React from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import {
  FilterList,
  FilterListOff,
  ExpandMore,
  ExpandLess,
  Clear
} from '@mui/icons-material'
import { hasActiveFilters, getActiveFiltersCount, getFilterSummary } from '../../utils/tableStateUtils'

interface ActiveFiltersIndicatorProps {
  tableState: any
  onClearFilters: () => void
  showDetails?: boolean
  compact?: boolean
}

export const ActiveFiltersIndicator: React.FC<ActiveFiltersIndicatorProps> = ({
  tableState,
  onClearFilters,
  showDetails = false,
  compact = false
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const hasFilters = hasActiveFilters(tableState)
  const filtersCount = getActiveFiltersCount(tableState)
  const filterSummary = getFilterSummary(tableState)

  if (!hasFilters) {
    return null
  }

  const handleToggleExpanded = () => {
    setExpanded(!expanded)
  }

  if (compact) {
    return (
      <Tooltip title={`${filtersCount} filtro(s) activo(s). Click para limpiar.`}>
        <Chip
          icon={<FilterList />}
          label={filtersCount}
          color="warning"
          variant="filled"
          size="small"
          onClick={onClearFilters}
          onDelete={onClearFilters}
          deleteIcon={<Clear />}
          sx={{
            fontWeight: 'bold',
            '& .MuiChip-deleteIcon': {
              fontSize: '16px'
            }
          }}
        />
      </Tooltip>
    )
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#fff3e0',
        borderLeft: '4px solid #ff9800',
        borderRadius: 1
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <FilterList color="warning" />

        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          <strong>{filtersCount}</strong> filtro(s) activo(s)
          {filterSummary.length > 0 && !expanded && (
            <span> - {filterSummary[0]}{filterSummary.length > 1 && '...'}</span>
          )}
        </Typography>

        {showDetails && filterSummary.length > 1 && (
          <IconButton
            size="small"
            onClick={handleToggleExpanded}
            sx={{ color: 'warning.main' }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}

        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<FilterListOff />}
          onClick={onClearFilters}
          sx={{
            minWidth: 'auto',
            px: 2
          }}
        >
          Limpiar Filtros
        </Button>
      </Stack>

      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pl: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtros activos:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
              {filterSummary.map((filter, index) => (
                <Chip
                  key={index}
                  label={filter}
                  size="small"
                  variant="outlined"
                  color="warning"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}
    </Paper>
  )
}

export default ActiveFiltersIndicator