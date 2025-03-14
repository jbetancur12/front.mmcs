import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

import TemperatureChart from './TemperatureChart'
import { useStore } from '@nanostores/react'
import { $realTimeData } from 'src/store/deviceIotStore'

interface GraphDrawerProps {
  deviceId: number | string | null
  open: boolean
  onClose: () => void
}

interface DataPoint {
  timestamp: Date
  temperature: number
  humidity: number
}

const GraphDrawer = ({ deviceId, open, onClose }: GraphDrawerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const realTimeData = useStore($realTimeData)
  const [visibleSeries, setVisibleSeries] = useState({
    temperature: true,
    humidity: true
  })

  // Calcula las fechas de las últimas 12 horas (se recalcula solo cuando cambia deviceId)
  const { startDateStr, endDateStr } = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000)
    return {
      startDateStr: startDate.toISOString(),
      endDateStr: endDate.toISOString()
    }
  }, [deviceId])

  // Consulta los datos de la API solo cuando hay un dispositivo seleccionado
  const {
    data: graphData,
    isLoading,
    error
  } = useQuery(
    ['deviceDataPoints', deviceId, startDateStr, endDateStr],
    async () => {
      if (!deviceId) return []
      const response = await axiosPrivate.get(
        `http://localhost:5050/devicesIot/dataPoints?startDate=${startDateStr}&endDate=${endDateStr}&deviceIotId=${deviceId}`
      )
      return response.data
    },
    { enabled: !!deviceId }
  )

  // Combina los datos de temperatura y humedad en un único arreglo
  const combinedData = useMemo((): {
    timestamp: number
    temperature: number
    humidity: number
  }[] => {
    return graphData
      ? graphData.map((dp: any) => ({
          timestamp: new Date(dp.timestamp).getTime(), // usamos timestamp numérico para el eje X
          temperature: dp.avg_temperature,
          humidity: dp.avg_humidity
        }))
      : []
  }, [graphData])

  // Calcula los valores agregados para mostrar en la tabla
  const aggregateStats = useMemo(() => {
    if (!graphData || graphData.length === 0) return null

    const sumTemp = graphData.reduce(
      (sum: number, dp: any) => sum + dp.avg_temperature,
      0
    )
    const avgTemp = sumTemp / graphData.length
    const minTemp = Math.min(...graphData.map((dp: any) => dp.min_temperature))
    const maxTemp = Math.max(...graphData.map((dp: any) => dp.max_temperature))

    const sumHum = graphData.reduce(
      (sum: number, dp: any) => sum + dp.avg_humidity,
      0
    )
    const avgHum = sumHum / graphData.length
    const minHum = Math.min(...graphData.map((dp: any) => dp.min_humidity))
    const maxHum = Math.max(...graphData.map((dp: any) => dp.max_humidity))

    return {
      avgTemp,
      minTemp,
      maxTemp,
      avgHum,
      minHum,
      maxHum
    }
  }, [graphData])

  // Dominio para los ejes
  const tempDomain: [number, number] = useMemo(() => {
    if (!aggregateStats) return [0, 1]
    return [aggregateStats.minTemp, aggregateStats.maxTemp]
  }, [aggregateStats])

  const humDomain: [number, number] = useMemo(() => {
    if (!aggregateStats) return [0, 1]
    return [aggregateStats.minHum, aggregateStats.maxHum]
  }, [aggregateStats])

  // Función para formatear el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label)
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: 5
          }}
        >
          <Typography variant='caption'>{`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`}</Typography>
          {payload.map((pl: any) => (
            <Typography
              key={pl.dataKey}
              variant='caption'
              sx={{ color: pl.color }}
            >
              {pl.dataKey === 'temperature'
                ? `Temp: ${pl.value.toFixed(2)}°C`
                : `Hum: ${pl.value.toFixed(2)}%`}
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  // Función para manejar el clic en la leyenda y alternar la visibilidad de las series
  const handleLegendClick = (o: any) => {
    const { dataKey } = o
    setVisibleSeries((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: '100%' }
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Título y botón de cierre */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant='h6'>
            {graphData && graphData[0]?.deviceIot?.name
              ? `Gráfica de ${graphData[0].deviceIot.name}`
              : 'Gráfica'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isLoading ? (
          <Typography>Cargando datos...</Typography>
        ) : error ? (
          <Typography>Error al cargar los datos.</Typography>
        ) : (
          <>
            {/* Gráfico combinado con dos ejes y tooltip */}
            <Box sx={{ width: '100%', height: 400, mb: 2 }}>
              <ResponsiveContainer>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='timestamp'
                    type='number'
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(tick) => {
                      const date = new Date(tick)
                      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                    }}
                  />
                  <YAxis
                    yAxisId='left'
                    domain={tempDomain}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: '°C',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10
                    }}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    domain={humDomain}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: '%',
                      angle: 90,
                      position: 'insideRight',
                      fontSize: 10
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    onClick={handleLegendClick}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                  {visibleSeries.temperature && (
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='temperature'
                      stroke='#F44336'
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 2 }}
                    />
                  )}
                  {visibleSeries.humidity && (
                    <Line
                      yAxisId='right'
                      type='monotone'
                      dataKey='humidity'
                      stroke='#2196F3'
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Tabla con estadísticas agregadas */}
            {aggregateStats && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant='subtitle1' sx={{ mb: 1 }}>
                      Estadísticas agregadas
                    </Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell />
                          <TableCell align='center'>Temperatura (°C)</TableCell>
                          <TableCell align='center'>Humedad (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Promedio</TableCell>
                          <TableCell align='center'>
                            {aggregateStats.avgTemp.toFixed(2)}
                          </TableCell>
                          <TableCell align='center'>
                            {aggregateStats.avgHum.toFixed(2)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mínimo</TableCell>
                          <TableCell align='center'>
                            {aggregateStats.minTemp}
                          </TableCell>
                          <TableCell align='center'>
                            {aggregateStats.minHum}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Máximo</TableCell>
                          <TableCell align='center'>
                            {aggregateStats.maxTemp}
                          </TableCell>
                          <TableCell align='center'>
                            {aggregateStats.maxHum}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                  <Grid item xs={8}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {/* Gráfico de Temperatura */}
                      <Box sx={{ height: 300 }}>
                        <TemperatureChart
                          type='temperature'
                          data={Object.values(realTimeData)
                            .flat()
                            .map((payload) => payload.data)}
                        />
                      </Box>
                      {/* Gráfico de Humedad */}
                      <Box sx={{ height: 300, width: '100%' }}>
                        <TemperatureChart
                          type='humidity'
                          data={Object.values(realTimeData)
                            .flat()
                            .map((payload) => payload.data)}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  )
}

export default GraphDrawer
