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
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Fade,
  Chip,
  Avatar,
  Paper
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

interface Device {
  id: number
  name: string
  formatId: number | null
  certificateTemplateId: number
  magnitude: string
  unit: string
  createdAt: string // ISO string date
  updatedAt: string // ISO string date
}

interface Certificado {
  id: number
  city: string
  location: string
  activoFijo: string
  serie: string
  calibrationDate: string // ISO string date
  nextCalibrationDate: string // ISO string date
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

const DashboardCards: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  const [tableData, setTableData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch files data
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(
        `/files/next-to-expire-grouped`,
        {}
      )
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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData
    return tableData.filter(customer =>
      customer.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.identificacion.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tableData, searchTerm])

  const clearSearch = () => {
    setSearchTerm('')
  }

  const handleViewCustomer = (customerId: number) => {
    navigate(`/calibraciones/certificados/${customerId}`)
  }

  const getCustomerStatus = (customer: Customer) => {
    const now = new Date()
    let hasExpired = false
    let hasSoonToExpire = false
    
    customer.certificados.forEach(cert => {
      const nextDate = new Date(cert.nextCalibrationDate)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      if (nextDate < now) {
        hasExpired = true
      } else if (nextDate <= thirtyDaysFromNow) {
        hasSoonToExpire = true
      }
    })

    if (hasExpired) {
      return { status: 'expired', color: '#d32f2f', bgColor: '#ffebee', label: 'Certificados Vencidos', icon: ErrorIcon }
    } else if (hasSoonToExpire) {
      return { status: 'warning', color: '#f57c00', bgColor: '#fff3e0', label: 'Próximos a Vencer', icon: WarningIcon }
    } else {
      return { status: 'active', color: '#388e3c', bgColor: '#e8f5e8', label: 'Al Día', icon: CheckCircleIcon }
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
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
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
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Buscar clientes"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={clearSearch}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Cards Content */}
      <Grid container spacing={3}>
        {filteredData.map((customer) => {
          const customerStatus = getCustomerStatus(customer)
          return (
            <Grid item xs={12} md={6} lg={4} key={customer.id}>
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
                          bgcolor: '#ff5722', 
                          mr: 2,
                          width: 40,
                          height: 40
                        }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                          {customer.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          ID: {customer.identificacion}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {customer.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Teléfono:</strong> {customer.telefono}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>Ubicación:</strong> {customer.ciudad}, {customer.departamento}
                      </Typography>
                    </Box>

                    <Box 
                      sx={{ 
                        p: 2, 
                        backgroundColor: customerStatus.bgColor,
                        borderRadius: 2,
                        border: `1px solid ${customerStatus.color}30`,
                        mb: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <customerStatus.icon 
                          sx={{ 
                            fontSize: 20, 
                            color: customerStatus.color,
                            mr: 1
                          }} 
                        />
                        <Typography 
                          variant="body2" 
                          fontWeight="600" 
                          sx={{ color: customerStatus.color }}
                        >
                          {customerStatus.label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {customer.certificados.length} certificado(s) total
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewCustomer(customer.id)}
                      sx={{
                        bgcolor: '#ff5722',
                        '&:hover': {
                          bgcolor: '#e64a19'
                        }
                      }}
                    >
                      Ver Certificados
                    </Button>
                    
                    <Chip
                      label={`${customer.certificados.length} cert.`}
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 600
                      }}
                    />
                  </CardActions>
                </Card>
              </Fade>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}

export default DashboardCards