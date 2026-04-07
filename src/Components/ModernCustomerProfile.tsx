import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Badge,
  useTheme,
  useMediaQuery,
  Container,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  Switch,
  SwitchProps,
  styled,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import {
  ArrowBack,
  Email,
  Phone,
  LocationOn,
  Download,
  Business,
  Schedule,
  People,
  Devices,
  Settings,
  TrendingUp,
  CalendarToday,
  Warning,
  CheckCircle,
  Search,
  Clear,
  Edit,
  HelpOutline,
  Add,
  School
} from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery, useQueryClient } from 'react-query'

// Import existing components
import TableUsersCustomer from './TableUsersCustomer'
import Headquarters from './Headquarters'
import CalibrationTimeline from './CalibrationTimeline'
import Modules from './Modules'
import EquipmentCard from './EquipmentCard'
import { CreateFileModal } from './TableFiles/CreateFileModal/CreateFileModal'

import { bigToast } from './ExcelManipulation/Utils'
import { MySwal } from '@utils/sweetAlert'

// API URL
const minioUrl = import.meta.env.VITE_MINIO_URL

// Interfaces
interface UserData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
  isActive: boolean
}

export interface Certificate {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  certificateTypeId: number
  createdAt: string
  updatedAt: string
  headquarter: string
  device: {
    id: number
    name: string
    createdAt: string
    updatedAt: string
  }
  searchMatches?: { field: string }[]
}

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

type TabValue =
  | 'overview'
  | 'equipment'
  | 'headquarters'
  | 'schedule'
  | 'users'
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

// Función para exportar a Excel
const exportToExcel = async (
  data: Certificate[],
  customerName: string = ''
) => {
  if (data.length === 0) {
    bigToast('No hay datos para exportar', 'info')
    return
  }

  const XLSX = await import('xlsx')

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

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  const columnWidths = [
    { wch: 20 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 }
  ]
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Equipos')

  const fileName = `inventario_equipos_${customerName || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
    bigToast('Archivo Excel descargado exitosamente', 'success')
  } catch (error) {
    console.error('Error al generar archivo Excel:', error)
    bigToast('Error al generar el archivo Excel', 'error')
  }
}

// Función para exportar reporte completo del cliente (Overview)
const exportOverviewReport = async (
  customerData: UserData,
  allEquipment: Certificate[],
  stats: { total: number; expired: number; upcoming: number; active: number }
) => {
  if (!customerData) {
    bigToast('No hay datos del cliente para exportar', 'error')
    return
  }

  const XLSX = await import('xlsx')

  const workbook = XLSX.utils.book_new()
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 1. Hoja de Información del Cliente
  const customerInfo = [
    ['REPORTE GENERAL DEL CLIENTE'],
    [''],
    ['Información del Cliente'],
    ['Nombre:', customerData.nombre],
    ['Email:', customerData.email],
    ['Teléfono:', customerData.telefono],
    [''],
    ['Sedes'],
    ...(customerData.sede?.map((sede) => ['', sede]) || []),
    [''],
    ['Estadísticas Generales'],
    ['Total de Equipos:', stats.total],
    ['Equipos Activos:', stats.active],
    ['Próximos a Vencer (30 días):', stats.upcoming],
    ['Equipos Vencidos:', stats.expired],
    [''],
    ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')]
  ]

  const wsCustomer = XLSX.utils.aoa_to_sheet(customerInfo)
  wsCustomer['!cols'] = [{ wch: 30 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, wsCustomer, 'Resumen Cliente')

  // 2. Hoja de Equipos Vencidos
  const expiredEquipment = allEquipment.filter((cert) => {
    if (!cert.nextCalibrationDate) return false
    return new Date(cert.nextCalibrationDate) < now
  })

  if (expiredEquipment.length > 0) {
    const expiredData = expiredEquipment.map((cert) => ({
      Sede: cert.headquarter || '',
      'Nombre del Equipo': cert.device?.name || '',
      'Activo Fijo': cert.activoFijo || '',
      Serie: cert.serie || '',
      'Última Calibración': cert.calibrationDate
        ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
        : '',
      'Fecha de Vencimiento': cert.nextCalibrationDate
        ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
        : '',
      'Días Vencido': cert.nextCalibrationDate
        ? Math.floor(
          (now.getTime() - new Date(cert.nextCalibrationDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        : ''
    }))

    const wsExpired = XLSX.utils.json_to_sheet(expiredData)
    wsExpired['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(workbook, wsExpired, 'Equipos Vencidos')
  }

  // 3. Hoja de Equipos Próximos a Vencer
  const upcomingEquipment = allEquipment.filter((cert) => {
    if (!cert.nextCalibrationDate) return false
    const nextDate = new Date(cert.nextCalibrationDate)
    return nextDate >= now && nextDate <= thirtyDaysFromNow
  })

  if (upcomingEquipment.length > 0) {
    const upcomingData = upcomingEquipment.map((cert) => ({
      Sede: cert.headquarter || '',
      'Nombre del Equipo': cert.device?.name || '',
      'Activo Fijo': cert.activoFijo || '',
      Serie: cert.serie || '',
      'Última Calibración': cert.calibrationDate
        ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
        : '',
      'Próxima Calibración': cert.nextCalibrationDate
        ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
        : '',
      'Días Restantes': cert.nextCalibrationDate
        ? Math.floor(
          (new Date(cert.nextCalibrationDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
        )
        : ''
    }))

    const wsUpcoming = XLSX.utils.json_to_sheet(upcomingData)
    wsUpcoming['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(workbook, wsUpcoming, 'Próximos a Vencer')
  }

  // 4. Hoja de Todos los Equipos
  if (allEquipment.length > 0) {
    const allEquipmentData = allEquipment.map((cert) => {
      const getStatus = () => {
        if (!cert.nextCalibrationDate) return 'Sin fecha'
        const nextDate = new Date(cert.nextCalibrationDate)
        if (nextDate < now) return 'Vencido'
        if (nextDate <= thirtyDaysFromNow) return 'Próximo a vencer'
        return 'Activo'
      }

      return {
        Sede: cert.headquarter || '',
        'Nombre del Equipo': cert.device?.name || '',
        'Activo Fijo': cert.activoFijo || '',
        Serie: cert.serie || '',
        'Última Calibración': cert.calibrationDate
          ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
          : '',
        'Próxima Calibración': cert.nextCalibrationDate
          ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
          : '',
        Estado: getStatus()
      }
    })

    const wsAll = XLSX.utils.json_to_sheet(allEquipmentData)
    wsAll['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    wsAll['!autofilter'] = { ref: wsAll['!ref'] || 'A1' }
    XLSX.utils.book_append_sheet(workbook, wsAll, 'Todos los Equipos')
  }

  // Configurar propiedades del archivo
  workbook.Props = {
    Title: `Reporte General - ${customerData.nombre}`,
    Subject: 'Reporte completo del cliente',
    Author: 'Sistema de Gestión MetroMedics',
    CreatedDate: new Date()
  }

  // Generar el archivo
  const fileName = `reporte_completo_${customerData.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
    bigToast('Reporte completo descargado exitosamente', 'success')
  } catch (error) {
    console.error('Error al generar reporte completo:', error)
    bigToast('Error al generar el reporte completo', 'error')
  }
}

// Modern Switch Component
const ModernSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName='Mui-focusVisible' disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#10b981',
        opacity: 1,
        border: 0
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5
      }
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff'
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600]
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3
    }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500
    })
  }
}))

// Modern Customer Profile Component
const ModernCustomerProfile: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)
  const queryClient = useQueryClient()
  const canManageLmsCourses = $userStore.rol.includes('admin')

  // State
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const tabParam = searchParams.get('tab')
    const validTabs: TabValue[] = [
      'overview',
      'equipment',
      'headquarters',
      'schedule',
      'users',
      'modules',
      'lmsCourses'
    ]
    return validTabs.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : 'equipment'
  })

  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [image, setImage] = useState('/images/pngaaa.com-4811116.png')
  const [selectedSede, setSelectedSede] = useState<string | null>('')
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLmsCourseId, setSelectedLmsCourseId] = useState('')

  // Fetch customer data
  const { data: customerData, isLoading: loadingCustomer } = useQuery<UserData>(
    ['customer-data', id],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/customers/${id}`)
      return response.data
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        if (data.avatar) {
          setImage(`${minioUrl}/images/${data.avatar}`)
        }
      }
    }
  )

  const preSelectedCustomerData = React.useMemo(() => {
    if (!customerData) return undefined
    return {
      id: Number(id),
      nombre: customerData.nombre,
      sede: customerData.sede
    }
  }, [id, customerData])

  // Fetch certificates data (paginado)
  const { data: apiResponse, refetch } = useQuery<ApiResponse>(
    ['certificates-data', id, searchTerm, currentPage],
    async () => {
      if (!id) throw new Error('No customer ID provided')
      const response = await axiosPrivate.get(`/files/customer/${id}`, {
        params: { search: searchTerm, page: currentPage }
      })
      return response.data
    },
    { enabled: !!id }
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

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!apiResponse?.files)
      return { total: 0, expired: 0, upcoming: 0, active: 0 }

    return {
      total: apiResponse.statistics.total || 0,
      expired: apiResponse.statistics?.expired || 0,
      upcoming: apiResponse.statistics?.expiringSoon || 0,
      active: apiResponse.statistics?.active || 0
    }
  }, [apiResponse])

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
          queryClient.invalidateQueries(['certificates-data', id])
        }
      } catch (error) {
        console.error('Error al eliminar el certificado:', error)
        bigToast('Error al eliminar el certificado', 'error')
      }
    },
    [axiosPrivate, refetch, queryClient, id]
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
            headers: { 'Content-Type': 'multipart/form-data' }
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
          queryClient.invalidateQueries(['customer-data', id])
        }
      } catch (error) {
        console.error('Error al agregar sede:', error)
        bigToast('Error al agregar sede', 'error')
      }
    },
    [axiosPrivate, id, queryClient]
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
          queryClient.invalidateQueries(['customer-data', id])
        }
      } catch (error) {
        console.error('Error al actualizar sede:', error)
        bigToast('Error al actualizar sede', 'error')
      }
    },
    [axiosPrivate, id, queryClient]
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

  const handleStatusChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newStatus = event.target.checked
    if (!customerData || !id) return

    try {
      await axiosPrivate.put(`/customers/${id}`, { isActive: newStatus })
      queryClient.invalidateQueries(['customer-data', id])
      bigToast(
        `Cliente ${newStatus ? 'activado' : 'desactivado'} con éxito`,
        'success'
      )
    } catch (error) {
      console.error('Error updating customer status:', error)
      bigToast('Error al actualizar el estado del cliente', 'error')
      queryClient.invalidateQueries(['customer-data', id])
    }
  }

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
      const allData = await fetchAllDataForDownload(type)
      if (allData.length === 0) {
        bigToast('No hay datos para exportar', 'info')
      } else {
        await exportToExcel(allData, customerData?.nombre)
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      bigToast('Error al descargar el archivo Excel', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadOverviewReport = async () => {
    if (!customerData) {
      bigToast('No hay datos del cliente disponibles', 'error')
      return
    }

    setIsDownloading(true)
    try {
      const allData = await fetchAllDataForDownload('all')
      await exportOverviewReport(customerData, allData, stats)
    } catch (error) {
      console.error('Error al descargar reporte completo:', error)
      bigToast('Error al descargar el reporte completo', 'error')
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
    } catch (error) {
      console.error('Error al asignar curso LMS:', error)
      bigToast('Error al asignar el curso LMS', 'error')
    }
  }, [axiosPrivate, id, queryClient, selectedLmsCourseId])

  const handleRemoveLmsCourse = useCallback(
    async (courseId: number) => {
      if (!id) return

      try {
        await axiosPrivate.delete(`/customers/${id}/lms-courses/${courseId}`)
        bigToast('Curso LMS removido con éxito', 'success')
        queryClient.invalidateQueries(['customer-lms-courses', id])
      } catch (error) {
        console.error('Error al quitar curso LMS:', error)
        bigToast('Error al quitar el curso LMS', 'error')
      }
    },
    [axiosPrivate, id, queryClient]
  )

  const handleTabChange = useCallback(
    (newTab: TabValue) => {
      console.log('handleTabChange called:', { currentTab: activeTab, newTab })
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('tab', newTab)
      setSearchParams(newSearchParams)
      setActiveTab(newTab)
      console.log('Tab changed to:', newTab)
    },
    [searchParams, setSearchParams, activeTab]
  )

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
      handleTabChange('equipment')
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

  const isAdmin = $userStore.rol.some((role) =>
    ['admin', 'metrologist'].includes(role)
  )



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

  const matchedFields = getMatchedFields(apiResponse?.files ?? [])

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='60vh'
        >
          <CircularProgress size={60} />
          <Typography variant='h6' sx={{ ml: 2 }}>
            Cargando...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (!hasPermission) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error'>
          No tienes permisos suficientes para acceder a esta página.
        </Alert>
      </Container>
    )
  }

  if (loadingCustomer) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='60vh'
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' sx={{ py: 2 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <IconButton
          onClick={() => navigate('/customers')}
          sx={{
            mb: 2,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
          }}
        >
          <ArrowBack sx={{ color: '#10b981' }} />
        </IconButton>
      </Box>

      {/* Customer Profile Header */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }}
        />

        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} md={4}>
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                textAlign='center'
              >
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <label htmlFor='imageInput' style={{ cursor: 'pointer' }}>
                    <Avatar
                      src={image}
                      sx={{
                        width: 120,
                        height: 120,
                        border: '4px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s ease-in-out'
                        }
                      }}
                    >
                      {customerData?.nombre?.charAt(0)}
                    </Avatar>
                  </label>
                  <input
                    type='file'
                    id='imageInput'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {isAdmin && (
                    <Tooltip title='Cambiar imagen'>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          '&:hover': { backgroundColor: 'white' }
                        }}
                        size='small'
                      >
                        <Edit fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant='h4' fontWeight='bold' gutterBottom>
                  {customerData?.nombre}
                </Typography>
                {/* Status Switch */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {customerData?.isActive
                      ? 'Cliente Activo'
                      : 'Cliente Inactivo'}
                  </Typography>
                  <ModernSwitch
                    checked={customerData?.isActive || false}
                    onChange={handleStatusChange}
                    disabled={!isAdmin}
                  />
                </Box>{' '}
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display='flex' alignItems='center' mb={2}>
                    <Email sx={{ mr: 2, opacity: 0.8 }} />
                    <Box>
                      <Typography variant='body2' sx={{ opacity: 0.8 }}>
                        Email
                      </Typography>
                      <Typography variant='body1' fontWeight='500'>
                        {customerData?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display='flex' alignItems='center' mb={2}>
                    <Phone sx={{ mr: 2, opacity: 0.8 }} />
                    <Box>
                      <Typography variant='body2' sx={{ opacity: 0.8 }}>
                        Teléfono
                      </Typography>
                      <Typography variant='body1' fontWeight='500'>
                        {customerData?.telefono}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box display='flex' alignItems='flex-start'>
                    <LocationOn sx={{ mr: 2, mt: 0.5, opacity: 0.8 }} />
                    <Box>
                      <Typography variant='body2' sx={{ opacity: 0.8, mb: 1 }}>
                        Sedes ({customerData?.sede?.length || 0})
                      </Typography>
                      <Box display='flex' flexWrap='wrap' gap={1}>
                        {customerData?.sede?.slice(0, 3).map((sede, index) => (
                          <Chip
                            key={index}
                            label={sede}
                            size='small'
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                        {(customerData?.sede?.length || 0) > 3 && (
                          <Chip
                            label={`+${(customerData?.sede?.length || 0) - 3} más`}
                            size='small'
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Devices sx={{ color: '#1976d2', fontSize: 24 }} />
              </Box>
              <Typography variant='h4' fontWeight='bold' color='primary'>
                {stats.total}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Total Equipos
                </Typography>
                <Tooltip
                  title='Número total de equipos registrados para este cliente'
                  arrow
                >
                  <HelpOutline
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#ffebee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Warning sx={{ color: '#d32f2f', fontSize: 24 }} />
              </Box>
              <Typography variant='h4' fontWeight='bold' color='error'>
                {stats.expired}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Vencidos
                </Typography>
                <Tooltip
                  title='Calibraciones que ya han vencido y requieren atención inmediata'
                  arrow
                >
                  <HelpOutline
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#fff3e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Schedule sx={{ color: '#f57c00', fontSize: 24 }} />
              </Box>
              <Typography variant='h4' fontWeight='bold' color='warning.main'>
                {stats.upcoming}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Próximos
                </Typography>
                <Tooltip
                  title='Calibraciones próximas a vencer (dentro de 30 días) que requieren programación'
                  arrow
                >
                  <HelpOutline
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#e8f5e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <CheckCircle sx={{ color: '#2e7d32', fontSize: 24 }} />
              </Box>
              <Typography variant='h4' fontWeight='bold' color='success.main'>
                {stats.active}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Typography variant='body2' color='text.secondary'>
                  Activos
                </Typography>
                <Tooltip
                  title='Calibraciones vigentes con más de 30 días restantes hasta su vencimiento'
                  arrow
                >
                  <HelpOutline
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Card
        elevation={0}
        sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', mb: 3 }}
      >
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => {
            console.log('Tabs onChange triggered:', {
              event,
              newValue,
              currentActiveTab: activeTab
            })
            handleTabChange(newValue)
          }}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons='auto'
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 64,
              '&.Mui-selected': {
                color: '#10b981'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#10b981',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            value='overview'
            label='Resumen'
            icon={<TrendingUp />}
            iconPosition='start'
          />
          <Tab
            value='equipment'
            label='Equipos'
            icon={
              <Badge badgeContent={stats.total} color='primary'>
                <Devices />
              </Badge>
            }
            iconPosition='start'
          />
          <Tab
            value='headquarters'
            label='Sedes'
            icon={
              <Badge
                badgeContent={customerData?.sede?.length || 0}
                color='primary'
              >
                <Business />
              </Badge>
            }
            iconPosition='start'
          />
          <Tab
            value='schedule'
            label='Programación'
            icon={<CalendarToday />}
            iconPosition='start'
          />
          {isAdmin && (
            <Tab
              value='users'
              label='Usuarios'
              icon={<People />}
              iconPosition='start'
              onClick={() => {
                console.log('Users tab clicked directly')
                handleTabChange('users')
              }}
            />
          )}
          {isAdmin && (
            <Tab
              value='modules'
              label='Módulos'
              icon={<Settings />}
              iconPosition='start'
              onClick={() => {
                console.log('Modules tab clicked directly')
                handleTabChange('modules')
              }}
            />
          )}
          {canManageLmsCourses && (
            <Tab
              value='lmsCourses'
              label='Academia'
              icon={<School />}
              iconPosition='start'
              onClick={() => {
                handleTabChange('lmsCourses')
              }}
            />
          )}
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          minHeight: '400px'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {activeTab === 'overview' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Resumen del Cliente
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Vista general de la información y estadísticas del cliente.
              </Typography>

              {/* Quick Actions */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<Devices />}
                    onClick={() => handleTabChange('equipment')}
                    sx={{
                      py: 2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Ver Equipos
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant='outlined'
                    startIcon={<CalendarToday />}
                    onClick={() => handleTabChange('schedule')}
                    sx={{
                      py: 2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Ver Programación
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant='contained'
                    startIcon={
                      isDownloading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Download />
                      )
                    }
                    onClick={handleDownloadOverviewReport}
                    disabled={isDownloading}
                    sx={{
                      py: 2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      background:
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      }
                    }}
                  >
                    {isDownloading
                      ? 'Generando Reporte...'
                      : 'Descargar Reporte'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 'equipment' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Gestión de Equipos
              </Typography>

              {/* Advanced Search and Filters */}
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px'
                }}
              >
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
                              <IconButton
                                onClick={clearSearch}
                                edge='end'
                                size='small'
                              >
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
                      {isAdmin && (
                        <Button
                          fullWidth
                          variant='contained'
                          startIcon={<Add />}
                          onClick={() => setIsCreateModalOpen(true)}
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
                          isDownloading ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Download />
                          )
                        }
                        onClick={handleDownloadMenuClick}
                        disabled={isDownloading}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5,
                          background:
                            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                        <MenuItem
                          onClick={() => handleDownloadOption('nextOrExpired')}
                        >
                          ⚠️ Próximos a vencer / Vencidos
                        </MenuItem>
                      </Menu>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box display='flex' alignItems='center' gap={1} justifyContent='flex-end'>
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
                          🔍 Resultados para "<strong>{searchTerm}</strong>"
                          encontrados en: {matchedFields.join(', ')}
                        </Typography>
                      </Box>
                    )}
                </CardContent>
              </Card>

              {/* Equipment Grid */}
              {!apiResponse ? (
                <Box
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  py={8}
                >
                  <CircularProgress
                    size={60}
                    sx={{ color: '#10b981', mb: 2 }}
                  />
                  <Typography variant='h6' color='text.secondary' gutterBottom>
                    Cargando equipos...
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Obteniendo información de los equipos del cliente
                  </Typography>
                </Box>
              ) : certificatesData.length === 0 ? (
                <Card
                  elevation={0}
                  sx={{ border: '2px dashed #d1d5db', borderRadius: '16px' }}
                >
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
                      <Devices sx={{ fontSize: 40, color: '#9ca3af' }} />
                    </Box>
                    <Typography
                      variant='h6'
                      color='text.secondary'
                      gutterBottom
                    >
                      {searchTerm
                        ? 'No se encontraron equipos'
                        : 'No hay equipos registrados'}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      paragraph
                    >
                      {searchTerm
                        ? 'Intenta con otros términos de búsqueda o verifica los filtros aplicados'
                        : 'Este cliente aún no tiene equipos registrados en el sistema'}
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
                  {/* Equipment Cards Grid */}
                  <Grid container spacing={3}>
                    {certificatesData.map((certificate: Certificate) => (
                      <Grid item xs={12} sm={6} lg={4} key={certificate.id}>
                        <EquipmentCard
                          certificate={certificate}
                          onDelete={handleDelete}
                          sedes={customerData?.sede || []}
                          rol={$userStore.rol}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Modern Pagination */}
                  <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    mt={6}
                  >
                    <Card
                      elevation={0}
                      sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 2
                        }}
                      >
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
                          disabled={
                            currentPage === (apiResponse?.totalPages || 1)
                          }
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
            </Box>
          )}

          {activeTab === 'headquarters' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Sedes del Cliente
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Gestiona las diferentes sedes y ubicaciones del cliente.
              </Typography>

              <Headquarters
                setSelectedSede={setSelectedSede}
                selectedSede={selectedSede}
                sedes={customerData?.sede || []}
                onDelete={handleDelete}
                onDeleteSede={handleDeleteSede}
                onAddSede={handleAddSede}
                onEditSede={handleEditSede}
              />
            </Box>
          )}

          {activeTab === 'schedule' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Programación de Calibraciones
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Visualiza y gestiona el cronograma de calibraciones.
              </Typography>

              {id && <CalibrationTimeline customerId={id} />}
            </Box>
          )}

          {activeTab === 'users' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Usuarios del Cliente
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Administra los usuarios asociados a este cliente.
              </Typography>

              {!isAdmin ? (
                <Alert severity='warning' sx={{ mt: 3 }}>
                  No tienes permisos para ver esta sección. Solo administradores
                  y metrólogos pueden acceder.
                </Alert>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <React.Suspense
                    fallback={
                      <Box display='flex' justifyContent='center' py={4}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>
                          Cargando usuarios...
                        </Typography>
                      </Box>
                    }
                  >
                    <TableUsersCustomer />
                  </React.Suspense>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 'modules' && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Módulos del Cliente
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Configura los módulos y funcionalidades disponibles.
              </Typography>

              {!isAdmin ? (
                <Alert severity='warning' sx={{ mt: 3 }}>
                  No tienes permisos para ver esta sección. Solo administradores
                  y metrólogos pueden acceder.
                </Alert>
              ) : !id ? (
                <Alert severity='error' sx={{ mt: 3 }}>
                  Error: ID de cliente no disponible
                </Alert>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <React.Suspense
                    fallback={
                      <Box display='flex' justifyContent='center' py={4}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>
                          Cargando módulos...
                        </Typography>
                      </Box>
                    }
                  >
                    <Modules customerId={id} />
                  </React.Suspense>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 'lmsCourses' && canManageLmsCourses && (
            <Box>
              <Typography variant='h5' fontWeight='bold' gutterBottom>
                Cursos LMS del cliente
              </Typography>
              <Typography variant='body1' color='text.secondary' paragraph>
                Gestiona los cursos LMS visibles para esta empresa. Los cursos abiertos para todos los clientes se muestran aquí, pero no se pueden modificar manualmente.
              </Typography>

              <Alert severity='info' sx={{ mb: 3 }}>
                Desde esta pestaña solo se pueden asignar o quitar cursos habilitados para clientes específicos.
              </Alert>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-end',
                  mb: 3,
                  flexWrap: 'wrap'
                }}
              >
                <FormControl sx={{ minWidth: 320 }}>
                  <InputLabel htmlFor='customer-lms-course-select'>
                    Asignar curso específico
                  </InputLabel>
                  <Select
                    native
                    value={selectedLmsCourseId}
                    label='Asignar curso específico'
                    inputProps={{ id: 'customer-lms-course-select' }}
                    onChange={(event) =>
                      setSelectedLmsCourseId(String(event.target.value))
                    }
                  >
                    <option value=''></option>
                    {(customerLmsCourses?.assignableCourses || []).map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.title} ({course.status})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant='contained'
                  startIcon={<Add />}
                  onClick={handleAssignLmsCourse}
                  disabled={!selectedLmsCourseId}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Asignar curso
                </Button>
              </Box>

              {isLoadingCustomerLmsCourses ? (
                <Box display='flex' justifyContent='center' alignItems='center' py={6}>
                  <CircularProgress />
                </Box>
              ) : (customerLmsCourses?.visibleCourses || []).length === 0 ? (
                <Typography color='text.secondary'>
                  Esta empresa no tiene cursos LMS visibles en este momento.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {(customerLmsCourses?.visibleCourses || []).map((course) => (
                    <Grid item xs={12} md={6} key={course.id}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: '16px',
                          border: '1px solid #e5e7eb',
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 2,
                              mb: 1.5
                            }}
                          >
                            <Box>
                              <Typography variant='subtitle1' fontWeight={700}>
                                {course.title}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {course.description || 'Sin descripcion'}
                              </Typography>
                            </Box>
                            {!course.all_clients && (
                              <Button
                                color='error'
                                variant='outlined'
                                onClick={() => handleRemoveLmsCourse(course.id)}
                                sx={{ textTransform: 'none', height: 'fit-content' }}
                              >
                                Quitar
                              </Button>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={
                                course.status === 'published'
                                  ? 'Publicado'
                                  : course.status === 'draft'
                                    ? 'Borrador'
                                    : 'Archivado'
                              }
                              size='small'
                              variant='outlined'
                            />
                            <Chip
                              label={
                                course.all_clients
                                  ? 'Todos los clientes'
                                  : 'Asignado por empresa'
                              }
                              size='small'
                              color={course.all_clients ? 'success' : 'primary'}
                            />
                            <Chip
                              label={
                                course.audience === 'both'
                                  ? 'Internos y clientes'
                                  : 'Solo clientes'
                              }
                              size='small'
                              variant='outlined'
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      {/* Create File Modal */}
      {customerData && (
        <CreateFileModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          fetchFiles={async () => {
            await refetch()
          }}
          axiosPrivate={axiosPrivate}
          preSelectedCustomer={preSelectedCustomerData}
        />
      )}
    </Container>
  )
}

export default ModernCustomerProfile
