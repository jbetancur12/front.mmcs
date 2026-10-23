import React, { useState, useEffect, useCallback } from 'react'
import { Certificate } from './EquipmentCard'
import { useCustomerCertificatesByHeadquarter } from 'src/hooks/customers/useCustomerCertificates'
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
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import { bigToast } from './ExcelManipulation/Utils'
import EquipmentTable from './customer-profile/EquipmentTable'
import {
  Certificate as CertificateRow,
  CertificatesApiResponse
} from './customer-profile/types'

interface SelectedHqProps {
  onDelete: (id: number) => void
  sedes: string[]
  selectedSede: string | null
}

// Función para exportar a Excel real usando SheetJS
const exportToExcel = async (
  data: Certificate[],
  selectedSede: string | null
) => {
  if (data.length === 0) {
    bigToast('No hay datos para exportar', 'info')
    return
  }

  const XLSX = await import('xlsx')

  // Preparar los datos para Excel
  const excelData = data.map((cert) => ({
    Sede: cert.headquarter || '',
    'Nombre del Equipo': cert.device.name || '',
    'Activo Fijo': cert.activoFijo || '',
    Serie: cert.serie || '',
    Ubicación: cert.location || '',
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
    { wch: 25 }, // Ubicación
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
    bigToast('Error al generar el archivo Excel', 'error')
  }
}

const SelectedHq: React.FC<SelectedHqProps> = ({
  onDelete,
  sedes,
  selectedSede
}) => {
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)

  // Al cambiar de sede se empieza de cero
  useEffect(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [selectedSede])

  const { data: apiResponse, refetch } =
    useCustomerCertificatesByHeadquarter<ApiResponse>(id, {
      search: searchTerm,
      headquarter: selectedSede,
      page: currentPage
    })

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

  const handleDownloadExcel = useCallback(
    async (type: 'all' | 'nextOrExpired') => {
      setIsDownloading(true)
      try {
        const allData = await fetchAllDataForDownload(type)
        if (allData.length === 0) {
          bigToast('No hay datos para exportar', 'info')
        } else {
          await exportToExcel(allData, selectedSede)
        }
      } catch (error) {
        console.error('Error al descargar Excel:', error)
        bigToast('Error al descargar el archivo Excel', 'error')
      } finally {
        setIsDownloading(false)
      }
    },
    [fetchAllDataForDownload, selectedSede]
  )

  return (
    <EquipmentTable
      apiResponse={apiResponse as CertificatesApiResponse | undefined}
      certificatesData={(apiResponse?.files || []) as CertificateRow[]}
      searchTerm={searchTerm}
      onSearchChange={(value) => {
        setSearchTerm(value)
        setCurrentPage(1)
      }}
      statusFilter={null}
      onStatusFilter={() => undefined}
      matchedFields={[]}
      canCreateFile={false}
      onOpenCreateModal={() => undefined}
      isDownloading={isDownloading}
      onDownload={handleDownloadExcel}
      handleDelete={async (certificateId) => onDelete(certificateId)}
      onChanged={() => void refetch()}
      sedes={sedes}
      rol={$userStore.rol}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    />
  )
}

export default SelectedHq
