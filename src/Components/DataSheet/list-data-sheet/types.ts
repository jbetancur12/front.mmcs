export interface CalibrationHistory {
  id: number
  date: string
  internalCode: string
  activity: string
  comments: string
  verifiedBy: string
}

export interface DataSheetData {
  id?: number
  status: string
  pictureUrl: string
  internalCode: string
  equipmentName: string
  brand: string
  model: string
  serialNumber: string
  supplier: string
  manual: boolean
  magnitude: string
  units: string
  receivedDate: string
  inServiceDate: string
  location: string
  serviceType: string
  equipmentStatus: string
  operationRange: string
  accuracy: string
  resolution: string
  softwareFirmware: string
  storageTemperature: string
  storageHumidity: string
  operationTemperature: string
  operationHumidity: string
  storageOperationComment: string
  transportConditionsComment: string
  insuredValue: number
  maintenanceProvider: string
  maintenanceCycle: number
  calibrationProvider: string
  calibrationCycle: number
  calibrationHistories: CalibrationHistory[]
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
  invoiceUrl: string
}

export interface MenuOption {
  value: string
  text: string
  route: string
}
