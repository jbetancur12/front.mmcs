export interface Customer {
  id: number
  nombre: string
  sedes: string[]
  value: string // Mismo tipo que id pero como string
  label: string // Mismo que nombre
  options?: never
}

export type CustomerOption = Customer & {
  value: string
  label: string
}

export interface FileData {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: Date
  nextCalibrationDate: Date
  filePath: string
  customerId: number
  customer: Customer
  certificateTypeId: number
  deviceId: number
  headquarter: string
  user: {
    id: number
    nombre: string
  }
  device: {
    id: number
    name: string
  }
  certificateType: {
    id: number
    name: string
  }
}

export interface ResourceOption {
  value: string
  label: string
}

export interface DeviceData {
  id: string
  name: string
}
