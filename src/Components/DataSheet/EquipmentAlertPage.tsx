import React, { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Collapse,
  Button,
  Paper,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Fade,
  TextField,
  InputAdornment,
  Avatar
} from '@mui/material'
import {
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Engineering as EngineeringIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

export type EquipmentData = {
  id: number
  internalCode: string
  equipmentName: string
  brand?: string
  model?: string
  location?: string
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
  calibrationDueDate?: string
  inspectionDueDate?: string
  priority?: 'high' | 'medium' | 'low'
}

const EquipmentAlertsPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [equipments, setEquipments] = useState<EquipmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalibrationDetails, setShowCalibrationDetails] = useState(false)
  const [showInspectionDetails, setShowInspectionDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchEquipmentData = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate('/dataSheet/')
      setEquipments(response.data)
    } catch (error) {
      console.error('Error fetching equipment data:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las alertas de equipos',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipmentData()
  }, [axiosPrivate])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEquipmentData()
    setRefreshing(false)
    Swal.fire({
      title: '¡Actualizado!',
      text: 'Las alertas han sido actualizadas',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  }

  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return equipments
    return equipments.filter(equipment =>
      equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equipment.brand && equipment.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipment.location && equipment.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [equipments, searchTerm])

  const calibrationDueSoon = filteredEquipments.filter(
    (equipment) => equipment.isCalibrationDueSoon
  )
  const inspectionDueSoon = filteredEquipments.filter(
    (equipment) => equipment.isInspectionDueSoon
  )

  const totalAlerts = calibrationDueSoon.length + inspectionDueSoon.length

  const clearSearch = () => {
    setSearchTerm('')
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#f44336'
      case 'medium': return '#ff9800'
      case 'low': return '#4caf50'
      default: return '#2196f3'
    }
  }

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'Normal'
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
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
              <NotificationsActiveIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Resumen de Alertas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitoreo de calibraciones e inspecciones próximas
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Actualizar alertas">
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
        </Box>

        {/* Search Bar */}
        <TextField
          label="Buscar equipos"
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3}
            sx={{ 
              background: 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)',
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
                    Total de Alertas
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {totalAlerts}
                  </Typography>
                </Box>
                <NotificationsActiveIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                    Calibraciones
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {calibrationDueSoon.length}
                  </Typography>
                </Box>
                <BuildIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                    Inspecciones
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {inspectionDueSoon.length}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Empty State */}
      {totalAlerts === 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
          }}
        >
          <EngineeringIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
            ¡Excelente!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No hay alertas pendientes en este momento. Todos los equipos están al día.
          </Typography>
        </Paper>
      )}

      {/* Calibration Alerts Section */}
      {calibrationDueSoon.length > 0 && (
        <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
          <Box
            sx={{
              bgcolor: '#fff3e0',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #ffcc02'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <BuildIcon sx={{ fontSize: 28, color: '#ff9800', mr: 2 }} />
                <Chip
                  label={calibrationDueSoon.length}
                  size="small"
                  sx={{
                    bgcolor: '#ff9800',
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '32px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#e65100' }}>
                  Calibraciones Próximas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipos que requieren calibración próximamente
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={showCalibrationDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowCalibrationDetails(!showCalibrationDetails)}
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': {
                  borderColor: '#f57c00',
                  bgcolor: 'rgba(255, 152, 0, 0.04)'
                }
              }}
            >
              {showCalibrationDetails ? 'Ocultar' : 'Ver Detalles'}
            </Button>
          </Box>

          <Collapse in={showCalibrationDetails} timeout={500}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {calibrationDueSoon.map((equipment) => (
                  <Grid item xs={12} md={6} key={equipment.id}>
                    <Fade in timeout={300}>
                      <Card 
                        elevation={1}
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            elevation: 4,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              sx={{ 
                                bgcolor: '#ff9800', 
                                mr: 2,
                                width: 40,
                                height: 40
                              }}
                            >
                              <BuildIcon />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                                {equipment.equipmentName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Código: {equipment.internalCode}
                              </Typography>
                            </Box>
                            {equipment.priority && (
                              <Chip
                                label={getPriorityLabel(equipment.priority)}
                                size="small"
                                sx={{
                                  bgcolor: getPriorityColor(equipment.priority),
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                          
                          {equipment.brand && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Marca:</strong> {equipment.brand}
                            </Typography>
                          )}
                          
                          {equipment.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Ubicación:</strong> {equipment.location}
                            </Typography>
                          )}
                          
                          {equipment.calibrationDueDate && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              <strong>Fecha límite:</strong> {equipment.calibrationDueDate}
                            </Typography>
                          )}

                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              Calibración próxima requerida
                            </Typography>
                          </Alert>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Button
                            component={Link}
                            to={`/datasheets/${equipment.id}/inspection-maintenance`}
                            size="small"
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            sx={{
                              bgcolor: '#ff9800',
                              '&:hover': {
                                bgcolor: '#f57c00'
                              }
                            }}
                          >
                            Ver Detalles
                          </Button>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Inspection Alerts Section */}
      {inspectionDueSoon.length > 0 && (
        <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
          <Box
            sx={{
              bgcolor: '#e3f2fd',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #2196f3'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <ScheduleIcon sx={{ fontSize: 28, color: '#2196f3', mr: 2 }} />
                <Chip
                  label={inspectionDueSoon.length}
                  size="small"
                  sx={{
                    bgcolor: '#2196f3',
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '32px'
                  }}
                />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1565c0' }}>
                  Inspecciones Próximas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipos que requieren inspección próximamente
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={showInspectionDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowInspectionDetails(!showInspectionDetails)}
              sx={{
                borderColor: '#2196f3',
                color: '#2196f3',
                '&:hover': {
                  borderColor: '#1976d2',
                  bgcolor: 'rgba(33, 150, 243, 0.04)'
                }
              }}
            >
              {showInspectionDetails ? 'Ocultar' : 'Ver Detalles'}
            </Button>
          </Box>

          <Collapse in={showInspectionDetails} timeout={500}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {inspectionDueSoon.map((equipment) => (
                  <Grid item xs={12} md={6} key={equipment.id}>
                    <Fade in timeout={300}>
                      <Card 
                        elevation={1}
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            elevation: 4,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              sx={{ 
                                bgcolor: '#2196f3', 
                                mr: 2,
                                width: 40,
                                height: 40
                              }}
                            >
                              <ScheduleIcon />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                                {equipment.equipmentName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Código: {equipment.internalCode}
                              </Typography>
                            </Box>
                            {equipment.priority && (
                              <Chip
                                label={getPriorityLabel(equipment.priority)}
                                size="small"
                                sx={{
                                  bgcolor: getPriorityColor(equipment.priority),
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                          
                          {equipment.brand && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Marca:</strong> {equipment.brand}
                            </Typography>
                          )}
                          
                          {equipment.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Ubicación:</strong> {equipment.location}
                            </Typography>
                          )}
                          
                          {equipment.inspectionDueDate && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              <strong>Fecha límite:</strong> {equipment.inspectionDueDate}
                            </Typography>
                          )}

                          <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              Inspección próxima requerida
                            </Typography>
                          </Alert>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Button
                            component={Link}
                            to={`/datasheets/${equipment.id}/inspection-maintenance`}
                            size="small"
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            sx={{
                              bgcolor: '#2196f3',
                              '&:hover': {
                                bgcolor: '#1976d2'
                              }
                            }}
                          >
                            Ver Detalles
                          </Button>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}
    </Container>
  )
}

export default EquipmentAlertsPage
