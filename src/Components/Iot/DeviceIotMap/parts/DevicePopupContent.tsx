import { Typography, Box, Chip, Button } from '@mui/material'
import {
  Thermostat,
  WaterDrop,
  Battery5Bar,
  Info,
  Warning
} from '@mui/icons-material'

import { formatDistanceToNow } from 'date-fns'
import { DeviceIot } from '../../types'
import { AlarmSeverity } from '../constants'
import { getStatusColor } from '../utils/common'
import { es } from 'date-fns/locale'

import { useEffect, useState } from 'react'
import { DeviceReadingPayload } from '../types'
import useWebSocket from '@utils/use-websockets'

interface DevicePopupProps {
  device: DeviceIot
  onViewDetails: (device: DeviceIot) => void
}

const DevicePopup = ({ device, onViewDetails }: DevicePopupProps) => {
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

  // Función para obtener valores con manejo de fallos
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
        return currentSensorData.ts
          ? new Date(Number(currentSensorData.ts)).toLocaleString()
          : 'N/A'
      default:
        return 'N/A'
    }
  }

  const hasActiveAlarms = device.isInAlarm
  const lastUpdateTime = formatDistanceToNow(new Date(getValue('ts')), {
    addSuffix: true,
    locale: es
  })

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

  // Determine status color and text

  return (
    <Box sx={{ minWidth: 200, p: 1 }}>
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          {device.name}
        </Typography>
        <Chip
          label={hasActiveAlarms ? 'ALARMA' : device.status}
          size='small'
          color={getStatusColor(device.status, hasActiveAlarms, null)}
          icon={
            hasActiveAlarms ? (
              highestSeverity === AlarmSeverity.INFO ? (
                <Info fontSize='small' />
              ) : highestSeverity === AlarmSeverity.WARNING ? (
                <Warning fontSize='small' />
              ) : (
                <Warning fontSize='small' />
              )
            ) : undefined
          }
          sx={
            hasActiveAlarms
              ? {
                  fontWeight: 'bold',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow:
                        highestSeverity === AlarmSeverity.INFO
                          ? '0 0 0 0 rgba(0, 100, 255, 0.4)'
                          : highestSeverity === AlarmSeverity.WARNING
                            ? '0 0 0 0 rgba(255, 200, 0, 0.4)'
                            : '0 0 0 0 rgba(255, 0, 0, 0.4)'
                    },
                    '70%': {
                      boxShadow:
                        highestSeverity === AlarmSeverity.INFO
                          ? '0 0 0 7px rgba(0, 100, 255, 0)'
                          : highestSeverity === AlarmSeverity.WARNING
                            ? '0 0 0 7px rgba(255, 200, 0, 0)'
                            : '0 0 0 7px rgba(255, 0, 0, 0)'
                    },
                    '100%': {
                      boxShadow:
                        highestSeverity === AlarmSeverity.INFO
                          ? '0 0 0 0 rgba(0, 100, 255, 0)'
                          : highestSeverity === AlarmSeverity.WARNING
                            ? '0 0 0 0 rgba(255, 200, 0, 0)'
                            : '0 0 0 0 rgba(255, 0, 0, 0)'
                    }
                  }
                }
              : {}
          }
        />
      </Box>

      <Typography variant='body2' className='text-gray-600 mb-3'>
        {device?.location?.trim() || ''
          ? device.location
          : `${device?.lastLocation?.lat ?? 'N/A'}, ${device?.lastLocation?.lng ?? 'N/A'}`}
      </Typography>

      {hasActiveAlarms && (
        <Box
          sx={{
            mb: 2,
            p: 1,
            bgcolor:
              highestSeverity === AlarmSeverity.INFO
                ? 'info.light'
                : highestSeverity === AlarmSeverity.WARNING
                  ? 'warning.light'
                  : 'error.light',
            color:
              highestSeverity === AlarmSeverity.INFO
                ? 'info.contrastText'
                : highestSeverity === AlarmSeverity.WARNING
                  ? 'warning.contrastText'
                  : 'error.contrastText',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {highestSeverity === AlarmSeverity.INFO ? (
            <Info fontSize='small' sx={{ mr: 1 }} />
          ) : highestSeverity === AlarmSeverity.WARNING ? (
            <Warning fontSize='small' sx={{ mr: 1 }} />
          ) : (
            <Warning fontSize='small' sx={{ mr: 1 }} />
          )}
          <Typography variant='body2' fontWeight='bold'>
            ¡Dispositivo en estado de alarma!
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Thermostat
            color={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'temperature')
                ? (() => {
                    const tempAlarm = activeAlarms.find(
                      (a) => a.metric === 'temperature'
                    )
                    return tempAlarm?.severity === AlarmSeverity.INFO
                      ? 'info'
                      : tempAlarm?.severity === AlarmSeverity.WARNING
                        ? 'warning'
                        : 'error'
                  })()
                : 'primary'
            }
            fontSize='small'
            sx={{ mr: 1 }}
          />
          <Typography
            variant='body2'
            fontWeight={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'temperature')
                ? 'bold'
                : 'normal'
            }
            color={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'temperature')
                ? (() => {
                    const tempAlarm = activeAlarms.find(
                      (a) => a.metric === 'temperature'
                    )
                    return tempAlarm?.severity === AlarmSeverity.INFO
                      ? 'info.main'
                      : tempAlarm?.severity === AlarmSeverity.WARNING
                        ? 'warning.main'
                        : 'error.main'
                  })()
                : 'inherit'
            }
          >
            {`${getValue('t')} °C`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WaterDrop
            color={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'humidity')
                ? (() => {
                    const humidityAlarm = activeAlarms.find(
                      (a) => a.metric === 'humidity'
                    )
                    return humidityAlarm?.severity === AlarmSeverity.INFO
                      ? 'info'
                      : humidityAlarm?.severity === AlarmSeverity.WARNING
                        ? 'warning'
                        : 'error'
                  })()
                : 'primary'
            }
            fontSize='small'
            sx={{ mr: 1 }}
          />
          <Typography
            variant='body2'
            fontWeight={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'humidity')
                ? 'bold'
                : 'normal'
            }
            color={
              hasActiveAlarms &&
              activeAlarms.some((a) => a.metric === 'humidity')
                ? (() => {
                    const humidityAlarm = activeAlarms.find(
                      (a) => a.metric === 'humidity'
                    )
                    return humidityAlarm?.severity === AlarmSeverity.INFO
                      ? 'info.main'
                      : humidityAlarm?.severity === AlarmSeverity.WARNING
                        ? 'warning.main'
                        : 'error.main'
                  })()
                : 'inherit'
            }
          >
            {`${getValue('h')} %`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Battery5Bar fontSize='small' className='mr-1 text-green-500' />
          <Typography variant='body2' sx={{ ml: 1 }} color='inherit'>
            Battery: 100%
          </Typography>
        </Box>
      </Box>
      <Typography
        variant='caption'
        color='text.secondary'
        display='block'
        sx={{ mb: 1.5 }}
      >
        Última actualización: {lastUpdateTime}
      </Typography>

      <Button
        variant={hasActiveAlarms ? 'contained' : 'outlined'}
        color={
          hasActiveAlarms
            ? highestSeverity === AlarmSeverity.INFO
              ? 'info'
              : highestSeverity === AlarmSeverity.WARNING
                ? 'warning'
                : 'error'
            : 'primary'
        }
        size='small'
        fullWidth
        startIcon={
          hasActiveAlarms ? (
            highestSeverity === AlarmSeverity.INFO ? (
              <Info />
            ) : highestSeverity === AlarmSeverity.WARNING ? (
              <Warning />
            ) : (
              <Warning />
            )
          ) : (
            <Info />
          )
        }
        onClick={() => onViewDetails(device)}
      >
        {'Ver Detalles'}
      </Button>
    </Box>
  )
}

export default DevicePopup
