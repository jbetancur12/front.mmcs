import { atom } from 'nanostores'

interface DeviceData {
  label: string
  value: string
}

export const deviceStore = atom<DeviceData[]>([])
