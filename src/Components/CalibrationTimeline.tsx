import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Avatar,
  Fade,
  Alert,
  Skeleton
} from '@mui/material'

import {
  GetApp,
  Schedule,
  CheckCircle,
  Warning,
  LocationOn,
  Devices,
  Timeline as TimelineIcon,
  KeyboardArrowDown,
  Error as ErrorIcon,
  HelpOutline
} from '@mui/icons-material'

import { useNavigate } from 'react-router-dom'
import useAxiosPrivate from '@utils/use-axios-private'
// import jsPDF from 'jspdf'
// import html2canvas from 'html2canvas'

// const printToPDF = async (elementId: string) => {
//   const element = document.getElementById(elementId)
//   if (element) {
//     const canvas = await html2canvas(element)

//     const imgData = canvas.toDataURL('image/png')
//     const pdf = new jsPDF({
//       orientation: 'l', // Portrait
//       unit: 'px',
//       format: [canvas.width, canvas.height]
//     })
//     pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
//     pdf.save('calibration-timeline.pdf')
//   }
// }

// Define los tipos de datos
interface Device {
  deviceId: number
  deviceName: string
  serialNumber: string
  location: string
  calibrationMonth: number
  nextCalibrationMonth: number
  calibrationYear: number
  nextCalibrationYear: number
}

interface DataResponse {
  month: number
  nextMonth: number
  totalMonths: number
  startYear: number
  endYear: number
  headquarters: string[]
  devices: Device[]
}

// Función para generar los nombres de los meses
const getMonthNames = (): string[] => [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
]

// Calcula el cronograma de calibración
const createTimeline = (data: DataResponse) => {
  const { month, totalMonths, startYear } = data
  const monthNames = getMonthNames()
  const months = []

  let currentMonth = month
  let currentYear = startYear

  for (let i = 0; i < totalMonths; i++) {
    months.push({
      month: currentMonth,
      year: currentYear,
      label: `${monthNames[currentMonth - 1]} <br/> ${currentYear}`
    })

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return months
}

interface Props {
  customerId?: number | string
}

const CalibrationTimeline: React.FC<Props> = ({ customerId }) => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const [timeline, setTimeline] = useState<
    { month: number; year: number; label: string }[] | null
  >(null)
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [headquarters, setHeadquarters] = useState<string[]>([])

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (headquarter: string) => {
    handleClose()
    navigate(`schedule/pdf?headquarter=${headquarter}`)
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axiosPrivate.get<DataResponse>(
          `/files/customer/${customerId}/schedule`,
          {}
        )
        const data = response.data
        setTimeline(createTimeline(data))
        setHeadquarters(data.headquarters)
        setDevices(data.devices)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchData()
    }
  }, [customerId])

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: '8px' }} />
        </Box>

        <Grid container spacing={2} mb={3}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: '12px' }} />
            </Grid>
          ))}
        </Grid>

        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: '12px' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca'
        }}
      >
        <Typography variant="body1" fontWeight="600">
          Error al cargar la programación
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Alert>
    )
  }

  if (!timeline || !devices) {
    return (
      <Alert
        severity="info"
        sx={{
          borderRadius: '12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe'
        }}
      >
        <Typography variant="body2">
          No hay datos de programación disponibles para este cliente.
        </Typography>
      </Alert>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header with Export Button */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              backgroundColor: '#10b981',
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <TimelineIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
              Cronograma de Calibraciones
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {devices.length} equipos programados
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<GetApp />}
          endIcon={<KeyboardArrowDown />}
          onClick={handleClick}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }
          }}
        >
          Exportar PDF
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: { borderRadius: '12px', minWidth: '180px' }
          }}
        >
          {headquarters.map((headquarter) => (
            <MenuItem
              key={headquarter}
              onClick={() => handleMenuItemClick(headquarter)}
              sx={{
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: '#f0fdf4'
                }
              }}
            >
              <LocationOn sx={{ mr: 1, fontSize: 18, color: '#10b981' }} />
              {headquarter}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ backgroundColor: '#10b981', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#059669' }}>
                    {devices.filter(d =>
                      d.calibrationMonth === currentMonth && d.calibrationYear === currentYear
                    ).length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#065f46' }}>
                      Este mes
                    </Typography>
                    <Tooltip title="Calibraciones realizadas durante el mes actual" arrow>
                      <HelpOutline sx={{ fontSize: 14, color: '#065f46', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ backgroundColor: '#d97706', mr: 2 }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#d97706' }}>
                    {devices.filter(d =>
                      d.nextCalibrationMonth === currentMonth && d.nextCalibrationYear === currentYear
                    ).length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#92400e' }}>
                      Próximas
                    </Typography>
                    <Tooltip title="Calibraciones programadas para realizarse este mes" arrow>
                      <HelpOutline sx={{ fontSize: 14, color: '#92400e', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ backgroundColor: '#dc2626', mr: 2 }}>
                  <ErrorIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#dc2626' }}>
                    {devices.filter(d => {
                      const nextCalibrationDate = new Date(d.nextCalibrationYear, d.nextCalibrationMonth - 1)
                      const currentDate = new Date(currentYear, currentMonth - 1)
                      return nextCalibrationDate < currentDate
                    }).length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#991b1b' }}>
                      Vencidas
                    </Typography>
                    <Tooltip title="Calibraciones que ya han vencido y requieren atención inmediata" arrow>
                      <HelpOutline sx={{ fontSize: 14, color: '#991b1b', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2 }}>
                  <Devices />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                    {devices.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#1e40af' }}>
                      Total equipos
                    </Typography>
                    <Tooltip title="Número total de equipos incluidos en la programación de calibraciones" arrow>
                      <HelpOutline sx={{ fontSize: 14, color: '#1e40af', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Legend */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          mb: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1f2937' }}>
            Leyenda
          </Typography>
          <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<CheckCircle />}
                label="Calibración realizada"
                size="small"
                sx={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<Schedule />}
                label="Próxima calibración"
                size="small"
                sx={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<ErrorIcon />}
                label="Calibración vencida"
                size="small"
                sx={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #10b981',
                  borderRadius: '4px'
                }}
              />
              <Typography variant="body2" sx={{ color: '#374151' }}>
                Mes actual
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Modern Timeline Table */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        id="calibration-timeline"
      >
        <TableContainer
          sx={{
            maxHeight: 600,
            '& .MuiTable-root': {
              borderCollapse: 'separate',
              borderSpacing: 0
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#10b981',
                    color: 'white',
                    textAlign: 'center',
                    borderRight: '1px solid #059669',
                    minWidth: 200,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Devices fontSize="small" />
                    Equipo
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#10b981',
                    color: 'white',
                    textAlign: 'center',
                    minWidth: 120,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  Serie
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#10b981',
                    color: 'white',
                    textAlign: 'center',
                    minWidth: 150,
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <LocationOn fontSize="small" />
                    Ubicación
                  </Box>
                </TableCell>
                {timeline.map((entry, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: entry.month === currentMonth && entry.year === currentYear
                        ? '#059669'
                        : '#10b981',
                      color: 'white',
                      textAlign: 'center',
                      minWidth: 80,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10
                    }}
                  >
                    <Box>
                      <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                        {getMonthNames()[entry.month - 1]}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                        {entry.year}
                      </Typography>
                    </Box>
                    {entry.month === currentMonth && entry.year === currentYear && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          backgroundColor: '#fbbf24'
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device, deviceIndex) => (
                <Fade in={true} timeout={300 + deviceIndex * 50} key={`${device.deviceId}-${deviceIndex}`}>
                  <TableRow
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      },
                      '&:nth-of-type(even)': {
                        backgroundColor: '#fafafa'
                      }
                    }}
                  >
                    <TableCell
                      sx={{
                        backgroundColor: 'inherit',
                        borderRight: '1px solid #e5e7eb',
                        fontWeight: 600,
                        color: '#1f2937',
                        minWidth: 200
                      }}
                    >
                      <Typography variant="body2" fontWeight="600">
                        {device.deviceName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', color: '#6b7280', backgroundColor: 'inherit' }}>
                      {device.serialNumber || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', color: '#6b7280', backgroundColor: 'inherit' }}>
                      {device.location || 'N/A'}
                    </TableCell>
                    {timeline.map((entry, index) => {
                      const isCalibration =
                        entry.month === device.calibrationMonth &&
                        entry.year === device.calibrationYear
                      const isNextCalibration =
                        entry.month === device.nextCalibrationMonth &&
                        entry.year === device.nextCalibrationYear
                      const isCurrentMonth =
                        entry.month === currentMonth && entry.year === currentYear

                      // Check if calibration is overdue
                      const nextCalibrationDate = new Date(device.nextCalibrationYear, device.nextCalibrationMonth - 1)
                      const currentDate = new Date(currentYear, currentMonth - 1)
                      const isOverdue = isNextCalibration && nextCalibrationDate < currentDate

                      return (
                        <TableCell
                          key={`${device.deviceId}-${index}`}
                          sx={{
                            backgroundColor: isCurrentMonth ? '#f0fdf4' : 'inherit',
                            borderLeft: isCurrentMonth ? '2px solid #10b981' : 'none',
                            borderRight: isCurrentMonth ? '2px solid #10b981' : 'none',
                            textAlign: 'center',
                            minWidth: 80
                          }}
                        >
                          {isCalibration && (
                            <Tooltip title="Calibración realizada">
                              <Chip
                                icon={<CheckCircle />}
                                label="✓"
                                size="small"
                                sx={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  fontWeight: 600,
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                          {isNextCalibration && !isOverdue && (
                            <Tooltip title="Próxima calibración programada">
                              <Chip
                                icon={<Schedule />}
                                label="!"
                                size="small"
                                sx={{
                                  backgroundColor: '#d97706',
                                  color: 'white',
                                  fontWeight: 600,
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                          {isNextCalibration && isOverdue && (
                            <Tooltip title="Calibración vencida - Requiere atención inmediata">
                              <Chip
                                icon={<ErrorIcon />}
                                label="!"
                                size="small"
                                sx={{
                                  backgroundColor: '#dc2626',
                                  color: 'white',
                                  fontWeight: 600,
                                  animation: 'pulse 2s infinite',
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  },
                                  '@keyframes pulse': {
                                    '0%, 100%': {
                                      opacity: 1,
                                    },
                                    '50%': {
                                      opacity: 0.7,
                                    },
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </Fade>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

export default CalibrationTimeline
