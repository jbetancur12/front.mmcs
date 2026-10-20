import { Clear, FilterList, Search } from '@mui/icons-material'
import {
  Box,
  IconButton,
  TextField,
  useMediaQuery,
  useTheme
} from '@mui/material'
import React from 'react'

// Enhanced search component
const EnhancedSearch: React.FC<{
  globalFilter: string
  setGlobalFilter: (value: string) => void
  totalResults: number
}> = ({ globalFilter, setGlobalFilter, totalResults }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        alignItems: isMobile ? 'stretch' : 'center',
        p: isMobile ? 1.5 : 2,
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}
    >
      <TextField
        placeholder='Buscar usuarios por nombre, email o rol...'
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        variant='outlined'
        size='small'
        aria-label='Campo de búsqueda de usuarios'
        aria-describedby='search-help-text'
        InputProps={{
          startAdornment: (
            <Search sx={{ color: '#6b7280', mr: 1 }} aria-hidden='true' />
          ),
          endAdornment: globalFilter && (
            <IconButton
              onClick={() => setGlobalFilter('')}
              size='small'
              aria-label='Limpiar búsqueda'
              tabIndex={0}
              sx={{
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }
              }}
            >
              <Clear fontSize='small' />
            </IconButton>
          )
        }}
        sx={{
          flexGrow: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00BFA5'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00BFA5',
              borderWidth: '2px'
            }
          }
        }}
      />

      {/* Hidden help text for search field */}
      <Box
        id='search-help-text'
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        Escriba para filtrar usuarios por nombre, email o rol. Use la tecla
        Escape para limpiar la búsqueda.
      </Box>

      {/* Results counter and filter indicator - responsive layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1,
          alignItems: isMobile ? 'stretch' : 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}
        >
          <FilterList sx={{ color: '#6b7280', fontSize: 16 }} />
          <span
            style={{
              fontSize: '0.875rem',
              color: '#374151',
              fontWeight: 500
            }}
          >
            {totalResults} {totalResults === 1 ? 'usuario' : 'usuarios'}
          </span>
        </Box>

        {/* Clear search indicator */}
        {globalFilter && (
          <Box
            sx={{
              px: 2,
              py: 1,
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: 1
            }}
          >
            Filtrado activo
            <IconButton
              onClick={() => setGlobalFilter('')}
              size='small'
              sx={{
                color: '#1e40af',
                ml: 0.5,
                '&:hover': {
                  backgroundColor: '#bfdbfe'
                }
              }}
            >
              <Clear fontSize='small' />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default EnhancedSearch
