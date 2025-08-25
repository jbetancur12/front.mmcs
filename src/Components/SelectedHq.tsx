import React, { useState, useEffect, useCallback } from 'react'
import { Certificate, CertificateListItem } from './CertificateListItem'
import {
  Divider,
  Typography,
  Button,
  Box,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material'
import { useQuery } from 'react-query'
import { ApiResponse } from 'src/pages/Customer'
import { useParams } from 'react-router-dom'
import { axiosPrivate } from '@utils/api'
import { Download } from '@mui/icons-material'
import * as XLSX from 'xlsx'

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

  return (
    <div>
      <Box display='flex' gap={2} alignItems='center' mb={2}>
        <input
          type='text'
          placeholder='Buscar Equipo(s)...'
          className='flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500'
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        <Box display='flex' gap={1}>
          <Button
            variant='outlined'
            startIcon={
              isDownloading ? <CircularProgress size={16} /> : <Download />
            }
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={isDownloading}
            size='small'
          >
            Descargar Excel
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handleDownloadExcel('all')}>
              Todos los equipos
            </MenuItem>
            <MenuItem onClick={() => handleDownloadExcel('nextOrExpired')}>
              Próximos a vencer / Vencidos
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Typography variant='subtitle2' gutterBottom>
        Total Equipos: {apiResponse?.totalFiles || 0}
        {selectedSede && (
          <span style={{ fontWeight: 'normal', color: '#666' }}>
            {' '}
            en {selectedSede}
          </span>
        )}
      </Typography>

      <Divider />

      {isLoading ? (
        <Box display='flex' justifyContent='center' alignItems='center' py={4}>
          <CircularProgress />
          <Typography variant='body2' sx={{ ml: 2 }}>
            Cargando equipos...
          </Typography>
        </Box>
      ) : (
        <>
          {certificatesData.length === 0 ? (
            <Typography align='center' color='textSecondary' sx={{ py: 4 }}>
              {searchTerm
                ? `No se encontraron equipos que coincidan con "${searchTerm}"`
                : 'No hay equipos para mostrar en esta sede'}
            </Typography>
          ) : (
            <>
              {certificatesData.map((certificate: Certificate) => (
                <CertificateListItem
                  key={certificate.id}
                  certificate={certificate}
                  onDelete={onDelete}
                  sedes={sedes}
                />
              ))}

              <div className='flex justify-between items-center p-4'>
                <button
                  type='button'
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed'
                >
                  Anterior
                </button>

                <div className='text-center'>
                  <p className='text-lg font-semibold'>
                    Página {currentPage} de {apiResponse?.totalPages || 1}
                  </p>
                </div>

                <button
                  type='button'
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === (apiResponse?.totalPages || 1)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-400 disabled:cursor-not-allowed'
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default SelectedHq
