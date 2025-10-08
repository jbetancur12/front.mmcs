import { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Skeleton,
  Fade,
  Chip,
  Avatar,
  Paper,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  GetApp as GetAppIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { differenceInDays, format } from 'date-fns'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { FileData } from '../TableFiles'
import { useParams, useNavigate, Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'

const Dashboard: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const [tableData, setTableData] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Fetch files data
  const fetchFiles = async () => {
    let customerId: null | number = null
    if ($userStore.customer?.id || id) {
      customerId = $userStore.customer?.id || Number(id)
    }
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/files/next-to-expire`, {
        params: {
          customerId: customerId
        }
      })
      setTableData(response.data || [])
      
      // Get customer info from first record
      if (response.data && response.data.length > 0) {
        setCustomerInfo(response.data[0].customer)
      }
    } catch (error) {
      console.error('Error fetching file data:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los certificados del cliente',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [id])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCertificates = tableData.length
    let expiredCount = 0
    let soonToExpireCount = 0
    let activeCount = 0
    
    tableData.forEach(cert => {
      const now = new Date()
      const nextDate = new Date(cert.nextCalibrationDate)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      if (nextDate < now) {
        expiredCount++
      } else if (nextDate <= thirtyDaysFromNow) {
        soonToExpireCount++
      } else {
        activeCount++
      }
    })

    return {
      totalCertificates,
      expiredCount,
      soonToExpireCount,
      activeCount
    }
  }, [tableData])

  const getCertificateStatus = (cert: FileData) => {
    const now = new Date()
    const nextDate = new Date(cert.nextCalibrationDate)
    const daysRemaining = differenceInDays(nextDate, now)
    
    if (daysRemaining < 0) {
      return { 
        status: 'expired', 
        color: '#d32f2f', 
        bgColor: '#ffebee', 
        label: 'Vencido', 
        icon: ErrorIcon,
        daysText: 'VENCIDO'
      }
    } else if (daysRemaining <= 30) {
      return { 
        status: 'warning', 
        color: '#f57c00', 
        bgColor: '#fff3e0', 
        label: 'Próximo a Vencer', 
        icon: WarningIcon,
        daysText: `${daysRemaining} días restantes`
      }
    } else {
      return { 
        status: 'active', 
        color: '#388e3c', 
        bgColor: '#e8f5e8', 
        label: 'Vigente', 
        icon: CheckCircleIcon,
        daysText: `${daysRemaining} días restantes`
      }
    }
  }

  const handleExportExcel = () => {
    if (tableData.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay certificados para exportar',
        icon: 'info',
        confirmButtonText: 'Entendido'
      })
      return
    }

    const exportData = tableData.map((row) => ({
      'Compañía': row.customer?.nombre || '',
      'Equipo': row.device?.name || '',
      'Tipo de Certificado': row.certificateType?.name || '',
      'Ciudad': row.city,
      'Ubicación': row.location,
      'Sede': row.sede,
      'Activo Fijo': row.activoFijo,
      'Serie': row.serie,
      'Fecha de Calibración': row.calibrationDate
        ? format(new Date(row.calibrationDate), 'dd/MM/yyyy')
        : '',
      'Próxima Fecha de Calibración': row.nextCalibrationDate
        ? format(new Date(row.nextCalibrationDate), 'dd/MM/yyyy')
        : '',
      'Estado': getCertificateStatus(row).label,
      'Días Restantes': getCertificateStatus(row).daysText
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados')
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' })
    const fileName = `${customerInfo?.nombre || 'Cliente'}-certificados-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    saveAs(data, fileName)
    
    Swal.fire({
      title: '¡Exportado!',
      text: 'El archivo Excel ha sido descargado exitosamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  }

  const columns = useMemo<MRT_ColumnDef<FileData>[]>(() => [
    {
      accessorKey: 'device.name',
      header: 'Equipo',
      size: 200,
      enableEditing: false,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: '#2196f3', 
              width: 32,
              height: 32
            }}
          >
            <AssignmentIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="600">
              {row.original.device?.name || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Serie: {row.original.serie || 'N/A'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      accessorKey: 'nextCalibrationDate',
      header: 'Estado y Próxima Calibración',
      size: 280,
      Cell: ({ row }) => {
        const status = getCertificateStatus(row.original)
        const formattedDate = format(new Date(row.original.nextCalibrationDate), 'dd/MM/yyyy')

        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <status.icon sx={{ fontSize: 20, color: status.color, mr: 1 }} />
              <Typography variant="body2" fontWeight="600" sx={{ color: status.color }}>
                {status.label}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📅 {formattedDate}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: status.status === 'expired' ? '#d32f2f' : 'text.secondary',
                fontWeight: status.status === 'expired' ? 'bold' : 'normal'
              }}
            >
              {status.daysText}
            </Typography>
          </Box>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      size: 180,
      enableEditing: false,
      Cell: ({ row }) => (
        <Box>
          <Typography variant="body2">
            📍 {row.original.city}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.original.location}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {row.original.sede}
          </Typography>
        </Box>
      ),
    },
    {
      accessorKey: 'calibrationDate',
      header: 'Última Calibración',
      size: 150,
      Cell: ({ cell }) => {
        const date = cell.getValue<string>()
        return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A'
      },
    },
    {
      accessorKey: 'certificateType.name',
      header: 'Tipo',
      size: 150,
      enableEditing: false,
      Cell: ({ row }) => (
        <Chip
          label={row.original.certificateType?.name || 'N/A'}
          size="small"
          sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
        />
      ),
    }
  ], [])

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
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/dashboard" color="inherit">
            Dashboard
          </MuiLink>
          <Typography color="text.primary">
            {customerInfo?.nombre || 'Cliente'}
          </Typography>
        </Breadcrumbs>

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
            {customerInfo?.nombre} tiene todos sus certificados vigentes. No hay certificados vencidos o próximos a vencer.
          </Typography>
          <img
            src='/images/tick.png'
            alt='Certificados al dia'
            style={{ maxWidth: '200px', opacity: 0.8 }}
          />
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                borderRadius: 3,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
                }
              }}
            >
              Volver al Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink component={Link} to="/dashboard" color="inherit">
          Dashboard
        </MuiLink>
        <Typography color="text.primary">
          {customerInfo?.nombre || 'Cliente'}
        </Typography>
      </Breadcrumbs>

      {/* Header Section */}
      <Box component="header" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ 
                mr: 2,
                bgcolor: '#f5f5f5',
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar
              sx={{ 
                bgcolor: '#ff5722', 
                mr: 2,
                width: 48,
                height: 48
              }}
            >
              <BusinessIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {customerInfo?.nombre || 'Cliente'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificados vencidos o próximos a vencer
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={handleExportExcel}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                }
              }}
            >
              Exportar Excel
            </Button>
            
            <Box 
              sx={{ 
                display: 'flex',
                bgcolor: '#f5f5f5',
                borderRadius: 3,
                p: 0.5,
                border: '1px solid #e0e0e0'
              }}
            >
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'text'}
                onClick={() => setViewMode('cards')}
                size="small"
                sx={{
                  minWidth: 80,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  ...(viewMode === 'cards' ? {
                    bgcolor: '#ff5722',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)',
                    '&:hover': {
                      bgcolor: '#e64a19',
                      transform: 'scale(1.02)'
                    }
                  } : {
                    color: '#666',
                    '&:hover': {
                      bgcolor: '#e0e0e0',
                      color: '#333'
                    }
                  })
                }}
              >
                📋 Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'text'}
                onClick={() => setViewMode('table')}
                size="small"
                sx={{
                  minWidth: 80,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  ...(viewMode === 'table' ? {
                    bgcolor: '#ff5722',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)',
                    '&:hover': {
                      bgcolor: '#e64a19',
                      transform: 'scale(1.02)'
                    }
                  } : {
                    color: '#666',
                    '&:hover': {
                      bgcolor: '#e0e0e0',
                      color: '#333'
                    }
                  })
                }}
              >
                📊 Tabla
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
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
                    Vigentes
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {stats.activeCount}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
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
                <ScheduleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
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

      {/* Content Area */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {tableData.map((cert, index) => {
            const status = getCertificateStatus(cert)
            return (
              <Grid item xs={12} md={6} lg={4} key={cert.id || index}>
                <Fade in timeout={300}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        elevation: 6,
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{ 
                            bgcolor: '#2196f3', 
                            mr: 2,
                            width: 40,
                            height: 40
                          }}
                        >
                          <AssignmentIcon />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                            {cert.device?.name || 'Equipo'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            Serie: {cert.serie || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Ubicación:</strong> {cert.city}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Local:</strong> {cert.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Sede:</strong> {cert.sede}
                        </Typography>
                      </Box>

                      <Box 
                        sx={{ 
                          p: 2, 
                          backgroundColor: status.bgColor,
                          borderRadius: 2,
                          border: `1px solid ${status.color}30`,
                          mb: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <status.icon 
                            sx={{ 
                              fontSize: 20, 
                              color: status.color,
                              mr: 1
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            fontWeight="600" 
                            sx={{ color: status.color }}
                          >
                            {status.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          📅 Próxima: {format(new Date(cert.nextCalibrationDate), 'dd/MM/yyyy')}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: status.status === 'expired' ? '#d32f2f' : 'text.secondary',
                            fontWeight: status.status === 'expired' ? 'bold' : 'normal'
                          }}
                        >
                          {status.daysText}
                        </Typography>
                      </Box>

                      {cert.certificateType && (
                        <Chip
                          label={cert.certificateType.name}
                          size="small"
                          sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                        />
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/calibraciones/certificados/${cert.id}`)}
                        sx={{
                          bgcolor: '#2196f3',
                          '&:hover': {
                            bgcolor: '#1976d2'
                          }
                        }}
                      >
                        Ver Detalles
                      </Button>
                      
                      <Typography variant="caption" color="text.secondary">
                        {cert.calibrationDate ? format(new Date(cert.calibrationDate), 'dd/MM/yyyy') : 'Sin fecha'}
                      </Typography>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            columns={columns}
            data={tableData}
            localization={MRT_Localization_ES}
            state={{
              isLoading: loading,
            }}
            enableRowActions
            positionActionsColumn="last"
            renderRowActions={({ row }) => (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Ver detalles del certificado">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/calibraciones/certificados/${row.original.id}`)}
                    sx={{
                      color: '#2196f3',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.1)'
                      }
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            muiTableProps={{
              sx: {
                '& .MuiTableHead-root': {
                  '& .MuiTableCell-root': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 600,
                  }
                },
                '& .MuiTableBody-root': {
                  '& .MuiTableRow-root:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  }
                }
              }
            }}
            muiSearchTextFieldProps={{
              placeholder: 'Buscar certificados...',
              sx: { minWidth: '300px' },
              variant: 'outlined',
            }}
            muiTopToolbarProps={{
              sx: {
                backgroundColor: '#fafafa',
              }
            }}
            muiBottomToolbarProps={{
              sx: {
                backgroundColor: '#fafafa',
              }
            }}
            initialState={{
              density: 'comfortable',
              pagination: {
                pageSize: 10,
                pageIndex: 0,
              },
              columnVisibility: {
                id: false
              }
            }}
            enableColumnFilterModes
            enableColumnOrdering
            enableFacetedValues
            enableRowSelection={false}
            enableStickyHeader
            muiTableContainerProps={{
              sx: {
                maxHeight: '600px',
              }
            }}
          />
        </Paper>
      )}
    </Container>
  )
}

export default Dashboard
