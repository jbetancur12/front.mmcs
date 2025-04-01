// components/DeviceGraphs/GraphDrawer/tabs/DeviceDetailPanel.tsx
import { Alert, Badge, Box, Chip, Grid, Paper, Typography } from '@mui/material'

import { DataPayload, DeviceIot } from '../../types'
import {
  getConnectionIcon,
  getStatusColor
} from '../../DeviceIotMap/utils/common'
import {
  BatteryFull,
  Info,
  MyLocation,
  Opacity,
  Thermostat,
  Warning
} from '@mui/icons-material'
import { format } from 'date-fns'
import { AlarmSeverity } from '../../DeviceIotMap/constants'
import { DeviceAlarm } from '../../DeviceIotMap/types'

interface SummaryTabProps {
  deviceLastData: DataPayload[]
  lastEntry?: any
  lastTemperature: number | string
  lastHumidity: number | string
  deviceName?: string
  device: DeviceIot | null
}

export const DeviceDetailPanel = ({
  deviceLastData,
  device
}: SummaryTabProps) => {
  const hasActiveAlarms = device?.isInAlarm
  const activeAlarms = device?.alarms.filter(
    (alarm) => alarm.enabled === true && alarm.active === true
  )

  const getHighestSeverity = () => {
    if (!activeAlarms || activeAlarms.length === 0) return null

    let highestSeverity = null
    for (const alarm of activeAlarms) {
      if (
        !highestSeverity ||
        alarm.severity === AlarmSeverity.CRITICAL ||
        (highestSeverity !== AlarmSeverity.CRITICAL &&
          alarm.severity === AlarmSeverity.WARNING)
      ) {
        highestSeverity = alarm.severity
      }
    }
    return highestSeverity
  }

  const highestSeverity = getHighestSeverity()
  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            {hasActiveAlarms ? (
              <Badge
                badgeContent={<Warning fontSize='small' color='error' />}
                sx={{
                  '& .MuiBadge-badge': {
                    right: -15,
                    top: 5
                  }
                }}
              >
                {device.name}
              </Badge>
            ) : (
              device?.name
            )}
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            {'Ubicacion'}
          </Typography>
          {hasActiveAlarms && (
            <Alert
              severity={
                highestSeverity === AlarmSeverity.INFO
                  ? 'info'
                  : highestSeverity === AlarmSeverity.WARNING
                    ? 'warning'
                    : highestSeverity === AlarmSeverity.CRITICAL
                      ? 'error'
                      : 'error'
              }
              icon={
                highestSeverity === AlarmSeverity.INFO ? (
                  <Info />
                ) : highestSeverity === AlarmSeverity.WARNING ? (
                  <Warning />
                ) : (
                  <Warning />
                )
              }
              sx={{
                mt: 2,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.7 }
                }
              }}
            >
              Este dispositivo tiene alarmas activas
            </Alert>
          )}
        </Box>
        <Chip
          label={hasActiveAlarms ? 'ALARMA' : device?.status}
          variant='filled'
          color={
            getStatusColor(
              device?.status,
              hasActiveAlarms,
              highestSeverity
            ) as any
          }
          size='medium'
          icon={hasActiveAlarms ? <Warning /> : undefined}
          sx={{
            fontWeight: 'bold',
            ...(hasActiveAlarms && {
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            })
          }}
        />
      </Box>
      {/* Information cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MyLocation color='primary' sx={{ mr: 1 }} />
              <Typography variant='subtitle2' color='text.secondary'>
                Coordinates
              </Typography>
            </Box>
            <Typography variant='h6'>
              {deviceLastData[0]?.data?.gps.join(', ')}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BatteryFull color='success' />
              <Typography
                variant='subtitle2'
                color='text.secondary'
                sx={{ ml: 1 }}
              >
                Battery Level
              </Typography>
            </Box>
            <Typography variant='h6'>{'100'}%</Typography>
          </Paper>
        </Grid>
        {/* Connection Status */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getConnectionIcon(device, highestSeverity)}
              <Typography
                variant='subtitle2'
                color='text.secondary'
                sx={{ ml: 1 }}
              >
                Connection
              </Typography>
            </Box>
            <Typography variant='h6'>{device?.status}</Typography>
            <Typography variant='caption' color='text.secondary'>
              Last update:{' '}
              {format(
                new Date((device as DeviceIot).lastSeen),
                'MMM dd, yyyy HH:mm:ss'
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Current readings section */}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h5'>Current Readings</Typography>
        {hasActiveAlarms && (
          <Chip
            label='¡Alarmas activas!'
            color={
              highestSeverity === AlarmSeverity.INFO
                ? 'info'
                : highestSeverity === AlarmSeverity.WARNING
                  ? 'warning'
                  : highestSeverity === AlarmSeverity.CRITICAL
                    ? 'error'
                    : 'error'
            }
            icon={
              highestSeverity === AlarmSeverity.INFO ? (
                <Info />
              ) : highestSeverity === AlarmSeverity.WARNING ? (
                <Warning />
              ) : (
                <Warning />
              )
            }
            sx={{
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 }
              }
            }}
          />
        )}
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {deviceLastData[0]?.data?.sen.h && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                ...(hasActiveAlarms &&
                  activeAlarms?.some(
                    (alarm: DeviceAlarm) => alarm.metric === 'temperature'
                  ) &&
                  (() => {
                    const tempAlarm = activeAlarms.find(
                      (a: DeviceAlarm) => a.metric === 'temperature'
                    )
                    return {
                      border: '2px solid',
                      borderColor:
                        tempAlarm?.severity === AlarmSeverity.INFO
                          ? 'info.main'
                          : tempAlarm?.severity === AlarmSeverity.WARNING
                            ? 'warning.main'
                            : 'error.main',
                      boxShadow:
                        tempAlarm?.severity === AlarmSeverity.INFO
                          ? '0 0 15px rgba(0, 100, 255, 0.3)'
                          : tempAlarm?.severity === AlarmSeverity.WARNING
                            ? '0 0 15px rgba(255, 200, 0, 0.3)'
                            : '0 0 15px rgba(255, 0, 0, 0.3)'
                    }
                  })())
              }}
            >
              {hasActiveAlarms &&
                activeAlarms?.some(
                  (alarm: DeviceAlarm) => alarm.metric === 'temperature'
                ) && (
                  <>
                    {
                      activeAlarms
                        .filter(
                          (alarm: DeviceAlarm) => alarm.metric === 'temperature'
                        )
                        .map((alarm: DeviceAlarm) => (
                          <Box
                            key={alarm.id}
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              bgcolor:
                                alarm.severity === AlarmSeverity.INFO
                                  ? 'info.main'
                                  : alarm.severity === AlarmSeverity.WARNING
                                    ? 'warning.main'
                                    : 'error.main',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 0 rgba(0, 100, 255, 0.4)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 0 rgba(255, 200, 0, 0.4)'
                                        : '0 0 0 0 rgba(255, 0, 0, 0.4)'
                                },
                                '70%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 10px rgba(0, 100, 255, 0)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 10px rgba(255, 200, 0, 0)'
                                        : '0 0 0 10px rgba(255, 0, 0, 0)'
                                },
                                '100%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 0 rgba(0, 100, 255, 0)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 0 rgba(255, 200, 0, 0)'
                                        : '0 0 0 0 rgba(255, 0, 0, 0)'
                                }
                              }
                            }}
                          >
                            {alarm.severity === AlarmSeverity.INFO ? (
                              <Info sx={{ color: 'white', fontSize: 20 }} />
                            ) : alarm.severity === AlarmSeverity.WARNING ? (
                              <Warning sx={{ color: 'white', fontSize: 20 }} />
                            ) : (
                              <Warning sx={{ color: 'white', fontSize: 20 }} />
                            )}
                          </Box>
                        ))[0]
                    }
                  </>
                )}
              <Thermostat
                color={
                  hasActiveAlarms &&
                  activeAlarms?.some(
                    (alarm: DeviceAlarm) => alarm.metric === 'temperature'
                  )
                    ? (() => {
                        const tempAlarm = activeAlarms.find(
                          (a: DeviceAlarm) => a.metric === 'temperature'
                        )
                        return tempAlarm?.severity === AlarmSeverity.INFO
                          ? 'info'
                          : tempAlarm?.severity === AlarmSeverity.WARNING
                            ? 'warning'
                            : 'error'
                      })()
                    : 'primary'
                }
                sx={{ fontSize: 48, mb: 2 }}
              />
              <Typography
                variant='h3'
                sx={{
                  mb: 1,
                  fontWeight: 'bold',
                  color:
                    hasActiveAlarms &&
                    activeAlarms?.some(
                      (alarm: DeviceAlarm) => alarm.metric === 'temperature'
                    )
                      ? (() => {
                          const tempAlarm = activeAlarms.find(
                            (a: DeviceAlarm) => a.metric === 'temperature'
                          )
                          return tempAlarm?.severity === AlarmSeverity.INFO
                            ? 'info.main'
                            : tempAlarm?.severity === AlarmSeverity.WARNING
                              ? 'warning.main'
                              : 'error.main'
                        })()
                      : 'inherit'
                }}
              >
                {deviceLastData[0]?.data?.sen.t}°C
              </Typography>
              <Typography variant='subtitle1' color='text.secondary'>
                Temperature
              </Typography>
            </Paper>
          </Grid>
        )}
        {deviceLastData[0]?.data?.sen.h && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                ...(hasActiveAlarms &&
                  activeAlarms?.some(
                    (alarm: DeviceAlarm) => alarm.metric === 'humidity'
                  ) &&
                  (() => {
                    const humidityAlarm = activeAlarms.find(
                      (a: DeviceAlarm) => a.metric === 'humidity'
                    )
                    return {
                      border: '2px solid',
                      borderColor:
                        humidityAlarm?.severity === AlarmSeverity.INFO
                          ? 'info.main'
                          : humidityAlarm?.severity === AlarmSeverity.WARNING
                            ? 'warning.main'
                            : 'error.main',
                      boxShadow:
                        humidityAlarm?.severity === AlarmSeverity.INFO
                          ? '0 0 15px rgba(0, 100, 255, 0.3)'
                          : humidityAlarm?.severity === AlarmSeverity.WARNING
                            ? '0 0 15px rgba(255, 200, 0, 0.3)'
                            : '0 0 15px rgba(255, 0, 0, 0.3)'
                    }
                  })())
              }}
            >
              {hasActiveAlarms &&
                activeAlarms?.some(
                  (alarm: DeviceAlarm) => alarm.metric === 'humidity'
                ) && (
                  <>
                    {
                      activeAlarms
                        .filter(
                          (alarm: DeviceAlarm) => alarm.metric === 'humidity'
                        )
                        .map((alarm: DeviceAlarm) => (
                          <Box
                            key={alarm.id}
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              bgcolor:
                                alarm.severity === AlarmSeverity.INFO
                                  ? 'info.main'
                                  : alarm.severity === AlarmSeverity.WARNING
                                    ? 'warning.main'
                                    : 'error.main',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 0 rgba(0, 100, 255, 0.4)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 0 rgba(255, 200, 0, 0.4)'
                                        : '0 0 0 0 rgba(255, 0, 0, 0.4)'
                                },
                                '70%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 10px rgba(0, 100, 255, 0)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 10px rgba(255, 200, 0, 0)'
                                        : '0 0 0 10px rgba(255, 0, 0, 0)'
                                },
                                '100%': {
                                  boxShadow:
                                    alarm.severity === AlarmSeverity.INFO
                                      ? '0 0 0 0 rgba(0, 100, 255, 0)'
                                      : alarm.severity === AlarmSeverity.WARNING
                                        ? '0 0 0 0 rgba(255, 200, 0, 0)'
                                        : '0 0 0 0 rgba(255, 0, 0, 0)'
                                }
                              }
                            }}
                          >
                            {alarm.severity === AlarmSeverity.INFO ? (
                              <Info sx={{ color: 'white', fontSize: 20 }} />
                            ) : alarm.severity === AlarmSeverity.WARNING ? (
                              <Warning sx={{ color: 'white', fontSize: 20 }} />
                            ) : (
                              <Warning sx={{ color: 'white', fontSize: 20 }} />
                            )}
                          </Box>
                        ))[0]
                    }
                  </>
                )}
              <Opacity
                color={
                  hasActiveAlarms &&
                  activeAlarms?.some(
                    (alarm: DeviceAlarm) => alarm.metric === 'humidity'
                  )
                    ? (() => {
                        const humidityAlarm = activeAlarms.find(
                          (a: DeviceAlarm) => a.metric === 'humidity'
                        )
                        return humidityAlarm?.severity === AlarmSeverity.INFO
                          ? 'info'
                          : humidityAlarm?.severity === AlarmSeverity.WARNING
                            ? 'warning'
                            : 'error'
                      })()
                    : 'primary'
                }
                sx={{ fontSize: 48, mb: 2 }}
              />
              <Typography
                variant='h3'
                sx={{
                  mb: 1,
                  fontWeight: 'bold',
                  color:
                    hasActiveAlarms &&
                    activeAlarms?.some(
                      (alarm: DeviceAlarm) => alarm.metric === 'humidity'
                    )
                      ? (() => {
                          const humidityAlarm = activeAlarms.find(
                            (a: DeviceAlarm) => a.metric === 'humidity'
                          )
                          return humidityAlarm?.severity === AlarmSeverity.INFO
                            ? 'info.main'
                            : humidityAlarm?.severity === AlarmSeverity.WARNING
                              ? 'warning.main'
                              : 'error.main'
                        })()
                      : 'inherit'
                }}
              >
                {deviceLastData[0]?.data?.sen.h}%
              </Typography>
              <Typography variant='subtitle1' color='text.secondary'>
                Humedad
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
