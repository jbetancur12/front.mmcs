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
  Chip,
  Avatar,
  Paper,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink,
  Grow
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  GetApp as GetAppIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon

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


// Filter types and interfaces
type FilterType = 'all' | 'warning' | 'expired'

const Dashboard: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const [tableData, setTableData] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  
  // Filter state management
  const [filterType, setFilterType] = useState<FilterType>('all')
  
  // Table pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Filter predicate functions
  const filterPredicates = useMemo<Record<FilterType, (cert: FileData) => boolean>>(() => ({
    all: () => true,
    warning: (cert: FileData) => {
      const now = new Date()
      const nextDate = new Date(cert.nextCalibrationDate)
      const daysRemaining = differenceInDays(nextDate, now)
      return daysRemaining >= 0 && daysRemaining <= 30
    },
    expired: (cert: FileData) => {
      const now = new Date()
      const nextDate = new Date(cert.nextCalibrationDate)
      const daysRemaining = differenceInDays(nextDate, now)
      return daysRemaining < 0
    }
  }), [])

  // Filter handler functions
  const handleFilterChange = (newFilterType: FilterType) => {
    setFilterType(newFilterType)
    // Reset pagination when filter changes
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }

  const clearFilter = () => {
    setFilterType('all')
    // Reset pagination when clearing filter
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }

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

  // Memoized filtered data calculation
  const filteredData = useMemo(() => {
    if (filterType === 'all') {
      return tableData
    }
    return tableData.filter(filterPredicates[filterType])
  }, [tableData, filterType, filterPredicates])

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
        status: 'vigente', 
        color: '#388e3c', 
        bgColor: '#e8f5e8', 
        label: 'Vigente', 
        icon: CheckCircleIcon,
        daysText: `${daysRemaining} días restantes`
      }
    }
  }

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay certificados para exportar',
        icon: 'info',
        confirmButtonText: 'Entendido'
      })
      return
    }

    const exportData = filteredData.map((row) => ({
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
    
    // Generate filename based on filter state
    const filterSuffix = filterType !== 'all' ? `-${
      filterType === 'warning' ? 'proximos-vencer' :
      filterType === 'expired' ? 'vencidos' : 'todos'
    }` : ''
    
    const fileName = `${customerInfo?.nombre || 'Cliente'}-certificados${filterSuffix}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    saveAs(data, fileName)
    
    const filterText = filterType !== 'all' ? ` (${
      filterType === 'warning' ? 'Próximos a Vencer' :
      filterType === 'expired' ? 'Vencidos' : 'Todos'
    })` : ''
    
    Swal.fire({
      title: '¡Exportado!',
      text: `El archivo Excel${filterText} ha sido descargado exitosamente`,
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

      {/* Información de la vista */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 4,
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%)',
          border: '1px solid #ffb74d'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon sx={{ fontSize: 32, color: '#f57c00', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#e65100' }}>
            Certificados que Requieren Atención
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Esta vista muestra únicamente los certificados que están <strong>vencidos</strong> o <strong>próximos a vencer</strong> (dentro de 30 días).
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Todos (${filteredData.length})`}
            onClick={() => handleFilterChange('all')}
            color={filterType === 'all' ? 'primary' : 'default'}
            variant={filterType === 'all' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`Próximos a Vencer (${tableData.filter(filterPredicates.warning).length})`}
            onClick={() => handleFilterChange('warning')}
            color={filterType === 'warning' ? 'warning' : 'default'}
            variant={filterType === 'warning' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`Vencidos (${tableData.filter(filterPredicates.expired).length})`}
            onClick={() => handleFilterChange('expired')}
            color={filterType === 'expired' ? 'error' : 'default'}
            variant={filterType === 'expired' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          {filterType !== 'all' && (
            <Chip
              label="Limpiar filtro"
              onClick={clearFilter}
              variant="outlined"
              onDelete={clearFilter}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
      </Paper>

      {/* Content Area */}
      {viewMode === 'cards' ? (
        <Box sx={{ minHeight: '400px' }}>
          <Grid 
            container 
            spacing={3}
            sx={{
              // Maintain consistent spacing and layout
              '& .MuiGrid-item': {
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }
            }}
          >
            {filteredData.map((cert, index) => {
              const status = getCertificateStatus(cert)
              return (
                <Grid 
                  item 
                  xs={12} 
                  md={6} 
                  lg={4} 
                  key={cert.id || index}
                  sx={{
                    // Ensure consistent grid item behavior
                    display: 'flex',
                    '& > *': {
                      width: '100%'
                    }
                  }}
                >
                  <Grow
                    in={true}
                    timeout={{
                      enter: 400 + (index * 100), // Staggered entrance
                      exit: 300
                    }}
                    style={{
                      transformOrigin: 'center center',
                    }}
                  >
                    <Card 
                      elevation={2}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'scale(1)',
                        opacity: 1,
                        '&:hover': {
                          elevation: 8,
                          transform: 'translateY(-6px) scale(1.02)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
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
                              height: 40,
                              transition: 'all 0.3s ease-in-out'
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
                            mb: 2,
                            transition: 'all 0.3s ease-in-out'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <status.icon 
                              sx={{ 
                                fontSize: 20, 
                                color: status.color,
                                mr: 1,
                                transition: 'all 0.3s ease-in-out'
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
                            sx={{ 
                              bgcolor: '#e3f2fd', 
                              color: '#1976d2',
                              transition: 'all 0.3s ease-in-out'
                            }}
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
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              bgcolor: '#1976d2',
                              transform: 'scale(1.05)'
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
                  </Grow>
                </Grid>
              )
            })}
          </Grid>
          
          {/* Maintain layout stability with minimum height when filtering */}
          {filteredData.length === 0 && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: '300px',
                opacity: 0.7
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No hay certificados que coincidan con el filtro seleccionado
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <MaterialReactTable
            columns={columns}
            data={filteredData}
            localization={MRT_Localization_ES}
            state={{
              isLoading: loading,
              pagination,
            }}
            onPaginationChange={setPagination}
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
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {filterType !== 'all' && (
                  <Chip
                    label={`Filtrado: ${
                      filterType === 'warning' ? 'Próximos a Vencer' :
                      filterType === 'expired' ? 'Vencidos' : 'Todos'
                    } (${filteredData.length})`}
                    onDelete={clearFilter}
                    color="primary"
                    variant="outlined"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      '& .MuiChip-deleteIcon': {
                        color: '#1976d2'
                      }
                    }}
                  />
                )}
                <Typography variant="body2" color="text.secondary">
                  {filteredData.length} de {tableData.length} certificados
                </Typography>
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
                  '& .MuiTableRow-root': {
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.04)',
                      transform: 'scale(1.001)'
                    }
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
                borderBottom: filterType !== 'all' ? '2px solid #2196f3' : 'none'
              }
            }}
            muiBottomToolbarProps={{
              sx: {
                backgroundColor: '#fafafa',
              }
            }}
            initialState={{
              density: 'comfortable',
              columnVisibility: {
                id: false
              }
            }}
            // Reset pagination when filter changes
            autoResetPageIndex={false}
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
            // Add custom empty state for filtered results
            muiTableBodyProps={{
              sx: filteredData.length === 0 ? {
                '& .MuiTableRow-root:first-of-type .MuiTableCell-root': {
                  textAlign: 'center',
                  py: 4
                }
              } : {}
            }}
            // Custom no data message
            muiTableBodyRowProps={filteredData.length === 0 ? {
              sx: {
                '& .MuiTableCell-root': {
                  border: 'none'
                }
              }
            } : {}}
          />
          
          {/* Custom empty state for table when filtered */}
          {filteredData.length === 0 && tableData.length > 0 && (
            <Box 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                p: 4,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No hay certificados que coincidan con el filtro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Filtro activo: {
                  filterType === 'warning' ? 'Próximos a Vencer' :
                  filterType === 'expired' ? 'Vencidos' : 'Todos'
                }
              </Typography>
              <Button
                variant="outlined"
                onClick={clearFilter}
                size="small"
                sx={{
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.1)'
                  }
                }}
              >
                Ver Todos los Certificados
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  )
}

export default Dashboard
