// components/DeviceIotMap/sidebar/FilterPanel.tsx
import { Box, TextField, InputAdornment, Chip } from '@mui/material'
import { FilterState } from '../types'
import { Search } from '@mui/icons-material'

export const FilterPanel = ({
  filterState,
  onFilterChange
}: {
  filterState: FilterState
  onFilterChange: (type: keyof FilterState, value: any) => void
}) => (
  <Box className='mt-4'>
    <Box className='relative'>
      <TextField
        fullWidth
        size='small'
        placeholder='Buscar dispositivos'
        value={filterState.searchQuery}
        onChange={(e) => onFilterChange('searchQuery', e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search fontSize='small' />
            </InputAdornment>
          )
        }}
      />
    </Box>

    <Box sx={{ mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            mb: 1
          }}
        >
          Estado:
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label='Online'
            onClick={() =>
              onFilterChange(
                'statuses',
                new Set(
                  filterState.statuses.has('online')
                    ? [...filterState.statuses].filter((s) => s !== 'online')
                    : [...filterState.statuses, 'online']
                )
              )
            }
            color={filterState.statuses.has('online') ? 'primary' : 'default'}
            variant={filterState.statuses.has('online') ? 'filled' : 'outlined'}
            size='small'
            sx={{
              '& .MuiChip-label': { fontSize: '0.75rem' },
              height: '24px'
            }}
          />
          <Chip
            label='Offline'
            onClick={() =>
              onFilterChange(
                'statuses',
                new Set(
                  filterState.statuses.has('offline')
                    ? [...filterState.statuses].filter((s) => s !== 'offline')
                    : [...filterState.statuses, 'offline']
                )
              )
            }
            color={filterState.statuses.has('offline') ? 'primary' : 'default'}
            variant={
              filterState.statuses.has('offline') ? 'filled' : 'outlined'
            }
            size='small'
            sx={{
              '& .MuiChip-label': { fontSize: '0.75rem' },
              height: '24px'
            }}
          />
        </Box>
      </Box>
    </Box>

    <Box sx={{ mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            fontSize: '0.875rem',
            color: 'text.secondary',
            mb: 1
          }}
        >
          Fuente de poder:
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label='Corriente principal'
            onClick={() =>
              onFilterChange(
                'powerSources',
                new Set(
                  filterState.powerSources.has('main')
                    ? [...filterState.powerSources].filter((s) => s !== 'main')
                    : [...filterState.powerSources, 'main']
                )
              )
            }
            color={filterState.powerSources.has('main') ? 'primary' : 'default'}
            variant={
              filterState.powerSources.has('main') ? 'filled' : 'outlined'
            }
            size='small'
            sx={{
              '& .MuiChip-label': { fontSize: '0.75rem' },
              height: '24px'
            }}
          />
          <Chip
            label='Batería'
            onClick={() =>
              onFilterChange(
                'powerSources',
                new Set(
                  filterState.powerSources.has('bat')
                    ? [...filterState.powerSources].filter((s) => s !== 'bat')
                    : [...filterState.powerSources, 'bat']
                )
              )
            }
            color={filterState.powerSources.has('bat') ? 'primary' : 'default'}
            variant={
              filterState.powerSources.has('bat') ? 'filled' : 'outlined'
            }
            size='small'
            sx={{
              '& .MuiChip-label': { fontSize: '0.75rem' },
              height: '24px'
            }}
          />
        </Box>
      </Box>
    </Box>
  </Box>
)
