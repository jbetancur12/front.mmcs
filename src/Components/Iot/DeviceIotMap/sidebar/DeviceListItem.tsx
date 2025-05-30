import {
  Box,
  Tooltip,
  Chip,
  ListItemText,
  Avatar,
  Badge,
  ListItemButton,
  IconButton
} from '@mui/material'
import {
  BatteryFull,
  DeviceHub,
  Info,
  Place,
  ReportProblem,
  Thermostat,
  Visibility,
  Warning,
  WaterDrop
} from '@mui/icons-material'
import { DeviceIot } from '../../types'
import { AlarmSeverity } from '../constants'
import {  formatDistanceToNow, parse } from 'date-fns'
import { getPowerSourceIcon, getStatusColor } from '../utils/common'
import { es } from 'date-fns/locale'
import useWebSocket from '@utils/use-websockets'
import { DeviceReadingPayload } from '../types'
import { useEffect, useState } from 'react'

interface DeviceListItemProps {
  device: DeviceIot
  onSelect: (device: DeviceIot) => void
  onViewDetails?: (device: DeviceIot) => void
}

const DeviceListItem = ({
  device,
  onSelect,
  onViewDetails
}: DeviceListItemProps) => {
  const { deviceReadings } = useWebSocket()
  const [lastDeviceDataReaded, setLastDeviceDataReaded] =
    useState<Partial<DeviceReadingPayload> | null>({
      sen: {
        t: device?.sensorData?.t || '0',
        h: device?.sensorData?.h || '0'
      },
      gps: [device?.lastLocation.lat ?? 0, device?.lastLocation.lng ?? 0],
      ts: device?.lastSeen ? device.lastSeen.getTime() : undefined
    })

  // Actualizar el último dato válido cuando coincida el dispositivo
  useEffect(() => {
    const latestReading = deviceReadings[device?.name || '']
    if (latestReading) {
      setLastDeviceDataReaded(latestReading)
    }
  }, [deviceReadings, device?.name])

  const currentSensorData = lastDeviceDataReaded

  const getValue = (type: 't' | 'h' | 'gps' | 'pwr' | 'ts') => {
    if (!currentSensorData) return 'N/A'

    switch (type) {
      case 't':
        return currentSensorData.sen?.t ?? 'N/A'
      case 'h':
        return currentSensorData.sen?.h ?? 'N/A'
      case 'gps':
        return currentSensorData.gps ? currentSensorData.gps.join(', ') : 'N/A'
      case 'pwr':
        return currentSensorData.pwr?.v ? `${currentSensorData.pwr.v}V` : 'N/A'
      case 'ts':
          if (!currentSensorData.ts || isNaN(new Date(currentSensorData.ts).getTime())) {
            return 'N/A'; // Validación extra
          }
          return new Date(Number(currentSensorData.ts)).toLocaleString('es-ES'); // Ajustar formato
        default:
          return 'N/A';
    
        return 'N/A'
    }
  }

  const hasActiveAlarms = device.isInAlarm

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

  const getDeviceIcon = () => {
    if (hasActiveAlarms) {
      switch (highestSeverity) {
        case AlarmSeverity.INFO:
          return <Info color='info' />
        case AlarmSeverity.WARNING:
          return <ReportProblem color='warning' />
        case AlarmSeverity.CRITICAL:
          return <ReportProblem color='error' />
        default:
          return <ReportProblem color='error' />
      }
    }
    return <DeviceHub />
  }

  const raw = getValue('ts') // "14/4/2025, 20:55:55"
  
  const parsedDate = parse(raw, 'd/M/yyyy, HH:mm:ss', new Date())
  const lastUpdateTime = formatDistanceToNow(parsedDate, {
    addSuffix: true,
    locale: es
  })
 

  return (
    <ListItemButton
      onClick={() => onSelect(device)}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        '&:hover': {
          backgroundColor: 'action.hover'
        },
        ...(hasActiveAlarms && {
          backgroundColor:
            highestSeverity === AlarmSeverity.CRITICAL
              ? 'error.light'
              : highestSeverity === AlarmSeverity.WARNING
                ? 'warning.light'
                : highestSeverity === AlarmSeverity.INFO
                  ? 'info.light'
                  : 'error.light',
          '&:hover': {
            backgroundColor:
              highestSeverity === AlarmSeverity.CRITICAL
                ? 'error.main'
                : highestSeverity === AlarmSeverity.WARNING
                  ? 'warning.main'
                  : highestSeverity === AlarmSeverity.INFO
                    ? 'info.main'
                    : 'error.main'
          },
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': {
              backgroundColor:
                highestSeverity === AlarmSeverity.CRITICAL
                  ? 'rgba(255, 0, 0, 0.05)'
                  : highestSeverity === AlarmSeverity.WARNING
                    ? 'rgba(255, 200, 0, 0.05)'
                    : highestSeverity === AlarmSeverity.INFO
                      ? 'rgba(0, 100, 255, 0.05)'
                      : 'rgba(255, 0, 0, 0.05)'
            },
            '50%': {
              backgroundColor:
                highestSeverity === AlarmSeverity.CRITICAL
                  ? 'rgba(255, 0, 0, 0.15)'
                  : highestSeverity === AlarmSeverity.WARNING
                    ? 'rgba(255, 200, 0, 0.15)'
                    : highestSeverity === AlarmSeverity.INFO
                      ? 'rgba(0, 100, 255, 0.15)'
                      : 'rgba(255, 0, 0, 0.15)'
            },
            '100%': {
              backgroundColor:
                highestSeverity === AlarmSeverity.CRITICAL
                  ? 'rgba(255, 0, 0, 0.05)'
                  : highestSeverity === AlarmSeverity.WARNING
                    ? 'rgba(255, 200, 0, 0.05)'
                    : highestSeverity === AlarmSeverity.INFO
                      ? 'rgba(0, 100, 255, 0.05)'
                      : 'rgba(255, 0, 0, 0.05)'
            }
          }
        })
      }}
    >
      <Box sx={{ mr: 2 }}>
        <Badge
          overlap='circular'
          badgeContent={
            hasActiveAlarms ? (
              <Tooltip title='¡Este dispositivo tiene alarmas activas!'>
                <Warning
                  color={
                    highestSeverity === AlarmSeverity.CRITICAL
                      ? 'error'
                      : highestSeverity === AlarmSeverity.WARNING
                        ? 'warning'
                        : highestSeverity === AlarmSeverity.INFO
                          ? 'info'
                          : 'error'
                  }
                  fontSize='small'
                />
              </Tooltip>
            ) : null
          }
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <Avatar
            sx={{
              bgcolor: hasActiveAlarms
                ? highestSeverity === AlarmSeverity.CRITICAL
                  ? 'error.main'
                  : highestSeverity === AlarmSeverity.WARNING
                    ? 'warning.main'
                    : highestSeverity === AlarmSeverity.INFO
                      ? 'info.main'
                      : 'error.main'
                : 'primary.light',
              color: hasActiveAlarms ? 'white' : 'primary.dark',
              ...(hasActiveAlarms && {
                border: '2px solid',
                borderColor:
                  highestSeverity === AlarmSeverity.CRITICAL
                    ? 'error.dark'
                    : highestSeverity === AlarmSeverity.WARNING
                      ? 'warning.dark'
                      : highestSeverity === AlarmSeverity.INFO
                        ? 'info.dark'
                        : 'error.dark'
              })
            }}
          >
            {getDeviceIcon()}
          </Avatar>
        </Badge>
      </Box>
      <ListItemText
        primary={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5
            }}
          >
            <Box
              component='div'
              sx={{
                fontSize: '1rem',
                fontWeight: hasActiveAlarms ? 'bold' : 'medium',
                color: hasActiveAlarms
                  ? highestSeverity === AlarmSeverity.CRITICAL
                    ? 'error.main'
                    : highestSeverity === AlarmSeverity.WARNING
                      ? 'warning.main'
                      : highestSeverity === AlarmSeverity.INFO
                        ? 'info.main'
                        : 'error.main'
                  : 'inherit',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box component='span'>{device.name}</Box>
            </Box>
            <Chip
              label={hasActiveAlarms ? 'ALARMA' : device.status}
              size='small'
              color={
                getStatusColor(
                  device.status,
                  hasActiveAlarms,
                  highestSeverity
                ) as any
              }
              icon={hasActiveAlarms ? <Warning fontSize='small' /> : undefined}
              sx={
                hasActiveAlarms
                  ? {
                      animation: 'blink 1s infinite',
                      '@keyframes blink': {
                        '0%': { opacity: 0.7 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.7 }
                      }
                    }
                  : {}
              }
            />
          </Box>
        }
        secondary={
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Place fontSize='small' sx={{ mr: 0.5, fontSize: 16 }} />
              <Box
                component='span'
                sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
              >
                {device?.location?.trim() || ''
                  ? device.location
                  : `${device?.lastLocation?.lat ?? 'N/A'}, ${device?.lastLocation?.lng ?? 'N/A'}`}
              </Box>
            </Box>
            <Box className='mt-2 flex justify-between'>
              <Box className='flex items-center'>
                <Thermostat
                  className='mr-1'
                  sx={{
                    mr: 0.5,
                    fontSize: 16,
                    color:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'temperature'
                      )
                        ? 'error.main'
                        : 'inherit'
                  }}
                />
                <Box
                  component='span'
                  sx={{
                    color:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'temperature'
                      )
                        ? 'error.main'
                        : 'text.secondary',
                    fontWeight:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'temperature'
                      )
                        ? 'bold'
                        : 'normal',
                    fontSize: '0.875rem'
                  }}
                >
                  {getValue('t')}°C
                </Box>
              </Box>

              <Box className='flex items-center'>
                <WaterDrop
                  fontSize='small'
                  sx={{
                    mr: 0.5,
                    fontSize: 16,
                    color:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'humidity'
                      )
                        ? 'error.main'
                        : 'inherit'
                  }}
                />
                <Box
                  component='span'
                  sx={{
                    color:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'humidity'
                      )
                        ? 'error.main'
                        : 'text.secondary',
                    fontWeight:
                      hasActiveAlarms &&
                      activeAlarms.some(
                        (alarm: any) => alarm.metric === 'humidity'
                      )
                        ? 'bold'
                        : 'normal',
                    fontSize: '0.875rem'
                  }}
                >
                  {getValue('h')}%
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {<BatteryFull color='success' fontSize='small' />}
                <Box
                  component='span'
                  sx={{
                    ml: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  100%
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 0.5
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 0.5
                }}
              >
                <Box
                  component='span'
                  sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  Última actualización:{' '}
                  { lastUpdateTime   || '---'}
                </Box>
                {getPowerSourceIcon(device)}
                {onViewDetails && (
                  <Tooltip title='Ver detalles del dispositivo'>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={(e) => {
                        e.stopPropagation() // Evitar que se active el onClick del ListItemButton
                        onViewDetails(device)
                      }}
                      sx={{
                        ml: 1,
                        padding: '4px',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      <Visibility fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </>
        }
      />
    </ListItemButton>
  )
}

export default DeviceListItem
