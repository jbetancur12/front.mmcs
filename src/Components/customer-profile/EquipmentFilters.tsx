import { Add, Clear, Download, Search } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import React, { useState } from 'react'

import { STATUS_LABELS } from './constants'
import { CertificatesApiResponse, DownloadFilter, StatusFilter } from './types'

interface EquipmentFiltersProps {
  apiResponse?: CertificatesApiResponse
  statusFilter: StatusFilter | null
  handleStatusFilter: (status: StatusFilter) => void
  searchTerm: string
  handleSearchChange: (value: string) => void
  clearSearch: () => void
  matchedFields: string[]
  canCreateFile: boolean
  onOpenCreateModal: () => void
  isDownloading: boolean
  onDownload: (type: DownloadFilter) => void
}

/** Búsqueda, filtro de estado, subida de certificado y exportación a Excel. */
const EquipmentFilters = ({
  apiResponse,
  statusFilter,
  handleStatusFilter,
  searchTerm,
  handleSearchChange,
  clearSearch,
  matchedFields,
  canCreateFile,
  onOpenCreateModal,
  isDownloading,
  onDownload
}: EquipmentFiltersProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDownloadMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDownloadOption = (type: DownloadFilter) => {
    setAnchorEl(null)
    onDownload(type)
  }

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: '1px solid #e5e7eb',
        borderRadius: '16px'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {statusFilter && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Mostrando: ${STATUS_LABELS[statusFilter]} (${apiResponse?.totalFiles ?? 0})`}
              onDelete={() => handleStatusFilter(statusFilter)}
              sx={{
                fontWeight: 600,
                backgroundColor: '#e6f7f4',
                color: '#00897b'
              }}
            />
          </Box>
        )}
        <Grid container spacing={3} alignItems='center'>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant='outlined'
              placeholder='Buscar por nombre, serie, activo fijo...'
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search sx={{ color: '#10b981' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position='end'>
                    <IconButton onClick={clearSearch} edge='end' size='small'>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981'
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            {canCreateFile && (
              <Button
                fullWidth
                variant='contained'
                startIcon={<Add />}
                onClick={onOpenCreateModal}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  }
                }}
              >
                Subir Nuevo Certificado
              </Button>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant='contained'
              startIcon={
                isDownloading ? <CircularProgress size={16} /> : <Download />
              }
              onClick={handleDownloadMenuClick}
              disabled={isDownloading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                }
              }}
            >
              {isDownloading ? 'Descargando...' : 'Exportar Excel'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{
                paper: {
                  sx: { borderRadius: '12px', mt: 1 }
                }
              }}
            >
              <MenuItem onClick={() => handleDownloadOption('all')}>
                📊 Todos los equipos
              </MenuItem>
              <MenuItem onClick={() => handleDownloadOption('nextOrExpired')}>
                ⚠️ Próximos a vencer / Vencidos
              </MenuItem>
            </Menu>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box
              display='flex'
              alignItems='center'
              gap={1}
              justifyContent='flex-end'
            >
              <Typography variant='body2' color='text.secondary'>
                Total:
              </Typography>
              <Chip
                label={`${apiResponse?.totalFiles || 0} equipos`}
                size='small'
                sx={{
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  fontWeight: 600
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Search Results Info */}
        {apiResponse &&
          searchTerm &&
          apiResponse?.totalFiles > 0 &&
          matchedFields.length > 0 && (
            <Box
              mt={2}
              p={2}
              sx={{ backgroundColor: '#f0f9ff', borderRadius: '8px' }}
            >
              <Typography variant='body2' color='#0369a1'>
                🔍 Resultados para &quot;<strong>{searchTerm}</strong>&quot;
                encontrados en: {matchedFields.join(', ')}
              </Typography>
            </Box>
          )}
      </CardContent>
    </Card>
  )
}

export default EquipmentFilters
