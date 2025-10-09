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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Delete,
  HelpOutline
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

import { bigToast } from './ExcelManipulation/Utils'
import * as XLSX from 'xlsx'

// API URL
const minioUrl = import.meta.env.VITE_MINIO_URL

// Interfaces
interface UserData {
  nombre: string
  email: string
  telefono: string
  avatar?: string
  sede: string[]
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
}

type TabValue = 'overview' | 'equipment' | 'headquarters' | 'schedule' | 'users' | 'modules'

// Función para exportar a Excel
const exportToExcel = (data: Certificate[], customerName: string = '') => {
  if (data.length === 0) {
    bigToast('No hay datos para exportar', 'info')
    return
  }

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
    { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 20 }
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

  // State
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const tabParam = searchParams.get('tab')
    const validTabs: TabValue[] = ['overview', 'equipment', 'headquarters', 'schedule', 'users', 'modules']
    return validTabs.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'equipment'
  })
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [image, setImage] = useState('/images/pngaaa.com-4811116.png')
  const [selectedSede, setSelectedSede] = useState<string | null>('')
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

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

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!apiResponse?.files) return { total: 0, expired: 0, upcoming: 0, active: 0 }
    
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    let expired = 0
    let upcoming = 0
    let active = 0
    
    apiResponse.files.forEach(cert => {
      if (cert.nextCalibrationDate) {
        const nextDate = new Date(cert.nextCalibrationDate)
        if (nextDate < now) {
          expired++
        } else if (nextDate <= thirtyDaysFromNow) {
          upcoming++
        } else {
          active++
        }
      }
    })
    
    return {
      total: apiResponse.totalFiles || 0,
      expired,
      upcoming,
      active
    }
  }, [apiResponse])

  // Función para obtener todos los datos para descarga
  const fetchAllDataForDownload = useCallback(
    async (filterType: 'all' | 'nextOrExpired') => {
      if (!id) throw new Error('No customer ID provided')
      const params: Record<string, unknown> = { all: true }
      if (filterType === 'nextOrExpired') params.filter = 'nextOrExpired'
      const response = await axiosPrivate.get(`/files/customer/${id}`, { params })
      return response.data.files || []
    },
    [axiosPrivate, id]
  )

  const handleDelete = useCallback(
    async (certificateId: number) => {
      const isConfirmed = window.confirm(
        '¿Estás seguro de que deseas eliminar este certificado? Esta acción no se puede deshacer.'
      )

      if (!isConfirmed) return

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

  const handleDownloadMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
        exportToExcel(allData, customerData?.nombre)
      }
    } catch (error) {
      console.error('Error al descargar Excel:', error)
      bigToast('Error al descargar el archivo Excel', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleTabChange = useCallback((newTab: TabValue) => {
    console.log('handleTabChange called:', { currentTab: activeTab, newTab })
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', newTab)
    setSearchParams(newSearchParams)
    setActiveTab(newTab)
    console.log('Tab changed to:', newTab)
  }, [searchParams, setSearchParams, activeTab])

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

  // Permission check
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (
          $userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) ||
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

  const isAdmin = $userStore.rol.some((role) => ['admin', 'metrologist'].includes(role))
  
  // Debug logs
  console.log('ModernCustomerProfile Debug:', {
    activeTab,
    isAdmin,
    userRoles: $userStore.rol,
    customerId: id,
    searchParams: searchParams.toString()
  })

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Cargando...</Typography>
        </Box>
      </Container>
    )
  }

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          No tienes permisos suficientes para acceder a esta página.
        </Alert>
      </Container>
    )
  }

  if (loadingCustomer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
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
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <label htmlFor="imageInput" style={{ cursor: 'pointer' }}>
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
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {isAdmin && (
                    <Tooltip title="Cambiar imagen">
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          '&:hover': { backgroundColor: 'white' }
                        }}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {customerData?.nombre}
                </Typography>
                <Chip 
                  label="Cliente Activo" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600
                  }} 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Email sx={{ mr: 2, opacity: 0.8 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {customerData?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone sx={{ mr: 2, opacity: 0.8 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Teléfono
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {customerData?.telefono}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" alignItems="flex-start">
                    <LocationOn sx={{ mr: 2, mt: 0.5, opacity: 0.8 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Sedes ({customerData?.sede?.length || 0})
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {customerData?.sede?.slice(0, 3).map((sede, index) => (
                          <Chip
                            key={index}
                            label={sede}
                            size="small"
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
                            size="small"
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
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
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
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.total}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Equipos
                </Typography>
                <Tooltip title="Número total de equipos registrados para este cliente" arrow>
                  <HelpOutline sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
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
              <Typography variant="h4" fontWeight="bold" color="error">
                {stats.expired}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Vencidos
                </Typography>
                <Tooltip title="Calibraciones que ya han vencido y requieren atención inmediata" arrow>
                  <HelpOutline sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
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
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.upcoming}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Próximos
                </Typography>
                <Tooltip title="Calibraciones próximas a vencer (dentro de 30 días) que requieren programación" arrow>
                  <HelpOutline sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
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
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.active}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Activos
                </Typography>
                <Tooltip title="Calibraciones vigentes con más de 30 días restantes hasta su vencimiento" arrow>
                  <HelpOutline sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => {
            console.log('Tabs onChange triggered:', { event, newValue, currentActiveTab: activeTab })
            handleTabChange(newValue)
          }}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
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
            value="overview"
            label="Resumen"
            icon={<TrendingUp />}
            iconPosition="start"
          />
          <Tab
            value="equipment"
            label="Equipos"
            icon={<Badge badgeContent={stats.total} color="primary"><Devices /></Badge>}
            iconPosition="start"
          />
          <Tab
            value="headquarters"
            label="Sedes"
            icon={<Badge badgeContent={customerData?.sede?.length || 0} color="primary"><Business /></Badge>}
            iconPosition="start"
          />
          <Tab
            value="schedule"
            label="Programación"
            icon={<CalendarToday />}
            iconPosition="start"
          />
          {isAdmin && (
            <Tab
              value="users"
              label="Usuarios"
              icon={<People />}
              iconPosition="start"
              onClick={() => {
                console.log('Users tab clicked directly')
                handleTabChange('users')
              }}
            />
          )}
          {isAdmin && (
            <Tab
              value="modules"
              label="Módulos"
              icon={<Settings />}
              iconPosition="start"
              onClick={() => {
                console.log('Modules tab clicked directly')
                handleTabChange('modules')
              }}
            />
          )}
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', minHeight: '400px' }}>
        <CardContent sx={{ p: 4 }}>
          {activeTab === 'overview' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Resumen del Cliente
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Vista general de la información y estadísticas del cliente.
              </Typography>
              
              {/* Quick Actions */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
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
                    variant="outlined"
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
                    variant="contained"
                    startIcon={<Download />}
                    sx={{
                      py: 2,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}
                  >
                    Descargar Reporte
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 'equipment' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Gestión de Equipos
              </Typography>
              
              {/* Advanced Search and Filters */}
              <Card elevation={0} sx={{ mb: 3, border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por nombre, serie, activo fijo..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#10b981' }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm && (
                            <InputAdornment position="end">
                              <IconButton onClick={clearSearch} edge="end" size="small">
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
                        variant="contained"
                        startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />}
                        onClick={handleDownloadMenuClick}
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
                        onClose={handleMenuClose}
                        PaperProps={{
                          sx: { borderRadius: '12px', mt: 1 }
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
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          Total:
                        </Typography>
                        <Chip 
                          label={`${apiResponse?.totalFiles || 0} equipos`}
                          size="small"
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
                  {apiResponse && searchTerm && apiResponse?.totalFiles > 0 && matchedFields.length > 0 && (
                    <Box mt={2} p={2} sx={{ backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                      <Typography variant="body2" color="#0369a1">
                        🔍 Resultados para "<strong>{searchTerm}</strong>" encontrados en: {matchedFields.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Equipment Grid */}
              {!apiResponse ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={8}>
                  <CircularProgress size={60} sx={{ color: '#10b981', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Cargando equipos...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Obteniendo información de los equipos del cliente
                  </Typography>
                </Box>
              ) : certificatesData.length === 0 ? (
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
                      <Devices sx={{ fontSize: 40, color: '#9ca3af' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {searchTerm ? 'No se encontraron equipos' : 'No hay equipos registrados'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {searchTerm 
                        ? 'Intenta con otros términos de búsqueda o verifica los filtros aplicados'
                        : 'Este cliente aún no tiene equipos registrados en el sistema'
                      }
                    </Typography>
                    {searchTerm && (
                      <Button
                        variant="outlined"
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
                  <Box display="flex" justifyContent="center" alignItems="center" mt={6}>
                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                        <Button
                          variant="outlined"
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
                        
                        <Box display="flex" alignItems="center" gap={1} px={2}>
                          <Typography variant="body2" color="text.secondary">
                            Página
                          </Typography>
                          <Chip 
                            label={currentPage}
                            size="small"
                            sx={{ 
                              backgroundColor: '#10b981',
                              color: 'white',
                              fontWeight: 600,
                              minWidth: '32px'
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            de {apiResponse?.totalPages || 1}
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="outlined"
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
            </Box>
          )}

          {activeTab === 'headquarters' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Sedes del Cliente
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Gestiona las diferentes sedes y ubicaciones del cliente.
              </Typography>
              
              <Headquarters
                setSelectedSede={setSelectedSede}
                selectedSede={selectedSede}
                sedes={customerData?.sede || []}
                onDelete={handleDelete}
                onAddSede={handleAddSede}
                onEditSede={handleEditSede}
              />
            </Box>
          )}

          {activeTab === 'schedule' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Programación de Calibraciones
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Visualiza y gestiona el cronograma de calibraciones.
              </Typography>
              
              {id && <CalibrationTimeline customerId={id} />}
            </Box>
          )}

          {activeTab === 'users' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Usuarios del Cliente
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Administra los usuarios asociados a este cliente.
              </Typography>
              
              {!isAdmin ? (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  No tienes permisos para ver esta sección. Solo administradores y metrólogos pueden acceder.
                </Alert>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <React.Suspense fallback={
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Cargando usuarios...</Typography>
                    </Box>
                  }>
                    <TableUsersCustomer />
                  </React.Suspense>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 'modules' && (
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Módulos del Cliente
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Configura los módulos y funcionalidades disponibles.
              </Typography>
              
              {!isAdmin ? (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  No tienes permisos para ver esta sección. Solo administradores y metrólogos pueden acceder.
                </Alert>
              ) : !id ? (
                <Alert severity="error" sx={{ mt: 3 }}>
                  Error: ID de cliente no disponible
                </Alert>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <React.Suspense fallback={
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Cargando módulos...</Typography>
                    </Box>
                  }>
                    <Modules customerId={id} />
                  </React.Suspense>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

// Modern Equipment Card Component
interface EquipmentCardProps {
  certificate: Certificate
  onDelete: (id: number) => void
  sedes: string[]
  rol: string[]
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ certificate, onDelete, sedes, rol }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [sedeModalOpen, setSedeModalOpen] = useState(false)
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  
  // Calculate status based on calibration dates
  const getStatus = () => {
    if (!certificate.nextCalibrationDate) return { status: 'unknown', color: '#6b7280', bgColor: '#f9fafb', label: 'Sin fecha' }
    
    const now = new Date()
    const nextDate = new Date(certificate.nextCalibrationDate)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    if (nextDate < now) {
      return { status: 'expired', color: '#dc2626', bgColor: '#fef2f2', label: 'Vencido' }
    } else if (nextDate <= thirtyDaysFromNow) {
      return { status: 'warning', color: '#d97706', bgColor: '#fffbeb', label: 'Próximo a vencer' }
    } else {
      return { status: 'active', color: '#059669', bgColor: '#f0fdf4', label: 'Activo' }
    }
  }

  const status = getStatus()

  const handleCardClick = () => {
    // Navegar a los detalles del certificado
    navigate(`/calibraciones/certificados/${certificate.id}`)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el equipo "${certificate.device?.name || 'Sin nombre'}"? Esta acción no se puede deshacer.`
    )
    
    if (isConfirmed) {
      try {
        await onDelete(certificate.id)
        bigToast('Equipo eliminado exitosamente', 'success')
      } catch (error) {
        bigToast('Error al eliminar el equipo', 'error')
        console.error('Error deleting equipment:', error)
      }
    }
    handleMenuClose()
  }

  const handleChangeSede = () => {
    setSedeModalOpen(true)
    handleMenuClose()
  }

  const handleSedeChange = async (newSede: string) => {
    if (newSede === certificate.headquarter) {
      setSedeModalOpen(false)
      return
    }

    try {
      const response = await axiosPrivate.put(`/files/headquarter/${certificate.id}`, {
        headquarter: newSede
      })
      if (response.status === 200) {
        bigToast(`Sede cambiada a "${newSede}" exitosamente`, 'success')
        setSedeModalOpen(false)
        
        // Invalidate and refetch the certificates data using React Query
        queryClient.invalidateQueries(['certificates-data'])
        
        // Also trigger a gentle refresh of the component data
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      bigToast('Error al actualizar la sede', 'error')
      console.error('Error updating headquarter:', error)
    }
  }

  return (
    <>
      <Card 
        elevation={0} 
        onClick={handleCardClick}
        sx={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
            borderColor: '#10b981'
          }
        }}
      >
      <CardContent sx={{ p: 3 }}>
        {/* Header with Status */}
        { rol.some((role) => ['admin', 'metrologist'].includes(role)) && <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Chip
            label={status.label}
            size="small"
            sx={{
              backgroundColor: status.bgColor,
              color: status.color,
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          />
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            sx={{ 
              color: '#6b7280',
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <Settings fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
              sx: { borderRadius: '8px', minWidth: '180px' }
            }}
          >
            <MenuItem onClick={(e) => {
              e.stopPropagation()
              handleChangeSede()
            }}>
              <LocationOn fontSize="small" sx={{ mr: 1, color: '#059669' }} />
              Cambiar Sede
            </MenuItem>
            <MenuItem onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }} sx={{ color: '#dc2626' }}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              Eliminar
            </MenuItem>
          </Menu>
        </Box>}

        {/* Equipment Info */}
        <Box mb={3}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937', flex: 1 }}>
              {certificate.device?.name || 'Equipo sin nombre'}
            </Typography>
            {!certificate.filePath && (
              <Tooltip title="No hay certificado disponible">
                <Chip
                  label="Sin cert."
                  size="small"
                  sx={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
              </Tooltip>
            )}
          </Box>
          
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', fontWeight: 600 }}>
                Serie:
              </Typography>
              <Typography variant="body2" fontWeight="500" sx={{ color: certificate.serie ? '#374151' : '#9ca3af' }}>
                {certificate.serie || 'No especificada'}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', fontWeight: 600 }}>
                Activo:
              </Typography>
              <Typography variant="body2" fontWeight="500" sx={{ color: certificate.activoFijo ? '#374151' : '#9ca3af' }}>
                {certificate.activoFijo || 'No asignado'}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', fontWeight: 600 }}>
                Sede:
              </Typography>
              <Chip
                label={certificate.headquarter || 'Sin sede'}
                size="small"
                sx={{
                  backgroundColor: certificate.headquarter ? '#f0f9ff' : '#f9fafb',
                  color: certificate.headquarter ? '#1e40af' : '#6b7280',
                  fontSize: '0.75rem',
                  height: '24px',
                  fontWeight: 500
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Calibration Dates */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
            Información de Calibración
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Última Calibración
                </Typography>
                <Typography variant="body2" fontWeight="600" sx={{ color: '#374151' }}>
                  {certificate.calibrationDate 
                    ? new Date(certificate.calibrationDate).toLocaleDateString('es-ES')
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: status.bgColor, 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: `1px solid ${status.color}20`
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Próxima Calibración
                </Typography>
                <Typography variant="body2" fontWeight="600" sx={{ color: status.color }}>
                  {certificate.nextCalibrationDate 
                    ? new Date(certificate.nextCalibrationDate).toLocaleDateString('es-ES')
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

      </CardContent>
    </Card>

    {/* Modal para cambiar sede */}
    <Dialog
      open={sedeModalOpen}
      onClose={() => setSedeModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        fontWeight: 'bold',
        pb: 1,
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <LocationOn sx={{ color: '#10b981' }} />
          Cambiar Sede del Equipo
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Selecciona la nueva sede para: <strong>{certificate.device?.name}</strong>
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
          Sede actual: <Chip 
            label={certificate.headquarter || 'Sin sede'} 
            size="small" 
            sx={{ 
              backgroundColor: '#f0f9ff', 
              color: '#1e40af',
              fontWeight: 600
            }} 
          />
        </Typography>

        <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
          {sedes && sedes.length > 0 ? (
            sedes.map((sede) => (
              <Button
                key={sede}
                variant={certificate.headquarter === sede ? "contained" : "outlined"}
                onClick={() => handleSedeChange(sede)}
                disabled={certificate.headquarter === sede}
                startIcon={certificate.headquarter === sede ? <CheckCircle /> : <LocationOn />}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderRadius: '12px',
                  py: 1.5,
                  px: 2,
                  ...(certificate.headquarter === sede ? {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    }
                  } : {
                    borderColor: '#d1d5db',
                    color: '#374151',
                    '&:hover': {
                      borderColor: '#10b981',
                      backgroundColor: '#f0fdf4',
                      color: '#059669'
                    }
                  })
                }}
              >
                {sede}
                {certificate.headquarter === sede && (
                  <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.8 }}>
                    (Actual)
                  </Typography>
                )}
              </Button>
            ))
          ) : (
            <Box textAlign="center" py={3}>
              <Typography variant="body2" color="text.secondary">
                No hay sedes disponibles
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={() => setSedeModalOpen(false)}
          variant="outlined"
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  </>
  )
}

export default ModernCustomerProfile