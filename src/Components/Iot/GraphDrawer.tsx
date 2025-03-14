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
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryAxis,
  VictoryLegend,
  VictoryVoronoiContainer,
  VictoryTooltip
} from 'victory'

import TemperatureChart from './TemperatureChart'
import { useStore } from '@nanostores/react'
import { $realTimeData } from 'src/store/deviceIotStore'

interface GraphDrawerProps {
  deviceId: number | string | null
  open: boolean
  onClose: () => void
}

interface DataPoint {
  x: Date
  y: number
  series: 'temperature' | 'humidity'
  rawY?: number
}

const GraphDrawer = ({ deviceId, open, onClose }: GraphDrawerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const realTimeData = useStore($realTimeData)
  console.log('🚀 ~ GraphDrawer ~ realTimeData:', realTimeData)
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

  // Mapea los datos para la temperatura (sin transformación)
  const temperatureData = useMemo(() => {
    return graphData
      ? graphData.map((dp: any) => ({
          x: new Date(dp.timestamp),
          y: dp.avg_temperature,
          series: 'temperature'
        }))
      : []
  }, [graphData])

  // Mapea los datos de humedad y guarda el valor original en rawY
  const humidityData = useMemo(() => {
    return graphData
      ? graphData.map((dp: any) => ({
          x: new Date(dp.timestamp),
          y: dp.avg_humidity,
          rawY: dp.avg_humidity,
          series: 'humidity'
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

  // Si se tienen datos, definimos el dominio para la temperatura y para la humedad
  const tempDomain: [number, number] = useMemo(() => {
    if (!aggregateStats) return [0, 1]
    return [aggregateStats.minTemp, aggregateStats.maxTemp]
  }, [aggregateStats])

  const humDomain: [number, number] = useMemo(() => {
    if (!aggregateStats) return [0, 1]
    return [aggregateStats.minHum, aggregateStats.maxHum]
  }, [aggregateStats])

  // Función para escalar el valor de humedad al dominio de temperatura
  const scaleHumidity = (h: number) => {
    const [hMin, hMax] = humDomain
    const [tMin, tMax] = tempDomain
    return ((h - hMin) / (hMax - hMin)) * (tMax - tMin) + tMin
  }

  // Transforma los datos de humedad para graficarlos en el mismo dominio que la temperatura
  const humidityScaledData = useMemo((): DataPoint[] => {
    return humidityData.map((d: DataPoint) => ({
      ...d,
      y: scaleHumidity(d.y)
    }))
  }, [humidityData, tempDomain, humDomain])

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
            {/* Gráfico combinado con tooltip y doble eje */}
            <Box
              sx={{
                maxWidth: '100%',
                overflowX: 'auto',
                mb: 2,
                height: '400px'
              }}
            >
              <VictoryChart
                theme={VictoryTheme.material}
                scale={{ x: 'time' }}
                padding={{ top: 20, bottom: 40, left: 40, right: 60 }}
                height={200}
                width={800}
                domain={{ y: tempDomain }}
                containerComponent={
                  <VictoryVoronoiContainer
                    labels={({ datum }) => {
                      if (datum.series === 'temperature') {
                        return `Temp: ${datum.y.toFixed(2)}°C`
                      }
                      if (datum.series === 'humidity') {
                        // Muestra el valor original (no escalado)
                        return `Hum: ${datum.rawY.toFixed(2)}%`
                      }
                      return ''
                    }}
                    labelComponent={
                      <VictoryTooltip
                        cornerRadius={0}
                        flyoutStyle={{ fill: 'white', padding: 5 }}
                        style={{ fontSize: 10 }} // Tamaño de fuente más pequeño
                      />
                    }
                  />
                }
              >
                <VictoryAxis
                  style={{
                    tickLabels: {
                      fontSize: 8,
                      padding: 5
                    }
                  }}
                  tickFormat={(t) =>
                    `${t.getHours()}:${t
                      .getMinutes()
                      .toString()
                      .padStart(2, '0')}`
                  }
                />
                {/* Eje izquierdo para la temperatura */}
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: {
                      fontSize: 8,
                      padding: 5
                    }
                  }}
                />
                {/* Eje derecho para la humedad */}
                <VictoryAxis
                  dependentAxis
                  offsetX={740} // Ajusta según el ancho del gráfico
                  style={{
                    axis: { stroke: '#2196F3' },
                    ticks: { padding: 5, fontSize: 8 },
                    tickLabels: { fill: '#2196F3', fontSize: 8, padding: 5 }
                  }}
                  tickFormat={(t) => {
                    // Inversa la escala para mostrar el valor real de humedad
                    const [tMin, tMax] = tempDomain
                    const [hMin, hMax] = humDomain
                    const humValue =
                      ((t - tMin) / (tMax - tMin)) * (hMax - hMin) + hMin
                    return humValue.toFixed(0)
                  }}
                />
                <VictoryLine
                  data={visibleSeries.temperature ? temperatureData : []}
                  style={{
                    data: {
                      stroke: '#F44336',
                      strokeWidth: 0.3,
                      opacity: visibleSeries.temperature ? 1 : 0.3
                    }
                  }}
                />
                <VictoryLine
                  data={visibleSeries.humidity ? humidityScaledData : []}
                  style={{
                    data: {
                      stroke: '#2196F3',
                      strokeWidth: 0.3,
                      opacity: visibleSeries.humidity ? 1 : 0.3
                    }
                  }}
                />
                <VictoryLegend
                  x={250}
                  y={10}
                  orientation='horizontal'
                  gutter={10}
                  style={{
                    labels: { fontSize: 8, cursor: 'pointer' } // Tamaño de fuente más pequeño
                  }}
                  data={[
                    {
                      name: 'Temperatura (°C)',
                      symbol: {
                        fill: visibleSeries.temperature ? '#F44336' : '#cccccc'
                      }
                    },
                    {
                      name: 'Humedad (%)',
                      symbol: {
                        fill: visibleSeries.humidity ? '#2196F3' : '#cccccc'
                      }
                    }
                  ]}
                  events={[
                    {
                      target: 'data',
                      eventHandlers: {
                        onClick: (_: any, props: any) => {
                          const series = props.datum.name.includes(
                            'Temperatura'
                          )
                            ? 'temperature'
                            : 'humidity'
                          setVisibleSeries((prev) => ({
                            ...prev,
                            [series]: !prev[series]
                          }))
                          return []
                        }
                      }
                    }
                  ]}
                />
              </VictoryChart>
            </Box>

            {/* Tabla con estadísticas agregadas */}
            {aggregateStats && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    {/* <Gauge
                      width={100}
                      height={100}
                      value={
                        realTimeData['LILYGO-ColdChain'].length &&
                        Number(
                          realTimeData['LILYGO-ColdChain'][
                            realTimeData['LILYGO-ColdChain'].length - 1
                          ].data.sen.t
                        )
                      }
                    />
                    <Gauge
                      width={100}
                      height={100}
                      value={
                        realTimeData['LILYGO-ColdChain'].length &&
                        Number(
                          realTimeData['LILYGO-ColdChain'][
                            realTimeData['LILYGO-ColdChain'].length - 1
                          ].data.sen.h
                        )
                      }
                    /> */}
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
