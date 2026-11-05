import { atom } from 'nanostores'

interface DeviceData {
  label: string
  value: string | number
}

export const deviceStore = atom<DeviceData[]>([])
