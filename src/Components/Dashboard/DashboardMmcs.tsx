import React, { useState, useEffect, useMemo } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Avatar,
  Paper,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  Business as BusinessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import DashboardTable from './DashboardMmcsTable'
import DashboardCards from './DashboardMmcsCards'
import Swal from 'sweetalert2'

interface Device {
  id: number
  name: string
  formatId: number | null
  certificateTemplateId: number
  magnitude: string
  unit: string
  createdAt: string
  updatedAt: string
}

interface Certificado {
  id: number
  city: string
  location: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  device: Device
}

interface Customer {
  id: number
  nombre: string
  identificacion: string
  direccion: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  certificados: Certificado[]
}

/**
 * Dashboard de Certificados por Vencer - Componente Principal con Alternador de Vistas
 * 
 * Este componente permite alternar dinámicamente entre dos vistas:
 * - Vista de Tabla: Análisis detallado con MaterialReactTable
 * - Vista de Cards: Navegación visual con cards responsivos
 * 
 * Ambas vistas comparten las mismas estadísticas y funcionalidades base.
 */
const Dashboard: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [tableData, setTableData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch files data
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/files/next-to-expire-grouped`, {})
      setTableData(response.data || [])
    } catch (error) {
      console.error('Error fetching file data:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los datos de certificados',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFiles()
    setRefreshing(false)
    Swal.fire({
      title: '¡Actualizado!',
      text: 'Los datos han sido actualizados',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = tableData.length
    const totalCertificates = tableData.reduce((acc, customer) => acc + customer.certificados.length, 0)
    
    let expiredCount = 0
    let soonToExpireCount = 0
    
    tableData.forEach(customer => {
      customer.certificados.forEach(cert => {
        const now = new Date()
        const nextDate = new Date(cert.nextCalibrationDate)
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        if (nextDate < now) {
          expiredCount++
        } else if (nextDate <= thirtyDaysFromNow) {
          soonToExpireCount++
        }
      })
    })

    return {
      totalCustomers,
      totalCertificates,
      expiredCount,
      soonToExpireCount
    }
  }, [tableData])

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: 'table' | 'cards'
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={400} height={40} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    )
  }

  if (tableData.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 8, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
            ¡Excelente!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#388e3c' }}>
            Certificados al Día
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Todos los certificados están vigentes. No hay certificados vencidos o próximos a vencer.
          </Typography>
          <img
            src='/images/tick.png'
            alt='Certificados al dia'
            style={{ maxWidth: '200px', opacity: 0.8 }}
          />
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box component="header" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ 
                bgcolor: '#ff5722', 
                mr: 2,
                width: 48,
                height: 48
              }}
            >
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Certificados por Vencer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clientes con certificados vencidos o próximos a vencer
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title="Actualizar datos">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: '#f5f5f5',
                  '&:hover': {
                    bgcolor: '#e0e0e0'
                  }
                }}
              >
                <RefreshIcon sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="Vista del dashboard"
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '1px solid #e0e0e0',
                  '&.Mui-selected': {
                    bgcolor: '#ff5722',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#e64a19'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="table" aria-label="Vista de tabla">
                <Tooltip title="Vista de tabla">
                  <TableRowsIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="cards" aria-label="Vista de cards">
                <Tooltip title="Vista de cards">
                  <ViewModuleIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards - Always visible */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Total Clientes
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalCustomers}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Total Certificados
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.totalCertificates}
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Próximos a Vencer
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.soonToExpireCount}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
              color: 'white',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Vencidos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.expiredCount}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dynamic Content Based on View Mode */}
      {viewMode === 'table' ? (
        <DashboardTable />
      ) : (
        <DashboardCards />
      )}
    </Container>
  )
}

export default Dashboard
