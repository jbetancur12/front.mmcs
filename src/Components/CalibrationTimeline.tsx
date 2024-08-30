// import React, { useEffect, useState } from 'react'
// import {
//   Container,
//   Typography,
//   Grid,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip
// } from '@mui/material'
// import axios from 'axios'
// import { api } from '../config'

// // Define los tipos de datos
// interface Device {
//   deviceId: number
//   deviceName: string
//   calibrationMonth: number
//   nextCalibrationMonth: number
//   calibrationYear: number
//   nextCalibrationYear: number
// }

// interface DataResponse {
//   month: number
//   nextMonth: number
//   totalMonths: number
//   startYear: number
//   endYear: number
//   devices: Device[]
// }

// // Función para generar los nombres de los meses
// const getMonthNames = (): string[] => [
//   'Enero',
//   'Febrero',
//   'Marzo',
//   'Abril',
//   'Mayo',
//   'Junio',
//   'Julio',
//   'Agosto',
//   'Septiembre',
//   'Octubre',
//   'Noviembre',
//   'Diciembre'
// ]

// const apiUrl = api()

// const CalibrationTimeline: React.FC<{ customerId?: number | string }> = ({
//   customerId
// }) => {
//   const [data, setData] = useState<DataResponse | null>(null)
//   const [loading, setLoading] = useState<boolean>(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true)
//       setError(null)
//       try {
//         const response = await axios.get<DataResponse>(
//           `${apiUrl}/files/customer/${customerId}/schedule`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//             }
//           }
//         )
//         setData(response.data)
//       } catch (error) {
//         console.error('Error fetching data:', error)
//         setError('Failed to load data')
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (customerId) {
//       fetchData()
//     }
//   }, [customerId])

//   if (loading) {
//     return <Typography>Loading...</Typography>
//   }

//   if (error) {
//     return <Typography color='error'>{error}</Typography>
//   }

//   if (!data) {
//     return <Typography>No data available</Typography>
//   }

//   const monthNames = getMonthNames()

//   return (
//     <Container>
//       <Typography variant='h4' gutterBottom>
//         Cronograma de Calibración
//       </Typography>
//       <Grid container spacing={2}>
//         <Grid item xs={12}>
//           <Paper>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Equipo</TableCell>
//                     <TableCell>Calibración Actual</TableCell>
//                     <TableCell>Próxima Calibración</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {data.devices.map((device) => (
//                     <TableRow key={device.deviceId}>
//                       <TableCell>{device.deviceName}</TableCell>
//                       <TableCell>
//                         {monthNames[device.calibrationMonth - 1]}{' '}
//                         {device.calibrationYear}
//                       </TableCell>
//                       <TableCell>
//                         {monthNames[device.nextCalibrationMonth - 1]}{' '}
//                         {device.nextCalibrationYear}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   )
// }

// export default CalibrationTimeline

// ---------------------------------------------------------------------------------------------------------

// import React, { useEffect, useState } from 'react'
// import {
//   Container,
//   Typography,
//   Grid,
//   Box,
//   Chip,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow
// } from '@mui/material'
// import axios from 'axios'
// import { api } from '../config'

// // Define los tipos de datos
// interface Device {
//   deviceId: number
//   deviceName: string
//   calibrationMonth: number
//   nextCalibrationMonth: number
//   calibrationYear: number
//   nextCalibrationYear: number
// }

// interface DataResponse {
//   month: number
//   nextMonth: number
//   totalMonths: number
//   startYear: number
//   endYear: number
//   devices: Device[]
// }

// // Función para generar los nombres de los meses
// const getMonthNames = (): string[] => [
//   'Enero',
//   'Febrero',
//   'Marzo',
//   'Abril',
//   'Mayo',
//   'Junio',
//   'Julio',
//   'Agosto',
//   'Septiembre',
//   'Octubre',
//   'Noviembre',
//   'Diciembre'
// ]

// Calcula el cronograma de calibración
// const createTimeline = (data: DataResponse) => {
//   const { month, nextMonth, totalMonths, devices, startYear } = data
//   const months: Array<{
//     month: number
//     year: number
//     label: string
//     isCalibration: boolean
//     isNextCalibration: boolean
//   }> = []

//   const monthNames = getMonthNames()
//   let currentMonth = month
//   let currentYear = startYear

//   for (let i = 0; i < totalMonths; i++) {
//     months.push({
//       month: currentMonth,
//       year: currentYear,
//       label: `${monthNames[currentMonth - 1]} ${currentYear}`,
//       isCalibration: devices.some(
//         (device) =>
//           device.calibrationMonth === currentMonth &&
//           device.calibrationYear === currentYear
//       ),
//       isNextCalibration: devices.some(
//         (device) =>
//           device.nextCalibrationMonth === currentMonth &&
//           device.nextCalibrationYear === currentYear
//       )
//     })

//     currentMonth++
//     if (currentMonth > 12) {
//       currentMonth = 1
//       currentYear++
//     }
//   }

//   return months
// }

// interface Props {
//   customerId?: number | string
// }

// const apiUrl = api()

// const CalibrationTimeline: React.FC<Props> = ({ customerId }) => {
//   const [timeline, setTimeline] = useState<Array<{
//     month: number
//     year: number
//     label: string
//     isCalibration: boolean
//     isNextCalibration: boolean
//   }> | null>(null)
//   const [loading, setLoading] = useState<boolean>(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true)
//       setError(null)
//       try {
//         const response = await axios.get<DataResponse>(
//           `${apiUrl}/files/customer/${customerId}/schedule`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//             }
//           }
//         )
//         const data = response.data
//         const timelineData = createTimeline(data)
//         setTimeline(timelineData)
//       } catch (error) {
//         console.error('Error fetching data:', error)
//         setError('Failed to load data')
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (customerId) {
//       fetchData()
//     }
//   }, [customerId])

//   if (loading) {
//     return <Typography>Loading...</Typography>
//   }

//   if (error) {
//     return <Typography color='error'>{error}</Typography>
//   }

//   if (!timeline) {
//     return <Typography>No data available</Typography>
//   }

//   // Organiza los dispositivos por mes
//   const devicesByMonth: Record<string, Device[]> = {}
//   timeline.forEach((entry) => {
//     const monthLabel = entry.label
//     devicesByMonth[monthLabel] = timeline
//       .filter((t) => t.label === monthLabel)
//       .map((t) => ({
//         deviceId: 0,
//         deviceName: '',
//         calibrationMonth: t.month,
//         nextCalibrationMonth: t.month,
//         calibrationYear: t.year,
//         nextCalibrationYear: t.year
//       }))
//   })

//   return (
//     <Container>
//       <Typography variant='h4' gutterBottom>
//         Cronograma de Calibración
//       </Typography>
//       <Grid container spacing={2}>
//         <Grid item xs={12}>
//           <Paper>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Equipo</TableCell>
//                     {timeline.map((entry, index) => (
//                       <TableCell key={index}>{entry.label}</TableCell>
//                     ))}
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {timeline.map((entry, index) => (
//                     <TableRow key={index}>
//                       <TableCell>
//                         {devicesByMonth[entry.label]?.map((device) => (
//                           <Typography key={device.deviceId}>
//                             {device.deviceName}
//                           </Typography>
//                         ))}
//                       </TableCell>
//                       {timeline.map((item, itemIndex) => (
//                         <TableCell key={itemIndex}>
//                           {item.isCalibration && (
//                             <Chip
//                               label='Calibración'
//                               size='small'
//                               color='primary'
//                             />
//                           )}
//                           {item.isNextCalibration && (
//                             <Chip
//                               label='Próxima'
//                               size='small'
//                               color='secondary'
//                             />
//                           )}
//                         </TableCell>
//                       ))}
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Container>
//   )
// }

// export default CalibrationTimeline

// ---------------------------------------------------------------------------------------------------------

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
  TableRow
  // Button
} from '@mui/material'
import axios from 'axios'
import { api } from '../config'
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
  devices: Device[]
}

// Función para generar los nombres de los meses
const getMonthNames = (): string[] => [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
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
      label: `${monthNames[currentMonth - 1]} ${currentYear}`
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

const apiUrl = api()

const CalibrationTimeline: React.FC<Props> = ({ customerId }) => {
  const [timeline, setTimeline] = useState<
    { month: number; year: number; label: string }[] | null
  >(null)
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<DataResponse>(
          `${apiUrl}/files/customer/${customerId}/schedule`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )
        const data = response.data
        setTimeline(createTimeline(data))
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
    return <Typography>Loading...</Typography>
  }

  if (error) {
    return <Typography color='error'>{error}</Typography>
  }

  if (!timeline || !devices) {
    return <Typography>No data available</Typography>
  }

  return (
    <Box width='100%' mt={2}>
      {/* <Button
        variant='contained'
        color='primary'
        onClick={() => printToPDF('calibration-timeline')}
      >
        Exportar a PDF
      </Button> */}
      <Box id='calibration-timeline'>
        <Paper>
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
                      zIndex: 1 // Asegura que esté encima de las celdas
                    }}
                  >
                    Equipo
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
                        color: '#000'
                      }}
                    >
                      {entry.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.deviceId}>
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
                    {timeline.map((entry, index) => {
                      const isCalibration =
                        entry.month === device.calibrationMonth &&
                        entry.year === device.calibrationYear
                      const isNextCalibration =
                        entry.month === device.nextCalibrationMonth &&
                        entry.year === device.nextCalibrationYear

                      return (
                        <TableCell
                          key={index}
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
                            <Chip
                              label='Calibración'
                              size='small'
                              color='primary'
                            />
                          )}
                          {isNextCalibration && (
                            <Chip
                              label='Próxima'
                              size='small'
                              color='secondary'
                            />
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
