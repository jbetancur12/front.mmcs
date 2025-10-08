import { useNavigate, useParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,  
  Avatar,
  Skeleton,
  Tooltip,
  Container
} from '@mui/material'
import CertificatesList from '../Components/CertificatesList'
import UpdateCertificateModal from '../Components/UpdateCertificateModal'
import { userStore } from '../store/userStore'
import { useStore } from '@nanostores/react'
import { 
  ArrowBack, 
  Edit, 
  Business,
  LocationOn,
  Devices,
  CalendarToday,
  Info,
  Settings,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Update
} from '@mui/icons-material'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import useAxiosPrivate from '@utils/use-axios-private'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { createRoot } from 'react-dom/client'
import { addYears, format } from 'date-fns'

const fieldLabels: { [key: string]: string } = {
  compania: 'Compañía',
  equipo: 'Equipo',
  city: 'Ciudad',
  location: 'Ubicación',
  sede: 'Sede',
  activoFijo: 'Activo Fijo',
  serie: 'Serie',
  calibrationDate: 'Última Fecha de Calibración',
  nextCalibrationDate: 'Próxima Fecha de Calibración'
}

interface DeviceDetailsProps {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  headquarter: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  device: any
  customer: any
  certificateTypeId: number
  createdAt: string
  updatedAt: string
}

function Certificates() {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const $userStore = useStore(userStore)
  const MySwal = withReactContent(Swal)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [certificateData, setCertificateData] =
    useState<DeviceDetailsProps | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)

  const getCertificateInfo = async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate.get(`/files/${id}`, {})
      if (response.status === 200) {
        setCertificateData(response.data)
      }
    } catch (error) {
      console.error('Error fetching certificate data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCertificateInfo()
  }, [id])

  // Calculate status based on calibration dates
  const getCalibrationStatus = () => {
    if (!certificateData?.nextCalibrationDate) return { status: 'unknown', color: '#6b7280', bgColor: '#f9fafb', label: 'Sin fecha', icon: Info }
    
    const now = new Date()
    const nextDate = new Date(certificateData.nextCalibrationDate)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    if (nextDate < now) {
      return { status: 'expired', color: '#dc2626', bgColor: '#fef2f2', label: 'Vencido', icon: ErrorIcon }
    } else if (nextDate <= thirtyDaysFromNow) {
      return { status: 'warning', color: '#d97706', bgColor: '#fffbeb', label: 'Próximo a vencer', icon: Warning }
    } else {
      return { status: 'active', color: '#059669', bgColor: '#f0fdf4', label: 'Activo', icon: CheckCircle }
    }
  }

  const calibrationStatus = getCalibrationStatus()

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleUpdateSuccess = () => {
    // Refrescar datos automáticamente
    getCertificateInfo()

    // Refrescar la lista de certificados
    setRefreshTrigger(prev => prev + 1)

    // Mostrar feedback persistente con SweetAlert2
    MySwal.fire({
      icon: 'success',
      title: 'Certificado Actualizado',
      text: 'El certificado ha sido actualizado exitosamente',
      timer: 2000,
      showConfirmButton: false
    })
  }

  const handleEdit = async (field: string) => {
    const fieldLabel = fieldLabels[field] || field

    if (field === 'calibrationDate' || field === 'nextCalibrationDate') {
      // Si el campo es una fecha, usamos DatePicker
      let selectedDate: Date | null = null

      const result = await MySwal.fire({
        title: 'Actualizar Información',
        html: `
          <div id="datepicker-container"></div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const container = document.getElementById('datepicker-container')
          if (container) {
            const PickerComponent = () => {
              const [value, setValue] = useState<Date | null>(null)
              return (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={value}
                    onChange={(newValue) => {
                      setValue(newValue)
                      selectedDate = newValue
                    }}
                    slots={{ textField: TextField }}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        fullWidth: true
                      },
                      popper: {
                        // Deshabilita el portal para que el popper se renderice
                        // dentro del mismo árbol DOM del modal
                        disablePortal: false,
                        style: { zIndex: 100000 }
                      }
                    }}
                  />
                </LocalizationProvider>
              )
            }

            const root = createRoot(container)
            root.render(<PickerComponent />)
          }
        },
        preConfirm: () => {
          if (!selectedDate) {
            Swal.showValidationMessage('Debes seleccionar una fecha')
            return false
          }
          return selectedDate
        }
      })

      if (result.isConfirmed) {
        const newValue = result.value // Formatear fecha YYYY-MM-DD
        if (newValue) {
          const payload: any = { [field]: newValue }
          if (field === 'calibrationDate') {
            const nextCalibrationDate = format(
              addYears(new Date(newValue), 1),
              'yyyy-MM-dd'
            )
            payload.nextCalibrationDate = nextCalibrationDate
          }
          try {
            const response = await axiosPrivate.put(`/files/${id}`, payload)

            if (response.status === 200) {
              MySwal.fire(
                'Actualizado',
                `El campo ${fieldLabel} ha sido actualizado exitosamente`,
                'success'
              )
              getCertificateInfo()
            }
          } catch (error) {
            MySwal.fire(
              'Error',
              `No se pudo actualizar el campo ${fieldLabel}`,
              'error'
            )
          }
        }
      }
    } else {
      // Para otros campos, usar un input de texto normal
      const result = await MySwal.fire({
        title: 'Actualizar Información',
        text: `Ingresa el nuevo valor para ${fieldLabel}`,
        input: 'text',
        inputPlaceholder: `Nuevo valor para ${fieldLabel}`,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        const newValue = result.value

        try {
          const response = await axiosPrivate.put(`/files/${id}`, {
            [field]: newValue
          })

          if (response.status === 200) {
            MySwal.fire(
              'Actualizado',
              `El campo ${fieldLabel} ha sido actualizado exitosamente`,
              'success'
            )
            getCertificateInfo()
          }
        } catch (error) {
          MySwal.fire(
            'Error',
            `No se pudo actualizar el campo ${fieldLabel}`,
            'error'
          )
        }
      }
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '12px' }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '12px' }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Compact Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between" 
        mb={3}
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{ 
              mr: 2,
              color: '#374151',
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Avatar 
            sx={{ 
              backgroundColor: '#10b981',
              mr: 2,
              width: 32,
              height: 32
            }}
          >
            <Devices fontSize="small" />
          </Avatar>
          
          <Box>
            <Typography variant="h6" sx={{ color: '#1f2937', fontWeight: 600, fontSize: '1.1rem' }}>
              {certificateData?.device?.name || 'Detalles del Equipo'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {certificateData?.customer?.nombre}
            </Typography>
          </Box>
        </Box>

        {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Update />}
            onClick={handleOpenModal}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              }
            }}
          >
            Actualizar
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Equipment Information - Left Column */}
        <Grid item xs={12} md={8}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1f2937', fontSize: '1rem' }}>
                Información del Equipo
              </Typography>
              
              {/* Company Info - Compact */}
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  mb: 2
                }}
              >
                <Box display="flex" alignItems="center">
                  <Business sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ mr: 2, minWidth: '70px' }}>
                    Empresa:
                  </Typography>
                  <Typography variant="body2" fontWeight="500" sx={{ color: '#1f2937' }}>
                    {certificateData?.customer?.nombre}
                  </Typography>
                </Box>
              </Box>

              {/* Equipment Details in compact 2x3 grid */}
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<Devices />}
                    label="Equipo"
                    value={certificateData?.device?.name}
                    editable={false}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<LocationOn />}
                    label="Sede"
                    value={certificateData?.headquarter?.toUpperCase()}
                    editable={false}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<LocationOn />}
                    label="Ciudad"
                    value={certificateData?.city}
                    editable={true}
                    field="city"
                    onEdit={handleEdit}
                    userRoles={$userStore.rol}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<LocationOn />}
                    label="Ubicación"
                    value={certificateData?.location}
                    editable={true}
                    field="location"
                    onEdit={handleEdit}
                    userRoles={$userStore.rol}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<Info />}
                    label="Dirección"
                    value={certificateData?.sede}
                    editable={true}
                    field="sede"
                    onEdit={handleEdit}
                    userRoles={$userStore.rol}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CompactDetailRow
                    icon={<Settings />}
                    label="Activo Fijo"
                    value={certificateData?.activoFijo}
                    editable={true}
                    field="activoFijo"
                    onEdit={handleEdit}
                    userRoles={$userStore.rol}
                  />
                </Grid>

                <Grid item xs={12}>
                  <CompactDetailRow
                    icon={<Info />}
                    label="Serie"
                    value={certificateData?.serie}
                    editable={true}
                    field="serie"
                    onEdit={handleEdit}
                    userRoles={$userStore.rol}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Calibration Status Sidebar - Right Column */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1f2937', fontSize: '1rem' }}>
                Estado de Calibración
              </Typography>
              
              <Box 
                sx={{ 
                  p: 3, 
                  backgroundColor: calibrationStatus.bgColor,
                  borderRadius: '12px',
                  border: `2px solid ${calibrationStatus.color}20`,
                  textAlign: 'center',
                  mb: 3
                }}
              >
                <calibrationStatus.icon 
                  sx={{ 
                    fontSize: 40, 
                    color: calibrationStatus.color,
                    mb: 1
                  }} 
                />
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ color: calibrationStatus.color, fontSize: '1rem' }}
                >
                  {calibrationStatus.label}
                </Typography>
              </Box>

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center">
                    <CalendarToday sx={{ color: '#6b7280', mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.875rem' }}>
                      Última Calibración
                    </Typography>
                  </Box>
                  {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
                    <Tooltip title="Editar fecha">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit('calibrationDate')}
                        sx={{ 
                          color: '#6b7280',
                          '&:hover': { 
                            backgroundColor: '#f0fdf4',
                            color: '#10b981'
                          }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                  {certificateData?.calibrationDate 
                    ? new Date(certificateData.calibrationDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'No especificada'
                  }
                </Typography>
              </Box>

              <Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarToday sx={{ color: '#6b7280', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.875rem' }}>
                    Próxima Calibración
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="500" sx={{ color: calibrationStatus.color }}>
                  {certificateData?.nextCalibrationDate 
                    ? new Date(certificateData.nextCalibrationDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'No especificada'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates List - Full Width */}
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1f2937', fontSize: '1rem' }}>
                Certificados y Documentos
              </Typography>
              <CertificatesList refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <UpdateCertificateModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleUpdateSuccess}
        id={id}
      />
    </Container>
  )
}

// Compact Detail Row Component - More compact than cards
interface CompactDetailRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  editable?: boolean
  field?: string
  onEdit?: (field: string) => void
  userRoles?: string[]
}

const CompactDetailRow: React.FC<CompactDetailRowProps> = ({
  icon,
  label,
  value,
  editable = false,
  field,
  onEdit,
  userRoles = []
}) => {
  const canEdit = editable && 
    userRoles.some((role) => ['admin', 'metrologist'].includes(role)) && 
    onEdit && 
    field

  return (
    <Box 
      sx={{ 
        p: 1.5, 
        backgroundColor: '#ffffff', 
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s ease-in-out',
        '&:hover': canEdit ? {
          borderColor: '#10b981',
          boxShadow: '0 1px 4px rgba(16, 185, 129, 0.1)'
        } : {}
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" flex={1}>
          <Box 
            sx={{ 
              color: '#10b981', 
              mr: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { fontSize: 'small' })}
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            fontWeight="600"
            sx={{ fontSize: '0.75rem', minWidth: '70px', mr: 1 }}
          >
            {label}:
          </Typography>
          <Typography 
            variant="body2" 
            fontWeight="500" 
            sx={{ 
              color: value ? '#1f2937' : '#9ca3af',
              wordBreak: 'break-word',
              fontSize: '0.875rem',
              flex: 1
            }}
          >
            {value || 'No especificado'}
          </Typography>
        </Box>
        
        {canEdit && (
          <Tooltip title={`Editar ${label.toLowerCase()}`}>
            <IconButton 
              size="small" 
              onClick={() => onEdit(field)}
              sx={{ 
                color: '#6b7280',
                p: 0.5,
                ml: 1,
                '&:hover': { 
                  backgroundColor: '#f0fdf4',
                  color: '#10b981'
                }
              }}
            >
              <Edit sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

export default Certificates
