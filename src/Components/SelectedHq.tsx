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

interface SelectedHqProps {
  onDelete: (id: number) => void
  sedes: string[]
  selectedSede: string | null
}

// Función para exportar a CSV
const exportToCSV = (data: Certificate[], selectedSede: string | null) => {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Definir las cabeceras del CSV
  const headers = [
    'Sede',
    'Nombre del Equipo',
    'Activo Fijo',
    'Serie',
    'Fecha de Calibración',
    'Próxima Calibración'
  ]

  // Convertir los datos a formato CSV
  const csvContent = [
    headers.join(','), // Cabeceras
    ...data.map((cert) =>
      [
        `"${cert.headquarter || ''}"`,
        `"${cert.device.name || ''}"`,
        `"${cert.activoFijo || ''}"`,
        `"${cert.serie || ''}"`,
        cert.calibrationDate
          ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
          : '',
        cert.nextCalibrationDate
          ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
          : ''
      ].join(',')
    )
  ].join('\n')

  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent

  // Crear y descargar el archivo
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `inventario_equipos_${selectedSede || 'todas_sedes'}_${new Date().toISOString().split('T')[0]}.csv`
  )
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  onDelete,
  sedes,
  selectedSede
}) => {
  const { id } = useParams<{ id: string }>()

  // Recuperar el estado inicial desde sessionStorage
  const [searchTerm, setSearchTerm] = useState(
    sessionStorage.getItem('searchTerm') || ''
  )
  const [currentPage, setCurrentPage] = useState(
    parseInt(sessionStorage.getItem('currentPage') || '1', 10)
  )
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Guardar el estado en sessionStorage cuando cambie
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

  // Función para obtener todos los datos de la sede para descarga
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

  // Nueva función para descargar CSV filtrado
  const handleDownloadCSV = useCallback(
    async (type: 'all' | 'nextOrExpired') => {
      setAnchorEl(null)
      setIsDownloading(true)
      try {
        const allData = await fetchAllDataForDownload(type)
        if (allData.length === 0) {
          alert('No hay datos para exportar')
        } else {
          exportToCSV(allData, selectedSede)
        }
      } catch (error) {
        console.error('Error al descargar CSV:', error)
        alert('Error al descargar el archivo CSV')
      } finally {
        setIsDownloading(false)
      }
    },
    [fetchAllDataForDownload, selectedSede]
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Resetear a la primera página cuando se busca
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
            Descargar CSV
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handleDownloadCSV('all')}>
              Todos los equipos
            </MenuItem>
            <MenuItem onClick={() => handleDownloadCSV('nextOrExpired')}>
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
