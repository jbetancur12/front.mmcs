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
  Grid,
  Button,
  Skeleton,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper
} from '@mui/material'
import { ArrowBack, Close as CloseIcon } from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { $realTimeData } from 'src/store/deviceIotStore'

import { RANGE_OPTIONS } from './constants'
import ModuleConfigForm, { ModuleConfig } from './ModuleConfigForm'
import MainChart from './GraphDrawer/parts/MainChart'
import TemperatureChart from './TemperatureChart'
import { getGaugeConfig } from './helpers'

import Gauge from './Gauge'

import EventHistory from './EventHistory'

interface GraphDrawerProps {
  deviceId: number | string | null
  deviceName: string
  open: boolean
  onClose: () => void
  devicesFromApi: any
}

const GraphDrawer = ({
  deviceId,
  open,
  onClose,
  deviceName,
  devicesFromApi: deviceDetails
}: GraphDrawerProps) => {
  const axiosPrivate = useAxiosPrivate()
  const realTimeData = useStore($realTimeData)

  const [selectedTab, setSelectedTab] = useState<string>('resumen')
  const [selectedRange, setSelectedRange] = useState(RANGE_OPTIONS[0])
  const [visibleSeries, setVisibleSeries] = useState({
    temperature: true,
    humidity: true
  })
  const [selectedConfig, setSelectedConfig] = useState<
    ModuleConfig | undefined
  >(undefined)
  const [selectedSensorType, setSelectedSensorType] = useState<
    ModuleConfig['sensorType'] | null
  >(null)

  const realTimeDataFlat = useMemo(
    () =>
      Object.entries(realTimeData).flatMap(([_, values]) =>
        values.map((payload) => ({
          ...payload.data,
          timestamp: payload.timestamp
        }))
      ),
    [realTimeData]
  )
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  const lilygoData = realTimeData?.[deviceName] || []
  const lastEntry = lilygoData[lilygoData.length - 1] || null
  const lastTemperature = lastEntry?.data?.sen.t || 0
  const lastHumidity = lastEntry?.data?.sen.h || 0
  const status = lastEntry ? 'Online' : 'Offline'

  const { startDateStr, endDateStr } = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date(
      endDate.getTime() - (selectedRange?.hours ?? 0) * 60 * 60 * 1000
    )
    return {
      startDateStr: startDate.toISOString(),
      endDateStr: endDate.toISOString()
    }
  }, [selectedRange])

  const {
    data: graphData,
    isLoading,
    error
  } = useQuery(
    ['deviceDataPoints', deviceId, startDateStr, endDateStr],
    async () => {
      if (!deviceId) return []
      const response = await axiosPrivate.get(
        `/devicesIot/dataPoints?startDate=${startDateStr}&endDate=${endDateStr}&deviceIotId=${deviceId}`
      )
      return response.data
    },
    {
      enabled: !!deviceId,
      keepPreviousData: true, // Mantiene datos anteriores durante la carga
      staleTime: 60_000 // Considerar los datos frescos por 1 minuto
    }
  )

  // const handleSelectSensorType = (sensorType: ModuleConfig['sensorType']) => {
  //   const existingConfig = currentDevice?.deviceIotConfigs?.find(
  //     (c: any) => c.sensorType === sensorType
  //   )

  //   setSelectedSensorType(sensorType)

  //   if (existingConfig) {
  //     setSelectedConfig({
  //       ...existingConfig,
  //       absoluteMin: Number(existingConfig.absoluteMin),
  //       absoluteMax: Number(existingConfig.absoluteMax),
  //       okMin: Number(existingConfig.okMin),
  //       okMax: Number(existingConfig.okMax)
  //     })
  //   } else {
  //     setSelectedConfig({
  //       deviceIotId: Number(deviceId),
  //       sensorType,
  //       absoluteMin: sensorType === 'TEMPERATURA' ? 20 : 50,
  //       absoluteMax: sensorType === 'TEMPERATURA' ? 30 : 80,
  //       okMin: sensorType === 'TEMPERATURA' ? 20 : 50,
  //       okMax: sensorType === 'TEMPERATURA' ? 25 : 60,
  //       alarmThresholds: [],
  //       warningThresholds: []
  //     })
  //   }
  // }

  const extractAlarms = (deviceData: any) => {
    const temperatureConfig = deviceData?.deviceIotConfigs?.find(
      (c: any) => c.sensorType === 'TEMPERATURA'
    )
    const humidityConfig = deviceData?.deviceIotConfigs?.find(
      (c: any) => c.sensorType === 'HUMEDAD'
    )

    return {
      temperatureAlarms: {
        above: temperatureConfig?.alarmThresholds?.find(
          (t: any) => t.type === 'ABOVE' && t.enabled
        )?.min,
        below: temperatureConfig?.alarmThresholds?.find(
          (t: any) => t.type === 'BELOW' && t.enabled
        )?.max
      },
      humidityAlarms: {
        above: humidityConfig?.alarmThresholds?.find(
          (t: any) => t.type === 'ABOVE' && t.enabled
        )?.min,
        below: humidityConfig?.alarmThresholds?.find(
          (t: any) => t.type === 'BELOW' && t.enabled
        )?.max
      }
    }
  }

  const combinedData = useMemo(
    () =>
      graphData?.map((dp: any) => ({
        timestamp: new Date(dp.timestamp).getTime(),
        temperature: dp.avg_temperature,
        humidity: dp.avg_humidity
      })) || [],
    [graphData]
  )

  const handleToggleSeries = (series: 'temperature' | 'humidity') => {
    setVisibleSeries((prev) => ({ ...prev, [series]: !prev[series] }))
  }

  const aggregateStats = useMemo(() => {
    if (!graphData || graphData.length === 0) return null

    const tempValues = graphData.reduce(
      (acc: any, dp: any) => {
        acc.sum += dp.avg_temperature
        acc.min = Math.min(acc.min, dp.min_temperature)
        acc.max = Math.max(acc.max, dp.max_temperature)
        return acc
      },
      { sum: 0, min: Infinity, max: -Infinity }
    )

    const humValues = graphData.reduce(
      (acc: any, dp: any) => {
        acc.sum += dp.avg_humidity
        acc.min = Math.min(acc.min, dp.min_humidity)
        acc.max = Math.max(acc.max, dp.max_humidity)
        return acc
      },
      { sum: 0, min: Infinity, max: -Infinity }
    )

    return {
      avgTemp: tempValues.sum / graphData.length,
      minTemp: tempValues.min,
      maxTemp: tempValues.max,
      avgHum: humValues.sum / graphData.length,
      minHum: humValues.min,
      maxHum: humValues.max
    }
  }, [graphData])

  const currentDevice = deviceDetails?.find(
    (device: any) => device.id === deviceId
  )

  const { temperatureAlarms, humidityAlarms } = extractAlarms(currentDevice)

  const tempConfig = getGaugeConfig(
    currentDevice?.deviceIotConfigs,
    'TEMPERATURA'
  )
  const humConfig = getGaugeConfig(currentDevice?.deviceIotConfigs, 'HUMEDAD')

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%' } }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position='static' color='default' sx={{ boxShadow: 'none' }}>
          <Toolbar>
            <IconButton edge='start' onClick={onClose} aria-label='volver'>
              <ArrowBack />
            </IconButton>

            <Box sx={{ flexGrow: 1, ml: 2 }}>
              <Typography variant='h6' component='span'>
                Sensor: "{deviceName}"
              </Typography>
              <Typography component='span' sx={{ ml: 2 }}>
                Estado: [
                <Box
                  component='span'
                  sx={{
                    color: status === 'Online' ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  {status}
                </Box>
                ]
              </Typography>
            </Box>

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant='fullWidth'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label='Resumen' value='resumen' />
          <Tab label='Histórico' value='historico' />
          <Tab label='Configuración' value='configuracion' />
          <Tab label='Eventos' value='eventos' />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {selectedTab === 'resumen' && (
            <Grid container spacing={3}>
              {/* Sección superior: Gauges y última actualización */}
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: 320 }}>
                      <Typography variant='h6' gutterBottom>
                        Temperatura
                      </Typography>
                      <Box sx={{ height: 'calc(100% - 48px)' }}>
                        <Gauge
                          value={Number(lastTemperature)}
                          config={{
                            absoluteMin: tempConfig?.absoluteMin || 20,
                            absoluteMax: tempConfig?.absoluteMax || 30,
                            okMin: tempConfig?.okMin || 20,
                            okMax: tempConfig?.okMax || 25,
                            alarmThresholds: tempConfig?.alarmThresholds || [],
                            warningThresholds:
                              tempConfig?.warningThresholds || [],
                            sensorType: 'TEMPERATURA'
                          }}
                          // size={120} // Si tu componente Gauge acepta prop de tamaño
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: 320 }}>
                      <Typography variant='h6' gutterBottom>
                        Humedad
                      </Typography>
                      <Box sx={{ height: 'calc(100% - 48px)' }}>
                        <Gauge
                          value={Number(lastHumidity)}
                          config={{
                            absoluteMin: humConfig?.absoluteMin || 50,
                            absoluteMax: humConfig?.absoluteMax || 80,
                            okMin: humConfig?.okMin || 50,
                            okMax: humConfig?.okMax || 60,
                            alarmThresholds: humConfig?.alarmThresholds || [],
                            warningThresholds:
                              humConfig?.warningThresholds || [],
                            sensorType: 'HUMEDAD'
                          }}
                          // size={120}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Sección inferior: Gráficas en tiempo real */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, height: 320 }}>
                      <Typography variant='h6' gutterBottom>
                        Variación Temporal - Temperatura (°C)
                      </Typography>
                      <TemperatureChart
                        type='temperature'
                        data={realTimeDataFlat}
                      />
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, height: 320 }}>
                      <Typography variant='h6' gutterBottom>
                        Variación Temporal - Humedad (%)
                      </Typography>
                      <TemperatureChart
                        type='humidity'
                        data={realTimeDataFlat}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' align='left'>
                  Última actualización:{' '}
                  {new Date(lastEntry?.timestamp).toLocaleTimeString()}
                </Typography>
              </Grid>
              {/* <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    height: '100%'
                  }}
                >
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      Variación de Temperatura
                    </Typography>
                    <TemperatureChart
                      type='temperature'
                      data={realTimeDataFlat}
                      // height={250}
                    />
                  </Paper>

                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      Variación de Humedad
                    </Typography>
                    <TemperatureChart
                      type='humidity'
                      data={realTimeDataFlat}
                      // height={250}
                    />
                  </Paper>
                </Box>
              </Grid> */}

              {/* Sección Mapa */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='h6' gutterBottom>
                    Ubicación del Sensor
                  </Typography>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    {/* <MiniMap lat={latitude} lon={longitude} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Coordenadas: {latitude}, {longitude}
          </Typography> */}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
          {selectedTab === 'historico' && (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {RANGE_OPTIONS.map((rangeOption) => (
                  <Button
                    key={rangeOption.label}
                    variant={
                      rangeOption.label === selectedRange.label
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => setSelectedRange(rangeOption)}
                  >
                    {rangeOption.label}
                  </Button>
                ))}
              </Box>

              {isLoading ? (
                <Skeleton variant='rectangular' width='100%' height={400} />
              ) : error ? (
                <Typography color='error'>
                  Error al cargar datos históricos
                </Typography>
              ) : (
                <MainChart
                  graphData={combinedData}
                  visibleSeries={visibleSeries}
                  onToggleSeries={handleToggleSeries}
                  temperatureAlarms={temperatureAlarms}
                  humidityAlarms={humidityAlarms}
                />
              )}
              {aggregateStats && (
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: 400, // Ancho máximo reducido
                      width: '100%',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Table size='small' sx={{ width: '100%' }}>
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell
                            sx={{ width: '40%', padding: '8px' }}
                          ></TableCell>
                          <TableCell align='center' sx={{ padding: '8px' }}>
                            Temperatura (°C)
                          </TableCell>
                          <TableCell align='center' sx={{ padding: '8px' }}>
                            Humedad (%)
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {[
                          {
                            label: 'Promedio',
                            temp: aggregateStats.avgTemp,
                            hum: aggregateStats.avgHum
                          },
                          {
                            label: 'Mínimo',
                            temp: aggregateStats.minTemp,
                            hum: aggregateStats.minHum
                          },
                          {
                            label: 'Máximo',
                            temp: aggregateStats.maxTemp,
                            hum: aggregateStats.maxHum
                          }
                        ].map((row) => (
                          <TableRow key={row.label}>
                            <TableCell sx={{ padding: '8px', fontWeight: 500 }}>
                              {row.label}
                            </TableCell>
                            <TableCell align='center' sx={{ padding: '8px' }}>
                              {typeof row.temp === 'number'
                                ? row.temp.toFixed(2)
                                : 'N/A'}
                            </TableCell>
                            <TableCell align='center' sx={{ padding: '8px' }}>
                              {typeof row.hum === 'number'
                                ? row.hum.toFixed(2)
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
            </>
          )}
          {selectedTab === 'configuracion' && (
            <Box sx={{ mt: 2 }}>
              {!selectedSensorType ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant='h6' gutterBottom>
                      Seleccionar tipo de sensor para configurar
                    </Typography>
                  </Grid>

                  {(
                    [
                      'TEMPERATURA',
                      'HUMEDAD',
                      'PRESION',
                      'OTRO'
                    ] as ModuleConfig['sensorType'][]
                  ).map((sensorType) => {
                    const existingConfig =
                      currentDevice?.deviceIotConfigs?.find(
                        (c: any) => c.sensorType === sensorType
                      )

                    return (
                      <Grid item xs={6} md={3} key={sensorType}>
                        <Button
                          fullWidth
                          variant={existingConfig ? 'contained' : 'outlined'}
                          color={existingConfig ? 'secondary' : 'primary'}
                          onClick={() => {
                            if (existingConfig) {
                              setSelectedConfig({
                                ...existingConfig,
                                absoluteMin: Number(existingConfig.absoluteMin),
                                absoluteMax: Number(existingConfig.absoluteMax),
                                okMin: Number(existingConfig.okMin),
                                okMax: Number(existingConfig.okMax)
                              })
                            } else {
                              setSelectedConfig({
                                deviceIotId: Number(deviceId),
                                sensorType,
                                absoluteMin:
                                  sensorType === 'TEMPERATURA' ? 20 : 50,
                                absoluteMax:
                                  sensorType === 'TEMPERATURA' ? 30 : 80,
                                okMin: sensorType === 'TEMPERATURA' ? 20 : 50,
                                okMax: sensorType === 'TEMPERATURA' ? 25 : 60,
                                alarmThresholds: [],
                                warningThresholds: []
                              })
                            }
                            setSelectedSensorType(
                              sensorType as ModuleConfig['sensorType']
                            )
                          }}
                          sx={{ height: 80 }}
                        >
                          <Box>
                            <Typography variant='body1'>
                              {sensorType}
                            </Typography>
                            <Typography variant='caption'>
                              {existingConfig
                                ? 'Configurado'
                                : 'Nueva configuración'}
                            </Typography>
                          </Box>
                        </Button>
                      </Grid>
                    )
                  })}
                </Grid>
              ) : (
                <Box>
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={() => {
                      setSelectedSensorType(null)
                      setSelectedConfig(undefined)
                    }}
                    sx={{ mb: 2 }}
                  >
                    Volver a selección
                  </Button>

                  <ModuleConfigForm
                    deviceIotId={Number(deviceId)}
                    initialData={selectedConfig}
                    onSuccess={() => {
                      // Actualizar datos del dispositivo
                      setSelectedSensorType(null)
                      setSelectedConfig(undefined)
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
          {selectedTab === 'eventos' && (
            <EventHistory deviceId={deviceId as string} />
          )}
        </Box>
      </Box>
    </Drawer>
  )
}

export default GraphDrawer
