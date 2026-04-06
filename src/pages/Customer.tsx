import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import TableUsersCustomer from '../Components/TableUsersCustomer'

import EquipmentCard, { Certificate } from '../Components/EquipmentCard'
import { bigToast } from '../Components/ExcelManipulation/Utils'
import Headquarters from '../Components/Headquarters'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Grid
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import CalibrationTimeline from '../Components/CalibrationTimeline'
import { ArrowBack, Clear, Download } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery, useQueryClient } from 'react-query'
import Modules from 'src/Components/Modules'
import * as XLSX from 'xlsx'
import { MySwal } from '@utils/sweetAlert'

// API URL
const minioUrl = import.meta.env.VITE_MINIO_URL

interface UserData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
}

export interface ApiResponse {
  totalFiles: number
  totalPages: number
  currentPage: number
  files: Certificate[]
  searchInfo?: {
    term: string
    searchableFields: string[]
  }
  statistics: {
    expired: number,
    expiringSoon: number,
    active: number,
    total: number
  },
}

type Tab =
  | 'users'
  | 'certificates'
  | 'headquarters'
  | 'calibrationTimeLine'
  | 'modules'
  | 'lmsCourses'

type CustomerLmsCourse = {
  id: number
  title: string
  description: string
  status: 'draft' | 'published' | 'archived'
  audience: 'client' | 'both'
  all_clients: boolean
  isAssignedToCustomer: boolean
}

type CustomerLmsCoursesResponse = {
  customer: {
    id: number
    nombre: string
    isActive: boolean
  }
  visibleCourses: CustomerLmsCourse[]
  assignableCourses: CustomerLmsCourse[]
}

// Función para exportar a Excel usando XLSX
const exportToExcel = (data: Certificate[], customerName: string = '') => {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  // Preparar los datos para Excel
  const excelData = data.map((cert) => ({
    Sede: cert.headquarter || '',
    'Nombre del Equipo': cert.device?.name || '',
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
  const fileName = `inventario_equipos_${customerName || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
  } catch (error) {
    console.error('Error al generar archivo Excel:', error)
    alert('Error al generar el archivo Excel')
  }
}

function UserProfile(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = $userStore.rol.some((role) =>
    ['admin', 'metrologist'].includes(role)
  )
  const canManageLmsCourses = $userStore.rol.includes('admin')

  const [customerData, setCustomerData] = useState<UserData>({
    nombre: '',
    email: '',
    telefono: '',
    avatar: '',
    sede: []
  })

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab')
    const validTabs: Tab[] = [
      'users',
      'certificates',
      'headquarters',
      'calibrationTimeLine',
      'modules',
      'lmsCourses'
    ]
    return validTabs.includes(tabParam as Tab)
      ? (tabParam as Tab)
      : 'certificates'
  })

  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  const [image, setImage] = useState('/images/pngaaa.com-4811116.png')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedSede, setSelectedSede] = useState<string | null>('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedLmsCourseId, setSelectedLmsCourseId] = useState('')

  // Fetch customer data
  useQuery<UserData>(
    ['customer-data', id],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/customers/${id}`)
      return response.data
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setCustomerData(data)
        if (data.avatar) {
          setImage(`${minioUrl}/images/${data.avatar}`)
        }
      }
    }
  )

  // Fetch certificates data using useQuery (paginado)
  const { data: apiResponse, refetch } = useQuery<ApiResponse>(
    ['certificates-data', id, searchTerm, currentPage],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: { search: searchTerm, page: currentPage }
      })
      return response.data
    },
    {
      enabled: !!id
    }
  )

  const certificatesData = apiResponse?.files || []

  const {
    data: customerLmsCourses,
    isLoading: isLoadingCustomerLmsCourses
  } = useQuery<CustomerLmsCoursesResponse>(
    ['customer-lms-courses', id],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/customers/${id}/lms-courses`)
      return response.data
    },
    {
      enabled: Boolean(id && canManageLmsCourses)
    }
  )

  // Función para obtener todos los datos para descarga
  const fetchAllDataForDownload = useCallback(
    async (filterType: 'all' | 'nextOrExpired') => {
      if (!id) throw new Error('No customer ID provided')
      const params: Record<string, unknown> = { all: true }
      if (filterType === 'nextOrExpired') params.filter = 'nextOrExpired'
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params
      })
      return response.data.files || []
    },
    [axiosPrivate, id]
  )

  const handleDelete = useCallback(
    async (certificateId: number) => {
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas eliminar este certificado? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      })

      if (!result.isConfirmed) return

      try {
        const response = await axiosPrivate.delete(`/files/${certificateId}`)

        if (response.status >= 200 && response.status < 300) {
          bigToast('Certificado eliminado con éxito', 'success')
          await refetch()
          // Invalidate and refetch the certificates query to update the UI
          queryClient.invalidateQueries(['certificates-data', id])
        }
      } catch (error) {
        console.error('Error al eliminar el certificado:', error)
        bigToast('Error al eliminar el certificado', 'error')
      }
    },
    [axiosPrivate, refetch, queryClient, id]
  )

  const handleDeleteSede = useCallback(
    async (sede: string) => {
      if (!id) return

      const result = await MySwal.fire({
        title: '¿Eliminar sede?',
        text: `¿Estás seguro de que deseas eliminar la sede "${sede}"? Esta acción solo se permitirá si no hay certificados asociados.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
      })

      if (!result.isConfirmed) return

      try {
        const response = await axiosPrivate.delete(
          `/customers/${id}/sedes/${sede}`
        )

        if (response.status === 200) {
          bigToast('Sede eliminada con éxito', 'success')
          queryClient.invalidateQueries(['customer-data', id])
        }
      } catch (error: any) {
        console.error('Error al eliminar sede:', error)
        if (error.response?.status === 409) {
          MySwal.fire({
            title: 'No se puede eliminar',
            text: 'No se puede eliminar la sede porque tiene certificados asociados. Por favor, remueve o transfiere los certificados primero.',
            icon: 'error',
            confirmButtonColor: '#3085d6'
          })
        } else {
          bigToast('Error al eliminar sede', 'error')
        }
      }
    },
    [axiosPrivate, id, queryClient]
  )

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newImage = event.target.files?.[0]

      if (newImage && id) {
        setImage(URL.createObjectURL(newImage))
        const formData = new FormData()
        formData.append('file', newImage as Blob)
        formData.append('customerId', id)

        try {
          await axiosPrivate.post(`/customers/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        } catch (error) {
          console.error('Error al enviar la imagen al backend:', error)
          setImage('/images/pngaaa.com-4811116.png')
        }
      } else {
        setImage('/images/pngaaa.com-4811116.png')
      }
    },
    [axiosPrivate, id]
  )

  const handleAddSede = useCallback(
    async (newSede: string) => {
      if (!id) return

      try {
        const response = await axiosPrivate.post(`/customers/${id}/sedes`, {
          nuevaSede: newSede
        })

        if (response.status === 200) {
          bigToast('Sede agregada con éxito', 'success')
          setCustomerData((prev) => ({
            ...prev,
            sede: [...prev.sede, newSede]
          }))
        }
      } catch (error) {
        console.error('Error al agregar sede:', error)
        bigToast('Error al agregar sede', 'error')
      }
    },
    [axiosPrivate, id]
  )

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

  const handleTabChange = useCallback(
    (tab: Tab) => {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('tab', tab)
      setSearchParams(newSearchParams)
      setActiveTab(tab)
    },
    [searchParams, setSearchParams]
  )

  const handleEditSede = useCallback(
    async (oldSede: string, newSede: string) => {
      if (!id) return

      try {
        const response = await axiosPrivate.put(`/customers/${id}/sedes`, {
          oldSede,
          newSede
        })

        if (response.status === 200) {
          bigToast('Sede actualizada con éxito', 'success')
          setCustomerData((prevData) => ({
            ...prevData,
            sede: prevData.sede.map((sede) =>
              sede === oldSede ? newSede : sede
            )
          }))
        }
      } catch (error) {
        console.error('Error al actualizar sede:', error)
        bigToast('Error al actualizar sede', 'error')
      }
    },
    [axiosPrivate, id]
  )

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleDownloadMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDownloadOption = async (type: 'all' | 'nextOrExpired') => {
    setAnchorEl(null)
    setIsDownloading(true)
    try {
      const allData = await fetchAllDataForDownload(
        type === 'all' ? 'all' : 'nextOrExpired'
      )

      if (allData.length === 0) {
        bigToast('No hay datos para exportar', 'info')
      } else {
        exportToExcel(allData, customerData.nombre)
        bigToast('Archivo Excel descargado exitosamente', 'success')
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      bigToast('Error al descargar el archivo Excel', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAssignLmsCourse = useCallback(async () => {
    if (!id || !selectedLmsCourseId) return

    try {
      await axiosPrivate.post(`/customers/${id}/lms-courses/${selectedLmsCourseId}`)
      bigToast('Curso LMS asignado con éxito', 'success')
      setSelectedLmsCourseId('')
      queryClient.invalidateQueries(['customer-lms-courses', id])
    } catch (error: any) {
      console.error('Error al asignar curso LMS:', error)
      bigToast(
        error.response?.data?.error || 'Error al asignar curso LMS',
        'error'
      )
    }
  }, [axiosPrivate, id, queryClient, selectedLmsCourseId])

  const handleRemoveLmsCourse = useCallback(async (courseId: number) => {
    if (!id) return

    try {
      await axiosPrivate.delete(`/customers/${id}/lms-courses/${courseId}`)
      bigToast('Curso LMS removido con éxito', 'success')
      queryClient.invalidateQueries(['customer-lms-courses', id])
    } catch (error: any) {
      console.error('Error al quitar curso LMS:', error)
      bigToast(
        error.response?.data?.error || 'Error al quitar curso LMS',
        'error'
      )
    }
  }, [axiosPrivate, id, queryClient])

  // Update search params when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set('query', searchTerm)
        return newParams
      })
    } else {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('query')
        return newParams
      })
    }
  }, [searchTerm, setSearchParams])

  useEffect(() => {
    if (activeTab === 'lmsCourses' && !canManageLmsCourses) {
      handleTabChange('certificates')
    }
  }, [activeTab, canManageLmsCourses, handleTabChange])

  // Permission check
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (
          $userStore.rol.some((role) =>
            ['admin', 'metrologist'].includes(role)
          ) ||
          id === String($userStore.customer.id)
        ) {
          setHasPermission(true)
        } else {
          setHasPermission(false)
          navigate(-1)
        }
      } catch (error) {
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      checkPermission()
    }

    return () => {
      setLoading(true)
    }
  }, [id, $userStore.rol, $userStore.customer, navigate])

  const getMatchedFields = (files: Certificate[]) => {
    if (!files || files.length === 0) return []

    const fieldLabels: Record<string, string> = {
      name: 'Nombre',
      serie: 'Serie',
      location: 'Ubicación',
      activoFijo: 'Activo Fijo',
      deviceName: 'Nombre del Dispositivo'
    }

    const allMatchedFields = files.flatMap(
      (file) => file.searchMatches?.map((match) => match.field) || []
    )

    const uniqueFields = [...new Set(allMatchedFields)]
    return uniqueFields.map((field) => fieldLabels[field] || field)
  }

  // En tu componente:
  const matchedFields = getMatchedFields(apiResponse?.files ?? [])

  if (loading) {
    return <Typography variant='h6'>Cargando...</Typography>
  }

  if (!hasPermission) {
    return <Typography variant='h6'>No tienes permisos suficientes</Typography>
  }

  return (
    <div>
      <IconButton onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
        <ArrowBack />
      </IconButton>

      <div className='bg-white shadow-md rounded-lg p-8 max-w-md mx-auto mt-4'>
        <div className='text-center'>
          <div className='flex flex-col justify-center'>
            <label htmlFor='imageInput'>
              <img
                src={image}
                alt={`Avatar de ${customerData.nombre}`}
                className='w-24 h-24 rounded-full mx-auto cursor-pointer'
              />
            </label>
            <input
              type='file'
              id='imageInput'
              accept='image/*'
              className='hidden'
              onChange={handleImageChange}
            />
          </div>
          <h2 className='text-2xl font-semibold mt-4'>{customerData.nombre}</h2>
        </div>

        <div className='mt-6'>
          <ul className='mt-3'>
            <li className='flex items-center text-gray-700'>
              <svg
                className='h-5 w-5 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                height='1em'
                viewBox='0 0 512 512'
                aria-hidden='true'
              >
                <path d='M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z' />
              </svg>
              {customerData.email}
            </li>
            <li className='flex items-center text-gray-700 mt-2'>
              <svg
                className='h-5 w-5 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                height='1em'
                viewBox='0 0 512 512'
                aria-hidden='true'
              >
                <path d='M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z' />
              </svg>
              {customerData.telefono}
            </li>
          </ul>
        </div>
      </div>

      <ul className='flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 mt-8'>
        <li className='-mb-px mr-1'>
          <button
            type='button'
            onClick={() => handleTabChange('certificates')}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'certificates'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
              }`}
          >
            Equipos
          </button>
        </li>
        <li className='mr-1'>
          <button
            type='button'
            onClick={() => handleTabChange('headquarters')}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'headquarters'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
              }`}
          >
            Sedes
          </button>
        </li>
        <li className='mr-1'>
          <button
            type='button'
            onClick={() => handleTabChange('calibrationTimeLine')}
            className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'calibrationTimeLine'
                ? 'border-l border-t border-r rounded-t'
                : 'text-blue-500 hover:text-blue-800'
              }`}
          >
            Programación
          </button>
        </li>
        {isAdmin && (
          <>
            <li className='mr-1'>
              <button
                type='button'
                onClick={() => handleTabChange('users')}
                className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'users'
                    ? 'border-l border-t border-r rounded-t'
                    : 'text-blue-500 hover:text-blue-800'
                  }`}
              >
                Usuarios
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => handleTabChange('modules')}
                className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'modules'
                    ? 'border-l border-t border-r rounded-t'
                    : 'text-blue-500 hover:text-blue-800'
                  }`}
              >
                Modulos
              </button>
            </li>
            {canManageLmsCourses && (
              <li className='mr-1'>
                <button
                  type='button'
                  onClick={() => handleTabChange('lmsCourses')}
                  className={`bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold ${activeTab === 'lmsCourses'
                      ? 'border-l border-t border-r rounded-t'
                      : 'text-blue-500 hover:text-blue-800'
                    }`}
                >
                  Academia
                </button>
              </li>
            )}
          </>
        )}
      </ul>

      {activeTab === 'certificates' && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box display='flex' gap={2} alignItems='center' mb={2}>
            <TextField
              sx={{ flexGrow: 1 }}
              variant='outlined'
              placeholder='Buscar Equipo(s)...'
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                endAdornment: searchTerm && (
                  <InputAdornment position='end'>
                    <IconButton
                      aria-label='limpiar búsqueda'
                      onClick={clearSearch}
                      edge='end'
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Box display='flex' gap={1} alignItems='center'>
              <Button
                variant='outlined'
                startIcon={
                  isDownloading ? <CircularProgress size={16} /> : <Download />
                }
                onClick={handleDownloadMenuClick}
                disabled={isDownloading}
                size='small'
              >
                Descargar Excel
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleDownloadOption('all')}>
                  Todos los equipos
                </MenuItem>
                <MenuItem onClick={() => handleDownloadOption('nextOrExpired')}>
                  Próximos a vencer / Vencidos
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          <Typography variant='subtitle2' gutterBottom>
            Total Equipos: {apiResponse?.totalFiles || 0}
          </Typography>
          {apiResponse &&
            searchTerm &&
            apiResponse?.totalFiles > 0 &&
            matchedFields.length > 0 && (
              <Typography variant='subtitle2' gutterBottom>
                Resultados para: &quot;{searchTerm}&quot; encontrados en:{' '}
                {matchedFields.join(', ')}
              </Typography>
            )}
          <Divider />

          {!apiResponse ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              mt={2}
              flexDirection='column'
            >
              <CircularProgress />
              <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
                Cargando Información...
              </Typography>
            </Box>
          ) : (
            <>
              {certificatesData.length === 0 ? (
                <Typography align='center' color='textSecondary' sx={{ my: 2 }}>
                  No hay certificados para mostrar.
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {certificatesData.map((certificate: Certificate) => (
                    <Grid item xs={12} sm={6} lg={4} key={certificate.id}>
                      <EquipmentCard
                        certificate={certificate}
                        onDelete={handleDelete}
                        sedes={customerData.sede}
                        rol={$userStore.rol}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
              <div className='flex justify-between items-center p-4'>
                <button
                  type='button'
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50'
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
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50'
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </Paper>
      )}

      {activeTab === 'users' && <TableUsersCustomer />}
      {activeTab === 'headquarters' && (
        <Headquarters
          setSelectedSede={setSelectedSede}
          selectedSede={selectedSede}
          sedes={customerData.sede}
          onDelete={handleDelete}
          onDeleteSede={handleDeleteSede}
          onAddSede={handleAddSede}
          onEditSede={handleEditSede}
        />
      )}
      {activeTab === 'calibrationTimeLine' && id && (
        <CalibrationTimeline customerId={id} />
      )}
      {activeTab === 'modules' && id && <Modules customerId={id} />}
      {activeTab === 'lmsCourses' && canManageLmsCourses && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Cursos LMS del cliente
          </Typography>

          <Alert severity='info' sx={{ mb: 3 }}>
            Aquí puedes ver los cursos LMS disponibles para esta empresa y asignar cursos específicos de cliente. Los cursos abiertos para todos los clientes se muestran, pero no se pueden quitar ni añadir manualmente.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 320 }}>
              <InputLabel>Asignar curso específico</InputLabel>
              <Select
                value={selectedLmsCourseId}
                label='Asignar curso específico'
                onChange={(event) => setSelectedLmsCourseId(String(event.target.value))}
              >
                {(customerLmsCourses?.assignableCourses || []).map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.title} ({course.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant='contained'
              onClick={handleAssignLmsCourse}
              disabled={!selectedLmsCourseId}
            >
              Asignar curso
            </Button>
          </Box>

          {isLoadingCustomerLmsCourses ? (
            <Box display='flex' justifyContent='center' alignItems='center' py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {(customerLmsCourses?.visibleCourses || []).length === 0 ? (
                <Typography color='text.secondary'>
                  Esta empresa no tiene cursos LMS visibles en este momento.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {(customerLmsCourses?.visibleCourses || []).map((course) => (
                    <Grid item xs={12} md={6} key={course.id}>
                      <Paper variant='outlined' sx={{ p: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                          <Box>
                            <Typography variant='subtitle1' fontWeight={600}>
                              {course.title}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {course.description}
                            </Typography>
                          </Box>
                          {!course.all_clients && (
                            <Button
                              color='error'
                              variant='outlined'
                              onClick={() => handleRemoveLmsCourse(course.id)}
                            >
                              Quitar
                            </Button>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={course.status === 'published' ? 'Publicado' : course.status === 'draft' ? 'Borrador' : 'Archivado'}
                            size='small'
                            variant='outlined'
                          />
                          <Chip
                            label={course.audience === 'both' ? 'Ambos' : 'Clientes'}
                            size='small'
                          />
                          <Chip
                            label={course.all_clients ? 'Todos los clientes' : 'Asignado por empresa'}
                            size='small'
                            color={course.all_clients ? 'default' : 'primary'}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}

              {(customerLmsCourses?.assignableCourses || []).length === 0 && (
                <Alert severity='success' sx={{ mt: 3 }}>
                  No hay más cursos específicos disponibles para asignar a esta empresa.
                </Alert>
              )}
            </>
          )}
        </Paper>
      )}
    </div>
  )
}

export default UserProfile
