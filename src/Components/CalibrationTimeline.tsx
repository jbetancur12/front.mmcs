import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Button,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem
  // Button
} from '@mui/material'

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
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
        flexDirection='column'
      >
        <CircularProgress />
        <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
          Cargando...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return <Typography color='error'>{error}</Typography>
  }

  if (!timeline || !devices) {
    return <Typography>No data available</Typography>
  }

  return (
    <Box width='100%' mt={2}>
      <Tooltip arrow placement='right' title='Exportar a PDF'>
        <div>
          <Button
            variant='contained'
            color='primary'
            onClick={handleClick} // Abre el menú desplegable
          >
            Exportar a PDF
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {headquarters.map((headquarter) => (
              <MenuItem
                key={headquarter}
                onClick={() => handleMenuItemClick(headquarter)}
              >
                {headquarter}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </Tooltip>
      <Box id='calibration-timeline'>
        <Paper>
          <Stack
            spacing={2}
            direction='row'
            sx={{
              mb: 2,
              mt: 2
              // border: '1px solid #000',
              // width: 450,
              // padding: 2
            }}
          >
            <Chip label='X' size='small' color='primary' sx={{ width: 25 }} />
            <span>Calibración</span>
            <Chip label='X' size='small' color='warning' sx={{ width: 25 }} />
            <span>Proxima Calibración</span>
          </Stack>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#9CF08B',
                      color: '#000',
                      position: 'sticky',
                      left: 0,
                      textAlign: 'center',
                      zIndex: 1 // Asegura que esté encima de las celdas
                    }}
                  >
                    Equipo
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#9CF08B',
                      color: '#000',
                      textAlign: 'center'
                      // Asegura que esté encima de las celdas
                    }}
                  >
                    Serie
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#9CF08B',
                      color: '#000',
                      textAlign: 'center'
                      // Asegura que esté encima de las celdas
                    }}
                  >
                    Ubicación
                  </TableCell>
                  {timeline.map((entry, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor:
                          entry.month === currentMonth &&
                          entry.year === currentYear
                            ? '#9CF08B30'
                            : '#9CF08B',
                        color: '#000',
                        textAlign: 'center'
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: entry.label }} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device, deviceIndex) => (
                  <TableRow key={`${device.deviceId}-${deviceIndex}`}>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#fff'
                        // zIndex: 1 // Asegura que esté encima de las celdas
                      }}
                    >
                      {device.deviceName}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {device.serialNumber}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {device.location}
                    </TableCell>
                    {timeline.map((entry, index) => {
                      const isCalibration =
                        entry.month === device.calibrationMonth &&
                        entry.year === device.calibrationYear
                      const isNextCalibration =
                        entry.month === device.nextCalibrationMonth &&
                        entry.year === device.nextCalibrationYear

                      return (
                        <TableCell
                          key={`${device.deviceId}-${index}`} // Combina deviceId e index para una clave única
                          sx={{
                            backgroundColor:
                              entry.month === currentMonth &&
                              entry.year === currentYear
                                ? '#9CF08B30'
                                : '#fff',
                            borderLeft:
                              entry.month === currentMonth &&
                              entry.year === currentYear
                                ? 'solid 2px #9CF08B80'
                                : 'none',
                            borderRight:
                              entry.month === currentMonth &&
                              entry.year === currentYear
                                ? 'solid 2px #9CF08B80'
                                : 'none'
                          }}
                        >
                          {isCalibration && (
                            <Chip label='X' size='small' color='primary' />
                          )}
                          {isNextCalibration && (
                            <Chip label='X' size='small' color='warning' />
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  )
}

export default CalibrationTimeline
