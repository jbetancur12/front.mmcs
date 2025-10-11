import React, { useState, useEffect, useCallback } from 'react'
import EquipmentCard, { Certificate } from './EquipmentCard'
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

interface ApiResponse {
  totalFiles: number
  totalPages: number
  currentPage: number
  files: Certificate[]
  searchInfo?: {
    term: string
    searchableFields: string[]
  }
  statistics: {
    expired: number
    expiringSoon: number
    active: number
    total: number
  }
}
import { axiosPrivate } from '@utils/api'
import { Download, Search, Clear } from '@mui/icons-material'
import * as XLSX from 'xlsx'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'

interface SelectedHqProps {
  onDelete: (id: number) => void
  sedes: string[]
  selectedSede: string | null
}

// Función para exportar a Excel real usando SheetJS
const exportToExcel = (data: Certificate[], selectedSede: string | null) => {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Preparar los datos para Excel
  const excelData = data.map((cert) => ({
    Sede: cert.headquarter || '',
    'Nombre del Equipo': cert.device.name || '',
    'Activo Fijo': cert.activoFijo || '',
    Serie: cert.serie || '',
    'Fecha de Calibración': cert.calibrationDate
      ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
      : '',
    'Próxima Calibración': cert.nextCalibrationDate
      ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
      : ''
  }))

  // Crear workbook y worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Configurar ancho de columnas para mejor visualización
  const columnWidths = [
    { wch: 20 }, // Sede
    { wch: 35 }, // Nombre del Equipo
    { wch: 15 }, // Activo Fijo
    { wch: 15 }, // Serie
    { wch: 18 }, // Fecha de Calibración
    { wch: 20 } // Próxima Calibración
  ]
  worksheet['!cols'] = columnWidths

  // Estilo para las cabeceras (fila 1)
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '366092' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  }

  // Aplicar estilo a las cabeceras
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!worksheet[cellAddress]) continue
    worksheet[cellAddress].s = headerStyle
  }

  // Configurar filtros automáticos
  worksheet['!autofilter'] = { ref: worksheet['!ref'] || 'A1' }

  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Equipos')

  // Configurar propiedades del archivo
  workbook.Props = {
    Title: 'Inventario de Equipos',
    Subject: 'Reporte de inventario',
    Author: 'Sistema de Gestión',
    CreatedDate: new Date()
  }

  // Generar el archivo y descargarlo
  const fileName = `inventario_equipos_${selectedSede || 'todas_sedes'}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
  } catch (error) {
    console.error('Error al generar archivo Excel:', error)
    alert('Error al generar el archivo Excel')
  }
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  onDelete,
  sedes,
  selectedSede
}) => {
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)

  const [searchTerm, setSearchTerm] = useState(
    sessionStorage.getItem('searchTerm') || ''
  )
  const [currentPage, setCurrentPage] = useState(
    parseInt(sessionStorage.getItem('currentPage') || '1', 10)
  )
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    sessionStorage.setItem('searchTerm', searchTerm)
  }, [searchTerm])

  useEffect(() => {
    sessionStorage.setItem('currentPage', currentPage.toString())
  }, [currentPage])

  const { data: apiResponse, isLoading } = useQuery<ApiResponse>(
    ['certificates-data', id, searchTerm, selectedSede, currentPage],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: {
          search: searchTerm,
          headquarter: selectedSede,
          page: currentPage
        }
      })
      return response.data
    },
    {
      enabled: !!id
    }
  )

  const fetchAllDataForDownload = useCallback(
    async (filterType: 'all' | 'nextOrExpired'): Promise<Certificate[]> => {
      if (!id) throw new Error('No customer ID provided')
      try {
        const params: {
          all: boolean
          headquarter: string | null
          filter?: string
        } = { all: true, headquarter: selectedSede }
        if (filterType === 'nextOrExpired') params.filter = 'nextOrExpired'
        const response = await axiosPrivate.get(`/files/customer/${id}`, {
          params
        })
        return response.data.files || []
      } catch (error) {
        console.error('Error al obtener todos los datos:', error)
        throw error
      }
    },
    [axiosPrivate, id, selectedSede]
  )

  const certificatesData = apiResponse?.files || []

  const handlePageChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev' && currentPage > 1) {
        setCurrentPage((prev) => prev - 1)
      } else if (
        direction === 'next' &&
        apiResponse &&
        currentPage < apiResponse.totalPages
      ) {
        setCurrentPage((prev) => prev + 1)
      }
    },
    [currentPage, apiResponse]
  )

  const handleDownloadExcel = useCallback(
    async (type: 'all' | 'nextOrExpired') => {
      setAnchorEl(null)
      setIsDownloading(true)
      try {
        const allData = await fetchAllDataForDownload(type)
        if (allData.length === 0) {
          alert('No hay datos para exportar')
        } else {
          exportToExcel(allData, selectedSede)
        }
      } catch (error) {
        console.error('Error al descargar Excel:', error)
        alert('Error al descargar el archivo Excel')
      } finally {
        setIsDownloading(false)
      }
    },
    [fetchAllDataForDownload, selectedSede]
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  return (
    <div>
      {/* Advanced Search and Filters */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #e5e7eb', borderRadius: '16px' }}>
        <CardContent sx={{ p: 3 }}>
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
              <Button
                fullWidth
                variant='contained'
                startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={isDownloading}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  }
                }}
              >
                {isDownloading ? 'Descargando...' : 'Exportar Excel'}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                slotProps={{
                  paper: {
                    sx: { borderRadius: '12px', mt: 1 }
                  }
                }}
              >
                <MenuItem onClick={() => handleDownloadExcel('all')}>
                  📊 Todos los equipos
                </MenuItem>
                <MenuItem onClick={() => handleDownloadExcel('nextOrExpired')}>
                  ⚠️ Próximos a vencer / Vencidos
                </MenuItem>
              </Menu>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box display='flex' alignItems='center' gap={1}>
                <Typography variant='body2' color='text.secondary'>
                  Total:
                </Typography>
                <Chip
                  label={`${apiResponse?.statistics?.total || 0} equipos`}
                  size='small'
                  sx={{
                    backgroundColor: '#f0f9ff',
                    color: '#0369a1',
                    fontWeight: 600
                  }}
                />
              </Box>
              {selectedSede && (
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                  en {selectedSede}
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isLoading ? (
        <Box display='flex' flexDirection='column' alignItems='center' py={8}>
          <CircularProgress size={60} sx={{ color: '#10b981', mb: 2 }} />
          <Typography variant='h6' color='text.secondary' gutterBottom>
            Cargando equipos...
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Obteniendo información de los equipos
          </Typography>
        </Box>
      ) : (
        <>
          {certificatesData.length === 0 ? (
            <Card elevation={0} sx={{ border: '2px dashed #d1d5db', borderRadius: '16px' }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <Search sx={{ fontSize: 40, color: '#9ca3af' }} />
                </Box>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  {searchTerm ? 'No se encontraron equipos' : 'No hay equipos en esta sede'}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  {searchTerm
                    ? `No hay resultados para "${searchTerm}"`
                    : 'Esta sede aún no tiene equipos registrados'}
                </Typography>
                {searchTerm && (
                  <Button
                    variant='outlined'
                    onClick={clearSearch}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Grid container spacing={3}>
                {certificatesData.map((certificate: Certificate) => (
                  <Grid item xs={12} sm={6} lg={4} key={certificate.id}>
                    <EquipmentCard
                      certificate={certificate}
                      onDelete={onDelete}
                      sedes={sedes}
                      rol={$userStore.rol}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Modern Pagination */}
              <Box display='flex' justifyContent='center' alignItems='center' mt={6}>
                <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <Button
                      variant='outlined'
                      onClick={() => handlePageChange('prev')}
                      disabled={currentPage === 1}
                      sx={{
                        borderRadius: '8px',
                        minWidth: '100px',
                        '&:disabled': { opacity: 0.5 }
                      }}
                    >
                      ← Anterior
                    </Button>

                    <Box display='flex' alignItems='center' gap={1} px={2}>
                      <Typography variant='body2' color='text.secondary'>
                        Página
                      </Typography>
                      <Chip
                        label={currentPage}
                        size='small'
                        sx={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          fontWeight: 600,
                          minWidth: '32px'
                        }}
                      />
                      <Typography variant='body2' color='text.secondary'>
                        de {apiResponse?.totalPages || 1}
                      </Typography>
                    </Box>

                    <Button
                      variant='outlined'
                      onClick={() => handlePageChange('next')}
                      disabled={currentPage === (apiResponse?.totalPages || 1)}
                      sx={{
                        borderRadius: '8px',
                        minWidth: '100px',
                        '&:disabled': { opacity: 0.5 }
                      }}
                    >
                      Siguiente →
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default SelectedHq
