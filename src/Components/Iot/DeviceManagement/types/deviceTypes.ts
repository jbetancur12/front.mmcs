import { DeviceIot } from '../../types'

export interface AddDeviceModalProps {
  open: boolean
  onClose: () => void
  device?: DeviceIot | null
}
