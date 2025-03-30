import { Tooltip } from '@mui/material'
import { AlarmSeverity, DeviceStatus, PowerSource } from '../constants'
import {
  Info,
  Power,
  PowerOff,
  ReportProblem,
  SignalCellular4Bar,
  SignalCellularConnectedNoInternet0Bar
} from '@mui/icons-material'
import { DeviceIot } from '../../types'

export const getStatusInfo = (status: string) => {
  switch (status) {
    case DeviceStatus.ONLINE:
      return { color: '#4caf50', text: 'Online' }
    case DeviceStatus.OFFLINE:
      return { color: '#f44336', text: 'Offline' }
    case DeviceStatus.LOW_BATTERY:
      return { color: '#ff9800', text: 'Low Battery' }
    default:
      return { color: '#757575', text: 'Unknown' }
  }
}

export const getStatusColor = (
  status: string,
  isInAlarm: boolean,
  highestSeverity: 'warning' | 'info' | 'critical' | null
) => {
  if (isInAlarm) {
    switch (highestSeverity) {
      case AlarmSeverity.INFO:
        return 'info'
      case AlarmSeverity.WARNING:
        return 'warning'
      case AlarmSeverity.CRITICAL:
        return 'error'
      default:
        return 'error'
    }
  }
  switch (status) {
    case DeviceStatus.ONLINE:
      return 'success'
    case DeviceStatus.OFFLINE:
      return 'error'
    case DeviceStatus.LOW_BATTERY:
      return 'warning'
    default:
      return 'default'
  }
}

export const getPowerSourceIcon = (device: DeviceIot) => {
  if (!device.src) return null
  return device.src === PowerSource.MAIN ? (
    <Tooltip title='Connected to Main Power'>
      <Power color='primary' fontSize='small' />
    </Tooltip>
  ) : (
    <Tooltip title='Running on Battery'>
      <PowerOff color='action' fontSize='small' />
    </Tooltip>
  )
}

export const getConnectionIcon = (
  device: DeviceIot,

  highestSeverity: 'warning' | 'info' | 'critical' | null
) => {
  if (device.isInAlarm) {
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
  return device.status === DeviceStatus.ONLINE ? (
    <SignalCellular4Bar color='success' />
  ) : (
    <SignalCellularConnectedNoInternet0Bar color='error' />
  )
}
